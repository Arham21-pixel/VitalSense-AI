from __future__ import annotations

"""Schema-stable prediction response generator."""

from typing import Any, Dict, List, Optional
import json

from .alert_engine import create_alert
from .utils import build_top_factors


def generate_prediction_response(
    patient_id: str,
    risk_score: float,
    top_factors: Optional[List[str]] = None,
    shap_explanations: Optional[Dict[str, float]] = None,
    model_version: str = "v1.0",
    timestamp: Optional[str] = None,
    include_recommendation: bool = False,
) -> Dict[str, Any]:
    """Generate a production-ready prediction response.

    The default payload matches the API contract requested by the user:
    patient_id, timestamp, risk_score, risk_level, alert, priority,
    model_version, and top_factors.
    """
    response = create_alert(
        patient_id=patient_id,
        risk_score=risk_score,
        top_factors=top_factors or [],
        model_version=model_version,
        timestamp=timestamp,
    )

    if not response["top_factors"] and shap_explanations:
        response["top_factors"] = build_top_factors({}, shap_explanations)

    if include_recommendation:
        if response["priority"] == "CRITICAL":
            response["recommended_action"] = "Immediate sepsis protocol activation"
        elif response["priority"] == "WARNING":
            response["recommended_action"] = "Enhanced monitoring and reassessment required"
        else:
            response["recommended_action"] = "Continue routine monitoring"

    return response


def generate_response_json(
    patient_id: str,
    risk_score: float,
    top_factors: Optional[List[str]] = None,
    shap_explanations: Optional[Dict[str, float]] = None,
    model_version: str = "v1.0",
    timestamp: Optional[str] = None,
    pretty: bool = False,
    include_recommendation: bool = False,
) -> str:
    response = generate_prediction_response(
        patient_id=patient_id,
        risk_score=risk_score,
        top_factors=top_factors,
        shap_explanations=shap_explanations,
        model_version=model_version,
        timestamp=timestamp,
        include_recommendation=include_recommendation,
    )
    if pretty:
        return json.dumps(response, indent=2, ensure_ascii=False)
    return json.dumps(response, ensure_ascii=False)

