
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# --------------------------------------------------
# 1. File paths and configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

TRAIN_FILE = BASE_DIR / "train.csv"
MEAL_FILE = BASE_DIR / "meal_info.csv"
CENTER_FILE = BASE_DIR / "fulfilment_center_info.csv"

MODEL_FILE = BASE_DIR / "plateiq_demand_model.joblib"
METRICS_FILE = BASE_DIR / "model_metrics.json"

TARGET = "num_orders"

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


# --------------------------------------------------
# 2. Create preprocessing pipeline
# --------------------------------------------------

def create_preprocessor():
    try:
        encoder = OneHotEncoder(
            handle_unknown="ignore",
            sparse_output=True,
        )
    except TypeError:
        # Support older scikit-learn versions.
        encoder = OneHotEncoder(
            handle_unknown="ignore",
            sparse=True,
        )

    return ColumnTransformer(
        transformers=[
            ("categories", encoder, CATEGORICAL_FEATURES),
            ("numbers", "passthrough", NUMERIC_FEATURES),
        ]
    )


# --------------------------------------------------
# 3. Load and prepare data
# --------------------------------------------------

def main():
    for file_path in [TRAIN_FILE, MEAL_FILE, CENTER_FILE]:
        if not file_path.exists():
            raise FileNotFoundError(
                f"Missing file: {file_path.name}\n"
                "Place all three CSV files beside train_model.py."
            )

    print("Loading CSV files...")

    orders = pd.read_csv(TRAIN_FILE)
    meals = pd.read_csv(MEAL_FILE)
    centers = pd.read_csv(CENTER_FILE)

    print(f"Historical order rows: {len(orders):,}")
    print(f"Meal records: {len(meals):,}")
    print(f"Fulfilment centers: {len(centers):,}")

    data = orders.merge(
        meals,
        on="meal_id",
        how="left",
        validate="many_to_one",
    )

    data = data.merge(
        centers,
        on="center_id",
        how="left",
        validate="many_to_one",
    )

    required_columns = FEATURES + [TARGET]

    missing_columns = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    data = data.dropna(subset=required_columns).copy()

    if data.empty:
        raise ValueError("No valid data remains after removing missing values.")

    if (data[TARGET] < 0).any():
        raise ValueError(
            "num_orders contains negative values. Check the training data."
        )

    # --------------------------------------------------
    # 4. Split data chronologically
    # --------------------------------------------------

    weeks = sorted(data["week"].unique())

    if len(weeks) < 5:
        raise ValueError(
            "Not enough distinct weeks to evaluate the model."
        )

    test_week_count = max(
        1,
        int(np.ceil(len(weeks) * 0.20)),
    )

    test_weeks = weeks[-test_week_count:]
    first_test_week = test_weeks[0]

    train_data = data[
        data["week"] < first_test_week
    ].copy()

    test_data = data[
        data["week"].isin(test_weeks)
    ].copy()

    if train_data.empty or test_data.empty:
        raise ValueError(
            "The chronological train/test split is empty."
        )

    X_train = train_data[FEATURES]
    y_train = train_data[TARGET]

    X_test = test_data[FEATURES]
    y_test = test_data[TARGET]

    print(f"Training rows: {len(train_data):,}")
    print(f"Testing rows: {len(test_data):,}")

    print(
        f"Training weeks: {train_data['week'].min()} "
        f"to {train_data['week'].max()}"
    )

    print(
        f"Testing weeks: {test_data['week'].min()} "
        f"to {test_data['week'].max()}"
    )

    # --------------------------------------------------
    # 5. Train and evaluate the evaluation model
    # --------------------------------------------------

    evaluation_model = Pipeline(
        steps=[
            ("preprocessor", create_preprocessor()),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=80,
                    max_depth=18,
                    min_samples_leaf=3,
                    max_features=0.8,
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )

    print("\nTraining evaluation model...")

    evaluation_model.fit(
        X_train,
        np.log1p(y_train),
    )

    predicted_log = evaluation_model.predict(X_test)

    predictions = np.maximum(
        0,
        np.expm1(predicted_log),
    )

    mae = mean_absolute_error(y_test, predictions)

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    r2 = r2_score(y_test, predictions)

    print("\n--- PLATEIQ MODEL EVALUATION ---")
    print(f"MAE:  {mae:.2f} orders")
    print(f"RMSE: {rmse:.2f} orders")
    print(f"R2:   {r2:.4f}")

    # --------------------------------------------------
    # 6. Train the final model on all historical data
    # --------------------------------------------------

    final_model = Pipeline(
        steps=[
            ("preprocessor", create_preprocessor()),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=40,
                    max_depth=14,
                    min_samples_leaf=3,
                    max_features=0.8,
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )

    print("\nTraining final model on all historical data...")

    final_model.fit(
        data[FEATURES],
        np.log1p(data[TARGET]),
    )

    # Save the trained pipeline for the FastAPI backend.
    joblib.dump(final_model, MODEL_FILE)

    print(f"Saved model: {MODEL_FILE}")

    # --------------------------------------------------
    # 7. Save evaluation metrics
    # --------------------------------------------------

    metrics = {
        "model": "RandomForestRegressor",
        "target": TARGET,
        "target_transform": "log1p; invert predictions with expm1",
        "training_rows_for_evaluation": int(len(train_data)),
        "test_rows": int(len(test_data)),
        "test_week_start": int(first_test_week),
        "test_week_end": int(max(test_weeks)),
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
        "sklearn_version": sklearn.__version__,
        "features": FEATURES,
    }

    METRICS_FILE.write_text(
        json.dumps(metrics, indent=2),
        encoding="utf-8",
    )

    print("\nExample predictions:")

    example = pd.DataFrame({
        "actual_orders": y_test.iloc[:10].to_numpy(),
        "predicted_orders": np.round(predictions[:10], 1),
    })

    print(example.to_string(index=False))

    print("\nTraining complete!")
    print(f"Saved model: {MODEL_FILE.name}")
    print(f"Saved metrics: {METRICS_FILE.name}")


if __name__ == "__main__":
    main()