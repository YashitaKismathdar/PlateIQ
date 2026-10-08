# PlateIQ frontend ↔ backend integration

## Current frontend mode

The current UI remains **demo/mock-data driven** so frontend work can continue before the backend is connected.

The frontend/backend boundary is now defined in:

- `lib/types.ts` — shared domain response types.
- `lib/api-contracts.ts` — request payloads.
- `lib/api.ts` — typed HTTP client and endpoint functions.
- `components/data-state.tsx` — reusable loading/error/empty UI state.

## Backend contract

The frontend client expects these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard` | Hydrate the operational dashboard |
| GET | `/api/restaurant` | Restaurant metadata |
| GET | `/api/forecasts` | All forecasts |
| GET | `/api/forecasts/:dishId` | One dish forecast |
| GET | `/api/inventory` | Current inventory |
| POST | `/api/inventory/:id/order` | Place/reorder inventory |
| POST | `/api/inventory/:id/receive` | Receive stock; body: `{ amount }` |
| PATCH | `/api/inventory/:id` | Adjust stock; body: `{ amount }` |
| GET | `/api/batches` | Preparation batches |
| PATCH | `/api/batches/:id` | Update batch status |
| GET | `/api/waste` | Waste records |
| POST | `/api/waste` | Record waste |
| POST | `/api/scenario/simulate` | Run What-If simulation |
| POST | `/api/copilot` | AI Copilot request |

Set `NEXT_PUBLIC_PLATEIQ_API_URL` when the backend is hosted separately. Leave it unset if the backend is served from the same origin.

## Integration rule

When the backend is ready, replace the demo hydration/mutations with calls to `plateiqApi`. Do **not** move database logic into React components and do not make UI components depend on backend-specific field names.

The mock/demo engine can remain as a local fallback while the integration is being tested.
