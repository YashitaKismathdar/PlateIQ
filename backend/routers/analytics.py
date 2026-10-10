from pathlib import Path
from functools import lru_cache

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Project root: PlateIQ/
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def find_dataset(filename: str) -> Path:
    """Find a dataset in common project folders."""
    candidates = [
        PROJECT_ROOT / filename,
        PROJECT_ROOT / "plateiq-ml" / filename,
        PROJECT_ROOT / "data" / filename,
        PROJECT_ROOT / "plateiq-ml" / "data" / filename,
        PROJECT_ROOT / "backend" / "data" / filename,
    ]

    for path in candidates:
        if path.is_file():
            return path

    raise FileNotFoundError(
        f"{filename} was not found. Check its location in the project."
    )


@lru_cache(maxsize=2)
def load_dataset(filename: str) -> pd.DataFrame:
    """Load and cache CSV datasets."""
    return pd.read_csv(find_dataset(filename))


def get_data(filename: str, required_columns: set) -> pd.DataFrame:
    """Load a dataset and verify required columns."""
    try:
        df = load_dataset(filename)
    except (FileNotFoundError, OSError, pd.errors.ParserError) as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    missing = required_columns - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"{filename} is missing columns: {sorted(missing)}",
        )

    return df


@router.get("/historical")
def historical_analytics(
    center_id: int | None = Query(default=None, ge=1),
    meal_id: int | None = Query(default=None, ge=1),
):
    """Return historical orders grouped by week."""
    train = get_data(
        "train.csv",
        {"week", "center_id", "meal_id", "num_orders"},
    )

    filtered = train.copy()

    if center_id is not None:
        filtered = filtered[filtered["center_id"] == center_id]

    if meal_id is not None:
        filtered = filtered[filtered["meal_id"] == meal_id]

    if filtered.empty:
        return {
            "data_type": "historical",
            "filters": {
                "center_id": center_id,
                "meal_id": meal_id,
            },
            "total_records": 0,
            "total_orders": 0,
            "weekly_trends": [],
        }

    weekly = (
        filtered.groupby("week", as_index=False)
        .agg(
            total_orders=("num_orders", "sum"),
            record_count=("num_orders", "size"),
        )
        .sort_values("week")
    )

    return {
        "data_type": "historical",
        "filters": {
            "center_id": center_id,
            "meal_id": meal_id,
        },
        "total_records": int(len(filtered)),
        "total_orders": int(filtered["num_orders"].sum()),
        "weekly_trends": weekly.to_dict(orient="records"),
    }


@router.get("/categories")
def category_analytics():
    """Summarize historical orders by meal category."""
    train = get_data(
        "train.csv",
        {"meal_id", "num_orders"},
    )

    meals = get_data(
        "meal_info.csv",
        {"meal_id", "category"},
    )

    # Prevent duplicate meal IDs from multiplying order totals.
    meals = meals[["meal_id", "category"]].drop_duplicates(
        subset=["meal_id"]
    )

    merged = train.merge(
        meals,
        on="meal_id",
        how="left",
        validate="many_to_one",
    )

    merged["category"] = merged["category"].fillna("Unknown")

    categories = (
        merged.groupby("category", as_index=False)
        .agg(
            total_orders=("num_orders", "sum"),
            meal_count=("meal_id", "nunique"),
            record_count=("num_orders", "size"),
        )
        .sort_values("total_orders", ascending=False)
    )

    return {
        "data_type": "historical",
        "total_orders": int(merged["num_orders"].sum()),
        "categories": categories.to_dict(orient="records"),
    }