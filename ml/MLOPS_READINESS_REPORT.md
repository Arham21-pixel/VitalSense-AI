# MLOps Readiness Report

## Serialization & Versioning
- Models are now saved as wrapper objects via `joblib.dump()` in `src/xgboost_model.py` (preserves metadata).
- `src/lstm_model.py` supports checkpointing via `torch.save()` and can restore state.
- `src/settings.py` contains `MODEL_VERSION_V1` and `MODEL_VERSION_V2` constants; consider using semantic versioning and storing Git commit hash in artifacts.

## Reproducibility
- Random seeds are settable in `XGBoostModel` constructor.
- Add a top-level `experiment.yaml` or `params.json` to store hyperparameters, preprocessing steps, and dataset versions.

## Deployment readiness
- `src/rest_api_example.py` demonstrates API integration and response schema. Move to a production FastAPI app and add input validation.
- Add a Dockerfile and minimal `entrypoint` to containerize the service.

## Monitoring & Observability
- Add logging metrics for prediction latency, input feature coverage (missing values), and drift monitoring.
- Integrate model performance monitoring (A/B tests, shadow deployments) and register alerts for performance degradation.

## CI/CD
- Add unit tests and GitHub Actions to run lint, tests, and a lightweight smoke test that loads model artifacts and runs a sample inference.

## Suggested Immediate Actions
1. Add `requirements.txt` pinning specific versions or add `pyproject.toml`/`poetry.lock`.
2. Create a reproducible training script that accepts a config file and outputs artifacts + metadata (model version, git sha).
3. Add a Dockerfile and a small `docker-compose` for local deployment.
4. Add a simple Prometheus metrics endpoint (prediction count, latency, failures).
