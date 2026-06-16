from pydantic import BaseModel
from typing import List, Dict

class PatientVitals(BaseModel):
    patient_id: str
    heart_rate: float
    temperature: float
    respiratory_rate: float
    spo2: float
    systolic_bp: float
    wbc: float
    lactate: float
    creatinine: float

class PredictionResult(BaseModel):
    patient_id: str
    timestamp: str
    risk_score: float
    risk_level: str
    alert: bool
    priority: str
    model_version: str
    top_factors: List[str]
    scores: Dict[str, float] = {}

class Alert(BaseModel):
    alert_id: str
    patient_id: str
    risk_level: str
    priority: str
    message: str
    timestamp: str
    dismissed: bool = False
    top_factors: List[str] = []

