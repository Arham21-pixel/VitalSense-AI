"""
VitalSense AI - REST API Example with Response Generator

Demonstrates how to expose predictions through a REST API with proper
response formatting, error handling, and logging.

Usage:
    pip install flask
    python rest_api_example.py
    # Then: curl -X POST http://localhost:5000/api/predict ...
"""

from flask import Flask, request, jsonify
from .response_generator import generate_prediction_response, generate_response_json
from typing import Dict, Any, Tuple
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)


# ============================================================================
# ERROR HANDLERS
# ============================================================================

class PredictionError(Exception):
    """Base prediction error."""
    pass


class ValidationError(PredictionError):
    """Input validation error."""
    pass


class ModelError(PredictionError):
    """Model prediction error."""
    pass


@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors."""
    return jsonify({
        "error": "Bad Request",
        "message": str(error.description),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }), 400


@app.errorhandler(422)
def unprocessable_entity(error):
    """Handle validation errors."""
    return jsonify({
        "error": "Unprocessable Entity",
        "message": str(error.description),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }), 422


@app.errorhandler(500)
def internal_error(error):
    """Handle internal errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred. Please try again later.",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }), 500


# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

def validate_prediction_request(data: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate incoming prediction request.
    
    Returns:
        (is_valid, error_message)
    """
    required_fields = ["patient_id", "risk_score"]
    
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    if not isinstance(data["patient_id"], str) or not data["patient_id"].strip():
        return False, "patient_id must be a non-empty string"
    
    try:
        score = float(data["risk_score"])
        if score < 0 or score > 1:
            return False, "risk_score must be between 0 and 1"
    except (TypeError, ValueError):
        return False, "risk_score must be a valid number"
    
    # Optional fields validation
    if "top_factors" in data:
        if not isinstance(data["top_factors"], list):
            return False, "top_factors must be an array"
    
    if "shap_explanations" in data:
        if not isinstance(data["shap_explanations"], dict):
            return False, "shap_explanations must be an object"
    
    return True, ""


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "VitalSense AI Prediction API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }), 200


@app.route('/api/predict', methods=['POST'])
def predict():
    """Generate a prediction response.
    
    Request body:
        {
            "patient_id": "10031757",
            "risk_score": 0.9788,
            "top_factors": ["High Heart Rate", "High Shock Index"],
            "shap_explanations": {"age": 4.13, "heart_rate": 0.36},
            "model_version": "v1.0-xgb"  (optional)
        }
    
    Response:
        {
            "patient_id": "10031757",
            "timestamp": "2026-06-11T10:15:00Z",
            "risk_score": 0.9788,
            "risk_level": "HIGH",
            "alert": true,
            "priority": "CRITICAL",
            "model_version": "v1.0-xgb",
            "top_factors": [...],
            "shap_explanations": {...},
            "recommended_action": "Immediate sepsis protocol activation"
        }
    """
    try:
        # Get request data
        data = request.get_json(force=True)
        
        # Validate request
        is_valid, error_msg = validate_prediction_request(data)
        if not is_valid:
            logger.warning(f"Validation error: {error_msg}")
            return jsonify({"error": "Validation Error", "message": error_msg}), 422
        
        logger.info(f"Processing prediction for patient: {data['patient_id']}")
        
        # Generate prediction response
        response = generate_prediction_response(
            patient_id=data["patient_id"],
            risk_score=data["risk_score"],
            top_factors=data.get("top_factors", []),
            shap_explanations=data.get("shap_explanations", {}),
            model_version=data.get("model_version", "v1.0-xgb")
        )
        
        logger.info(f"Prediction generated: risk_level={response['risk_level']}, patient={data['patient_id']}")
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Value error: {e}")
        return jsonify({"error": "Validation Error", "message": str(e)}), 422
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """Generate predictions for multiple patients.
    
    Request body:
        {
            "predictions": [
                {
                    "patient_id": "P1",
                    "risk_score": 0.95,
                    "top_factors": ["Tachycardia"],
                    "shap_explanations": {"hr": 0.5}
                },
                {
                    "patient_id": "P2",
                    "risk_score": 0.42,
                    ...
                }
            ]
        }
    
    Response:
        {
            "predictions": [...],
            "count": 3,
            "timestamp": "...",
            "critical_alerts": 1
        }
    """
    try:
        data = request.get_json(force=True)
        
        if "predictions" not in data:
            return jsonify({"error": "Missing 'predictions' field"}), 422
        
        if not isinstance(data["predictions"], list):
            return jsonify({"error": "predictions must be an array"}), 422
        
        predictions = data["predictions"]
        logger.info(f"Processing batch of {len(predictions)} predictions")
        
        # Generate responses for each prediction
        responses = []
        critical_count = 0
        
        for pred in predictions:
            # Validate each prediction
            is_valid, error_msg = validate_prediction_request(pred)
            if not is_valid:
                logger.warning(f"Skipping invalid prediction: {error_msg}")
                continue
            
            try:
                response = generate_prediction_response(
                    patient_id=pred["patient_id"],
                    risk_score=pred["risk_score"],
                    top_factors=pred.get("top_factors", []),
                    shap_explanations=pred.get("shap_explanations", {}),
                    model_version=pred.get("model_version", "v1.0-xgb")
                )
                responses.append(response)
                
                if response["priority"] == "CRITICAL":
                    critical_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing patient {pred.get('patient_id')}: {e}")
        
        # Sort by risk score (highest first)
        responses.sort(key=lambda x: x["risk_score"], reverse=True)
        
        logger.info(f"Batch processing complete: {len(responses)} predictions, {critical_count} critical")
        
        return jsonify({
            "predictions": responses,
            "count": len(responses),
            "critical_alerts": critical_count,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }), 200
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}", exc_info=True)
        return jsonify({"error": "Processing Error", "message": str(e)}), 500


@app.route('/api/predict/json', methods=['POST'])
def predict_json():
    """Generate prediction and return as compact JSON string.
    
    Similar to /api/predict but returns the response as a raw JSON string
    (useful for streaming scenarios).
    """
    try:
        data = request.get_json(force=True)
        
        # Validate
        is_valid, error_msg = validate_prediction_request(data)
        if not is_valid:
            return jsonify({"error": "Validation Error", "message": error_msg}), 422
        
        # Generate JSON response
        json_response = generate_response_json(
            patient_id=data["patient_id"],
            risk_score=data["risk_score"],
            top_factors=data.get("top_factors", []),
            shap_explanations=data.get("shap_explanations", {}),
            model_version=data.get("model_version", "v1.0-xgb"),
            pretty=False  # Compact JSON
        )
        
        # Return as text/plain with the JSON string
        return json_response, 200, {"Content-Type": "application/json"}
        
    except Exception as e:
        logger.error(f"JSON generation error: {e}")
        return jsonify({"error": "Error", "message": str(e)}), 500


# ============================================================================
# EXAMPLE CLIENTS
# ============================================================================

if __name__ == "__main__":
    print("""
    VitalSense AI - REST API Server
    ================================
    
    Endpoints:
    - GET  /api/health               : Health check
    - POST /api/predict              : Single prediction
    - POST /api/predict/batch        : Batch predictions
    - POST /api/predict/json         : Prediction as JSON string
    
    Example requests:
    
    1. Single prediction:
       curl -X POST http://localhost:5000/api/predict \\
         -H "Content-Type: application/json" \\
         -d '{
           "patient_id": "10031757",
           "risk_score": 0.9788,
           "top_factors": ["High Heart Rate", "High Shock Index"],
           "shap_explanations": {"age": 4.13, "heart_rate": 0.36}
         }'
    
    2. Health check:
       curl http://localhost:5000/api/health
    
    3. Batch prediction:
       curl -X POST http://localhost:5000/api/predict/batch \\
         -H "Content-Type: application/json" \\
         -d '{
           "predictions": [
             {"patient_id": "P1", "risk_score": 0.95, "top_factors": ["Tachycardia"]},
             {"patient_id": "P2", "risk_score": 0.42, "top_factors": ["Fever"]}
           ]
         }'
    """)
    
    print("\nStarting server on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
