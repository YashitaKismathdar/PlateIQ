
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

# Store the database beside this file.
DB_PATH = Path(__file__).resolve().parent / "plateiq.db"


def get_connection():
    """Open a SQLite connection and return rows as dictionaries."""
    connection = sqlite3.connect(DB_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the forecast history table if it does not exist."""
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS forecast_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week INTEGER NOT NULL,
                meal_id INTEGER NOT NULL,
                center_id INTEGER NOT NULL,
                checkout_price REAL NOT NULL,
                base_price REAL NOT NULL,
                emailer_for_promotion INTEGER NOT NULL,
                homepage_featured INTEGER NOT NULL,
                predicted_orders REAL NOT NULL,
                forecast_type TEXT NOT NULL DEFAULT 'weekly',
                created_at TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_forecast_created_at
            ON forecast_history(created_at)
        """)


def save_forecast(inputs: dict, result: dict):
    """Persist one successful prediction."""
    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute("""
            INSERT INTO forecast_history (
                week,
                meal_id,
                center_id,
                checkout_price,
                base_price,
                emailer_for_promotion,
                homepage_featured,
                predicted_orders,
                forecast_type,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            int(inputs["week"]),
            int(inputs["meal_id"]),
            int(inputs["center_id"]),
            float(inputs["checkout_price"]),
            float(inputs["base_price"]),
            int(inputs.get("emailer_for_promotion", 0)),
            int(inputs.get("homepage_featured", 0)),
            float(result["predicted_orders"]),
            result.get("forecast_type", "weekly"),
            created_at,
        ))

        return cursor.lastrowid


def get_forecast_history(limit: int = 50, offset: int = 0):
    """Retrieve the newest forecasts first."""
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT
                id,
                week,
                meal_id,
                center_id,
                checkout_price,
                base_price,
                emailer_for_promotion,
                homepage_featured,
                predicted_orders,
                forecast_type,
                created_at
            FROM forecast_history
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall()

        return [dict(row) for row in rows]


def get_forecast_count():
    """Return the total number of saved forecasts."""
    with get_connection() as connection:
        row = connection.execute(
            "SELECT COUNT(*) AS total FROM forecast_history"
        ).fetchone()

        return row["total"]
