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


class HospitalSettings(BaseModel):
    hospital_name: str
    timezone: str
    date_format: str
    time_format: str
    language: str
    default_unit_system: str


class ThresholdSettings(BaseModel):
    lactate_warning: float
    lactate_critical: float
    heart_rate_high: float
    respiratory_rate_high: float
    spo2_low: float
    temperature_high: float
    systolic_bp_low: float


class NotificationSettings(BaseModel):
    email_enabled: bool
    sms_enabled: bool
    push_enabled: bool
    escalation_minutes: int
    on_call_team: str
    quiet_hours_start: str
    quiet_hours_end: str


class UserRoleSettings(BaseModel):
    id: str
    name: str
    access_level: str
    members: int
    active: bool
    scope: str


class SettingsUpdatePayload(BaseModel):
    hospital: HospitalSettings
    thresholds: ThresholdSettings
    notifications: NotificationSettings
    roles: List[UserRoleSettings]


class SettingsSnapshot(SettingsUpdatePayload):
    updated_at: str

