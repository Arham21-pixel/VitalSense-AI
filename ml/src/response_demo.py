"""
VitalSense AI - Response Generator Demo

Demonstrates how to generate complete prediction responses for various patient scenarios.
"""

from response_generator import generate_prediction_response, generate_response_json
import json


def demo_high_risk_patient():
    """Demo: High-risk sepsis patient requiring immediate intervention."""
    print("=" * 70)
    print("DEMO 1: HIGH-RISK SEPSIS PATIENT")
    print("=" * 70)
    
    response = generate_prediction_response(
        patient_id="10031757",
        risk_score=0.9788,
        top_factors=["High Heart Rate", "High Shock Index", "Advanced Age"],
        shap_explanations={
            "age": 4.13,
            "heart_rate": 0.36,
            "shock_index": 0.10,
            "respiratory_rate": 0.08,
            "systolic_bp": 0.05
        },
        model_version="v1.0-xgb"
    )
    
    print("\nResponse Object:")
    print(json.dumps(response, indent=2))
    
    print(f"\n✓ Alert Status: {response['alert']}")
    print(f"✓ Priority: {response['priority']}")
    print(f"✓ Recommended Action: {response['recommended_action']}")
    print(f"✓ Model Version: {response['model_version']}")


def demo_medium_risk_patient():
    """Demo: Medium-risk patient requiring enhanced monitoring."""
    print("\n" + "=" * 70)
    print("DEMO 2: MEDIUM-RISK PATIENT")
    print("=" * 70)
    
    response = generate_prediction_response(
        patient_id="10031758",
        risk_score=0.52,
        top_factors=["Low Urine Output", "Elevated Lactate", "Recent Surgery"],
        shap_explanations={
            "urine_output": 0.28,
            "lactate": 0.15,
            "post_op_hours": 0.09
        },
        model_version="v1.0-xgb"
    )
    
    print("\nResponse Object:")
    print(json.dumps(response, indent=2))
    
    print(f"\n✓ Alert Status: {response['alert']}")
    print(f"✓ Priority: {response['priority']}")
    print(f"✓ Recommended Action: {response['recommended_action']}")


def demo_low_risk_patient():
    """Demo: Low-risk patient with stable vital signs."""
    print("\n" + "=" * 70)
    print("DEMO 3: LOW-RISK PATIENT")
    print("=" * 70)
    
    response = generate_prediction_response(
        patient_id="10031759",
        risk_score=0.08,
        top_factors=[],
        shap_explanations={},
        model_version="v1.0-xgb"
    )
    
    print("\nResponse Object:")
    print(json.dumps(response, indent=2))
    
    print(f"\n✓ Alert Status: {response['alert']}")
    print(f"✓ Priority: {response['priority']}")
    print(f"✓ Recommended Action: {response['recommended_action']}")


def demo_batch_predictions():
    """Demo: Batch processing of multiple patient predictions."""
    print("\n" + "=" * 70)
    print("DEMO 4: BATCH PREDICTION PROCESSING")
    print("=" * 70)
    
    patients_data = [
        {
            "patient_id": "10001001",
            "risk_score": 0.95,
            "top_factors": ["Severe Tachycardia", "Low BP"],
            "shap_explanations": {"hr": 0.45, "bp": 0.32}
        },
        {
            "patient_id": "10001002",
            "risk_score": 0.42,
            "top_factors": ["Mild Fever", "Increased WBC"],
            "shap_explanations": {"temp": 0.18, "wbc": 0.15}
        },
        {
            "patient_id": "10001003",
            "risk_score": 0.15,
            "top_factors": [],
            "shap_explanations": {}
        }
    ]
    
    responses = []
    for patient in patients_data:
        response = generate_prediction_response(
            patient_id=patient["patient_id"],
            risk_score=patient["risk_score"],
            top_factors=patient["top_factors"],
            shap_explanations=patient["shap_explanations"],
            model_version="v1.0-xgb"
        )
        responses.append(response)
    
    print("\nBatch Results (sorted by risk score DESC):")
    responses_sorted = sorted(responses, key=lambda x: x["risk_score"], reverse=True)
    
    for i, resp in enumerate(responses_sorted, 1):
        print(f"\n{i}. Patient {resp['patient_id']}")
        print(f"   Risk Score: {resp['risk_score']} | Level: {resp['risk_level']} | Priority: {resp['priority']}")


def demo_json_output():
    """Demo: Compact JSON output for API responses."""
    print("\n" + "=" * 70)
    print("DEMO 5: JSON OUTPUT FOR API INTEGRATION")
    print("=" * 70)
    
    json_response = generate_response_json(
        patient_id="10031757",
        risk_score=0.9788,
        top_factors=["High Heart Rate", "High Shock Index", "Advanced Age"],
        shap_explanations={
            "age": 4.13,
            "heart_rate": 0.36,
            "shock_index": 0.10
        },
        model_version="v1.0-xgb",
        pretty=True
    )
    
    print("\nCompact JSON (suitable for API response):")
    print(json_response)


def demo_error_handling():
    """Demo: Error handling and validation."""
    print("\n" + "=" * 70)
    print("DEMO 6: ERROR HANDLING & VALIDATION")
    print("=" * 70)
    
    test_cases = [
        ("Invalid risk score (>1.0)", {"patient_id": "P1", "risk_score": 1.5}),
        ("Negative risk score", {"patient_id": "P2", "risk_score": -0.1}),
        ("Empty patient_id", {"patient_id": "", "risk_score": 0.5}),
        ("Non-numeric factors", {"patient_id": "P3", "risk_score": 0.5, "top_factors": [123]}),
    ]
    
    for test_name, kwargs in test_cases:
        print(f"\nTest: {test_name}")
        try:
            response = generate_prediction_response(**kwargs)
            print(f"✓ Success - Risk Score (clamped): {response['risk_score']}")
        except ValueError as e:
            print(f"✗ Caught Error: {e}")


if __name__ == "__main__":
    demo_high_risk_patient()
    demo_medium_risk_patient()
    demo_low_risk_patient()
    demo_batch_predictions()
    demo_json_output()
    demo_error_handling()
    
    print("\n" + "=" * 70)
    print("DEMO COMPLETE")
    print("=" * 70)
