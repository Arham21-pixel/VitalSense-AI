import os
import sys
import pandas as pd

vitals_dict = {
    'heart_rate': 78.0,
    'temperature': 37.1,
    'respiratory_rate': 17.0,
    'spo2': 98.0,
    'systolic_bp': 118.0,
    'wbc': 7.2,
    'lactate': 1.1,
    'creatinine': 0.9,
    'sbp': 118.0,
    'dbp': 80.0,
    'map': 90.0,
    'platelets': 150.0,
    'age': 65.0,
    'icu_los': 1.0
}

patient_series = pd.Series(vitals_dict)

try:
    src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ml'))
    if src_path not in sys.path:
        sys.path.append(src_path)

    from src.predict import predict as ml_predict
    prediction = ml_predict(patient_series)
    print("SUCCESS", prediction)
except Exception as e:
    import traceback
    traceback.print_exc()
