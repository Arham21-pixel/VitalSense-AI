from __future__ import annotations

from typing import Iterable, List

import numpy as np
import pandas as pd

from .settings import PRODUCTION_FEATURE_COLUMNS
from .utils import ensure_numeric_frame, fill_clinical_values, normalize_hour_column


ID_COLUMNS = {"subject_id", "hadm_id", "stay_id"}
NON_FEATURE_COLUMNS = ID_COLUMNS | {"sepsis_label", "hour"}


def build_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Create production features from hourly ICU data."""
    out = normalize_hour_column(frame.copy())

    if "shock_index" not in out.columns and {"heart_rate", "sbp"}.issubset(out.columns):
        out["shock_index"] = out["heart_rate"] / out["sbp"].replace(0, np.nan)
    if "pulse_pressure" not in out.columns and {"sbp", "dbp"}.issubset(out.columns):
        out["pulse_pressure"] = out["sbp"] - out["dbp"]
    if "map_low" not in out.columns and "map" in out.columns:
        out["map_low"] = (out["map"] < 65).astype(int)
    if "tachypnea" not in out.columns and "respiratory_rate" in out.columns:
        out["tachypnea"] = (out["respiratory_rate"] > 22).astype(int)

    out = ensure_numeric_frame(out, PRODUCTION_FEATURE_COLUMNS)
    out = fill_clinical_values(out)

    for column in ["shock_index", "pulse_pressure", "map_low", "tachypnea"]:
        if column in out.columns:
            out[column] = out[column].fillna(0)

    return out


def get_model_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Return the numeric feature matrix used for classical models."""
    feature_cols = [c for c in frame.columns if c not in NON_FEATURE_COLUMNS]
    return frame[feature_cols].copy()


def normalize_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Apply z-score normalization to numeric production features."""
    out = frame.copy()
    numeric_cols = [c for c in out.columns if c not in ID_COLUMNS and c != "sepsis_label" and pd.api.types.is_numeric_dtype(out[c])]
    means = out[numeric_cols].mean()
    stds = out[numeric_cols].std(ddof=0).replace(0, 1)
    out[numeric_cols] = (out[numeric_cols] - means) / stds
    return out


def standardize_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Alias for normalize_features for compatibility with older scripts."""
    return normalize_features(frame)


def make_sequence_tensor(frame: pd.DataFrame, window_size: int = 12) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Create sliding windows for sequence modeling."""
    feature_cols = [c for c in PRODUCTION_FEATURE_COLUMNS if c in frame.columns]
    sequences: List[np.ndarray] = []
    labels: List[int] = []
    stays: List[int] = []

    for stay_id, group in frame.groupby("stay_id"):
        group = group.sort_values("hour")
        values = group[feature_cols].fillna(0).to_numpy(dtype=float)
        label = int(group["sepsis_label"].iloc[0]) if "sepsis_label" in group.columns else 0
        if len(values) < window_size:
            continue
        for start in range(len(values) - window_size + 1):
            sequences.append(values[start : start + window_size])
            labels.append(label)
            stays.append(int(stay_id))

    if not sequences:
        return np.empty((0, window_size, len(feature_cols))), np.empty((0,)), np.empty((0,))

    return np.asarray(sequences), np.asarray(labels), np.asarray(stays)
