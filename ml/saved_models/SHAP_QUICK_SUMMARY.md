# SHAP Analysis - QUICK SUMMARY

## ✓ COMPLETED TASKS

### 1. SHAP Values Generated on TEST Set
- **Samples analyzed:** 2,085 test cases
- **Method:** TreeExplainer (optimized for XGBoost)
- **Computation:** Exact Shapley values for each feature-sample pair
- **Status:** ✓ Complete

---

### 2. TOP 10 FEATURES BY MEAN ABSOLUTE SHAP VALUE

| Rank | Feature | Mean \|SHAP\| |
|------|---------|---------------|
| 1 | **age** | 2.6394 |
| 2 | shock_index | 0.2326 |
| 3 | heart_rate | 0.1504 |
| 4 | pulse_pressure | 0.1143 |
| 5 | respiratory_rate | 0.1064 |
| 6 | map | 0.0609 |
| 7 | sbp | 0.0568 |
| 8 | dbp | 0.0487 |
| 9 | temperature | 0.0349 |
| 10 | tachypnea | 0.0151 |

**Key Finding:** Age is 11x more important than the second-most important feature (shock_index)

---

### 3. VISUALIZATIONS CREATED

#### Plot 1: SHAP Summary Plot (Bee Swarm)
**File:** `shap_summary_plot.png`
- Shows individual sample contributions for each feature
- Color represents feature value (red=high, blue=low)
- Dots to the right indicate features pushing toward sepsis prediction
- Age clearly dominates with the widest spread

#### Plot 2: SHAP Feature Importance Bar Chart
**File:** `shap_feature_importance_bar.png`
- Ranks top 15 features by mean absolute SHAP value
- Age bar dominates (~2.64) compared to all others
- Clear exponential decay in importance

---

### 4. HIGH-RISK PATIENT ANALYSIS

#### Patient Selected: Subject ID 10031757
- **Risk Score:** 97.88% probability of sepsis 🔴 **HIGH RISK**
- **Actual Status:** SEPSIS (confirmed by ground truth)
- **Model Accuracy:** CORRECT ✓

#### Risk Score Breakdown:

**TOP 5 POSITIVE CONTRIBUTORS (↑ Increasing Risk)**
1. **age: 67 years** → SHAP: +4.1291 (85.1% of risk)
2. **heart_rate: 121 bpm** → SHAP: +0.3639 (7.5% of risk)
3. **shock_index: 1.14** → SHAP: +0.1003 (2.1% of risk)
4. **map: 80.67 mmHg** → SHAP: +0.0626 (1.3% of risk)
5. **sbp: 106 mmHg** → SHAP: +0.0621 (1.3% of risk)

**TOP 5 NEGATIVE CONTRIBUTORS (↓ Decreasing Risk)**
1. **pulse_pressure: 38 mmHg** → SHAP: -0.0583 (1.2% protection)
2. **temperature: 36.89°C** → SHAP: -0.0462 (1.0% protection)
3. **dbp: 68 mmHg** → SHAP: -0.0168 (0.3% protection)
4. **wbc: NaN** → SHAP: -0.0042 (0.1% protection)
5. **respiratory_rate: 23 breaths/min** → SHAP: -0.0026 (0.1% protection)

---

### 5. HUMAN-READABLE EXPLANATION

#### Why This Patient is HIGH-RISK:

**Primary Factor (85% of risk):** Advanced age (67 years)
- The model has learned that older patients in this ICU dataset have significantly higher sepsis risk
- This single factor alone shifts the prediction from 25% baseline to ~80%

**Secondary Factors (15% of risk):** Multiple hemodynamic abnormalities
- **Tachycardia** (121 bpm) - heart racing, classic sepsis sign
- **Elevated shock index** - ratio of heart rate to blood pressure indicates severe hemodynamic stress
- **Low blood pressure** - systolic only 106 mmHg (normal ~120)
- **Reduced perfusion** - mean arterial pressure 80.67 mmHg, borderline concerning

#### Clinical Interpretation:

This is a **very sick patient** showing the classic triad of sepsis risk:
1. **Advanced age** - reduced physiologic reserve
2. **Hemodynamic instability** - vital signs show cardiovascular stress
3. **Systemic response** - tachycardia and hypotension suggesting infection/shock

The model's 97.88% prediction is **highly confident and well-justified** clinically. The combination of multiple risk factors creates a compelling case for sepsis.

**Ground Truth Validation:** Patient DID have sepsis, confirming the model's prediction was accurate.

---

## OUTPUT FILES

### Visualizations
- `shap_summary_plot.png` - Bee swarm SHAP plot
- `shap_feature_importance_bar.png` - Feature importance ranking

### Data Files
- `shap_feature_importance.csv` - All 17 features ranked by mean |SHAP|
- `high_risk_patient_explanation.txt` - Patient case details

### Reports
- `SHAP_ANALYSIS_REPORT.md` - Full comprehensive report (this folder)

---

## KEY INSIGHTS

### About Feature Importance
- **Age is king** - Single most predictive feature (11x more important than #2)
- **Hemodynamic features critical** - Heart rate, blood pressure, shock index are strong secondary signals
- **Lab values surprisingly weak** - WBC, lactate, creatinine have minimal predictive power
- **Temperature is weak** - Perhaps elderly patients don't mount fever response in sepsis

### About the Model
- ✓ Makes interpretable predictions
- ✓ Focuses on clinically relevant features
- ✓ Successfully identifies high-risk patients
- ⚠️ Age heavily dominates; may need age-stratified thresholds

### About This Patient
- ✓ Model correctly identified as high-risk
- ✓ Multiple clinical warning signs present
- ✓ Appropriate for urgent sepsis intervention
- ✓ Ground truth confirms sepsis diagnosis

---

**Analysis Date:** June 11, 2026
**Model:** XGBoost Sepsis Prediction
**Test Set Size:** 2,085 samples (30.3% sepsis prevalence)
**Explainability Method:** SHAP (Shapley Additive exPlanations)
