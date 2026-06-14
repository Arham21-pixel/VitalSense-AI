"""
Example training pipeline with GroupShuffleSplit for stay-based data splitting.

This demonstrates:
1. Keep stay_id, hadm_id, subject_id for group splitting
2. Keep 'hour' as it represents time since ICU admission
3. Use GroupShuffleSplit to ensure stay integrity
"""

import pandas as pd
import numpy as np
from pathlib import Path

from src.data_splitter import split_by_stay, prepare_features
from src.features import build_features, get_model_features


def main():
    # Load data
    # data/ is at project root, not in src/
    data_path = Path(__file__).parent.parent / "data" / "processed_features.csv"
    df = pd.read_csv(data_path)
    
    print("=" * 70)
    print("DATA SPLITTING WITH GROUP INTEGRITY")
    print("=" * 70)
    
    # Display dataset info
    print(f"\nDataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    print(f"\nSepsis label distribution:")
    print(df["sepsis_label"].value_counts())
    
    print(f"\nUnique stays: {df['stay_id'].nunique()}")
    print(f"Unique admissions: {df['hadm_id'].nunique()}")
    print(f"Unique patients: {df['subject_id'].nunique()}")
    
    # Build features (keeps all columns initially)
    df = build_features(df)
    
    # Split by stay using GroupShuffleSplit
    splits = split_by_stay(df, train_size=0.70, val_size=0.15, test_size=0.15)
    
    df_train = df.iloc[splits['train']]
    df_val = df.iloc[splits['val']]
    df_test = df.iloc[splits['test']]
    
    print("\n" + "=" * 70)
    print("SPLIT RESULTS")
    print("=" * 70)
    
    print(f"\nTrain set:")
    print(f"  Rows: {len(df_train)}")
    print(f"  Unique stays: {df_train['stay_id'].nunique()}")
    print(f"  Sepsis positive: {(df_train['sepsis_label']==1).sum()}")
    
    print(f"\nValidation set:")
    print(f"  Rows: {len(df_val)}")
    print(f"  Unique stays: {df_val['stay_id'].nunique()}")
    print(f"  Sepsis positive: {(df_val['sepsis_label']==1).sum()}")
    
    print(f"\nTest set:")
    print(f"  Rows: {len(df_test)}")
    print(f"  Unique stays: {df_test['stay_id'].nunique()}")
    print(f"  Sepsis positive: {(df_test['sepsis_label']==1).sum()}")
    
    # Verify no overlap in stays across splits
    train_stays = set(df_train['stay_id'].unique())
    val_stays = set(df_val['stay_id'].unique())
    test_stays = set(df_test['stay_id'].unique())
    
    assert len(train_stays & val_stays) == 0, "Train and val have overlapping stays!"
    assert len(train_stays & test_stays) == 0, "Train and test have overlapping stays!"
    assert len(val_stays & test_stays) == 0, "Val and test have overlapping stays!"
    
    print("\n✓ No data leakage: All stays are unique across splits")
    
    # Extract model features for training
    X_train = get_model_features(df_train)
    y_train = df_train["sepsis_label"]
    
    X_val = get_model_features(df_val)
    y_val = df_val["sepsis_label"]
    
    X_test = get_model_features(df_test)
    y_test = df_test["sepsis_label"]
    
    print(f"\nModel features (X):")
    print(f"  Shape: {X_train.shape}")
    print(f"  Columns: {X_train.columns.tolist()}")
    
    print("\n" + "=" * 70)
    print("Ready for model training!")
    print("=" * 70)
    
    return {
        'X_train': X_train, 'y_train': y_train,
        'X_val': X_val, 'y_val': y_val,
        'X_test': X_test, 'y_test': y_test,
        'df_train': df_train, 'df_val': df_val, 'df_test': df_test
    }


if __name__ == "__main__":
    data = main()
