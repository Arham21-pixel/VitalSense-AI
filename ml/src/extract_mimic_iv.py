import argparse
import gzip
import os
import re
from pathlib import Path

import pandas as pd

CHUNK_SIZE = 200_000

CHART_ITEM_IDS = {
    "heart_rate": {220045, 230037},
    "respiratory_rate": {220210, 230042},
    "temperature": {223761, 223762, 224027, 228242},
    "sbp": {220179, 220050, 225309, 227243, 224167},
    "dbp": {220180, 220051, 225310, 227242, 224643},
    "map": {225312, 224322, 226766, 227023, 229827},
}

CHART_TEMPERATURE_F_ITEMIDS = {223761}

LAB_ITEM_IDS = {
    "spo2": {50817},
    "wbc": {51755, 51756, 51300, 51301, 52407, 51516},
    "creatinine": {50912, 52546, 52024, 51081, 51977},
    "platelets": {51704, 51265},
    "lactate": {50813, 52442, 53154},
}

OUTPUT_COLUMNS = [
    "subject_id",
    "hadm_id",
    "stay_id",
    "hour",
    "heart_rate",
    "respiratory_rate",
    "temperature",
    "spo2",
    "sbp",
    "dbp",
    "map",
    "wbc",
    "creatinine",
    "platelets",
    "lactate",
]

ENGINEERED_COLUMNS = [
    "age",
    "icu_los",
    "shock_index",
    "pulse_pressure",
    "map_low",
    "tachypnea",
    "map_trend",
    "heart_rate_trend",
    "respiratory_rate_trend",
    "lactate_delta",
]

# Sepsis-3 ICD code definitions
# Reference: https://sepsis-3.org/
# ICD-9: 038.x (Septicemia), 995.92 (SIRS from infection)
# ICD-10: A40.x (Streptococcal sepsis), A41.x (Other sepsis), R65.2x (Severe sepsis)
SEPSIS_ICD9_CODES = {
    "038",      # Septicemia (includes 038.0-038.9)
    "9959",     # SIRS from infection (995.9x becomes 9959 after removing decimals)
    "99592",    # Systemic inflammatory response syndrome - SIRS, from infection
}

SEPSIS_ICD10_PREFIXES = {
    "A40",      # Streptococcal sepsis
    "A41",      # Other sepsis
    "R65.2",    # Severe sepsis (R65.20, R65.21, etc.)
}


def parse_numeric_value(value):
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text == "":
        return None
    text = text.replace(",", "")
    match = re.search(r"[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?", text)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def build_feature_map(mapping):
    item_to_feature = {}
    for feature, itemids in mapping.items():
        for itemid in itemids:
            item_to_feature[itemid] = feature
    return item_to_feature


def ensure_path(path_text):
    path = Path(path_text)
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    return path


def read_icustays(path):
    path = ensure_path(path)
    df = pd.read_csv(path, parse_dates=["intime", "outtime"], dtype={"subject_id": int, "hadm_id": int, "stay_id": int})
    df = df.dropna(subset=["stay_id", "hadm_id", "intime", "outtime"])
    df["stay_id"] = df["stay_id"].astype(int)
    df["hadm_id"] = df["hadm_id"].astype(int)
    df["subject_id"] = df["subject_id"].astype(int)
    return df[["subject_id", "hadm_id", "stay_id", "intime", "outtime", "los"]]


def read_patients(path):
    path = ensure_path(path)
    df = pd.read_csv(path, dtype={"subject_id": int})
    df = df.dropna(subset=["subject_id"])
    df["subject_id"] = df["subject_id"].astype(int)
    return df[["subject_id", "anchor_age"]]


def is_sepsis_icd9(icd_code):
    """Check if an ICD-9 code indicates sepsis."""
    code_str = str(icd_code).strip().replace(".", "")
    # Check for exact matches or prefixes
    for sepsis_code in SEPSIS_ICD9_CODES:
        if code_str.startswith(sepsis_code):
            return True
    return False


def is_sepsis_icd10(icd_code):
    """Check if an ICD-10 code indicates sepsis."""
    code_str = str(icd_code).strip().upper()
    for prefix in SEPSIS_ICD10_PREFIXES:
        if code_str.startswith(prefix):
            return True
    return False


def extract_sepsis_labels_from_icd(diagnoses_path):
    """
    Extract sepsis labels based on ICD-9 and ICD-10 codes.
    
    Returns a DataFrame with columns: hadm_id, sepsis_label (binary: 0 or 1)
    """
    path = ensure_path(diagnoses_path)
    df = pd.read_csv(
        path,
        dtype={"subject_id": int, "hadm_id": int, "seq_num": int, "icd_version": int},
        usecols=["hadm_id", "icd_code", "icd_version"]
    )
    
    # Mark sepsis diagnoses
    sepsis_mask = False
    for idx, row in df.iterrows():
        if row["icd_version"] == 9:
            if is_sepsis_icd9(row["icd_code"]):
                sepsis_mask = True
                break
        elif row["icd_version"] == 10:
            if is_sepsis_icd10(row["icd_code"]):
                sepsis_mask = True
                break
    
    # Vectorized approach
    icd9_mask = (df["icd_version"] == 9) & (df["icd_code"].astype(str).str.replace(".", "").apply(
        lambda x: any(x.startswith(code) for code in SEPSIS_ICD9_CODES)
    ))
    icd10_mask = (df["icd_version"] == 10) & (df["icd_code"].astype(str).str.upper().apply(
        lambda x: any(x.startswith(prefix) for prefix in SEPSIS_ICD10_PREFIXES)
    ))
    
    df["has_sepsis"] = icd9_mask | icd10_mask
    
    # Create one row per hadm_id with binary sepsis label
    sepsis_labels = df[df["has_sepsis"]].groupby("hadm_id").size().reset_index(name="count")
    sepsis_labels["sepsis_label"] = 1
    sepsis_labels = sepsis_labels[["hadm_id", "sepsis_label"]]
    
    return sepsis_labels


def load_external_sepsis_labels(sepsis_labels_path):
    """
    Load external Sepsis-3 labels from a CSV file.
    
    Expected format: CSV with columns 'hadm_id' and 'sepsis_label' (binary: 0 or 1)
    This is a placeholder for future integration with validated Sepsis-3 cohort definitions.
    
    Args:
        sepsis_labels_path: Path to external sepsis labels file
        
    Returns:
        DataFrame with columns: hadm_id, sepsis_label
    """
    if sepsis_labels_path is None or not Path(sepsis_labels_path).exists():
        return pd.DataFrame(columns=["hadm_id", "sepsis_label"])
    
    df = pd.read_csv(sepsis_labels_path, dtype={"hadm_id": int, "sepsis_label": int})
    return df[["hadm_id", "sepsis_label"]]


def process_chart_events(path, icu_stays):
    path = ensure_path(path)
    item_to_feature = build_feature_map(CHART_ITEM_IDS)
    cols = ["stay_id", "charttime", "itemid", "valuenum", "value"]

    records = []
    for chunk in pd.read_csv(path, usecols=cols, parse_dates=["charttime"], chunksize=CHUNK_SIZE, compression="infer", low_memory=False):
        chunk = chunk[chunk["itemid"].isin(item_to_feature)]
        if chunk.empty:
            continue

        chunk["feature"] = chunk["itemid"].map(item_to_feature)
        chunk["value_num"] = chunk["valuenum"].where(chunk["valuenum"].notna())
        missing_value = chunk["value_num"].isna()
        chunk.loc[missing_value, "value_num"] = chunk.loc[missing_value, "value"].apply(parse_numeric_value)
        chunk["value_num"] = pd.to_numeric(chunk["value_num"], errors="coerce")
        chunk = chunk.dropna(subset=["value_num", "charttime"])
        if chunk.empty:
            continue

        chunk.loc[chunk["itemid"].isin(CHART_TEMPERATURE_F_ITEMIDS), "value_num"] = (
            (chunk.loc[chunk["itemid"].isin(CHART_TEMPERATURE_F_ITEMIDS), "value_num"] - 32.0) * 5.0 / 9.0
        )

        chunk["hour"] = chunk["charttime"].dt.floor("H")
        grouped = (
            chunk.groupby(["stay_id", "hour", "feature"], dropna=False)["value_num"]
            .mean()
            .reset_index()
        )
        records.append(grouped)

    if not records:
        return pd.DataFrame(columns=["stay_id", "hour"] + list(CHART_ITEM_IDS.keys()))

    chart_df = pd.concat(records, ignore_index=True)
    chart_pivot = chart_df.pivot_table(index=["stay_id", "hour"], columns="feature", values="value_num", aggfunc="mean").reset_index()
    return chart_pivot


def process_lab_events(path, icu_stays):
    path = ensure_path(path)
    item_to_feature = build_feature_map(LAB_ITEM_IDS)
    cols = ["hadm_id", "charttime", "itemid", "valuenum", "value"]

    records = []
    for chunk in pd.read_csv(path, usecols=cols, parse_dates=["charttime"], chunksize=CHUNK_SIZE, compression="infer", low_memory=False):
        chunk = chunk[chunk["itemid"].isin(item_to_feature)]
        if chunk.empty:
            continue

        chunk["feature"] = chunk["itemid"].map(item_to_feature)
        chunk["value_num"] = chunk["valuenum"].where(chunk["valuenum"].notna())
        missing_value = chunk["value_num"].isna()
        chunk.loc[missing_value, "value_num"] = chunk.loc[missing_value, "value"].apply(parse_numeric_value)
        chunk["value_num"] = pd.to_numeric(chunk["value_num"], errors="coerce")
        chunk = chunk.dropna(subset=["value_num", "charttime", "hadm_id"])
        if chunk.empty:
            continue

        merged = chunk.merge(icu_stays[["hadm_id", "stay_id", "intime", "outtime"]], on="hadm_id", how="left")
        merged = merged[merged["charttime"].between(merged["intime"], merged["outtime"], inclusive="both")]
        merged = merged.dropna(subset=["stay_id"])
        if merged.empty:
            continue

        merged["hour"] = merged["charttime"].dt.floor("H")
        grouped = (
            merged.groupby(["stay_id", "hour", "feature"], dropna=False)["value_num"]
            .mean()
            .reset_index()
        )
        records.append(grouped)

    if not records:
        return pd.DataFrame(columns=["stay_id", "hour"] + list(LAB_ITEM_IDS.keys()))

    lab_df = pd.concat(records, ignore_index=True)
    lab_pivot = lab_df.pivot_table(index=["stay_id", "hour"], columns="feature", values="value_num", aggfunc="mean").reset_index()
    return lab_pivot


def combine_features(chart_df, lab_df, icu_stays, patients, sepsis_labels):
    df = pd.merge(chart_df, lab_df, on=["stay_id", "hour"], how="outer")
    df = pd.merge(df, icu_stays[["stay_id", "hadm_id", "subject_id", "los"]], on="stay_id", how="left")
    df = pd.merge(df, patients[["subject_id", "anchor_age"]], on="subject_id", how="left")
    df = pd.merge(df, sepsis_labels, on="hadm_id", how="left")
    df = df.drop_duplicates(subset=["stay_id", "hour", "hadm_id", "subject_id"])
    df["map"] = df["map"].fillna(df["dbp"] + (df["sbp"] - df["dbp"]) / 3.0)
    df["hour"] = df["hour"].astype("datetime64[ns]")
    
    # Fill sepsis_label: 0 for negative (not sepsis), keep NaN for unknown
    # NaN values indicate stays with no sepsis diagnosis found
    df["sepsis_label"] = df["sepsis_label"].fillna(0).astype(int)
    
    df = df[["subject_id", "hadm_id", "stay_id", "hour"] + [c for c in OUTPUT_COLUMNS if c not in {"subject_id", "hadm_id", "stay_id", "hour"}] + ["anchor_age", "los", "sepsis_label"]]
    df = df.rename(columns={"anchor_age": "age", "los": "icu_los"})
    return df


def engineer_features(df):
    df = df.sort_values(["stay_id", "hour"]).reset_index(drop=True)
    fill_cols = [
        "heart_rate",
        "respiratory_rate",
        "temperature",
        "spo2",
        "sbp",
        "dbp",
        "map",
        "wbc",
        "creatinine",
        "platelets",
        "lactate",
    ]
    df[fill_cols] = df.groupby("stay_id")[fill_cols].ffill().bfill()
    medians = df[fill_cols].median()
    df[fill_cols] = df[fill_cols].fillna(medians)
    df["shock_index"] = df["heart_rate"] / df["sbp"]
    df["pulse_pressure"] = df["sbp"] - df["dbp"]
    df["map_low"] = (df["map"] < 100).astype(int)
    df["tachypnea"] = (df["respiratory_rate"] > 22).astype(int)
    df["map_trend"] = df.groupby("stay_id")["map"].diff().fillna(0.0)
    df["heart_rate_trend"] = df.groupby("stay_id")["heart_rate"].diff().fillna(0.0)
    df["respiratory_rate_trend"] = df.groupby("stay_id")["respiratory_rate"].diff().fillna(0.0)
    df["lactate_delta"] = df.groupby("stay_id")["lactate"].diff().fillna(0.0)
    df["age"] = df["age"].fillna(-1).astype(int)
    df["icu_los"] = df["icu_los"].fillna(0.0)
    return df


def parse_args():
    parser = argparse.ArgumentParser(description="Extract hourly features from MIMIC-IV CSV files.")
    parser.add_argument("--chart-events", default="mimic-iv-clinical-database-demo-2.2/icu/chartevents.csv", help="Path to chartevents.csv or chartevents.csv.gz")
    parser.add_argument("--lab-events", default="mimic-iv-clinical-database-demo-2.2/hosp/labevents.csv", help="Path to labevents.csv or labevents.csv.gz")
    parser.add_argument("--icustays", default="mimic-iv-clinical-database-demo-2.2/icu/icustays.csv", help="Path to icustays.csv or icustays.csv.gz")
    parser.add_argument("--patients", default="mimic-iv-clinical-database-demo-2.2/hosp/patients.csv", help="Path to patients.csv or patients.csv.gz")
    parser.add_argument("--diagnoses", default="mimic-iv-clinical-database-demo-2.2/hosp/diagnoses_icd.csv", help="Path to diagnoses_icd.csv for sepsis label extraction")
    parser.add_argument("--external-sepsis-labels", default=None, help="Optional path to external Sepsis-3 labels CSV (columns: hadm_id, sepsis_label)")
    parser.add_argument("--output", default="processed_features.csv", help="Output CSV file path for base features")
    parser.add_argument("--train-output", default="train_features.csv", help="Output CSV file path for engineered training features")
    return parser.parse_args()


def main():
    args = parse_args()
    icu_stays = read_icustays(args.icustays)
    patients = read_patients(args.patients)
    chart_df = process_chart_events(args.chart_events, icu_stays)
    lab_df = process_lab_events(args.lab_events, icu_stays)
    
    # Extract sepsis labels
    print("Extracting sepsis labels from ICD codes...")
    sepsis_labels = extract_sepsis_labels_from_icd(args.diagnoses)
    print(f"  Found {len(sepsis_labels)} admissions with sepsis diagnosis")
    
    # Load external labels if provided (overrides ICD-based labels)
    if args.external_sepsis_labels:
        print(f"Loading external sepsis labels from {args.external_sepsis_labels}...")
        external_labels = load_external_sepsis_labels(args.external_sepsis_labels)
        if not external_labels.empty:
            # External labels override ICD-based labels
            sepsis_labels = external_labels
            print(f"  Loaded {len(external_labels)} labels from external file")
    
    processed = combine_features(chart_df, lab_df, icu_stays, patients, sepsis_labels)
    processed = processed.sort_values(["stay_id", "hour"])
    processed.to_csv(args.output, index=False)
    print(f"Wrote {len(processed)} rows to {args.output}")
    
    # Summary statistics for sepsis_label
    sepsis_positive = processed[processed["sepsis_label"] == 1]["hadm_id"].nunique()
    total_admits = processed["hadm_id"].nunique()
    print(f"Sepsis label summary: {sepsis_positive}/{total_admits} admissions labeled with sepsis")

    train_features = engineer_features(processed)
    train_columns = ["subject_id", "hadm_id", "stay_id", "hour"] + [c for c in OUTPUT_COLUMNS if c not in {"subject_id", "hadm_id", "stay_id", "hour"}] + ENGINEERED_COLUMNS + ["sepsis_label"]
    train_features = train_features[train_columns]
    train_features.to_csv(args.train_output, index=False)
    print(f"Wrote {len(train_features)} rows to {args.train_output}")


if __name__ == "__main__":
    main()
