import type { BatchStatus, PlateIQState } from './types'
import { buildForecast } from './forecasting'
import { calculateWaste } from './calculations'
import { deriveInventoryState, ingredientRequirements } from './inventory-engine'
import { wasteSummary } from './waste-engine'
import { calculateWasteRisk } from './waste-risk-engine'
import { explainForecast } from './forecasting'

const batchStatuses: BatchStatus[] = ['Recommended', 'In Preparation', 'Ready', 'Completed']

export function getForecastMetrics(state: PlateIQState, dishId = 'biryani') {
  return state.forecasts.find(item => item.dishId === dishId) ?? null
}

export function getRestaurantMetrics(state: PlateIQState) {
  const forecast = state.forecasts.reduce((sum, item) => sum + item.forecast, 0)
  const projectedDemand = state.forecasts.reduce((sum, item) => sum + item.projectedDemand, 0)
  const prepared = state.dishes.reduce((sum, dish) => sum + dish.prepared, 0)
  const waste = wasteSummary(state.waste)
  const forecastAccuracy = state.forecasts.length ? state.forecasts.reduce((sum, item) => sum + item.confidence, 0) / state.forecasts.length : 0
  return { demand: forecast, projectedDemand, prepared, wasteKg: waste.wasteKg, wasteCost: waste.wasteCost, wasteReductionPct: waste.wasteReductionPct, savings: waste.potentialSavings ?? 0, forecastAccuracy }
}

export function getInventoryMetrics(state: PlateIQState) {
  const projectedStockouts = state.inventory.filter(item => item.daysLeft <= 1).length
  return { projectedStockouts, stockoutRate: state.inventory.length ? projectedStockouts / state.inventory.length * 100 : 0 }
}

export function getKitchenMetrics(state: PlateIQState) {
  const activeBatches = state.batches.filter(batch => batch.status === 'In Preparation' || batch.status === 'Ready')
  const busyStations = state.stations.filter(station => station.status === 'Busy').length
  return { capacity: state.stations.length ? Math.round(state.stations.reduce((sum, station) => sum + station.capacity, 0) / state.stations.length) : 0, activeBatches, busyStations }
}

export function getLiveOperationsMetrics(state: PlateIQState) {
  const forecast = getForecastMetrics(state)
  return { orders: state.demo.orders, ordersPerMinute: state.demo.ordersPerMinute, projectedDemand: forecast?.projectedDemand ?? 0, capacity: getKitchenMetrics(state).capacity, surge: state.demo.status === 'Surge' }
}

export function getBatchImpact(state: PlateIQState, dishId: string, quantity: number) {
  const dish = state.dishes.find(item => item.id === dishId)
  if (!dish) return { dish: undefined, quantity, requirements: {}, shortages: [], maxFeasibleQuantity: 0, ready: false }
  const requirements = ingredientRequirements(dish, quantity)
  const inventoryById = new Map(state.inventory.map(item => [item.id, item]))
  const shortages = Object.entries(requirements).flatMap(([ingredientId, required]) => {
    const item = inventoryById.get(ingredientId)
    return !item || item.currentStock < required ? [{ ingredientId, name: item?.name ?? ingredientId, required, available: item?.currentStock ?? 0 }] : []
  })
  const capacityRatios = Object.entries(dish.ingredients).map(([ingredientId]) => {
    const item = inventoryById.get(ingredientId)
    return item ? item.currentStock / Math.max(dish.ingredients[ingredientId], 0.0001) : 0
  })
  const maxFeasibleQuantity = capacityRatios.length ? Math.max(0, Math.floor(Math.min(...capacityRatios)) * dish.batchSize) : 0
  return { dish, quantity, requirements, shortages, maxFeasibleQuantity, ready: shortages.length === 0 }
}

export function getDishOperationalContext(state: PlateIQState, dishId = 'biryani') {
  const dish = state.dishes.find(item => item.id === dishId) ?? state.dishes[0]
  if (!dish) return null
  const forecast = getForecastMetrics(state, dish.id)
  const batch = state.batches.find(item => item.dishId === dish.id && item.status === 'Recommended') ?? state.batches.find(item => item.dishId === dish.id)
  const requestedQuantity = forecast?.recommendedPreparation ?? batch?.quantity ?? 0
  const batchImpact = getBatchImpact(state, dish.id, requestedQuantity)
  const recommendedQuantity = Math.min(requestedQuantity, batchImpact.maxFeasibleQuantity)
  const risk = forecast ? calculateWasteRisk({ ...forecast, prepared: dish.prepared, preparationQuantity: requestedQuantity, leadTimeMinutes: dish.leadTimeMinutes, batchSize: dish.batchSize, ingredients: dish.ingredients }, state.inventory, state.waste) : null
  return { dish, forecast, batch, batchImpact, recommendedQuantity, risk, factors: explainForecast(state.scenario, state.demo.ordersPerMinute) }
}

export function getCopilotContext(state: PlateIQState, dishId = 'biryani') {
  const context = getDishOperationalContext(state, dishId) ?? { dish: undefined, forecast: null, batch: undefined, batchImpact: { quantity: 0, requirements: {}, shortages: [], maxFeasibleQuantity: 0, ready: false }, recommendedQuantity: 0, risk: null, factors: [] }
  const nextBatch = context?.batch?.status === 'Recommended' || context?.batch?.status === 'In Preparation' ? context.batch : undefined
  return { ...context, nextBatch, prepared: context.dish?.prepared ?? 0, orders: state.demo.orders, inventory: state.inventory, waste: wasteSummary(state.waste), scenario: state.scenario, surge: state.demo.status === 'Surge' }
}

export function getAnalyticsMetrics(state: PlateIQState) {
  const metrics = getRestaurantMetrics(state)
  const inventory = getInventoryMetrics(state)
  return { forecastAccuracy: metrics.forecastAccuracy, preparationEfficiency: metrics.demand ? metrics.prepared / metrics.demand * 100 : 0, stockoutRate: inventory.stockoutRate, wasteReductionPct: wasteSummary(state.waste).wasteReductionPct, savings: wasteSummary(state.waste).potentialSavings }
}

export function validateStateConsistency(state: PlateIQState): string[] {
  const warnings: string[] = []
  const dishIds = new Set(state.dishes.map(dish => dish.id))
  const inventoryIds = new Set(state.inventory.map(item => item.id))
  const forecastByDish = new Map(state.forecasts.map(forecast => [forecast.dishId, forecast]))
  const derivedMetrics = getRestaurantMetrics(state)
  const waste = wasteSummary(state.waste)
  if (state.inventory.some(item => item.currentStock < 0)) warnings.push('Inventory contains negative stock.')
  if (state.inventory.some(item => !['Not Ordered', 'Ordered', 'Received'].includes(item.orderStatus))) warnings.push('Inventory has an impossible order status.')
  if (state.inventory.some(item => { const derived = deriveInventoryState(item); return item.daysLeft !== derived.daysLeft || item.status !== derived.status })) warnings.push('Inventory status or days remaining is stale.')
  if (state.batches.some(batch => !dishIds.has(batch.dishId))) warnings.push('Batch references a missing dish.')
  if (state.dishes.some(dish => Object.keys(dish.ingredients).some(ingredientId => !inventoryIds.has(ingredientId)))) warnings.push('Dish references a missing ingredient.')
  if (state.dishes.some(dish => dish.prepared < 0)) warnings.push('Dish prepared quantity is negative.')
  if (state.forecasts.some(forecast => forecast.baseline < 0 || forecast.forecast < 0 || forecast.lowerBound < 0 || forecast.upperBound < 0 || forecast.actual < 0 || forecast.projectedDemand < 0 || forecast.recommendedPreparation < 0)) warnings.push('Forecast contains a negative value.')
  if (state.forecasts.some(forecast => forecast.lowerBound > forecast.upperBound)) warnings.push('Forecast prediction range is inverted.')
  if (state.demo.projectedDemand < state.demo.orders) warnings.push('Projected demand is below current orders.')
  if (!state.batches.every(batch => batchStatuses.includes(batch.status))) warnings.push('Batch has an impossible status.')
  if (state.batches.some(batch => batch.quantity < 0)) warnings.push('Batch quantity is negative.')
  if (state.recommendations.some(recommendation => recommendation.dishId && !dishIds.has(recommendation.dishId))) warnings.push('Recommendation references a missing dish.')
  if (state.batches.some(batch => batch.status === 'Completed' && state.recommendations.some(recommendation => recommendation.dishId === batch.dishId))) warnings.push('Completed batch still has an active recommendation.')
  if (state.demo.prepared < 0) warnings.push('Prepared quantity is negative.')
  if (state.metrics.prepared !== derivedMetrics.prepared || state.demo.prepared !== derivedMetrics.prepared) warnings.push('Aggregate prepared quantity does not match dish totals.')
  if (state.metrics.demand !== derivedMetrics.demand) warnings.push('Aggregate forecast does not match forecast totals.')
  if (state.waste.some(record => !dishIds.has(record.dishId) || record.prepared < 0 || record.consumed < 0 || record.wasteKg < 0 || record.wasteCost < 0 || !['Prepared Food', 'Spoilage', 'Overproduction', 'Other'].includes(record.category) || record.unit !== 'kg')) warnings.push('Waste record is invalid.')
  if (Math.abs(state.metrics.wasteKg - waste.wasteKg) > 0.05 || state.metrics.wasteCost !== waste.wasteCost) warnings.push('Waste totals do not match waste records.')
  const biryaniForecast = forecastByDish.get('biryani')
  if (biryaniForecast && (state.demo.forecast !== biryaniForecast.forecast || state.demo.lowerBound !== biryaniForecast.lowerBound || state.demo.upperBound !== biryaniForecast.upperBound || state.demo.confidence !== biryaniForecast.confidence || state.demo.projectedDemand !== biryaniForecast.projectedDemand)) warnings.push('Demo forecast does not match the authoritative forecast.')
  if (!state.demo.batch || !state.batches.some(batch => batch.id === state.demo.batch.id && batch.dishId === state.demo.batch.dishId && batch.status === state.demo.batch.status)) warnings.push('Demo batch does not match a persisted batch.')
  return warnings
}

export function isValidPersistedState(value: unknown): value is PlateIQState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<PlateIQState>
  if (state.version !== 2 || !Array.isArray(state.dishes) || !Array.isArray(state.forecasts) || !state.forecasts.every(forecast => typeof forecast.baseline === 'number') || !Array.isArray(state.batches) || !Array.isArray(state.inventory) || !Array.isArray(state.waste) || !state.demo || typeof state.demo.simulatedTime !== 'string' || !state.metrics) return false
  return validateStateConsistency(state as PlateIQState).length === 0
}

export function simulateScenario(state: PlateIQState, scenario: PlateIQState['scenario']) {
  const kitchenCapacity = state.demo.kitchenCapacity
  const forecastByDish = state.dishes.map(dish => {
    const orders = dish.id === 'biryani' ? state.demo.orders : dish.actualOrders
    const baseline = state.forecasts.find(item => item.dishId === dish.id)?.baseline
    return { dish, forecast: buildForecast(dish, orders, scenario, kitchenCapacity, baseline) }
  })
  const projectedDemand = forecastByDish.reduce((sum, item) => sum + item.forecast.projectedDemand, 0)
  const recommendedPreparation = forecastByDish.reduce((sum, item) => sum + item.forecast.recommendedPreparation, 0)
  const ingredientRequirements: Record<string, number> = {}
  for (const item of forecastByDish) {
    const requirements = ingredientRequirementsForDish(item.dish, item.forecast.recommendedPreparation)
    for (const [ingredientId, amount] of Object.entries(requirements)) ingredientRequirements[ingredientId] = (ingredientRequirements[ingredientId] ?? 0) + amount
  }
  const inventoryById = new Map(state.inventory.map(item => [item.id, item]))
  const projectedInventory = Object.entries(ingredientRequirements).map(([ingredientId, required]) => {
    const item = inventoryById.get(ingredientId)
    return { ingredientId, required, current: item?.currentStock ?? 0, remaining: (item?.currentStock ?? 0) - required, name: item?.name ?? ingredientId }
  })
  const hasShortage = projectedInventory.some(item => item.remaining < 0)
  const projectedDays = projectedInventory.map(item => {
    const inventoryItem = inventoryById.get(item.ingredientId)
    return item.remaining / Math.max(inventoryItem?.dailyUsage ?? 0.1, 0.1)
  })
  const stockoutRisk = hasShortage || projectedDays.some(days => days <= 0.8) ? 'High' : projectedDays.some(days => days <= 2) ? 'Medium' : 'Low'
  const projectedWaste = forecastByDish.reduce((sum, item) => {
    const currentWaste = state.waste.find(record => record.dishId === item.dish.id)
    const simulatedPrepared = item.dish.prepared + item.forecast.recommendedPreparation
    const waste = calculateWaste(simulatedPrepared, item.forecast.projectedDemand, currentWaste?.spoilageKg ?? 0)
    return { wasteKg: Number((sum.wasteKg + waste.wasteKg).toFixed(1)), wasteCost: sum.wasteCost + waste.wasteCost }
  }, { wasteKg: 0, wasteCost: 0 })
  const recommendation = recommendedPreparation > 0 ? `Schedule ${recommendedPreparation} additional plates across ${forecastByDish.filter(item => item.forecast.recommendedPreparation > 0).length} dish batches.` : 'Current preparation is sufficient for the simulated demand.'
  return {
    projectedDemand,
    recommendedPreparation,
    recommendedBatches: forecastByDish.filter(item => item.forecast.recommendedPreparation > 0).length,
    ingredientRequirements,
    projectedInventory,
    stockoutRisk,
    wasteRisk: forecastByDish.reduce((highest, item) => {
      const risk = calculateWasteRisk({ ...item.forecast, actual: item.dish.actualOrders, prepared: item.dish.prepared, preparationQuantity: item.forecast.recommendedPreparation, leadTimeMinutes: item.dish.leadTimeMinutes, batchSize: item.dish.batchSize, ingredients: item.dish.ingredients }, state.inventory, state.waste)
      return risk.score > highest.score ? risk : highest
    }, calculateWasteRisk({ ...forecastByDish[0].forecast, actual: forecastByDish[0].dish.actualOrders, prepared: forecastByDish[0].dish.prepared, preparationQuantity: forecastByDish[0].forecast.recommendedPreparation, leadTimeMinutes: forecastByDish[0].dish.leadTimeMinutes, batchSize: forecastByDish[0].dish.batchSize, ingredients: forecastByDish[0].dish.ingredients }, state.inventory, state.waste)),
    ingredientPressure: projectedInventory.filter(item => item.remaining < 0).map(item => item.name),
    projectedWasteKg: Number(projectedWaste.wasteKg.toFixed(1)),
    projectedWasteCost: projectedWaste.wasteCost,
    forecastByDish,
    explanation: `Scenario demand combines customer change, weather, holiday, local event, and promotion exactly once. ${recommendation}`,
    recommendation,
  }
}

function ingredientRequirementsForDish(dish: PlateIQState['dishes'][number], quantity: number) {
  return ingredientRequirements(dish, quantity)
}
