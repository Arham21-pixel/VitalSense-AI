from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import random

router = APIRouter(prefix="/patients", tags=["patients"])

# In-memory store for patients and their latest vitals
patients_db: Dict[str, Dict[str, Any]] = {
    "P001": {
        "patient_id": "P001",
        "heart_rate": 78.0,
        "temperature": 37.1,
        "respiratory_rate": 17.0,
        "spo2": 98.0,
        "systolic_bp": 118.0,
        "wbc": 7.2,
        "lactate": 1.1,
        "creatinine": 0.9
    },
    "P002": {
        "patient_id": "P002",
        "heart_rate": 72.0,
        "temperature": 37.0,
        "respiratory_rate": 16.0,
        "spo2": 98.0,
        "systolic_bp": 120.0,
        "wbc": 7.5,
        "lactate": 1.1,
        "creatinine": 0.9
    },
    "P003": {
        "patient_id": "P003",
        "heart_rate": 110.0,
        "temperature": 39.0,
        "respiratory_rate": 24.0,
        "spo2": 91.0,
        "systolic_bp": 90.0,
        "wbc": 15.0,
        "lactate": 3.1,
        "creatinine": 1.5
    },
    "P004": {
        "patient_id": "P004",
        "heart_rate": 80.0,
        "temperature": 36.6,
        "respiratory_rate": 18.0,
        "spo2": 97.0,
        "systolic_bp": 115.0,
        "wbc": 8.0,
        "lactate": 1.3,
        "creatinine": 1.0
    },
    "P005": {
        "patient_id": "P005",
        "heart_rate": 65.0,
        "temperature": 36.8,
        "respiratory_rate": 14.0,
        "spo2": 99.0,
        "systolic_bp": 110.0,
        "wbc": 6.8,
        "lactate": 0.8,
        "creatinine": 0.8
    }
}

PATIENT_BEDS: Dict[str, str] = {
    "P001": "ICU-01",
    "P002": "ICU-02",
    "P003": "ICU-03",
    "P004": "ICU-04",
    "P005": "ICU-05",
}

PATIENT_RISK_PROFILES: Dict[str, str] = {
    "P001": "stable",
    "P002": "stable",
    "P003": "critical",
    "P004": "watch",
    "P005": "stable",
}

patient_history_db: Dict[str, List[Dict[str, Any]]] = {}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_patient_status(vitals: Dict[str, Any]) -> str:
    if vitals["lactate"] > 2.0 and (vitals["heart_rate"] > 100 or vitals["spo2"] < 92):
        return "CRITICAL"
    if (
        vitals["lactate"] > 2.0
        or vitals["heart_rate"] > 100
        or vitals["temperature"] > 38.3
        or vitals["respiratory_rate"] > 22
    ):
        return "HIGH RISK"
    if vitals["temperature"] > 37.8 or vitals["heart_rate"] > 92:
        return "MONITOR"
    return "STABLE"


def build_patient_snapshot(vitals: Dict[str, Any]) -> Dict[str, Any]:
    patient_id = vitals["patient_id"]
    snapshot = dict(vitals)
    snapshot["bed_number"] = PATIENT_BEDS.get(patient_id, patient_id)
    snapshot["status"] = get_patient_status(vitals)
    return snapshot


def update_patient_vitals(patient_id: str, vitals: Dict[str, Any], timestamp: str | None = None) -> Dict[str, Any]:
    timestamp = timestamp or utc_now_iso()
    normalized = dict(vitals)
    normalized["patient_id"] = patient_id
    patients_db[patient_id] = normalized

    history_entry = {
        "timestamp": timestamp,
        "heart_rate": normalized["heart_rate"],
        "temperature": normalized["temperature"],
        "respiratory_rate": normalized["respiratory_rate"],
        "spo2": normalized["spo2"],
        "systolic_bp": normalized["systolic_bp"],
        "wbc": normalized["wbc"],
        "lactate": normalized["lactate"],
        "creatinine": normalized["creatinine"],
    }
    history = patient_history_db.setdefault(patient_id, [])
    history.append(history_entry)
    patient_history_db[patient_id] = history[-10:]
    return normalized


def get_all_patients() -> List[Dict[str, Any]]:
    return [build_patient_snapshot(vitals) for vitals in patients_db.values()]


def get_patient_history(patient_id: str) -> List[Dict[str, Any]]:
    if patient_id not in patient_history_db:
        raise HTTPException(status_code=404, detail="Patient history not found")
    return patient_history_db[patient_id]


def _bounded_delta(current: float, low: float, high: float, max_delta: float, digits: int = 1) -> float:
    updated = max(low, min(high, current + random.uniform(-max_delta, max_delta)))
    return round(updated, digits)


def advance_simulation() -> List[Dict[str, Any]]:
    next_snapshots: List[Dict[str, Any]] = []
    for patient_id, current in list(patients_db.items()):
        profile = PATIENT_RISK_PROFILES.get(patient_id, "stable")
        updated = dict(current)

        if profile == "critical":
            updated["heart_rate"] = _bounded_delta(current["heart_rate"], 104.0, 128.0, 4.0)
            updated["temperature"] = _bounded_delta(current["temperature"], 38.4, 39.8, 0.2)
            updated["respiratory_rate"] = _bounded_delta(current["respiratory_rate"], 22.0, 30.0, 1.0, 0)
            updated["spo2"] = _bounded_delta(current["spo2"], 88.0, 93.0, 1.0, 0)
            updated["systolic_bp"] = _bounded_delta(current["systolic_bp"], 82.0, 96.0, 3.0, 0)
            updated["wbc"] = _bounded_delta(current["wbc"], 13.0, 18.5, 0.5)
            updated["lactate"] = _bounded_delta(current["lactate"], 2.7, 4.4, 0.3)
            updated["creatinine"] = _bounded_delta(current["creatinine"], 1.3, 2.1, 0.1)
        elif profile == "watch":
            updated["heart_rate"] = _bounded_delta(current["heart_rate"], 88.0, 104.0, 3.0)
            updated["temperature"] = _bounded_delta(current["temperature"], 37.4, 38.5, 0.2)
            updated["respiratory_rate"] = _bounded_delta(current["respiratory_rate"], 18.0, 24.0, 1.0, 0)
            updated["spo2"] = _bounded_delta(current["spo2"], 93.0, 97.0, 1.0, 0)
            updated["systolic_bp"] = _bounded_delta(current["systolic_bp"], 94.0, 110.0, 3.0, 0)
            updated["wbc"] = _bounded_delta(current["wbc"], 9.0, 13.5, 0.4)
            updated["lactate"] = _bounded_delta(current["lactate"], 1.4, 2.4, 0.2)
            updated["creatinine"] = _bounded_delta(current["creatinine"], 0.9, 1.4, 0.05)
        else:
            updated["heart_rate"] = _bounded_delta(current["heart_rate"], 65.0, 90.0, 2.0)
            updated["temperature"] = _bounded_delta(current["temperature"], 36.5, 37.5, 0.1)
            updated["respiratory_rate"] = _bounded_delta(current["respiratory_rate"], 14.0, 19.0, 1.0, 0)
            updated["spo2"] = _bounded_delta(current["spo2"], 96.0, 100.0, 1.0, 0)
            updated["systolic_bp"] = _bounded_delta(current["systolic_bp"], 108.0, 126.0, 3.0, 0)
            updated["wbc"] = _bounded_delta(current["wbc"], 5.5, 9.5, 0.3)
            updated["lactate"] = _bounded_delta(current["lactate"], 0.7, 1.5, 0.1)
            updated["creatinine"] = _bounded_delta(current["creatinine"], 0.7, 1.1, 0.05)

        updated["respiratory_rate"] = float(updated["respiratory_rate"])
        updated["spo2"] = float(updated["spo2"])
        updated["systolic_bp"] = float(updated["systolic_bp"])
        next_snapshots.append(updated)

    return next_snapshots


def _seed_history() -> None:
    for patient_id, vitals in patients_db.items():
        baseline = dict(vitals)
        for idx in range(10):
            timestamp = (datetime.now(timezone.utc) - timedelta(seconds=(9 - idx) * 15)).isoformat().replace("+00:00", "Z")
            update_patient_vitals(patient_id, baseline, timestamp)


_seed_history()

@router.get("")
def list_patients():
    return get_all_patients()


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    return build_patient_snapshot(patients_db[patient_id])


@router.get("/{patient_id}/history")
def patient_history(patient_id: str):
    return get_patient_history(patient_id)

