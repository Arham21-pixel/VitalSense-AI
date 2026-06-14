from __future__ import annotations

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
SAVED_MODELS_DIR = ROOT_DIR / "saved_models"

MODEL_VERSION_V1 = "v1.0"
MODEL_VERSION_V2 = "v2.0"

RISK_THRESHOLDS = {
    "low": 0.30,
    "medium": 0.50,
    "high": 0.70,
    "critical": 0.90,
}

PRODUCTION_FEATURE_COLUMNS = [
    "heart_rate",
    "respiratory_rate",
    "temperature",
    "spo2",
    "sbp",
    "dbp",
    "map",
    "wbc",
    "creatinine",
    "platelets",
    "lactate",
    "age",
    "icu_los",
    "shock_index",
    "pulse_pressure",
    "map_low",
    "tachypnea",
    "map_trend",
    "heart_rate_trend",
    "respiratory_rate_trend",
    "lactate_delta",
]

HUMAN_READABLE_FEATURES = {
    "heart_rate": "Heart Rate",
    "respiratory_rate": "Respiratory Rate",
    "temperature": "Temperature",
    "spo2": "SpO2",
    "sbp": "Systolic Blood Pressure",
    "dbp": "Diastolic Blood Pressure",
    "map": "Mean Arterial Pressure",
    "wbc": "White Blood Cell Count",
    "creatinine": "Creatinine",
    "platelets": "Platelets",
    "lactate": "Lactate",
    "age": "Age",
    "icu_los": "ICU Length of Stay",
    "shock_index": "Shock Index",
    "pulse_pressure": "Pulse Pressure",
    "map_low": "Low MAP",
    "tachypnea": "Tachypnea",
    "map_trend": "MAP Trend",
    "heart_rate_trend": "Heart Rate Trend",
    "respiratory_rate_trend": "Respiratory Rate Trend",
    "lactate_delta": "Lactate Delta",
}

RESPONSE_SCHEMA_KEYS = [
    "patient_id",
    "timestamp",
    "risk_score",
    "risk_level",
    "alert",
    "priority",
    "model_version",
    "top_factors",
]

ARTIFACT_DIR = SAVED_MODELS_DIR


def ensure_dirs():
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def get_risk_level(score: float) -> str:
    """Map a numeric `score` in [0,1] to a risk level string.

    Returns one of: LOW, MEDIUM, HIGH, CRITICAL.
    """
    if score >= RISK_THRESHOLDS.get("critical", 0.9):
        return "CRITICAL"
    if score >= RISK_THRESHOLDS.get("high", 0.7):
        return "HIGH"
    if score >= RISK_THRESHOLDS.get("medium", 0.5):
        return "MEDIUM"
    return "LOW"

