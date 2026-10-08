import type { BatchStatus, InventoryItem, SimulationScenario, WasteCategory } from './types'

/**
 * Frontend/backend contract.
 *
 * Keep these request shapes stable when the backend is wired in. The UI should
 * not need to know database field names or transport details.
 */
export interface InventoryAdjustmentRequest {
  amount: number
}

export interface InventoryReceiveRequest {
  amount: number
}

export interface BatchUpdateRequest {
  status: BatchStatus
}

export interface WasteRecordRequest {
  dishId: string
  wasteKg: number
  category: WasteCategory
  cause: string
}

export interface ScenarioSimulationRequest {
  scenario: SimulationScenario
}

export interface CopilotRequest {
  message: string
  context: Record<string, unknown>
}

export type InventoryResponse = InventoryItem[]
