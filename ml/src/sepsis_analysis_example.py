"""
Example: Working with Sepsis Labels in MIMIC-IV Features

This script demonstrates how to use the sepsis_label column
for analysis and machine learning tasks.
"""

import pandas as pd
import numpy as np
from collections import Counter


def load_features(filepath='train_features.csv'):
    """Load the feature dataset with sepsis labels"""
    return pd.read_csv(filepath)


def sepsis_cohort_statistics(df):
    """Print summary statistics for sepsis cohorts"""
    print("=" * 60)
    print("SEPSIS COHORT STATISTICS")
    print("=" * 60)
    
    # Per-admission statistics
    admission_data = df.groupby('hadm_id').agg({
        'sepsis_label': 'first',
        'age': 'first',
        'icu_los': 'first',
        'hour': 'count',  # number of time points
    }).rename(columns={'hour': 'num_timepoints'})
    
    print(f"\nTotal Admissions: {len(admission_data)}")
    print(f"  - Sepsis Positive: {(admission_data['sepsis_label'] == 1).sum()}")
    print(f"  - Sepsis Negative: {(admission_data['sepsis_label'] == 0).sum()}")
    print(f"  - Sepsis Rate: {100 * (admission_data['sepsis_label'] == 1).sum() / len(admission_data):.1f}%")
    
    print(f"\nAge Distribution by Sepsis Status:")
    for status in [0, 1]:
        ages = admission_data[admission_data['sepsis_label'] == status]['age']
        print(f"  Sepsis={status}: mean={ages.mean():.1f}, std={ages.std():.1f}, median={ages.median():.1f}")
    
    print(f"\nICU Length of Stay by Sepsis Status:")
    for status in [0, 1]:
        los = admission_data[admission_data['sepsis_label'] == status]['icu_los']
        print(f"  Sepsis={status}: mean={los.mean():.1f} days, median={los.median():.1f} days")
    
    print(f"\nNumber of Observations per Admission:")
    print(f"  Mean: {admission_data['num_timepoints'].mean():.1f} time points")
    print(f"  Median: {admission_data['num_timepoints'].median():.1f} time points")


def biomarker_analysis(df):
    """Analyze biomarkers by sepsis status"""
    print("\n" + "=" * 60)
    print("BIOMARKER COMPARISON (Sepsis vs. Non-Sepsis)")
    print("=" * 60)
    
    biomarkers = ['heart_rate', 'respiratory_rate', 'temperature', 'wbc', 'lactate', 'creatinine']
    
    for biomarker in biomarkers:
        if biomarker not in df.columns:
            continue
            
        print(f"\n{biomarker.upper()}:")
        for status in [0, 1]:
            data = df[df['sepsis_label'] == status][biomarker].dropna()
            if len(data) > 0:
                label_str = "Sepsis+" if status == 1 else "Sepsis-"
                print(f"  {label_str}: mean={data.mean():.2f}, std={data.std():.2f}, median={data.median():.2f}")


def create_ml_dataset(df, aggregate_by='admission'):
    """
    Create a dataset suitable for machine learning
    
    Args:
        df: Feature dataframe
        aggregate_by: 'admission' (one row per admission) or 'stay' (one row per stay)
    
    Returns:
        X: Feature matrix (predictors)
        y: Target vector (sepsis_label)
        metadata: DataFrame with identifying information
    """
    
    if aggregate_by == 'admission':
        group_col = 'hadm_id'
    elif aggregate_by == 'stay':
        group_col = 'stay_id'
    else:
        raise ValueError("aggregate_by must be 'admission' or 'stay'")
    
    # Group by admission/stay and take mean of numeric features
    numeric_cols = [c for c in df.columns if df[c].dtype in [np.float64, np.int64] and c not in ['subject_id', 'hadm_id', 'stay_id']]
    
    aggregated = df.groupby(group_col)[numeric_cols + ['sepsis_label']].mean().reset_index()
    
    # Remove rows with missing target
    aggregated = aggregated.dropna(subset=['sepsis_label'])
    
    # Separate features and target
    feature_cols = [c for c in numeric_cols if c != 'sepsis_label']
    X = aggregated[feature_cols].fillna(0)
    y = aggregated['sepsis_label'].astype(int).values  # Convert to numpy array
    metadata = aggregated[[group_col]].reset_index(drop=True)
    
    print(f"\nCreated ML dataset:")
    print(f"  Rows: {len(X)}")
    print(f"  Features: {len(feature_cols)}")
    positive_count = (y == 1).sum()
    print(f"  Positive Class: {positive_count} ({100*positive_count/len(y):.1f}%)")
    
    return X, y, metadata


def time_series_dataset(df, window_size=12):
    """
    Create time series dataset for sequence models
    
    Args:
        df: Feature dataframe
        window_size: Number of time steps to use as input
    
    Returns:
        X: Numpy array of shape (samples, window_size, features)
        y: Binary sepsis labels
        stay_ids: Corresponding stay_ids for traceability
    """
    
    feature_cols = ['heart_rate', 'respiratory_rate', 'temperature', 'spo2', 
                   'sbp', 'dbp', 'map', 'wbc', 'creatinine', 'platelets', 'lactate']
    available_features = [c for c in feature_cols if c in df.columns]
    
    X_list = []
    y_list = []
    stay_ids_list = []
    
    for stay_id, group in df.groupby('stay_id'):
        group = group.sort_values('hour').reset_index(drop=True)
        sepsis_label = group['sepsis_label'].iloc[0]
        
        # Extract feature values
        values = group[available_features].fillna(0).values
        
        # Create sliding windows
        for i in range(len(values) - window_size + 1):
            window = values[i:i+window_size]
            X_list.append(window)
            y_list.append(sepsis_label)
            stay_ids_list.append(stay_id)
    
    X = np.array(X_list)
    y = np.array(y_list)
    stay_ids = np.array(stay_ids_list)
    
    print(f"\nCreated time series dataset:")
    print(f"  Samples: {len(X)}")
    print(f"  Window size: {window_size}")
    print(f"  Features: {len(available_features)}")
    print(f"  Shape: {X.shape}")
    
    return X, y, stay_ids


def main():
    # Load features
    print("Loading features...")
    df = load_features()
    print(f"Loaded {len(df)} rows")
    
    # Cohort statistics
    sepsis_cohort_statistics(df)
    
    # Biomarker analysis
    biomarker_analysis(df)
    
    # Create ML datasets
    print("\n" + "=" * 60)
    print("CREATING ML DATASETS")
    print("=" * 60)
    
    X_admission, y_admission, _ = create_ml_dataset(df, aggregate_by='admission')
    X_ts, y_ts, _ = time_series_dataset(df, window_size=12)
    
    print("\n✓ Successfully created datasets")
    print("  Use X_admission, y_admission for traditional ML models")
    print("  Use X_ts, y_ts for sequence/LSTM models")


if __name__ == '__main__':
    main()
