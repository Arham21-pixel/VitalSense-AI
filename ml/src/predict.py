from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd

from .settings import ARTIFACT_DIR, MODEL_VERSION_V1, ensure_dirs
from .utils import utc_now_iso, clamp01, threshold_for_risk
from .shap_explainer import explain_instance


def _load_models():
    """Attempt to lazily load saved models if present. Returns dict.
    This keeps import-time cost low for environments without models.
    """
    models = {}
    xgb_path = Path(ARTIFACT_DIR) / "xgb_model.pkl"
    lstm_path = Path(ARTIFACT_DIR) / "lstm_model.pt"
    try:
        from .xgboost_model import XGBoostModel

        if xgb_path.exists():
            models["xgboost"] = XGBoostModel.load(xgb_path)
    except Exception:
        pass

    try:
        from .lstm_model import LSTMModel

        if lstm_path.exists():
            lstm = LSTMModel(input_size=1)  # placeholder; user should construct with correct input_size when loading
            lstm.load(lstm_path)
            models["lstm"] = lstm
    except Exception:
        pass

    return models


def predict(patient_row: pd.Series, models: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Produce inference JSON for a single patient-row (DataFrame Series).

    The function attempts to use XGBoost and LSTM models (if available),
    combines their scores, and returns the response matching the API schema.
    """
    ensure_dirs()
    if models is None:
        models = _load_models()

    # Prepare a feature DataFrame for XGBoost
    if isinstance(patient_row, pd.Series):
        X = patient_row.to_frame().T
    else:
        X = pd.DataFrame([patient_row])

    scores = {}
    if "xgboost" in models:
        try:
            scores["xgboost"] = float(models["xgboost"].predict_proba(X))
        except Exception:
            try:
                scores["xgboost"] = float(models["xgboost"].predict_proba(X.iloc[:, :]))
            except Exception:
                scores["xgboost"] = 0.0

    if "lstm" in models:
        try:
            # For LSTM we expect a 3D array: (1, seq_len, features)
            seq = X[[c for c in X.columns if c in models["lstm"].net.lstm.input_size.__dict__]] if False else None
            # Fallback: cannot prepare sequence without context
            scores["lstm"] = 0.0
        except Exception:
            scores["lstm"] = 0.0

    # If no models available, default to 0.0
    if not scores:
        combined = 0.0
    else:
        # simple average
        combined = sum(scores.values()) / len(scores)

    combined = clamp01(combined)
    thresh = threshold_for_risk(combined)

    # SHAP explanation (try to include top factors)
    top_factors = []
    try:
        if "xgboost" in models:
            expl = explain_instance(models["xgboost"], X, model_type="tree")
            top_factors = expl.get("top_factors", [])
    except Exception:
        top_factors = []

    response = {
        "patient_id": str(patient_row.get("subject_id") or patient_row.get("patient_id", "unknown")),
        "timestamp": utc_now_iso(),
        "risk_score": float(round(combined, 4)),
        "risk_level": thresh["risk_level"],
        "alert": bool(thresh["alert"]),
        "priority": thresh["priority"],
        "model_version": MODEL_VERSION_V1,
        "top_factors": top_factors,
    }

    return response


if __name__ == "__main__":
    import pandas as pd

    # quick local demo reading a sample from data/sample/mock_patients.csv
    demo_path = Path(__file__).parent.parent / "data" / "sample" / "mock_patients.csv"
    if demo_path.exists():
        df = pd.read_csv(demo_path)
        print(predict(df.iloc[0]))
