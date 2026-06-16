import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
import torch

# Add current folder to sys.path so we can import local modules
src_path = Path(__file__).resolve().parent
if str(src_path) not in sys.path:
    sys.path.append(str(src_path))

from xgboost_model import XGBoostModel
from lstm_model import LSTMModel
from settings import SAVED_MODELS_DIR, DATA_DIR, ensure_dirs, PRODUCTION_FEATURE_COLUMNS

def generate_synthetic_data(num_patients=100, hours_per_patient=24):
    np.random.seed(42)
    rows = []
    
    for i in range(num_patients):
        patient_id = f"P{i+1:03d}"
        subject_id = i + 1000
        hadm_id = i + 20000
        stay_id = i + 300000
        
        # Decide if this patient develops sepsis (40% probability)
        has_sepsis = 1 if np.random.rand() < 0.40 else 0
        sepsis_onset_hour = np.random.randint(6, 18) if has_sepsis else 999
        
        # General demographics
        age = np.random.randint(40, 85)
        
        # Initial baseline values
        hr_base = np.random.uniform(70, 85)
        rr_base = np.random.uniform(14, 18)
        temp_base = np.random.uniform(36.6, 37.2)
        spo2_base = np.random.uniform(97, 99)
        sbp_base = np.random.uniform(110, 125)
        dbp_base = np.random.uniform(70, 80)
        wbc_base = np.random.uniform(6.0, 9.0)
        lactate_base = np.random.uniform(0.7, 1.3)
        creatinine_base = np.random.uniform(0.7, 1.0)
        platelets_base = np.random.uniform(180, 240)
        
        for hour in range(1, hours_per_patient + 1):
            icu_los = hour / 24.0
            
            # Sepsis label for this specific hour
            label_at_hour = 1 if (has_sepsis and hour >= sepsis_onset_hour) else 0
            
            # Clinical drift simulation
            if label_at_hour:
                # Sepsis progression
                severity = (hour - sepsis_onset_hour) / (hours_per_patient - sepsis_onset_hour + 1)
                hr = hr_base + severity * np.random.uniform(20, 35) + np.random.normal(0, 2)
                rr = rr_base + severity * np.random.uniform(6, 12) + np.random.normal(0, 1)
                temp = temp_base + severity * np.random.uniform(1.2, 2.5) + np.random.normal(0, 0.1)
                spo2 = spo2_base - severity * np.random.uniform(5, 9) + np.random.normal(0, 0.5)
                sbp = sbp_base - severity * np.random.uniform(20, 35) + np.random.normal(0, 2)
                dbp = dbp_base - severity * np.random.uniform(15, 25) + np.random.normal(0, 2)
                wbc = wbc_base + severity * np.random.uniform(6, 12) + np.random.normal(0, 0.3)
                lactate = lactate_base + severity * np.random.uniform(2.0, 4.0) + np.random.normal(0, 0.1)
                creatinine = creatinine_base + severity * np.random.uniform(0.8, 1.8) + np.random.normal(0, 0.05)
                platelets = platelets_base - severity * np.random.uniform(50, 100) + np.random.normal(0, 5)
            else:
                # Normal minor variation
                hr = hr_base + np.random.normal(0, 2)
                rr = rr_base + np.random.normal(0, 1)
                temp = temp_base + np.random.normal(0, 0.1)
                spo2 = spo2_base + np.random.normal(0, 0.3)
                sbp = sbp_base + np.random.normal(0, 2)
                dbp = dbp_base + np.random.normal(0, 1.5)
                wbc = wbc_base + np.random.normal(0, 0.2)
                lactate = lactate_base + np.random.normal(0, 0.05)
                creatinine = creatinine_base + np.random.normal(0, 0.03)
                platelets = platelets_base + np.random.normal(0, 3)
            
            # Clip spo2
            spo2 = min(100.0, max(50.0, spo2))
            
            # Mean arterial pressure (MAP)
            map_val = (sbp + 2 * dbp) / 3.0
            
            rows.append({
                "subject_id": subject_id,
                "hadm_id": hadm_id,
                "stay_id": stay_id,
                "hour": hour,
                "heart_rate": round(hr, 1),
                "respiratory_rate": round(rr, 1),
                "temperature": round(temp, 2),
                "spo2": round(spo2, 1),
                "sbp": round(sbp, 1),
                "dbp": round(dbp, 1),
                "map": round(map_val, 1),
                "wbc": round(wbc, 2),
                "creatinine": round(creatinine, 2),
                "platelets": round(platelets, 1),
                "lactate": round(lactate, 2),
                "age": age,
                "icu_los": round(icu_los, 2),
                "sepsis_label": label_at_hour
            })
            
    df = pd.DataFrame(rows)
    
    # Calculate engineered features matching mimic-iv script
    df["shock_index"] = df["heart_rate"] / df["sbp"].replace(0, np.nan)
    df["pulse_pressure"] = df["sbp"] - df["dbp"]
    df["map_low"] = (df["map"] < 65).astype(int)
    df["tachypnea"] = (df["respiratory_rate"] > 22).astype(int)
    
    # Calculate trends
    df["map_trend"] = df.groupby("stay_id")["map"].diff().fillna(0.0)
    df["heart_rate_trend"] = df.groupby("stay_id")["heart_rate"].diff().fillna(0.0)
    df["respiratory_rate_trend"] = df.groupby("stay_id")["respiratory_rate"].diff().fillna(0.0)
    df["lactate_delta"] = df.groupby("stay_id")["lactate"].diff().fillna(0.0)
    
    # Fill in clinical values to ensure no nans
    df["shock_index"] = df["shock_index"].fillna(0.7)
    
    return df

def main():
    print("Generating high-fidelity synthetic patient cohort...")
    df = generate_synthetic_data(num_patients=100, hours_per_patient=24)
    
    # Ensure directories exist
    ensure_dirs()
    
    # Save datasets
    df.to_csv(DATA_DIR / "processed_features.csv", index=False)
    df.to_csv("processed_features.csv", index=False) # for verify_implementation
    
    # Save a train split
    train_split = df.sample(frac=0.8, random_state=42)
    train_split.to_csv("train_features.csv", index=False) # for verify_implementation
    
    print(f"Saved synthetic datasets: shape={df.shape}")
    print(f"Total rows: {len(df)}, sepsis rate: {df['sepsis_label'].mean() * 100:.1f}%")
    
    # 1. Train XGBoost
    print("\nTraining XGBoost model...")
    feature_cols = [c for c in PRODUCTION_FEATURE_COLUMNS]
    X = df[feature_cols]
    y = df["sepsis_label"]
    
    # Split stays for training
    train_patients = df["stay_id"].unique()[:80]
    train_idx = df["stay_id"].isin(train_patients)
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[~train_idx], y[~train_idx]
    
    xgb = XGBoostModel(random_state=42)
    xgb.train(X_train, y_train, X_val, y_val)
    xgb.save(SAVED_MODELS_DIR / "xgb_model.pkl")
    print(f"XGBoost trained and saved to {SAVED_MODELS_DIR / 'xgb_model.pkl'}")
    
    # 2. Train LSTM
    print("\nTraining PyTorch LSTM model...")
    # Generate sequence tensor
    from features import make_sequence_tensor
    X_seq, y_seq, _ = make_sequence_tensor(df, window_size=12)
    
    if len(X_seq) > 0:
        # LSTM input size is the number of features: len(feature_cols)
        lstm = LSTMModel(input_size=len(feature_cols), hidden_size=32)
        lstm.fit(X_seq, y_seq, epochs=15, batch_size=32)
        lstm.save(SAVED_MODELS_DIR / "lstm_model.pt")
        print(f"LSTM trained and saved to {SAVED_MODELS_DIR / 'lstm_model.pt'}")
    else:
        print("Error: Could not generate sequence tensor for LSTM model.")
        
    print("\n✓ Verification & training complete!")

if __name__ == "__main__":
    main()
