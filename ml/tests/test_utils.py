from __future__ import annotations

import pytest
import pandas as pd

from src.utils import clamp01, safe_numeric, build_top_factors


def test_clamp01():
    assert clamp01(0.5) == 0.5
    assert clamp01(-1.0) == 0.0
    assert clamp01(2.0) == 1.0


def test_safe_numeric():
    assert safe_numeric("3.5") == 3.5
    assert safe_numeric(None, default=7.0) == 7.0
    assert isinstance(safe_numeric("not-a-number", default=1.2), float)


def test_build_top_factors_basic():
    row = {"heart_rate": 120, "age": 70, "lactate": 3.0}
    # supply small shap dict favoring heart_rate
    shap_vals = {"heart_rate": 0.8, "age": 0.4, "lactate": 0.1}
    descriptors = build_top_factors(row, shap_values=shap_vals, top_n=3)
    assert isinstance(descriptors, list)
    assert any("Heart" in s or "Age" in s for s in descriptors)
