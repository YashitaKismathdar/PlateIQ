
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


# All files are expected in the same folder as this script.
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


def main():
    # 1. Check that the input files exist.
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
    print(f"Fulfillment centers: {len(centers):,}")

    # 2. Combine order history with meal and center information.
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
        col for col in required_columns if col not in data.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    data = data.dropna(subset=required_columns).copy()

    # 3. Split chronologically: the latest weeks are the test set.
    # This is more realistic than randomly mixing past and future weeks.
    weeks = sorted(data["week"].unique())

    if len(weeks) < 5:
        raise ValueError("Not enough distinct weeks to evaluate the model.")

    test_week_count = max(1, int(np.ceil(len(weeks) * 0.20)))
    test_weeks = weeks[-test_week_count:]
    first_test_week = test_weeks[0]

    train_data = data[data["week"] < first_test_week].copy()
    test_data = data[data["week"].isin(test_weeks)].copy()

    if train_data.empty or test_data.empty:
        raise ValueError("The chronological train/test split is empty.")

    X_train = train_data[FEATURES]
    y_train = train_data[TARGET].clip(lower=0)

    X_test = test_data[FEATURES]
    y_test = test_data[TARGET].clip(lower=0)

    print(f"Training rows: {len(train_data):,}")
    print(f"Testing rows:  {len(test_data):,}")
    print(
        f"Training weeks: {train_data['week'].min()} "
        f"to {train_data['week'].max()}"
    )
    print(
        f"Testing weeks:  {test_data['week'].min()} "
        f"to {test_data['week'].max()}"
    )

    # 4. Encode categories and train a Random Forest.
    # log1p helps the model handle widely varying order counts.
    try:
        encoder = OneHotEncoder(
            handle_unknown="ignore",
            sparse_output=True,
        )
    except TypeError:
        # Compatibility with older scikit-learn versions.
        encoder = OneHotEncoder(
            handle_unknown="ignore",
            sparse=True,
        )

    preprocessor = ColumnTransformer(
        transformers=[
            ("categories", encoder, CATEGORICAL_FEATURES),
            ("numbers", "passthrough", NUMERIC_FEATURES),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
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

    print("\nTraining model... This may take a few minutes.")

    pipeline.fit(X_train, np.log1p(y_train))

    # 5. Evaluate on later weeks the model did not train on.
    predicted_log = pipeline.predict(X_test)
    predictions = np.maximum(0, np.expm1(predicted_log))

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    print("\n--- PLATEIQ MODEL EVALUATION ---")
    print(f"MAE:  {mae:.2f} orders")
    print(f"RMSE: {rmse:.2f} orders")
    print(f"R²:   {r2:.4f}")

    # 6. Retrain on all historical rows for backend handoff.
    # The metrics above remain from the untouched test period.
    final_model = Pipeline(
        steps=[
            ("preprocessor", encoder_preprocessor(preprocessor)),
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
        np.log1p(data[TARGET].clip(lower=0)),
    )

    # Save the fitted pipeline and the information the backend needs.
    joblib.dump(final_model, MODEL_FILE)

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
    print(f"Saved model:   {MODEL_FILE.name}")
    print(f"Saved metrics: {METRICS_FILE.name}")


def encoder_preprocessor(preprocessor):
    """Create a fresh preprocessor for the final full-data fit."""
    return ColumnTransformer(
        transformers=[
            (
                "categories",
                preprocessor.named_transformers_["categories"],
                CATEGORICAL_FEATURES,
            ),
            ("numbers", "passthrough", NUMERIC_FEATURES),
        ]
    )


if __name__ == "__main__":
    main()