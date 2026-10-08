import type { AIRecommendation, BatchStatus, DailyMetrics, Dish, Forecast, InventoryItem, PlateIQState, PreparationBatch, Restaurant, SimulationScenario, WasteCategory, WasteRecord } from './types'

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

const API_BASE_URL = process.env.NEXT_PUBLIC_PLATEIQ_API_URL?.replace(/\\/$/, '') ?? ''

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload: unknown = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : `PlateIQ API request failed with status ${response.status}`
    throw new PlateIQApiError(message, response.status, payload)
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
  getDashboard: () => request<DashboardResponse>('/api/dashboard'),

  getRestaurant: () => request<Restaurant>('/api/restaurant'),

  getForecasts: () => request<Forecast[]>('/api/forecasts'),

  getForecast: (dishId: string) =>
    request<Forecast>(`/api/forecasts/${encodeURIComponent(dishId)}`),

  getInventory: () => request<InventoryItem[]>('/api/inventory'),

  orderInventory: (itemId: string) =>
    request<InventoryItem>(`/api/inventory/${encodeURIComponent(itemId)}/order`, {
      method: 'POST',
    }),

  receiveInventory: (itemId: string, amount: number) =>
    request<InventoryItem>(`/api/inventory/${encodeURIComponent(itemId)}/receive`, {
      method: 'POST',
      body: jsonBody({ amount }),
    }),

  adjustInventory: (itemId: string, amount: number) =>
    request<InventoryItem>(`/api/inventory/${encodeURIComponent(itemId)}`, {
      method: 'PATCH',
      body: jsonBody({ amount }),
    }),

  getBatches: () => request<PreparationBatch[]>('/api/batches'),

  updateBatch: (batchId: string, status: BatchStatus) =>
    request<PreparationBatch>(`/api/batches/${encodeURIComponent(batchId)}`, {
      method: 'PATCH',
      body: jsonBody({ status }),
    }),

  getWaste: () => request<WasteRecord[]>('/api/waste'),

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

  copilot: (message: string, context: Partial<PlateIQState>) =>
    request<CopilotResponse>('/api/copilot', {
      method: 'POST',
      body: jsonBody({ message, context }),
    }),
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}
