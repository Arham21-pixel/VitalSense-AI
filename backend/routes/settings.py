from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/settings", tags=["settings"])


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class HospitalSettings(BaseModel):
    hospital_name: str = "VitalSense General Hospital"
    timezone: str = "Asia/Kolkata"
    date_format: str = "DD MMM YYYY"
    time_format: str = "24-hour"
    language: str = "English"
    default_unit_system: str = "Metric"


class ThresholdSettings(BaseModel):
    lactate_warning: float = 2.0
    lactate_critical: float = 3.5
    heart_rate_high: float = 100.0
    respiratory_rate_high: float = 22.0
    spo2_low: float = 92.0
    temperature_high: float = 38.3
    systolic_bp_low: float = 90.0


class NotificationSettings(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    escalation_minutes: int = 10
    on_call_team: str = "Rapid Response Team"
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "06:00"


class UserRoleSettings(BaseModel):
    id: str
    name: str
    access_level: str
    members: int = 0
    active: bool = True
    scope: str = ""


class SettingsUpdatePayload(BaseModel):
    hospital: HospitalSettings = Field(default_factory=HospitalSettings)
    thresholds: ThresholdSettings = Field(default_factory=ThresholdSettings)
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)
    roles: List[UserRoleSettings] = Field(default_factory=list)


class SettingsSnapshot(SettingsUpdatePayload):
    updated_at: str


def build_default_settings() -> SettingsSnapshot:
    return SettingsSnapshot(
        hospital=HospitalSettings(),
        thresholds=ThresholdSettings(),
        notifications=NotificationSettings(),
        roles=[
            UserRoleSettings(
                id="role-admin",
                name="Administrator",
                access_level="Admin",
                members=2,
                active=True,
                scope="Full control over hospital settings, roles, thresholds, and alerts.",
            ),
            UserRoleSettings(
                id="role-lead",
                name="Clinical Lead",
                access_level="Editor",
                members=4,
                active=True,
                scope="Can tune thresholds, review alerts, and coordinate escalation policy.",
            ),
            UserRoleSettings(
                id="role-nurse",
                name="Nurse Station",
                access_level="Responder",
                members=12,
                active=True,
                scope="Can review patient context, acknowledge alerts, and update handoff notes.",
            ),
            UserRoleSettings(
                id="role-viewer",
                name="Ward Viewer",
                access_level="Read Only",
                members=8,
                active=False,
                scope="View live status and audit history without editing policy.",
            ),
        ],
        updated_at=utc_now_iso(),
    )


settings_state = build_default_settings()


@router.get("", response_model=SettingsSnapshot)
def get_settings() -> SettingsSnapshot:
  return settings_state


@router.patch("", response_model=SettingsSnapshot)
def update_settings(payload: SettingsUpdatePayload) -> SettingsSnapshot:
  global settings_state
  settings_state = SettingsSnapshot(**payload.dict(), updated_at=utc_now_iso())
  return settings_state


@router.post("/reset", response_model=SettingsSnapshot)
def reset_settings() -> SettingsSnapshot:
  global settings_state
  settings_state = build_default_settings()
  return settings_state
