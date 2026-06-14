"""
SHAP Test Set Analysis Script

This script:
1. Loads the trained XGBoost model
2. Loads the test set with full context
3. Generates SHAP values on test set using TreeExplainer
4. Creates SHAP summary plot and feature importance bar plot
5. Reports top 10 features ranked by mean absolute SHAP value
6. Selects a high-risk patient (probability > 0.8)
7. Generates comprehensive explanation for the patient's risk
"""

from pathlib import Path
import pandas as pd
import numpy as np
import pickle
import matplotlib.pyplot as plt
import seaborn as sns

from src.data_splitter import split_by_stay
from src.features import build_features, get_model_features

try:
    import shap
    print("✓ SHAP library loaded successfully")
except ImportError:
    print("✗ SHAP not installed. Install with: pip install shap")
    sys.exit(1)


def load_test_set():
    """Load and prepare test set data."""
    print("\n[1/5] Loading test set data...")
    
    # Load raw data
    data_path = Path('.') / 'data' / 'processed_features.csv'
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Build features
    df = build_features(df)
    
    # Convert to numeric
    numeric_cols = [c for c in df.columns if c not in ['subject_id', 'hadm_id', 'stay_id', 'sepsis_label']]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Split data (same split as training)
    splits = split_by_stay(df, train_size=0.70, val_size=0.15, test_size=0.15)
    test_idx = splits['test']
    
    # Extract test set with full context (keep patient IDs)
    df_test_full = df.iloc[test_idx].copy()
    
    # Extract features and targets
    X_test = get_model_features(df_test_full)
    y_test = df_test_full['sepsis_label'].values
    
    print(f"Test set shape: {X_test.shape}")
    print(f"Test samples: {len(X_test)}")
    print(f"Sepsis cases in test: {y_test.sum()} ({y_test.sum()/len(y_test)*100:.1f}%)")
    
    return X_test, y_test, df_test_full


def load_model():
    """Load trained XGBoost model."""
    print("\n[2/5] Loading trained model...")
    
    model_path = Path('.') / 'saved_models' / 'xgb_model.pkl'
    if not model_path.exists():
        print(f"✗ Model not found at {model_path}")
        print("Please run train_xgboost.py first")
        sys.exit(1)
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"✓ Model loaded successfully")
    print(f"  Features: {len(model.feature_names)}")
    print(f"  Trees: {model.model.n_estimators}")
    
    return model


def generate_shap_values(model, X_test):
    """Generate SHAP values for test set."""
    print("\n[3/5] Computing SHAP values (TreeExplainer)...")
    print("This may take a moment...")
    
    # Use TreeExplainer (fast for tree-based models)
    explainer = shap.TreeExplainer(model.model)
    shap_values = explainer.shap_values(X_test)
    
    # For binary classification, shap_values is a 2D array (class probabilities)
    # We use class 1 (sepsis positive)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    
    print(f"✓ SHAP values computed")
    print(f"  Shape: {shap_values.shape}")
    print(f"  Expected shape: ({len(X_test)}, {len(model.feature_names)})")
    
    return explainer, shap_values


def compute_feature_importance(shap_values, feature_names):
    """Rank features by mean absolute SHAP value."""
    print("\n[4/5] Computing feature importance...")
    
    # Mean absolute SHAP values
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    
    # Create dataframe
    importance_df = pd.DataFrame({
        'Feature': feature_names,
        'Mean_Abs_SHAP': mean_abs_shap
    }).sort_values('Mean_Abs_SHAP', ascending=False).reset_index(drop=True)
    
    importance_df['Rank'] = importance_df.index + 1
    
    return importance_df


def create_shap_plots(explainer, shap_values, X_test, model, importance_df):
    """Create SHAP visualizations."""
    print("\nCreating SHAP visualizations...")
    
    # Set up plotting style
    plt.style.use('seaborn-v0_8-darkgrid')
    
    # 1. SHAP Summary Plot (bee swarm)
    print("  - SHAP Summary Plot...")
    fig1, ax1 = plt.subplots(figsize=(12, 8))
    shap.summary_plot(shap_values, X_test, feature_names=model.feature_names, show=False)
    plot1_path = Path('.') / 'saved_models' / 'shap_summary_plot.png'
    plt.savefig(plot1_path, dpi=300, bbox_inches='tight')
    print(f"    Saved to {plot1_path}")
    
    # 2. SHAP Feature Importance Bar Plot (mean |SHAP|)
    print("  - SHAP Feature Importance Bar Plot...")
    fig2, ax2 = plt.subplots(figsize=(10, 8))
    
    top_n = 15
    top_importance = importance_df.head(top_n)
    
    colors = plt.cm.viridis(np.linspace(0, 1, len(top_importance)))
    bars = ax2.barh(range(len(top_importance)), top_importance['Mean_Abs_SHAP'].values, color=colors)
    ax2.set_yticks(range(len(top_importance)))
    ax2.set_yticklabels(top_importance['Feature'].values, fontsize=10)
    ax2.set_xlabel('Mean |SHAP| Value', fontsize=12, fontweight='bold')
    ax2.set_title('SHAP Feature Importance (Top 15)', fontsize=14, fontweight='bold', pad=20)
    ax2.invert_yaxis()
    
    # Add value labels
    for i, (idx, row) in enumerate(top_importance.iterrows()):
        ax2.text(row['Mean_Abs_SHAP'] + 0.001, i, f"{row['Mean_Abs_SHAP']:.4f}", 
                va='center', fontsize=9)
    
    plt.tight_layout()
    plot2_path = Path('.') / 'saved_models' / 'shap_feature_importance_bar.png'
    plt.savefig(plot2_path, dpi=300, bbox_inches='tight')
    print(f"    Saved to {plot2_path}")
    
    plt.close('all')
    
    return plot1_path, plot2_path


def find_high_risk_patient(model, X_test, df_test_full, shap_values, feature_names, threshold=0.8):
    """Find a high-risk patient for detailed explanation."""
    print("\n[5/5] Analyzing high-risk patients...")
    
    # Get predictions
    y_pred_proba = model.predict_proba(X_test)
    
    # Find high-risk patients
    high_risk_mask = y_pred_proba > threshold
    high_risk_indices = np.where(high_risk_mask)[0]
    
    print(f"High-risk patients (probability > {threshold}): {len(high_risk_indices)}")
    
    if len(high_risk_indices) == 0:
        print("No high-risk patients found. Selecting highest risk patient instead...")
        high_risk_idx = np.argmax(y_pred_proba)
        risk_score = y_pred_proba[high_risk_idx]
    else:
        # Select the first high-risk patient
        high_risk_idx = high_risk_indices[0]
        risk_score = y_pred_proba[high_risk_idx]
    
    return high_risk_idx, risk_score, y_pred_proba, high_risk_mask


def explain_patient(high_risk_idx, risk_score, X_test, shap_values, df_test_full, 
                   model, feature_names, importance_df):
    """Generate comprehensive explanation for patient's risk."""
    
    print("\n" + "="*80)
    print("HIGH-RISK PATIENT ANALYSIS")
    print("="*80)
    
    # Patient info
    patient_row = df_test_full.iloc[high_risk_idx]
    subject_id = patient_row['subject_id']
    hadm_id = patient_row['hadm_id']
    stay_id = patient_row['stay_id']
    actual_label = patient_row['sepsis_label']
    
    print(f"\nPatient ID: {subject_id}")
    print(f"Hospital Admission ID: {hadm_id}")
    print(f"ICU Stay ID: {stay_id}")
    print(f"Actual Sepsis Status: {'SEPSIS' if actual_label == 1 else 'NO SEPSIS'}")
    
    print("\n" + "-"*80)
    print("RISK ASSESSMENT")
    print("-"*80)
    print(f"Predicted Sepsis Probability: {risk_score:.4f} ({risk_score*100:.2f}%)")
    print(f"Risk Level: {'🔴 HIGH RISK' if risk_score > 0.8 else '🟠 MEDIUM RISK' if risk_score > 0.5 else '🟢 LOW RISK'}")
    
    # Get SHAP values for this patient
    patient_shap = shap_values[high_risk_idx]
    
    # Get feature values for this patient
    patient_features = X_test.iloc[high_risk_idx]
    
    # Rank contributions
    shap_contributions = pd.DataFrame({
        'Feature': feature_names,
        'Value': patient_features.values,
        'SHAP': patient_shap,
        'Abs_SHAP': np.abs(patient_shap)
    }).sort_values('Abs_SHAP', ascending=False)
    
    # Top positive contributors (pushing toward sepsis)
    positive_contributors = shap_contributions[shap_contributions['SHAP'] > 0].head(5)
    
    # Top negative contributors (pushing against sepsis)
    negative_contributors = shap_contributions[shap_contributions['SHAP'] < 0].head(5)
    
    print("\n" + "-"*80)
    print("TOP 5 POSITIVE CONTRIBUTORS (↑ Increasing sepsis risk)")
    print("-"*80)
    for rank, (idx, row) in enumerate(positive_contributors.iterrows(), 1):
        print(f"{rank}. {row['Feature']:<30} Value: {row['Value']:>10.4f}  SHAP: {row['SHAP']:>8.4f}")
    
    print("\n" + "-"*80)
    print("TOP 5 NEGATIVE CONTRIBUTORS (↓ Decreasing sepsis risk)")
    print("-"*80)
    for rank, (idx, row) in enumerate(negative_contributors.iterrows(), 1):
        print(f"{rank}. {row['Feature']:<30} Value: {row['Value']:>10.4f}  SHAP: {row['SHAP']:>8.4f}")
    
    # Human-readable explanation
    print("\n" + "-"*80)
    print("HUMAN-READABLE EXPLANATION")
    print("-"*80)
    
    print(f"\nThis patient has a {risk_score*100:.1f}% predicted probability of sepsis.")
    
    if risk_score > 0.8:
        print("⚠️  This is a HIGH-RISK patient requiring immediate clinical attention.")
    elif risk_score > 0.5:
        print("⚠️  This patient shows moderate sepsis risk and should be monitored closely.")
    else:
        print("✓ This patient shows low sepsis risk based on current vitals and lab values.")
    
    print("\nKey Clinical Factors:")
    print(f"\nDriving RISK UP ({len(positive_contributors)} factors):")
    for rank, (idx, row) in enumerate(positive_contributors.iterrows(), 1):
        contribution_pct = (row['SHAP'] / np.abs(patient_shap).sum()) * 100 if np.abs(patient_shap).sum() > 0 else 0
        print(f"  • {row['Feature']}: {row['Value']:.2f} (↑ {contribution_pct:.1f}% contribution to risk)")
    
    print(f"\nDriving RISK DOWN ({len(negative_contributors)} factors):")
    for rank, (idx, row) in enumerate(negative_contributors.iterrows(), 1):
        contribution_pct = (np.abs(row['SHAP']) / np.abs(patient_shap).sum()) * 100 if np.abs(patient_shap).sum() > 0 else 0
        print(f"  • {row['Feature']}: {row['Value']:.2f} (↓ {contribution_pct:.1f}% contribution to protection)")
    
    # Base rate comment
    print(f"\nModel's baseline prediction (before patient-specific factors):")
    print(f"  Base sepsis rate in training data: ~25%")
    print(f"  This patient's individual factors: {'shift probability UP to {:.1f}%'.format(risk_score*100) if risk_score > 0.25 else 'shift probability DOWN to {:.1f}%'.format(risk_score*100)}")
    
    print("\n" + "="*80)
    
    return positive_contributors, negative_contributors


def main():
    print("="*80)
    print("SHAP TEST SET ANALYSIS")
    print("="*80)
    
    # Load data and model
    X_test, y_test, df_test_full = load_test_set()
    model = load_model()
    
    # Get predictions
    y_pred_proba = model.predict_proba(X_test)
    
    # Generate SHAP values
    explainer, shap_values = generate_shap_values(model, X_test)
    
    # Compute feature importance
    importance_df = compute_feature_importance(shap_values, model.feature_names)
    
    # Create plots
    plot1_path, plot2_path = create_shap_plots(explainer, shap_values, X_test, model, importance_df)
    
    # Report top 10 features
    print("\n" + "="*80)
    print("TOP 10 FEATURES BY MEAN ABSOLUTE SHAP VALUE")
    print("="*80)
    print(f"\n{'Rank':<6} {'Feature':<30} {'Mean |SHAP|':>15}")
    print("-" * 52)
    for rank, (idx, row) in enumerate(importance_df.head(10).iterrows(), 1):
        print(f"{rank:<6} {row['Feature']:<30} {row['Mean_Abs_SHAP']:>15.6f}")
    
    # Find and explain high-risk patient
    high_risk_idx, risk_score, y_pred_proba_all, high_risk_mask = find_high_risk_patient(
        model, X_test, df_test_full, shap_values, model.feature_names, threshold=0.8
    )
    
    # Generate explanation
    pos_contrib, neg_contrib = explain_patient(
        high_risk_idx, risk_score, X_test, shap_values, df_test_full,
        model, model.feature_names, importance_df
    )
    
    # Save summary report
    print("\n" + "="*80)
    print("SAVING ANALYSIS RESULTS")
    print("="*80)
    
    # Save importance dataframe
    importance_path = Path('.') / 'saved_models' / 'shap_feature_importance.csv'
    importance_df.to_csv(importance_path, index=False)
    print(f"✓ Feature importance saved to {importance_path}")
    
    # Save patient explanation
    explanation_path = Path('.') / 'saved_models' / 'high_risk_patient_explanation.txt'
    with open(explanation_path, 'w') as f:
        f.write("="*80 + "\n")
        f.write("HIGH-RISK PATIENT ANALYSIS\n")
        f.write("="*80 + "\n")
        patient_row = df_test_full.iloc[high_risk_idx]
        f.write(f"\nPatient ID: {patient_row['subject_id']}\n")
        f.write(f"Hospital Admission ID: {patient_row['hadm_id']}\n")
        f.write(f"ICU Stay ID: {patient_row['stay_id']}\n")
        f.write(f"Actual Sepsis Status: {'SEPSIS' if patient_row['sepsis_label'] == 1 else 'NO SEPSIS'}\n")
        f.write(f"\nRisk Score: {risk_score:.4f} ({risk_score*100:.2f}%)\n")
        f.write(f"Risk Level: {'HIGH RISK' if risk_score > 0.8 else 'MEDIUM RISK' if risk_score > 0.5 else 'LOW RISK'}\n")
        f.write("\nTop Positive Contributors (Risk Drivers):\n")
        f.write("-"*80 + "\n")
        for rank, (idx, row) in enumerate(pos_contrib.iterrows(), 1):
            f.write(f"{rank}. {row['Feature']}: {row['Value']:.4f} (SHAP: {row['SHAP']:.4f})\n")
        f.write("\nTop Negative Contributors (Risk Mitigators):\n")
        f.write("-"*80 + "\n")
        for rank, (idx, row) in enumerate(neg_contrib.iterrows(), 1):
            f.write(f"{rank}. {row['Feature']}: {row['Value']:.4f} (SHAP: {row['SHAP']:.4f})\n")
    
    print(f"✓ Patient explanation saved to {explanation_path}")
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)
    print(f"\nGenerated outputs:")
    print(f"  1. {plot1_path}")
    print(f"  2. {plot2_path}")
    print(f"  3. {importance_path}")
    print(f"  4. {explanation_path}")


if __name__ == "__main__":
    main()
