from fastapi import APIRouter

router = APIRouter(tags=["predictions"])


@router.post("/predict")
def predict():
    return {"risk": 0.0, "label": "low"}
