# Model Performance Report

NOTE: Ground-truth numeric performance metrics require running training pipelines on the dataset `data/processed_features.csv`. Below is a summary of the model interfaces, evaluation methods added, and how to reproduce numeric results.

## What I added
- `src/xgboost_model.py` implements `train`, `evaluate`, `predict_proba`, and plotting utilities. Evaluation returns metrics including ROC-AUC and PR-AUC.
- `src/lstm_model.py` implements sequence modeling with training, early stopping, and checkpointing. Use `make_sequence_tensor` in `src/features.py` to construct sequences.
- `src/evaluation.py` provides `evaluate_classification` returning a MetricBundle with clinical metrics (sensitivity, specificity, false-alarm rate).

## How to reproduce performance numbers
1. Prepare features by running:

```bash
python -m src.extract_mimic_iv --output data/processed_features.csv --train-output data/train_features.csv
```

2. Train XGBoost:

```bash
python src/train_xgboost.py
```

3. Train LSTM (example script to be constructed using `src/lstm_model.py` and `src/training_pipeline.py`):

- Use `features.make_sequence_tensor(df_train, window_size=12)` to produce X,y for LSTM.
- Call `model.fit(X_train, y_train, X_val=X_val, y_val=y_val, epochs=50, early_stopping=5, checkpoint_path='saved_models/lstm_model.pt')`

4. Evaluate using `src/evaluation.evaluate_classification` on held-out test data.

## Observations & Recommendations
- Class imbalance: Likely present. Use `scale_pos_weight` in XGBoost or over-/under-sampling strategies; for LSTM use class-weighted loss or focal loss.
- Cross-validation: Use GroupKFold by `stay_id` for robust CV to avoid leakage.
- Threshold tuning: Use ROC/PR curves and cost-sensitive calibration for deployment thresholds.

## Best Model Recommendation (guidance)
- For tabular hourly features, a well-tuned XGBoost with calibrated thresholds is likely to be more stable in production.
- Use ensemble of XGBoost + LSTM (stacking) if temporal context adds signal; calibrate stacking weights using a validation set.

