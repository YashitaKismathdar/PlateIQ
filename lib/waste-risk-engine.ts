import type { InventoryItem, WasteRecord } from './types'
import { clamp } from './calculations'

export type WasteRiskLevel = 'Low' | 'Medium' | 'High'

export interface WasteRiskInput {
  forecast: number
  lowerBound: number
  upperBound: number
  actual: number
  projectedDemand: number
  prepared: number
  preparationQuantity: number
  leadTimeMinutes: number
  batchSize: number
  ingredients: Record<string, number>
}

export interface WasteRiskResult {
  level: WasteRiskLevel
  score: number
  reasons: string[]
  recommendedAction: string
  ingredientPressure: number
  projectedWasteKg: number
  projectedWasteCost: number
  stockoutRisk: 'Low' | 'Medium' | 'High'
}

export function calculateWasteRisk(input: WasteRiskInput, inventory: InventoryItem[], waste: WasteRecord[] = []): WasteRiskResult {
  const forecast = Math.max(input.forecast, 1)
  const projectedDemand = Math.max(input.projectedDemand, 1)
  const uncertainty = clamp((input.upperBound - input.lowerBound) / forecast, 0, 1)
  const demandVariability = clamp(Math.abs(input.actual - input.forecast) / forecast, 0, 1)
  const plannedPrepared = input.prepared + Math.max(0, input.preparationQuantity)
  const overproduction = clamp((plannedPrepared - projectedDemand) / projectedDemand, 0, 1)
  const requirements = Object.entries(input.ingredients).map(([ingredientId, amount]) => {
    const item = inventory.find(candidate => candidate.id === ingredientId)
    return { item, required: amount * Math.max(0, input.preparationQuantity) / Math.max(input.batchSize, 1) }
  })
  const missing = requirements.filter(requirement => !requirement.item)
  const shortages = requirements.filter(requirement => requirement.item && requirement.item.currentStock < requirement.required)
  const minimumDays = requirements.reduce((minimum, requirement) => Math.min(minimum, requirement.item?.daysLeft ?? 0), Number.POSITIVE_INFINITY)
  const ingredientCost = requirements.reduce((total, requirement) => total + (requirement.item?.unitCost ?? 0) * requirement.required, 0)
  const ingredientPressure = requirements.length ? clamp((shortages.length / requirements.length) * 70 + (minimumDays < 2 ? 25 : 0) + (ingredientCost > 5000 ? 5 : 0), 0, 100) : 0
  const costPressure = clamp(ingredientCost / 5000 * 10, 0, 10)
  const historicalWaste = waste.filter(record => record.wasteKg > 0).reduce((total, record) => total + record.wasteKg, 0)
  const score = Math.round(clamp(uncertainty * 25 + demandVariability * 15 + overproduction * 45 + ingredientPressure * 0.15 + costPressure + Math.min(5, historicalWaste), 0, 100))
  const reasons: string[] = []

  if (overproduction > 0.05) reasons.push('planned preparation is approaching or exceeding projected demand')
  if (uncertainty > 0.12) reasons.push('prediction range indicates elevated demand uncertainty')
  if (demandVariability > 0.12) reasons.push('live demand is varying from the current forecast')
  if (minimumDays < 2) reasons.push('one or more recipe ingredients have limited days remaining')
  if (shortages.length) reasons.push(`inventory cannot fully support the proposed batch${missing.length ? ' and has unresolved ingredients' : ''}`)
  if (!reasons.length) reasons.push('prepared quantity and ingredient pressure remain within the current plan')

  const level: WasteRiskLevel = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low'
  const recommendedAction = level === 'High' ? 'Delay or reduce the next batch until live demand confirms it.' : level === 'Medium' ? 'Monitor live orders and prepare progressively in the available batch size.' : 'Proceed with the recommended batch while monitoring live demand.'
  const projectedWasteKg = Number((Math.max(0, plannedPrepared - projectedDemand) * 0.045 + (minimumDays < 2 ? 0.5 : 0)).toFixed(1))

  return {
    level,
    score,
    reasons,
    recommendedAction,
    ingredientPressure: Math.round(ingredientPressure),
    projectedWasteKg,
    projectedWasteCost: Math.round(projectedWasteKg * 150),
    stockoutRisk: shortages.length || missing.length ? 'High' : minimumDays < 1 ? 'High' : minimumDays < 2 ? 'Medium' : 'Low',
  }
}
