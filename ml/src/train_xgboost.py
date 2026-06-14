"""
XGBoost Sepsis Prediction Model Training Script

This script:
1. Loads processed_features.csv
2. Splits data by stay_id (70% train, 15% val, 15% test)
3. Trains XGBoost model (XGBoost handles missing values automatically)
4. Evaluates on train, validation, and test sets
5. Generates feature importance plot and classification reports
6. Saves model to xgb_model.pkl
7. Outputs top 10 most important features
"""

from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from src.data_splitter import split_by_stay
from src.features import build_features, get_model_features
from src.xgboost_model import XGBoostModel


def main():
    print("="*80)
    print("XGBoost Sepsis Prediction Model Training")
    print("="*80)
    
    # Load data
    print("\n[1/6] Loading data...")
    data_path = Path('.') / 'data' / 'processed_features.csv'
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    print(f"Columns: {df.columns.tolist()}")
    
    # Build features (keeps all columns including patient IDs for GroupShuffleSplit)
    print("\n[2/6] Building features...")
    df = build_features(df)
    
    # Convert all columns to numeric (except patient IDs and target)
    print("Converting data types to numeric...")
    numeric_cols = [c for c in df.columns if c not in ['subject_id', 'hadm_id', 'stay_id', 'sepsis_label']]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Split data by stay_id using GroupShuffleSplit
    print("\n[3/6] Splitting data (70% train, 15% val, 15% test)...")
    splits = split_by_stay(df, train_size=0.70, val_size=0.15, test_size=0.15)
    
    train_idx = splits['train']
    val_idx = splits['val']
    test_idx = splits['test']
    
    print(f"Train set: {len(train_idx)} rows ({len(train_idx)/len(df)*100:.1f}%)")
    print(f"Val set:   {len(val_idx)} rows ({len(val_idx)/len(df)*100:.1f}%)")
    print(f"Test set:  {len(test_idx)} rows ({len(test_idx)/len(df)*100:.1f}%)")
    
    # Extract features and targets
    # get_model_features drops stay_id, hadm_id, subject_id, sepsis_label
    X_train = get_model_features(df.iloc[train_idx])
    X_val = get_model_features(df.iloc[val_idx])
    X_test = get_model_features(df.iloc[test_idx])
    
    y_train = df.iloc[train_idx]['sepsis_label'].values
    y_val = df.iloc[val_idx]['sepsis_label'].values
    y_test = df.iloc[test_idx]['sepsis_label'].values
    
    print(f"\nFeature matrix shape: {X_train.shape}")
    print(f"Features used: {X_train.columns.tolist()}")
    print(f"\nTarget distribution:")
    print(f"  Train: {y_train.sum()} sepsis cases out of {len(y_train)} ({y_train.sum()/len(y_train)*100:.1f}%)")
    print(f"  Val:   {y_val.sum()} sepsis cases out of {len(y_val)} ({y_val.sum()/len(y_val)*100:.1f}%)")
    print(f"  Test:  {y_test.sum()} sepsis cases out of {len(y_test)} ({y_test.sum()/len(y_test)*100:.1f}%)")
    
    # Check for missing values
    print(f"\nMissing values:")
    print(f"  X_train: {X_train.isna().sum().sum()} / {X_train.size} ({X_train.isna().sum().sum()/X_train.size*100:.2f}%)")
    print(f"  X_val:   {X_val.isna().sum().sum()} / {X_val.size} ({X_val.isna().sum().sum()/X_val.size*100:.2f}%)")
    print(f"  X_test:  {X_test.isna().sum().sum()} / {X_test.size} ({X_test.isna().sum().sum()/X_test.size*100:.2f}%)")
    print("  Note: XGBoost handles missing values automatically")
    
    # Train model
    print("\n[4/6] Training XGBoost model...")
    model = XGBoostModel(random_state=42)
    model.train(X_train, y_train, X_val, y_val)
    print("Model training complete")
    
    # Evaluate on all sets
    print("\n[5/6] Evaluating model...")
    
    print("\n--- TRAINING SET ---")
    train_metrics, train_pred, train_proba, train_cm = model.evaluate(X_train, y_train, "Train")

    print("\n--- VALIDATION SET ---")
    val_metrics, val_pred, val_proba, val_cm = model.evaluate(X_val, y_val, "Validation")

    print("\n--- TEST SET ---")
    test_metrics, test_pred, test_proba, test_cm = model.evaluate(X_test, y_test, "Test")
    # Feature importance
    print("\n[6/6] Generating outputs...")
    feature_importance_df = model.get_feature_importance(top_n=10)
    
    # Generate plots
    print("\nGenerating feature importance plot...")
    fig = model.plot_feature_importance(top_n=15)
    plot_path = Path('.') / 'saved_models' / 'xgboost_feature_importance.png'
    plot_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Saved to {plot_path}")
    
    print("Generating confusion matrix plot...")
    fig = model.plot_confusion_matrix(y_test, test_pred)
    cm_path = Path('.') / 'saved_models' / 'xgboost_confusion_matrix.png'
    fig.savefig(cm_path, dpi=300, bbox_inches='tight')
    print(f"Saved to {cm_path}")
    
    # Save model
    print("Saving model...")
    model_path = Path('.') / 'saved_models' / 'xgb_model.pkl'
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(model_path)
    
    # Summary
    print("\n" + "="*80)
    print("TRAINING COMPLETE")
    print("="*80)
    print(f"\nModel saved to: {model_path}")
    print(f"Feature importance plot: {plot_path}")
    print(f"Confusion matrix plot: {cm_path}")
    
    print("\n" + "="*80)
    print("TOP 10 MOST IMPORTANT FEATURES")
    print("="*80)
    for rank, (idx, row) in enumerate(feature_importance_df.head(10).iterrows(), 1):
        print(f"{rank:2d}. {row['feature']:<30} {row['importance']:.6f}")
    
    print("\n" + "="*80)
    print("TEST SET PERFORMANCE SUMMARY")
    print("="*80)
    print(f"ROC-AUC:   {test_metrics['roc_auc']:.4f}")
    print(f"F1 Score:  {test_metrics['f1']:.4f}")
    print(f"Recall:    {test_metrics['recall']:.4f}")
    print(f"Precision: {test_metrics['precision']:.4f}")
    
    plt.close('all')
    print("\nDone!")


if __name__ == "__main__":
    main()
