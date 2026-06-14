from __future__ import annotations

from pathlib import Path
from typing import Optional

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)
from xgboost import XGBClassifier


class XGBoostModel:
    def __init__(self, random_state: int = 42, **kwargs):
        self.random_state = random_state
        self.model = XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=random_state, **kwargs)

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, X_val: Optional[pd.DataFrame] = None, y_val: Optional[pd.Series] = None, early_stopping_rounds: int = 20):
        eval_set = None
        # store feature names for later analysis
        try:
            self.feature_names = list(X_train.columns)
        except Exception:
            self.feature_names = None
        if X_val is not None and y_val is not None:
            eval_set = [(X_train, y_train), (X_val, y_val)]

        fit_kwargs = {"eval_set": eval_set, "verbose": False}
        if X_val is not None and y_val is not None:
            try:
                import inspect

                sig = inspect.signature(self.model.fit)
                if "early_stopping_rounds" in sig.parameters:
                    fit_kwargs["early_stopping_rounds"] = early_stopping_rounds
            except Exception:
                pass

        self.model.fit(X_train, y_train, **fit_kwargs)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        proba = self.model.predict_proba(X)
        # Return probability for positive class
        if proba.shape[1] == 2:
            return proba[:, 1]
        return proba.ravel()

    def predict(self, X: pd.DataFrame, threshold: float = 0.5) -> np.ndarray:
        probs = self.predict_proba(X)
        return (probs >= threshold).astype(int)

    def evaluate(self, X: pd.DataFrame, y_true: pd.Series, label: str = "Test"):
        probs = self.predict_proba(X)
        preds = (probs >= 0.5).astype(int)

        metrics = {
            "accuracy": float(accuracy_score(y_true, preds)),
            "precision": float(precision_score(y_true, preds, zero_division=0)),
            "recall": float(recall_score(y_true, preds, zero_division=0)),
            "f1": float(f1_score(y_true, preds, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_true, probs)) if len(np.unique(y_true)) > 1 else 0.0,
            "pr_auc": float(average_precision_score(y_true, probs)) if len(np.unique(y_true)) > 1 else 0.0,
        }

        cm = confusion_matrix(y_true, preds)

        return metrics, preds, probs, cm

    def get_feature_importance(self, top_n: int = 20) -> pd.DataFrame:
        fmap = self.model.get_booster().get_score(importance_type="gain")
        items = [(k, v) for k, v in fmap.items()]
        df = pd.DataFrame(items, columns=["feature", "importance"]).sort_values("importance", ascending=False)
        return df.reset_index(drop=True)

    def plot_feature_importance(self, top_n: int = 20):
        df = self.get_feature_importance(top_n=top_n).head(top_n)
        fig, ax = plt.subplots(figsize=(8, max(4, len(df) * 0.3)))
        ax.barh(df["feature"][::-1], df["importance"][::-1])
        ax.set_xlabel("Importance")
        ax.set_title("XGBoost Feature Importance")
        plt.tight_layout()
        return fig

    def plot_confusion_matrix(self, y_true: pd.Series, y_pred: np.ndarray):
        cm = confusion_matrix(y_true, y_pred)
        fig, ax = plt.subplots(figsize=(4, 4))
        cax = ax.matshow(cm, cmap=plt.cm.Blues)
        for (i, j), val in np.ndenumerate(cm):
            ax.text(j, i, int(val), ha="center", va="center", color="white")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        fig.colorbar(cax)
        plt.tight_layout()
        return fig

    def save(self, path: Path | str):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        # Save the full wrapper to preserve any metadata (feature names, params)
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: Path | str):
        loaded = joblib.load(path)
        # If a raw XGBClassifier was saved, wrap it
        if isinstance(loaded, XGBClassifier):
            obj = cls()
            obj.model = loaded
            return obj
        return loaded
