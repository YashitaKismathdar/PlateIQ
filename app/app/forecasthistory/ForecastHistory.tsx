
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Forecast {
  id: number;
  week: number;
  meal_id: number;
  center_id: number;
  checkout_price: number;
  base_price: number;
  emailer_for_promotion: number;
  homepage_featured: number;
  predicted_orders: number;
  forecast_type: string;
  created_at: string;
}

interface HistoryResponse {
  total: number;
  limit: number;
  offset: number;
  forecasts: Forecast[];
}

export default function ForecastHistory() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);

  const limit = 10;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/forecast/history?limit=${limit}&offset=${offset}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load history (HTTP ${response.status})`
        );
      }

      const data: HistoryResponse = await response.json();

      setForecasts(data.forecasts ?? []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const formatDate = (value: string) => {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  };

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Forecast History
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Previously generated demand predictions
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <p className="text-sm text-gray-600">
          Total saved forecasts
        </p>
        <p className="text-2xl font-bold">{total}</p>
      </div>

      {loading && (
        <p className="py-6 text-sm text-gray-500">
          Loading forecast history...
        </p>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadHistory()}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && forecasts.length === 0 && (
        <p className="py-6 text-sm text-gray-500">
          No forecasts saved yet. Generate a prediction to see
          it here.
        </p>
      )}

      {!loading && !error && forecasts.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Week</th>
                  <th className="px-3 py-3">Meal ID</th>
                  <th className="px-3 py-3">Center ID</th>
                  <th className="px-3 py-3">Checkout Price</th>
                  <th className="px-3 py-3">Predicted Orders</th>
                </tr>
              </thead>

              <tbody>
                {forecasts.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-3">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-3 py-3">{item.week}</td>
                    <td className="px-3 py-3">{item.meal_id}</td>
                    <td className="px-3 py-3">{item.center_id}</td>
                    <td className="px-3 py-3">
                      {Number(item.checkout_price).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {Number(item.predicted_orders).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{offset + forecasts.length} of {total}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset === 0 || loading}
                onClick={() =>
                  setOffset((current) =>
                    Math.max(0, current - limit)
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={offset + limit >= total || loading}
                onClick={() => setOffset((current) => current + limit)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
