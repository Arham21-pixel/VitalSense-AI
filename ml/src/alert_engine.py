from __future__ import annotations

"""Clinical alert engine for sepsis risk scoring."""

from typing import Any, Dict, List, Optional
import json
from datetime import datetime, timezone

from .settings import MODEL_VERSION_V1, get_risk_level
from .utils import clamp01, utc_now_iso


def _determine_level(score: float) -> Dict[str, Any]:
    level = get_risk_level(score)
    if level == "CRITICAL":
        return {"risk_level": level, "alert": True, "priority": "CRITICAL"}
    if level == "HIGH":
        return {"risk_level": level, "alert": True, "priority": "HIGH"}
    if level == "MEDIUM":
        return {"risk_level": level, "alert": True, "priority": "WARNING"}
    return {"risk_level": "LOW", "alert": False, "priority": "NORMAL"}


def create_alert(
    patient_id: str,
    risk_score: float,
    top_factors: Optional[List[str]] = None,
    model_version: str = MODEL_VERSION_V1,
    timestamp: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a schema-compliant alert payload.

    Args:
        patient_id: Identifier for the patient (string).
        risk_score: Probability score between 0 and 1.
        top_factors: Optional list of human-readable factor strings.
        model_version: Model version string.
        timestamp: ISO 8601 UTC timestamp. Defaults to now.

    Returns:
        Dict matching the requested JSON structure.
    """
    if top_factors is None:
        top_factors = []

    score = clamp01(risk_score)
    if timestamp is None:
        timestamp = utc_now_iso()

    level_info = _determine_level(score)

    alert = {
        "patient_id": patient_id,
        "timestamp": timestamp,
        "risk_score": round(score, 4),
        "risk_level": level_info["risk_level"],
        "alert": level_info["alert"],
        "priority": level_info["priority"],
        "model_version": model_version,
        "top_factors": top_factors,
    }

    return alert


def create_alert_json(patient_id: str, risk_score: float, top_factors: Optional[List[str]] = None) -> str:
    """Return a JSON string for the alert (compact)."""
    alert = create_alert(patient_id, risk_score, top_factors=top_factors)
    return json.dumps(alert, ensure_ascii=False)


if __name__ == "__main__":
    # small self-check when run directly
    print(create_alert_json("demo_patient", 0.9788, ["High Heart Rate", "High Shock Index", "Advanced Age"]))
