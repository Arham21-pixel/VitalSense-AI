"""
Data splitting utility that respects ICU stay boundaries.

Uses GroupShuffleSplit to ensure all rows from a single stay_id
remain in the same train/val/test split.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit


def split_by_stay(df, train_size=0.70, val_size=0.15, test_size=0.15, random_state=42):
    """
    Split data by stay_id using GroupShuffleSplit.
    
    All rows from a given stay_id must remain together in the same split.
    This is critical for temporal models (LSTM) to avoid data leakage.
    
    Args:
        df: DataFrame with 'stay_id' column
        train_size: fraction for training (default 0.70)
        val_size: fraction for validation (default 0.15)
        test_size: fraction for testing (default 0.15)
        random_state: seed for reproducibility
        
    Returns:
        dict with 'train', 'val', 'test' indices
    """
    
    assert abs(train_size + val_size + test_size - 1.0) < 1e-6, \
        "train_size + val_size + test_size must equal 1.0"
    
    groups = df["stay_id"].values
    n_stays = len(df["stay_id"].unique())
    
    # First split: separate train (70%) from (val+test = 30%)
    splitter_1 = GroupShuffleSplit(
        n_splits=1,
        test_size=val_size + test_size,
        random_state=random_state
    )
    train_idx, temp_idx = next(splitter_1.split(df, groups=groups))
    
    # Second split: separate val (15%) from test (15%)
    # Adjust proportions: val is 15/(15+15) = 0.5 of the remaining 30%
    splitter_2 = GroupShuffleSplit(
        n_splits=1,
        test_size=test_size / (val_size + test_size),
        random_state=random_state + 1
    )
    val_idx, test_idx = next(
        splitter_2.split(df.iloc[temp_idx], groups=groups[temp_idx])
    )
    val_idx = temp_idx[val_idx]
    test_idx = temp_idx[test_idx]
    
    return {
        'train': train_idx,
        'val': val_idx,
        'test': test_idx
    }


def prepare_features(df, drop_patient_ids=False):
    """
    Prepare features for modeling.
    
    Args:
        df: DataFrame with all features
        drop_patient_ids: if True, drop stay_id, hadm_id, subject_id
                         if False, keep them (recommended for analysis/debugging)
        
    Returns:
        X (features), y (target), and original df for reference
    """
    
    # Keep patient identifiers by default for analysis and group splitting
    # They should NOT be used as features during training, but are needed
    # for GroupShuffleSplit to work correctly
    
    if drop_patient_ids:
        cols_to_drop = ["stay_id", "hadm_id", "subject_id"]
    else:
        cols_to_drop = []  # Keep all columns
    
    feature_cols = [c for c in df.columns if c not in cols_to_drop + ["sepsis_label"]]
    
    X = df[feature_cols]
    y = df["sepsis_label"]
    
    return X, y, feature_cols
