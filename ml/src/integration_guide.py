"""
VitalSense AI - Integration Guide for Response Generator

Shows how to integrate the response generator with existing LSTM, XGBoost,
and ensemble prediction models.
"""

from response_generator import generate_prediction_response, generate_response_json
from typing import Dict, Any, Optional, List
import json


# ============================================================================
# PATTERN 1: XGBOOST MODEL INTEGRATION
# ============================================================================

class XGBoostPredictorWithResponse:
    """XGBoost predictor with integrated response generation."""
    
    def __init__(self, model, feature_names: List[str], model_version: str = "v1.0-xgb"):
        """Initialize predictor.
        
        Args:
            model: Trained XGBoost model
            feature_names: List of feature names in training order
            model_version: Version identifier for the model
        """
        self.model = model
        self.feature_names = feature_names
        self.model_version = model_version
    
    def predict_with_response(
        self,
        patient_id: str,
        features_dict: Dict[str, float],
        include_shap: bool = False,
        shap_explainer=None
    ) -> Dict[str, Any]:
        """Generate prediction with full response object.
        
        Args:
            patient_id: Unique patient ID
            features_dict: Dictionary of feature values
            include_shap: Whether to include SHAP explanations
            shap_explainer: SHAP explainer instance (required if include_shap=True)
            
        Returns:
            Complete prediction response object
            
        Example:
            >>> response = predictor.predict_with_response(
            ...     patient_id="P123",
            ...     features_dict={"age": 65, "heart_rate": 110, ...},
            ...     include_shap=True,
            ...     shap_explainer=explainer
            ... )
        """
        import numpy as np
        
        # Prepare features in correct order
        feature_array = np.array([
            features_dict.get(fname, 0.0) for fname in self.feature_name
        ]).reshape(1, -1)
        
        # Get probability prediction
        risk_score = self.model.predict_proba(feature_array)[0, 1]
        
        # Extract top factors (features with highest contribution)
        top_factors = self._extract_top_factors(features_dict)
        
        # Get SHAP explanations if requested
        shap_explanations = {}
        if include_shap and shap_explainer:
            shap_values = shap_explainer.shap_values(feature_array)
            shap_explanations = {
                fname: float(shap_values[0, i])
                for i, fname in enumerate(self.feature_names)
                if shap_values[0, i] != 0
            }
            # Sort by absolute value
            shap_explanations = dict(sorted(
                shap_explanations.items(),
                key=lambda x: abs(x[1]),
                reverse=True
            ))
        
        # Generate response
        return generate_prediction_response(
            patient_id=patient_id,
            risk_score=risk_score,
            top_factors=top_factors,
            shap_explanations=shap_explanations,
            model_version=self.model_version
        )
    
    def _extract_top_factors(self, features_dict: Dict[str, float], n_top: int = 3) -> List[str]:
        """Extract top contributing factors (simplified).
        
        In production, use SHAP values for accurate feature importance.
        This is a simplified placeholder based on feature values.
        """
        # Map features to human-readable descriptions
        factor_descriptions = {
            "age": "Advanced Age" if features_dict.get("age", 0) > 65 else "Young Age",
            "heart_rate": "High Heart Rate" if features_dict.get("heart_rate", 0) > 100 else "Normal Heart Rate",
            "systolic_bp": "Low BP" if features_dict.get("systolic_bp", 0) < 90 else "Normal BP",
            "lactate": "Elevated Lactate" if features_dict.get("lactate", 0) > 2.0 else "Normal Lactate",
            "platelets": "Low Platelets" if features_dict.get("platelets", 0) < 150 else "Normal Platelets",
            "wbc": "Elevated WBC" if features_dict.get("wbc", 0) > 11 else "Normal WBC",
            "shock_index": "High Shock Index" if features_dict.get("shock_index", 0) > 0.7 else "Normal Shock Index",
            "respiratory_rate": "High Respiratory Rate" if features_dict.get("respiratory_rate", 0) > 20 else "Normal Rate",
            "urine_output": "Low Urine Output" if features_dict.get("urine_output", 0) < 0.5 else "Normal Urine Output",
            "temperature": "High Fever" if features_dict.get("temperature", 0) > 38.5 else "Hypothermia" if features_dict.get("temperature", 0) < 36 else "Normal Temperature",
        }
        
        # Return top N factors that are notable
        factors = [desc for feat, desc in factor_descriptions.items() if feat in features_dict]
        return factors[:n_top]


# ============================================================================
# PATTERN 2: LSTM MODEL INTEGRATION
# ============================================================================

class LSTMPredictorWithResponse:
    """LSTM predictor with integrated response generation."""
    
    def __init__(self, model, model_version: str = "v1.1-lstm"):
        """Initialize LSTM predictor.
        
        Args:
            model: Trained LSTM model
            model_version: Version identifier
        """
        self.model = model
        self.model_version = model_version
    
    def predict_with_response(
        self,
        patient_id: str,
        sequence: Any,  # Shape: (1, timesteps, features)
        top_factors: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate prediction with full response object.
        
        Args:
            patient_id: Unique patient ID
            sequence: Time series sequence [1, timesteps, features]
            top_factors: Top contributing factors
            
        Returns:
            Complete prediction response object
        """
        # Get probability prediction
        risk_score = self.model.predict(sequence)[0, 0]
        
        # Use provided factors or default
        if top_factors is None:
            top_factors = ["Temporal trend indicates increased risk"]
        
        # Generate response
        return generate_prediction_response(
            patient_id=patient_id,
            risk_score=risk_score,
            top_factors=top_factors,
            shap_explanations={},  # SHAP not typically used for LSTM
            model_version=self.model_version
        )


# ============================================================================
# PATTERN 3: ENSEMBLE MODEL INTEGRATION
# ============================================================================

class EnsemblePredictorWithResponse:
    """Ensemble predictor combining multiple models."""
    
    def __init__(
        self,
        xgb_predictor: XGBoostPredictorWithResponse,
        lstm_predictor: LSTMPredictorWithResponse,
        weights: Dict[str, float] = None
    ):
        """Initialize ensemble predictor.
        
        Args:
            xgb_predictor: XGBoost predictor instance
            lstm_predictor: LSTM predictor instance
            weights: Model weights (default: equal weight)
        """
        self.xgb_predictor = xgb_predictor
        self.lstm_predictor = lstm_predictor
        
        if weights is None:
            weights = {"xgb": 0.5, "lstm": 0.5}
        self.weights = weights
    
    def predict_with_response(
        self,
        patient_id: str,
        features_dict: Dict[str, float],
        sequence: Any = None,
        include_shap: bool = False,
        shap_explainer=None
    ) -> Dict[str, Any]:
        """Generate ensemble prediction with full response.
        
        Args:
            patient_id: Unique patient ID
            features_dict: Dictionary of feature values (for XGBoost)
            sequence: Time series sequence (for LSTM)
            include_shap: Whether to include SHAP values
            shap_explainer: SHAP explainer instance
            
        Returns:
            Complete prediction response object
        """
        # Get individual predictions
        xgb_response = self.xgb_predictor.predict_with_response(
            patient_id=patient_id,
            features_dict=features_dict,
            include_shap=include_shap,
            shap_explainer=shap_explainer
        )
        
        # Ensemble score (weighted average)
        xgb_score = xgb_response["risk_score"]
        
        lstm_score = 0.0
        if sequence is not None:
            lstm_response = self.lstm_predictor.predict_with_response(
                patient_id=patient_id,
                sequence=sequence
            )
            lstm_score = lstm_response["risk_score"]
        
        # Calculate ensemble score
        ensemble_score = (
            xgb_score * self.weights["xgb"] +
            lstm_score * self.weights["lstm"]
        )
        
        # Combine factors from both models
        combined_factors = xgb_response["top_factors"].copy()
        if sequence is not None:
            combined_factors.extend(["Temporal pattern indicates increased risk"])
        
        # Generate response
        return generate_prediction_response(
            patient_id=patient_id,
            risk_score=ensemble_score,
            top_factors=combined_factors[:3],  # Top 3 factors
            shap_explanations=xgb_response["shap_explanations"],
            model_version="v1.2-ensemble"
        )


# ============================================================================
# PATTERN 4: PRODUCTION PIPELINE
# ============================================================================

class PredictionPipeline:
    """Complete production prediction pipeline."""
    
    def __init__(self, predictor):
        """Initialize with a predictor (any of the above types)."""
        self.predictor = predictor
    
    def process_patient(
        self,
        patient_id: str,
        features_dict: Dict[str, float],
        sequence: Any = None,
        include_shap: bool = True,
        shap_explainer=None
    ) -> Dict[str, Any]:
        """Process a single patient through the pipeline.
        
        Returns:
            Complete prediction response object
        """
        try:
            response = self.predictor.predict_with_response(
                patient_id=patient_id,
                features_dict=features_dict,
                sequence=sequence,
                include_shap=include_shap,
                shap_explainer=shap_explainer
            )
            return response
        except Exception as e:
            raise RuntimeError(f"Pipeline error for patient {patient_id}: {e}")
    
    def process_batch(
        self,
        patients_data: List[Dict[str, Any]],
        include_shap: bool = False,
        shap_explainer=None
    ) -> List[Dict[str, Any]]:
        """Process multiple patients.
        
        Args:
            patients_data: List of patient data dicts with keys:
                - patient_id
                - features_dict
                - sequence (optional)
            include_shap: Whether to include SHAP values
            shap_explainer: SHAP explainer instance
            
        Returns:
            List of prediction responses sorted by risk score (descending)
        """
        responses = []
        for patient in patients_data:
            response = self.process_patient(
                patient_id=patient["patient_id"],
                features_dict=patient.get("features_dict", {}),
                sequence=patient.get("sequence"),
                include_shap=include_shap,
                shap_explainer=shap_explainer
            )
            responses.append(response)
        
        # Sort by risk score (highest first)
        responses.sort(key=lambda x: x["risk_score"], reverse=True)
        return responses
    
    def export_json(self, response: Dict[str, Any], pretty: bool = True) -> str:
        """Export response as JSON string."""
        return json.dumps(response, indent=2 if pretty else None, ensure_ascii=False)


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    # Example 1: XGBoost predictor with response
    print("=" * 70)
    print("EXAMPLE 1: XGBoost Predictor with Response Generation")
    print("=" * 70)
    
    # In production, load actual model and features
    # from sklearn.externals import joblib
    # xgb_model = joblib.load('models/xgb_model.pkl')
    # feature_names = ['age', 'heart_rate', 'systolic_bp', ...]
    
    # Placeholder for demonstration
    class DummyXGBModel:
        def predict_proba(self, X):
            return [[0.1, 0.9]]  # Example: 90% risk
    
    # xgb_predictor = XGBoostPredictorWithResponse(
    #     model=DummyXGBModel(),
    #     feature_names=['age', 'heart_rate', 'systolic_bp', 'lactate', 'platelets'],
    #     model_version="v1.0-xgb"
    # )
    
    # response = xgb_predictor.predict_with_response(
    #     patient_id="P12345",
    #     features_dict={
    #         "age": 72,
    #         "heart_rate": 115,
    #         "systolic_bp": 88,
    #         "lactate": 3.2,
    #         "platelets": 120
    #     },
    #     include_shap=False
    # )
    # print(json.dumps(response, indent=2))
    
    print("See docstrings above for integration patterns with:")
    print("  - XGBoost models")
    print("  - LSTM models")
    print("  - Ensemble models")
    print("  - Production pipelines")
