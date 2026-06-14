# Developer Quick Start

Follow these steps to run local checks, training, and the REST API.

1) Create a virtual environment and install dependencies

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
pip install pytest
```

2) Run unit tests (quick smoke tests)

```powershell
python -m pytest -q
```

3) Start the REST API example

```powershell
# from project root
python -m src.rest_api_example
```

4) Train XGBoost model (produces `saved_models/xgb_model.pkl`)

```powershell
python -m src.train_xgboost
```

5) Run SHAP analysis (after training)

```powershell
python -m src.shap_test_analysis
```

Notes:
- The repository contains heavy dependencies (xgboost, torch, shap). On first run, package installation may take time.
- CI runs unit tests only; extend CI to run integration tests if artifacts are available.