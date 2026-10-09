
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = (
    BASE_DIR.parent
    / "plateiq-ml"
    / "plateiq_demand_model.joblib"
)

# Load the model once when the server starts.
if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}. "
        "Check your project folder structure."
    )

model = joblib.load(MODEL_PATH)

CATEGORICAL_FEATURES = [
    "center_id",
    "meal_id",
    "city_code",
    "region_code",
    "center_type",
    "category",
    "cuisine",
]

NUMERIC_FEATURES = [
    "week",
    "checkout_price",
    "base_price",
    "emailer_for_promotion",
    "homepage_featured",
    "op_area",
]

FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

app = FastAPI(
    title="PlateIQ Demand Prediction API",
    description="Predict meal order demand using the trained ML model.",
    version="1.0.0",
)

# Configure FRONTEND_URL for deployment.
# Local development origins are included for convenience.
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PredictionInput(BaseModel):
    center_id: int
    meal_id: int
    city_code: int
    region_code: int
    center_type: str
    category: str
    cuisine: str

    week: int = Field(ge=1)
    checkout_price: float = Field(gt=0)
    base_price: float = Field(gt=0)
    emailer_for_promotion: int = Field(ge=0, le=1)
    homepage_featured: int = Field(ge=0, le=1)
    op_area: float = Field(gt=0)


@app.get("/")
def home():
    return {
        "message": "PlateIQ API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
    }


@app.post("/predict")
def predict_demand(payload: PredictionInput):
    try:
        input_data = pd.DataFrame(
            [payload.model_dump()],
            columns=FEATURES,
        )

        predicted_log = float(model.predict(input_data)[0])
        predicted_orders = max(
            0,
            float(np.expm1(predicted_log)),
        )

        return {
            "predicted_orders": round(predicted_orders),
            "predicted_orders_exact": round(
                predicted_orders, 2
            ),
            "unit": "orders",
            "model": "RandomForestRegressor",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(exc)}",
        ) from exc