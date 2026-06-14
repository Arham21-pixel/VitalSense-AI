# Sepsis Label Implementation

## Overview
A binary `sepsis_label` column has been added to the feature extraction pipeline (`extract_mimic_features.py`). The column contains:
- `1`: Patient admitted with sepsis diagnosis
- `0`: Patient without sepsis diagnosis

## Current Implementation

### ICD Code-Based Detection
The default implementation extracts sepsis labels from ICD diagnoses using Sepsis-3 coding criteria:

**ICD-9 Codes:**
- `038.*` - Septicemia (all subtypes)
- `995.9*` - SIRS from infection (Systemic Inflammatory Response Syndrome)

**ICD-10 Codes:**
- `A40.*` - Streptococcal sepsis
- `A41.*` - Other sepsis (including E. coli, P. aeruginosa, etc.)
- `R65.2*` - Severe sepsis (with/without septic shock)

### Output Statistics (Current Run)
- **Total Admissions:** 128
- **Sepsis Positive (label=1):** 21 (16.4%)
- **Sepsis Negative (label=0):** 107 (83.6%)
- **Total Feature Rows:** 12,128 (hourly time series)

## Using External Sepsis-3 Labels

For more sophisticated Sepsis-3 definitions, you can provide external labels that will override the ICD-code-based detection:

### 1. Prepare External Label File
Create a CSV file with two columns:
```
hadm_id,sepsis_label
22580999,1
22580912,0
...
```

Where:
- `hadm_id`: Hospital admission ID (must match MIMIC-IV data)
- `sepsis_label`: Binary label (0 or 1)

### 2. Run with External Labels
```bash
python extract_mimic_features.py \
  --external-sepsis-labels path/to/sepsis_labels.csv
```

### 3. External Label Sources
Consider using:
- **Sepsis-3 Consortium validated cohorts** from https://sepsis-3.org/
- **MIT-LCP sepsis cohort definitions** - typically found in the `sepsis-3` folder of the mimic-code repository
- **Custom machine learning models** trained on clinical expert annotations
- **Validated clinical trial cohorts** with explicit sepsis definitions

## Implementation Details

### File Modifications
Modified functions in `extract_mimic_features.py`:

1. **`extract_sepsis_labels_from_icd()`**
   - Reads diagnoses_icd.csv
   - Maps ICD codes to sepsis indicator
   - Returns DataFrame with hadm_id and binary sepsis_label

2. **`load_external_sepsis_labels()`**
   - Loads external labels from CSV
   - Validates expected columns
   - Placeholder for future Sepsis-3 integrations

3. **`combine_features()`**
   - Merges sepsis labels with time-series features
   - Fills missing values (non-sepsis admissions as 0)

### Data Structure
- Sepsis label is **constant per admission** (hadm_id)
- Repeated across all hourly records (stay_id, hour) for the same admission
- Can be used as target variable or for cohort filtering

## Integration with ML Pipeline

### Example: Using for Classification
```python
import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv('train_features.csv')

# Get one row per admission
admission_features = df.groupby('hadm_id').first().reset_index()

X = admission_features.drop(['subject_id', 'hadm_id', 'sepsis_label'], axis=1)
y = admission_features['sepsis_label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
```

### Example: Cohort Filtering
```python
# Get only sepsis cases
sepsis_cases = df[df['sepsis_label'] == 1]

# Get only non-sepsis cases  
control_cases = df[df['sepsis_label'] == 0]
```

## Validation Recommendations

When integrating external Sepsis-3 labels:

1. **Distribution Check**
   - Compare ICD-based labels vs external labels
   - Check for significant discrepancies in positive rate

2. **Temporal Consistency**
   - Verify labels align with ICU admission times
   - Check for backward-timed diagnoses

3. **Clinical Validation**
   - Sample cases and verify with clinical team
   - Check for sepsis biomarkers (lactate, WBC) in labeled cases

## Future Enhancements

- Integrate validated Sepsis-3 cohort definitions from MIT-LCP mimic-code repository
- Add sepsis severity scoring (SOFA, qSOFA)
- Include organ dysfunction markers (creatinine, platelets, lactate trends)
- Add sepsis onset timing (clinical anchors)

## References

- **Sepsis-3 Consensus Definitions**: https://sepsis-3.org/
- **ICD-9 to ICD-10 Sepsis Mapping**: https://www.cms.gov/Medicare/Quality-Reporting-Systems/HCQIS/MMC
- **MIT-LCP MIMIC Code**: https://github.com/MIT-LCP/mimic-code
- **Singer et al. (2016)**: "The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)" in JAMA
