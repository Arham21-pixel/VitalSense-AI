from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

from .settings import ARTIFACT_DIR, MODEL_VERSION_V1, ensure_dirs, PRODUCTION_FEATURE_COLUMNS
from .utils import utc_now_iso, clamp01, threshold_for_risk
from .shap_explainer import explain_instance


_cached_models: Dict[str, Any] | None = None


def _load_models():
    """Attempt to lazily load saved models if present. Returns dict."""
    global _cached_models
    if _cached_models is not None:
        return _cached_models

    models = {}
    xgb_path = Path(ARTIFACT_DIR) / "xgb_model.pkl"
    lstm_path = Path(ARTIFACT_DIR) / "lstm_model.pt"
    
    try:
        from .xgboost_model import XGBoostModel
        if xgb_path.exists():
            models["xgboost"] = XGBoostModel.load(xgb_path)
    except Exception as e:
        print(f"XGBoost load error: {e}")

    try:
        from .lstm_model import LSTMModel
        if lstm_path.exists():
            # Construct LSTM with correct input_size matching feature columns (21)
            lstm = LSTMModel(input_size=len(PRODUCTION_FEATURE_COLUMNS), hidden_size=32)
            lstm.load(lstm_path)
            models["lstm"] = lstm
    except Exception as e:
        print(f"LSTM load error: {e}")

    _cached_models = models
    return models


def predict(patient_row: pd.Series, history_df: Optional[pd.DataFrame] = None, models: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Produce inference JSON for a single patient.

    Combines XGBoost and LSTM models (if available) and returns scores
    for XGBoost, LSTM, and the Ensemble model.
    """
    ensure_dirs()
    if models is None:
        models = _load_models()

    # Prepare a feature DataFrame for XGBoost (shape: 1, 21)
    if isinstance(patient_row, pd.Series):
        X = patient_row.to_frame().T
    else:
        X = pd.DataFrame([patient_row])

    # Ensure all required features exist in X
    for col in PRODUCTION_FEATURE_COLUMNS:
        if col not in X.columns:
            X[col] = 0.0
    X = X[PRODUCTION_FEATURE_COLUMNS]

    # Calculate probabilities
    xgb_score = 0.0
    lstm_score = 0.0
    
    # 1. XGBoost Probabilities
    if "xgboost" in models:
        try:
            xgb_score = float(models["xgboost"].predict_proba(X)[0])
        except Exception:
            try:
                xgb_score = float(models["xgboost"].predict_proba(X.iloc[:, :])[0])
            except Exception:
                xgb_score = 0.0

    # 2. LSTM Probabilities
    if "lstm" in models:
        try:
            if history_df is not None and len(history_df) > 0:
                # Ensure history_df columns align with features
                hist_df = history_df.copy()
                for col in PRODUCTION_FEATURE_COLUMNS:
                    if col not in hist_df.columns:
                        hist_df[col] = 0.0
                hist_df = hist_df[PRODUCTION_FEATURE_COLUMNS].fillna(0.0)

                # Slice or pad to exactly 12 records
                n = len(hist_df)
                if n < 12:
                    # Pad by duplicating the first available record
                    pad_df = pd.concat([hist_df.iloc[[0]]] * (12 - n), ignore_index=True)
                    seq_df = pd.concat([pad_df, hist_df], ignore_index=True)
                else:
                    seq_df = hist_df.tail(12)

                # Make 3D sequence array: shape (1, 12, 21)
                X_seq = np.expand_dims(seq_df.to_numpy(dtype=float), axis=0)
                lstm_score = float(models["lstm"].predict_proba(X_seq)[0])
            else:
                lstm_score = 0.0
        except Exception as e:
            print(f"LSTM predict error: {e}")
            lstm_score = 0.0

    # 3. Aggregate scores into Ensemble
    if "xgboost" in models and "lstm" in models:
        ensemble_score = 0.6 * xgb_score + 0.4 * lstm_score
    elif "xgboost" in models:
        ensemble_score = xgb_score
        lstm_score = xgb_score
    elif "lstm" in models:
        ensemble_score = lstm_score
        xgb_score = lstm_score
    else:
        # Fallback heuristic if models are missing
        hr = float(patient_row.get("heart_rate", 75))
        lac = float(patient_row.get("lactate", 1.0))
        if lac > 2.0 or hr > 100:
            ensemble_score = 0.88 if lac > 2.0 and hr > 100 else 0.85
        else:
            ensemble_score = 0.15
        xgb_score = ensemble_score
        lstm_score = ensemble_score

    # Normalize bounds
    ensemble_score = clamp01(ensemble_score)
    xgb_score = clamp01(xgb_score)
    lstm_score = clamp01(lstm_score)
    
    thresh = threshold_for_risk(ensemble_score)

    # SHAP explanations
    top_factors = []
    try:
        if "xgboost" in models:
            expl = explain_instance(models["xgboost"], X, model_type="tree")
            top_factors = expl.get("top_factors", [])
    except Exception:
        pass

    if not top_factors:
        # Simple logical fallbacks for descriptors
        hr_val = float(patient_row.get("heart_rate", 75))
        lac_val = float(patient_row.get("lactate", 1.0))
        temp_val = float(patient_row.get("temperature", 37))
        spo2_val = float(patient_row.get("spo2", 98))
        
        if lac_val > 2.0:
            top_factors.append("Elevated Lactate")
        if hr_val > 100:
            top_factors.append("High Heart Rate")
        if temp_val > 38.3:
            top_factors.append("Elevated Temperature")
        if spo2_val < 92:
            top_factors.append("Low SpO2")
        if not top_factors:
            top_factors = ["Normal vitals baseline"]

    response = {
        "patient_id": str(patient_row.get("subject_id") or patient_row.get("patient_id", "unknown")),
        "timestamp": utc_now_iso(),
        "risk_score": float(round(ensemble_score, 4)),
        "risk_level": thresh["risk_level"],
        "alert": bool(thresh["alert"]),
        "priority": thresh["priority"],
        "model_version": MODEL_VERSION_V1,
        "top_factors": top_factors,
        "scores": {
            "ensemble": float(round(ensemble_score, 4)),
            "xgboost": float(round(xgb_score, 4)),
            "lstm": float(round(lstm_score, 4))
        }
    }

    return response
