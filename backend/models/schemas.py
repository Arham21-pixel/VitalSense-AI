from pydantic import BaseModel


class Patient(BaseModel):
    id: str
    name: str | None = None


class Alert(BaseModel):
    id: str
    patient_id: str
    message: str
