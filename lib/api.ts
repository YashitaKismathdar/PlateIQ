
import type {
  AIRecommendation,
  BatchStatus,
  DailyMetrics,
  Dish,
  Forecast,
  InventoryItem,
  PlateIQState,
  PreparationBatch,
  Restaurant,
  SimulationScenario,
  WasteCategory,
  WasteRecord,
} from './types'

export class PlateIQApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status = 500, details?: unknown) {
    super(message)
    this.name = 'PlateIQApiError'
    this.status = status
    this.details = details
  }
}

export interface ApiRequestOptions extends RequestInit {
  signal?: AbortSignal
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_PLATEIQ_API_URL ?? ''
).replace(/\/+$/, '')

async function request<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    throw new PlateIQApiError(
      error instanceof Error
        ? error.message
        : 'Unable to connect to the API',
      0,
      error,
    )
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new PlateIQApiError(
        'The API request failed',
        response.status,
      )
    }

    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  let payload: unknown

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
  } else {
    payload = await response.text()
  }

  if (!response.ok) {
    let message = `API request failed (${response.status})`

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      message = payload.message
    } else if (
      typeof payload === 'string' &&
      payload.trim()
    ) {
      message = payload
    }

    throw new PlateIQApiError(
      message,
      response.status,
      payload,
    )
  }

  return payload as T
}

function jsonBody(body: unknown): string {
  return JSON.stringify(body)
}

export interface DashboardResponse {
  restaurant: Restaurant
  dishes: Dish[]
  forecasts: Forecast[]
  batches: PreparationBatch[]
  stations: PlateIQState['stations']
  inventory: InventoryItem[]
  waste: WasteRecord[]
  alerts: PlateIQState['alerts']
  notifications: PlateIQState['notifications']
  recommendations: AIRecommendation[]
  events: PlateIQState['events']
  metrics: DailyMetrics
}

export interface SimulationResponse {
  scenario: SimulationScenario
  forecasts: Forecast[]
  batches: PreparationBatch[]
  recommendations: AIRecommendation[]
  explanation: string
}

export interface CopilotResponse {
  answer: string
  recommendations: AIRecommendation[]
}

export const plateiqApi = {
  getDashboard: () =>
    request<DashboardResponse>('/api/dashboard'),

  getRestaurant: () =>
    request<Restaurant>('/api/restaurant'),

  getForecasts: () =>
    request<Forecast[]>('/api/forecasts'),

  getForecast: (dishId: string) =>
    request<Forecast>(
      `/api/forecasts/${encodeURIComponent(dishId)}`,
    ),

  getInventory: () =>
    request<InventoryItem[]>('/api/inventory'),

  orderInventory: (itemId: string) =>
    request<InventoryItem>(
      `/api/inventory/${encodeURIComponent(itemId)}/order`,
      {
        method: 'POST',
      },
    ),

  receiveInventory: (itemId: string, amount: number) =>
    request<InventoryItem>(
      `/api/inventory/${encodeURIComponent(itemId)}/receive`,
      {
        method: 'POST',
        body: jsonBody({ amount }),
      },
    ),

  adjustInventory: (itemId: string, amount: number) =>
    request<InventoryItem>(
      `/api/inventory/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        body: jsonBody({ amount }),
      },
    ),

  getBatches: () =>
    request<PreparationBatch[]>('/api/batches'),

  updateBatch: (batchId: string, status: BatchStatus) =>
    request<PreparationBatch>(
      `/api/batches/${encodeURIComponent(batchId)}`,
      {
        method: 'PATCH',
        body: jsonBody({ status }),
      },
    ),

  getWaste: () =>
    request<WasteRecord[]>('/api/waste'),

  recordWaste: (input: {
    dishId: string
    wasteKg: number
    category: WasteCategory
    cause: string
  }) =>
    request<WasteRecord>('/api/waste', {
      method: 'POST',
      body: jsonBody(input),
    }),

  simulateScenario: (scenario: SimulationScenario) =>
    request<SimulationResponse>('/api/scenario/simulate', {
      method: 'POST',
      body: jsonBody({ scenario }),
    }),

  copilot: (
    message: string,
    context: Partial<PlateIQState>,
  ) =>
    request<CopilotResponse>('/api/copilot', {
      method: 'POST',
      body: jsonBody({ message, context }),
    }),
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0
}