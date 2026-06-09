from fastapi import APIRouter

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
def list_alerts():
    return []


@router.post("/dismiss")
def dismiss_alert():
    return {"status": "dismissed"}
