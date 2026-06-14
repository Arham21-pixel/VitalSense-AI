from __future__ import annotations

from typing import Any, Dict

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from .utils import MetricBundle


def evaluate_classification(y_true: Any, y_pred: Any, y_prob: Any) -> Dict[str, Any]:
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    y_prob = np.asarray(y_prob)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    specificity = tn / (tn + fp) if (tn + fp) else 0.0
    false_alarm_rate = fp / (fp + tn) if (fp + tn) else 0.0
    bundle = MetricBundle(
        accuracy=float(accuracy_score(y_true, y_pred)),
        precision=float(precision_score(y_true, y_pred, zero_division=0)),
        recall=float(recall_score(y_true, y_pred, zero_division=0)),
        f1=float(f1_score(y_true, y_pred, zero_division=0)),
        roc_auc=float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0,
        pr_auc=float(average_precision_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0,
        sensitivity=float(recall_score(y_true, y_pred, zero_division=0)),
        specificity=float(specificity),
        false_alarm_rate=float(false_alarm_rate),
        confusion_matrix=cm,
    )
    return bundle.__dict__

