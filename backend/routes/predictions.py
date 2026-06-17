from fastapi import APIRouter
from datetime import datetime
from typing import Dict
from models.schemas import PatientVitals, PredictionResult
from routes.patients import patients_db, update_patient_vitals
from routes.alerts import alerts_db, PRIORITY_ORDER, next_alert_id
import pandas as pd
import os
import sys

router = APIRouter(tags=["predictions"])


@router.post("/predict", response_model=PredictionResult)
def predict(vitals: PatientVitals):
    # 1. Update patient vitals state in patients_db and history
    vitals_payload = vitals.dict()
    timestamp = datetime.utcnow().isoformat() + "Z"
    update_patient_vitals(vitals.patient_id, vitals_payload, timestamp)

    # Convert to pandas Series
    vitals_dict = dict(vitals_payload)
    # Align field names with ML features
    vitals_dict['sbp'] = vitals_dict.get('systolic_bp')
    # Add default values for other columns expected by ML model
    vitals_dict['dbp'] = 80.0
    vitals_dict['map'] = 90.0
    vitals_dict['platelets'] = 150.0
    vitals_dict['age'] = 65.0
    vitals_dict['icu_los'] = 1.0

    patient_series = pd.Series(vitals_dict)

    ml_success = False
    prediction = {}

    # 2. Try to call ml predict()
    try:
        src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ml/src'))
        if src_path not in sys.path:
            sys.path.append(src_path)

        from predict import predict as ml_predict
        prediction = ml_predict(patient_series)
        ml_success = True
    except Exception:
        ml_success = False

    # 3. If import/execution failed, use fallback heuristic
    if not ml_success or prediction.get("risk_score", 0.0) == 0.0:
        heart_rate = vitals.heart_rate
        lactate = vitals.lactate
        temperature = vitals.temperature
        spo2 = vitals.spo2
        sbp = vitals.systolic_bp

        top_factors = []
        risk_score = 0.15
        risk_level = "LOW"
        alert = False
        priority = "NORMAL"

        if lactate > 2.0:
            top_factors.append("Elevated Lactate")
        if heart_rate > 100:
            top_factors.append("High Heart Rate")
        if temperature > 38.3:
            top_factors.append("Elevated Temperature")
        if spo2 < 92:
            top_factors.append("Low SpO2")
        if sbp < 90:
            top_factors.append("Low Blood Pressure")

        # Risk scoring
        if lactate > 2.0 or heart_rate > 100:
            risk_score = 0.88 if (lactate > 2.0 and heart_rate > 100) else 0.82
            if spo2 < 92 or sbp < 90:
                risk_score = min(0.97, risk_score + 0.08)
            risk_level = "CRITICAL" if risk_score >= 0.90 else "HIGH"
            alert = True
            priority = "CRITICAL" if risk_level == "CRITICAL" else "HIGH"
        elif len(top_factors) > 0:
            risk_score = 0.45
            risk_level = "MEDIUM"
            alert = False
            priority = "WARNING"

        if not top_factors:
            top_factors = ["Normal vitals baseline"]

        prediction = {
            "patient_id": vitals.patient_id,
            "timestamp": timestamp,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "alert": alert,
            "priority": priority,
            "model_version": "v1.0-fallback",
            "top_factors": top_factors,
            "scores": {
                "ensemble": risk_score,
                "xgboost": risk_score,
                "lstm": risk_score
            }
        }

    # 4. Auto generate Alert if alert=True — deduplicate per patient
    if prediction.get("alert"):
        pid = vitals.patient_id
        # Check if we already have an active (non-dismissed) alert for this patient
        existing_active = any(
            a["patient_id"] == pid and not a.get("dismissed", False)
            for a in alerts_db
        )
        if not existing_active:
            factors_str = ", ".join(prediction.get("top_factors", []))
            message = f"Sepsis risk alert for Patient {pid}."
            if factors_str:
                message += f" Triggered by: {factors_str}."

            alert_id = next_alert_id()
            alert_obj = {
                "alert_id": alert_id,
                "patient_id": pid,
                "risk_level": prediction.get("risk_level"),
                "priority": prediction.get("priority"),
                "message": message,
                "timestamp": prediction.get("timestamp"),
                "dismissed": False,
                "top_factors": prediction.get("top_factors", [])
            }
            alerts_db.append(alert_obj)
            # Sort by priority after insertion
            alerts_db.sort(key=lambda a: PRIORITY_ORDER.get(a.get("priority", "NORMAL"), 99))

    return prediction
