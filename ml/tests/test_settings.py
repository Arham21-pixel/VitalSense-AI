from __future__ import annotations

from src.settings import get_risk_level


def test_get_risk_level_thresholds():
    assert get_risk_level(0.0) == "LOW"
    assert get_risk_level(0.5) == "MEDIUM"
    assert get_risk_level(0.71) == "HIGH"
    assert get_risk_level(0.95) == "CRITICAL"
