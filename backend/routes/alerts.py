from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/alerts", tags=["alerts"])

# In-memory store for alerts
alerts_db: List[Dict[str, Any]] = [
    {
        "alert_id": "A002",
        "patient_id": "P003",
        "risk_level": "CRITICAL",
        "priority": "CRITICAL",
        "message": "High risk of sepsis detected: Critically elevated lactate (3.1 mmol/L), high heart rate (110 bpm), low SpO2 (91%).",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "dismissed": False,
        "top_factors": ["Elevated Lactate", "High Heart Rate", "Low SpO2", "Elevated Temperature"]
    }
]

PRIORITY_ORDER = {"CRITICAL": 1, "HIGH": 2, "WARNING": 3, "NORMAL": 4}


@router.get("")
def list_alerts(include_dismissed: bool = False):
    records = list(alerts_db) if include_dismissed else [alert for alert in alerts_db if not alert.get("dismissed", False)]
    records.sort(key=lambda a: PRIORITY_ORDER.get(a.get("priority", "NORMAL"), 99))
    return records


@router.post("/{alert_id}/dismiss")
def dismiss_alert(alert_id: str):
    for alert in alerts_db:
        if alert["alert_id"] == alert_id:
            alert["dismissed"] = True
            return {"status": "dismissed", "alert_id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")
