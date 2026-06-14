from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Mapping, Sequence

import numpy as np
import pandas as pd

from .settings import HUMAN_READABLE_FEATURES, RISK_THRESHOLDS, get_risk_level


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def safe_numeric(value: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def ensure_numeric_frame(frame: pd.DataFrame, columns: Sequence[str]) -> pd.DataFrame:
    out = frame.copy()
    for column in columns:
        if column in out.columns:
            out[column] = pd.to_numeric(out[column], errors="coerce")
    return out


def fill_clinical_values(frame: pd.DataFrame, group_key: str = "stay_id") -> pd.DataFrame:
    out = frame.copy()
    fill_cols = [c for c in out.columns if c not in {"subject_id", "hadm_id", "stay_id", "hour", "sepsis_label"}]
    if group_key in out.columns:
        out[fill_cols] = out.groupby(group_key)[fill_cols].ffill().bfill()
    medians = out[fill_cols].median(numeric_only=True)
    out[fill_cols] = out[fill_cols].fillna(medians)
    return out


def normalize_hour_column(frame: pd.DataFrame) -> pd.DataFrame:
    out = frame.copy()
    if "hour" in out.columns:
        out["hour"] = pd.to_datetime(out["hour"], errors="coerce")
    return out


def build_top_factors(
    feature_row: Mapping[str, Any] | pd.Series,
    shap_values: Mapping[str, float] | None = None,
    top_n: int = 3,
) -> List[str]:
    items = []
    shap_values = shap_values or {}
    for feature, value in feature_row.items():
        if feature in {"subject_id", "hadm_id", "stay_id", "hour", "sepsis_label"}:
            continue
        score = abs(float(shap_values.get(feature, 0.0)))
        items.append((feature, score, value))

    items.sort(key=lambda item: item[1], reverse=True)
    top_features = [item[0] for item in items[:top_n]]

    if not top_features:
        return []

    descriptors: List[str] = []
    for feature in top_features:
        try:
            value = safe_numeric(feature_row.get(feature, 0.0)) if hasattr(feature_row, "get") else safe_numeric(feature_row[feature])
        except Exception:
            value = 0.0
        label = HUMAN_READABLE_FEATURES.get(feature, feature.replace("_", " ").title())
        if feature == "heart_rate":
            descriptors.append("High Heart Rate" if value >= 100 else "Normal Heart Rate")
        elif feature == "shock_index":
            descriptors.append("High Shock Index" if value >= 0.7 else "Normal Shock Index")
        elif feature == "age":
            descriptors.append("Advanced Age" if value >= 65 else "Age Within Expected Range")
        elif feature == "lactate":
            descriptors.append("Elevated Lactate" if value >= 2.0 else "Normal Lactate")
        elif feature == "respiratory_rate":
            descriptors.append("High Respiratory Rate" if value >= 22 else "Normal Respiratory Rate")
        elif feature == "spo2":
            descriptors.append("Low SpO2" if value <= 92 else "Adequate SpO2")
        elif feature == "sbp":
            descriptors.append("Low Systolic Blood Pressure" if value <= 90 else "Stable Systolic Blood Pressure")
        else:
            descriptors.append(label)
    return descriptors[:top_n]


def describe_feature(feature: str, value: Any) -> str:
    feature = str(feature)
    value = safe_numeric(value)
    if feature == "heart_rate":
        return "High Heart Rate" if value >= 100 else "Normal Heart Rate"
    if feature == "shock_index":
        return "High Shock Index" if value >= 0.7 else "Normal Shock Index"
    if feature == "age":
        return "Advanced Age" if value >= 65 else "Age Within Expected Range"
    if feature == "lactate":
        return "Elevated Lactate" if value >= 2.0 else "Normal Lactate"
    if feature == "respiratory_rate":
        return "High Respiratory Rate" if value >= 22 else "Normal Respiratory Rate"
    if feature == "spo2":
        return "Low SpO2" if value <= 92 else "Adequate SpO2"
    if feature == "sbp":
        return "Low Systolic Blood Pressure" if value <= 90 else "Stable Systolic Blood Pressure"
    return HUMAN_READABLE_FEATURES.get(feature, feature.replace("_", " ").title())


@dataclass(frozen=True)
class MetricBundle:
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float
    sensitivity: float
    specificity: float
    false_alarm_rate: float
    confusion_matrix: np.ndarray


def threshold_for_risk(score: float) -> Dict[str, Any]:
    score = clamp01(score)
    level = get_risk_level(score)
    # Map to alert flags and priorities
    if level == "CRITICAL":
        return {"risk_level": level, "alert": True, "priority": "CRITICAL"}
    if level == "HIGH":
        return {"risk_level": level, "alert": True, "priority": "HIGH"}
    if level == "MEDIUM":
        return {"risk_level": level, "alert": True, "priority": "WARNING"}
    return {"risk_level": "LOW", "alert": False, "priority": "NORMAL"}

