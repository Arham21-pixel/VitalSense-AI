# Quick Reference: Sepsis Label Implementation

## 📊 What Was Created

Binary target column `sepsis_label` (0 = no sepsis, 1 = sepsis) based on Sepsis-3 ICD codes.

## 📈 Current Dataset

```
Files Updated:
  ✓ train_features.csv (12,128 rows × 23 columns)
  ✓ processed_features.csv (12,128 rows × 18 columns)

Cohort:
  • Total admissions: 128
  • Sepsis positive: 21 (16.4%)
  • Sepsis negative: 107 (83.6%)
  • Time points per admission: avg 94.8, median 50.5
```

## 🚀 How to Use

### Default (ICD-based labels)
```bash
python extract_mimic_features.py
```

### With external Sepsis-3 labels
```bash
python extract_mimic_features.py --external-sepsis-labels my_labels.csv
```

### Analyze sepsis cohorts
```bash
python sepsis_analysis_example.py
```

## 📁 New/Modified Files

| File | Purpose |
|------|---------|
| `extract_mimic_features.py` | Main pipeline (updated) |
| `SEPSIS_LABELING.md` | Full documentation |
| `IMPLEMENTATION_SUMMARY.md` | Executive summary |
| `sepsis_analysis_example.py` | Analysis examples |
| `external_sepsis_labels_template.csv` | Template for custom labels |
| `verify_implementation.py` | Verification script |

## 🔬 Key Clinical Findings

Sepsis patients show:
- 6.6% higher heart rate
- 11.4% higher respiratory rate  
- 19.4% higher creatinine
- **96.8% longer ICU stay** ← Most significant

## 💾 Loading Data in Python

```python
import pandas as pd

df = pd.read_csv('train_features.csv')

# By sepsis status
sepsis = df[df['sepsis_label'] == 1]
control = df[df['sepsis_label'] == 0]

# Per admission
admissions = df.groupby('hadm_id').first()
X = admissions.drop(['sepsis_label', 'subject_id', 'hadm_id'], axis=1)
y = admissions['sepsis_label']
```

## 🛠️ External Labels Format

Create CSV with columns: `hadm_id`, `sepsis_label`

```csv
hadm_id,sepsis_label
22580999,1
22580912,0
...
```

Then run:
```bash
python extract_mimic_features.py --external-sepsis-labels labels.csv
```

## 📚 ICD Codes Used

| System | Codes | Condition |
|--------|-------|-----------|
| ICD-9 | 038.* | Septicemia |
| ICD-9 | 995.9* | SIRS from infection |
| ICD-10 | A40.* | Streptococcal sepsis |
| ICD-10 | A41.* | Other sepsis |
| ICD-10 | R65.2* | Severe sepsis |

## ✨ Next Steps

1. Integrate external Sepsis-3 validated cohorts from MIT-LCP
2. Add SOFA/qSOFA scoring
3. Identify sepsis onset time (not just binary)
4. Validate against expert annotations

## 🔗 References

- Sepsis-3 Consensus: https://sepsis-3.org/
- MIT-LCP MIMIC Code: https://github.com/MIT-LCP/mimic-code
- Singer et al. (2016): JAMA 315(8): 801-810

---

✅ **Status**: Ready for use | **Date**: 2026-06-10
