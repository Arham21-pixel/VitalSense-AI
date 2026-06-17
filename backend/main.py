import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from routes.alerts import router as alerts_router
from routes.patients import router as patients_router, advance_simulation
from routes.predictions import router as predictions_router, predict
from routes.settings import router as settings_router
from models.schemas import PatientVitals
from websocket.manager import ConnectionManager


app = FastAPI(title="VitalSense AI API", version="0.1.0")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(patients_router)
app.include_router(alerts_router)
app.include_router(predictions_router)
app.include_router(settings_router)

# WebSocket manager
manager = ConnectionManager()

# Make manager available to routes/predictions.py
import routes.predictions
routes.predictions.manager = manager


@app.get("/")
def root():
    return {"status": "VitalSense AI running 🏥"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and listen for client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def broadcast_predictions_loop():
    while True:
        await asyncio.sleep(15)
        predictions = []
        for vitals_data in advance_simulation():
            try:
                vitals_model = PatientVitals(**vitals_data)
                pred = predict(vitals_model)
                predictions.append(pred)
            except Exception:
                pass

        if predictions and manager.active_connections:
                await manager.broadcast(json.dumps(predictions))


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_predictions_loop())

