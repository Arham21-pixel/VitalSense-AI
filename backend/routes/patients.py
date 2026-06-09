from fastapi import APIRouter

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("")
def list_patients():
    return []


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    return {"id": patient_id}
