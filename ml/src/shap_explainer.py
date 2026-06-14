from __future__ import annotations

from typing import Any, Iterable, List, Mapping, Sequence

import numpy as np
import pandas as pd
import shap

from .utils import build_top_factors


def explain_tree_model(model: Any, X: pd.DataFrame, top_n: int = 3) -> List[Mapping[str, Any]]:
    """Explain predictions for a tree-based model (XGBoost) using SHAP TreeExplainer.

    Returns a list of explanations per row containing top factors descriptors.
    """
    explainer = shap.TreeExplainer(model.model)
    shap_values = explainer.shap_values(X)
    results = []
    for i, row in X.iterrows():
        vals = {col: float(shap_values[i, idx]) for idx, col in enumerate(X.columns)} if shap_values.ndim == 2 else {col: float(shap_values[idx][i]) for idx, col in enumerate(X.columns)}
        top = build_top_factors(row, shap_values=vals, top_n=top_n)
        results.append({"index": int(i), "top_factors": top, "shap_values": vals})
    return results


def explain_model_generic(predict_fn, X: pd.DataFrame, nsamples: int = 100) -> List[Mapping[str, Any]]:
    """Generic explainer using KernelExplainer when model type is unknown.

    This is slower and intended as a fallback for non-tree models.
    """
    background = shap.sample(X, min(50, len(X)))
    explainer = shap.KernelExplainer(predict_fn, background)
    shap_vals = explainer.shap_values(X, nsamples=nsamples)
    results = []
    for i, row in X.iterrows():
        vals = {col: float(shap_vals[i, idx]) for idx, col in enumerate(X.columns)}
        top = build_top_factors(row, shap_values=vals)
        results.append({"index": int(i), "top_factors": top, "shap_values": vals})
    return results


def explain_instance(model: Any, X_row: pd.DataFrame, model_type: str = "auto", top_n: int = 3) -> Mapping[str, Any]:
    """Return top factors and raw SHAP values for a single-row DataFrame.

    model_type: "tree" | "deep" | "auto"
    """
    if model_type == "tree" or (model_type == "auto" and hasattr(model, "model") and hasattr(model.model, "get_booster")):
        expl = explain_tree_model(model, X_row, top_n=top_n)
        return expl[0] if expl else {"top_factors": [], "shap_values": {}}

    # fallback: use generic kernel explainer
    preds = lambda data: np.array(model.predict_proba(pd.DataFrame(data, columns=X_row.columns)))
    expl = explain_model_generic(preds, X_row)
    return expl[0] if expl else {"top_factors": [], "shap_values": {}}

