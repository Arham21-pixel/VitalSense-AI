# Alert Engine Report

## What I audited
- `src/alert_engine.py` and `src/response_generator.py` which create alert payloads returned by the API.

## Findings
- Duplicate threshold logic existed across modules. This was centralized to `src/settings.py` and `src/utils.py`.
- Priorities and alert flags were inconsistent; standardized mappings have been added.

## Changes applied
- Centralized risk thresholds in `src/settings.py` and added `get_risk_level()`.
- `src/alert_engine.py` now uses `get_risk_level()` to determine `risk_level`, `alert`, and `priority`.
- `src/response_generator.py` uses `create_alert()` to generate schema-compliant responses.

## Thresholds
- Default thresholds (subject to clinical review):
  - LOW < 0.50
  - MEDIUM >= 0.50
  - HIGH >= 0.70
  - CRITICAL >= 0.90

(These are configurable inside `src/settings.py`.)

## Recommendations to reduce false positives
- Add temporal smoothing of risk scores (e.g., require 2 consecutive hours above threshold to trigger alarm).
- Implement suppression windows (do not re-alert at the same priority level within X minutes unless risk escalates).
- Track recent alerts per `stay_id` to avoid alert storms.

## Implementation notes
- `create_alert()` returns the API object matching the required schema.
- The REST API example consumes `generate_prediction_response()` to produce final payloads.
