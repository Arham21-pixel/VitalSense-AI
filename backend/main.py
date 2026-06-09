from fastapi import FastAPI

from .routes.alerts import router as alerts_router
from .routes.patients import router as patients_router
from .routes.predictions import router as predictions_router

app = FastAPI(title="VitalSense AI API", version="0.1.0")

app.include_router(patients_router)
app.include_router(alerts_router)
app.include_router(predictions_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
