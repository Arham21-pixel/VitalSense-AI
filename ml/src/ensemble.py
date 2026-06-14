from __future__ import annotations

from typing import Dict, Iterable, Optional

import numpy as np
from sklearn.linear_model import LogisticRegression


def combine_predictions(scores: Dict[str, float], weights: Optional[Dict[str, float]] = None) -> float:
    """Combine model scores into a single risk score.

    `scores` must contain numeric scores for each model, e.g. {'lstm':0.8,'xgboost':0.7}
    `weights` may provide relative weights; if omitted, use equal weighting.
    Returns a float in [0,1].
    """
    names = list(scores.keys())
    vals = np.array([float(scores[n]) for n in names], dtype=float)
    if weights:
        w = np.array([float(weights.get(n, 1.0)) for n in names], dtype=float)
    else:
        w = np.ones_like(vals)
    if w.sum() == 0:
        w = np.ones_like(w)
    score = float(np.dot(vals, w) / w.sum())
    return max(0.0, min(1.0, score))


def calibrate_weights(predictions: Iterable[Dict[str, float]], y_true: Iterable[int]) -> Dict[str, float]:
    """Fit a logistic regression stacking model to produce combination weights.

    `predictions` is an iterable of dicts with identical keys for each sample.
    Returns normalized positive weights per model name.
    """
    preds = list(predictions)
    if not preds:
        return {}
    keys = list(preds[0].keys())
    X = np.vstack([[p[k] for k in keys] for p in preds])
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X, y_true)
    coefs = np.maximum(0.0, clf.coef_.ravel())
    if coefs.sum() == 0:
        coefs = np.ones_like(coefs)
    weights = {k: float(coefs[i]) / float(coefs.sum()) for i, k in enumerate(keys)}
    return weights
