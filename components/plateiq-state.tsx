'use client'
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type React from 'react'
import type { BatchStatus, OperationalEvent, PlateIQAction, PlateIQState, Severity } from '@/lib/types'
import { restaurant, dishes, inventory, stations, alerts, scenario, waste } from '@/lib/mock-data'
import { getDemoMetrics, isDemandSurge } from '@/lib/demo-engine'
import { buildForecast } from '@/lib/forecasting'
import { adjustStock, consumeForBatch, deriveInventoryState, markOrdered, receiveStock } from '@/lib/inventory-engine'
import { getForecastMetrics, getRestaurantMetrics, isValidPersistedState, simulateScenario } from '@/lib/selectors'
import { wasteSummary } from '@/lib/waste-engine'

const now = '2025-06-24T12:45:00+05:30'
const initialDemoMetrics = getDemoMetrics(0)
const initialDishes = dishes.map(dish => dish.id === 'biryani' ? { ...dish, actualOrders: initialDemoMetrics.orders } : dish)
const initialInventory = inventory.map(item => deriveInventoryState(item))
const initialForecasts = initialDishes.map(dish => ({
  id: `forecast-${dish.id}`,
  dishId: dish.id,
  period: 'Lunch',
  baseline: dish.forecast,
  forecast: dish.forecast,
  lowerBound: dish.lowerBound,
  upperBound: dish.upperBound,
  confidence: dish.confidence,
  actual: dish.actualOrders,
  projectedDemand: Math.max(dish.actualOrders, dish.forecast),
  recommendedPreparation: Math.max(0, Math.ceil((dish.forecast - dish.prepared) / dish.batchSize) * dish.batchSize),
}))
const initialBatches = initialDishes.map(dish => ({
  id: `${dish.id}-2`,
  dishId: dish.id,
  number: 2,
  quantity: initialForecasts.find(forecast => forecast.dishId === dish.id)?.recommendedPreparation ?? dish.nextBatch,
  status: 'Recommended' as BatchStatus,
  createdAt: now,
  updatedAt: now,
}))
const initialWaste = wasteSummary(waste)
const initialPrepared = initialDishes.reduce((sum, dish) => sum + dish.prepared, 0)
const initialForecast = initialForecasts.find(forecast => forecast.dishId === 'biryani')!

export const initialState: PlateIQState = {
  version: 2,
  restaurant,
  dishes: initialDishes,
  forecasts: initialForecasts,
  batches: initialBatches,
  stations,
  inventory: initialInventory,
  waste,
  alerts: alerts.filter(alert => alert.id !== 'surge'),
  notifications: [],
  recommendations: [{ id: 'rec-1', title: `Start preparation batch #2 +${initialBatches[0].quantity}`, description: 'Biryani is tracking above the initial preparation plan.', actionLabel: 'Start Batch #2', confidence: initialForecast.confidence, dishId: 'biryani' }],
  events: [],
  scenario,
  demo: { running: false, step: 0, speed: 1, orders: initialDemoMetrics.orders, ordersPerMinute: initialDemoMetrics.ordersPerMinute, baselineVelocity: 8, projectedDemand: initialForecast.projectedDemand, prepared: initialPrepared, kitchenCapacity: initialDemoMetrics.kitchenCapacity, forecast: initialForecast.forecast, lowerBound: initialForecast.lowerBound, upperBound: initialForecast.upperBound, confidence: initialForecast.confidence, status: initialDemoMetrics.status, batch: initialBatches[0], showReason: false, dismissedAlertIds: [], scenario, simulatedTime: '2025-06-24T11:00:00+05:30' },
  metrics: { demand: initialForecasts.reduce((sum, forecast) => sum + forecast.forecast, 0), prepared: initialPrepared, wasteKg: initialWaste.wasteKg, wasteCost: initialWaste.wasteCost, forecastAccuracy: initialForecasts.reduce((sum, forecast) => sum + forecast.confidence, 0) / initialForecasts.length, savings: initialWaste.potentialSavings ?? 0 },
}

function simulatedClock(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso))
}

function advanceClock(iso: string) {
  return new Date(new Date(iso).getTime() + 15 * 60 * 1000).toISOString()
}

function createEvent(state: PlateIQState, type: string, title: string, description: string, href = '/app', severity: Severity = 'info'): OperationalEvent {
  return { id: `event-${state.events.length + 1}`, timestamp: simulatedClock(state.demo.simulatedTime), type, title, description, severity, relatedEntity: href }
}

function createNotification(state: PlateIQState, title: string, description: string, href: string) {
  return { id: `notification-${state.notifications.length + 1}-${state.events.length + 1}`, title, description, href, read: false, createdAt: state.demo.simulatedTime }
}

function stationForDish(category: string) {
  return category === 'Breads' ? 'bread' : category === 'Sides' ? 'prep' : 'hot'
}

function updateStationStatus(state: PlateIQState, dishCategory: string, batchStatus: BatchStatus) {
  const stationId = stationForDish(dishCategory)
  const status: PlateIQState['stations'][number]['status'] | undefined = batchStatus === 'In Preparation' ? 'Busy' : batchStatus === 'Ready' || batchStatus === 'Completed' ? 'Ready' : undefined
  if (!status) return state.stations
  return state.stations.map(station => station.id === stationId ? { ...station, status } : station)
}

function syncState(state: PlateIQState): PlateIQState {
  const dishesWithForecasts = state.dishes.map(dish => {
    const forecast = state.forecasts.find(item => item.dishId === dish.id)
    return forecast ? { ...dish, forecast: forecast.forecast, lowerBound: forecast.lowerBound, upperBound: forecast.upperBound, confidence: forecast.confidence, actualOrders: forecast.actual } : dish
  })
  const metrics = getRestaurantMetrics({ ...state, dishes: dishesWithForecasts })
  const biryaniForecast = getForecastMetrics({ ...state, dishes: dishesWithForecasts })
  const activeBatch = state.batches.find(batch => batch.id === state.demo.batch.id) ?? state.batches[0]
  return {
    ...state,
    dishes: dishesWithForecasts,
    metrics: { ...state.metrics, demand: metrics.demand, prepared: metrics.prepared, wasteKg: metrics.wasteKg, wasteCost: metrics.wasteCost, forecastAccuracy: metrics.forecastAccuracy, savings: metrics.savings },
    demo: { ...state.demo, prepared: metrics.prepared, forecast: biryaniForecast?.forecast ?? state.demo.forecast, lowerBound: biryaniForecast?.lowerBound ?? state.demo.lowerBound, upperBound: biryaniForecast?.upperBound ?? state.demo.upperBound, confidence: biryaniForecast?.confidence ?? state.demo.confidence, projectedDemand: biryaniForecast?.projectedDemand ?? state.demo.projectedDemand, batch: activeBatch ?? state.demo.batch },
  }
}

function nextBatchStatus(status: BatchStatus): BatchStatus | null {
  if (status === 'Recommended') return 'In Preparation'
  if (status === 'In Preparation') return 'Ready'
  if (status === 'Ready') return 'Completed'
  return null
}

function advanceBatch(state: PlateIQState, batchId: string, requestedStatus?: BatchStatus): PlateIQState {
  const current = state.batches.find(batch => batch.id === batchId)
  if (!current) return state
  const dish = state.dishes.find(item => item.id === current.dishId)
  if (!dish) {
    const failure = createEvent(state, 'BATCH_FAILED', `Batch #${current.number} could not advance`, 'The batch references a missing dish.', '/app/kitchen-planner', 'critical')
    return { ...state, events: [failure, ...state.events], notifications: [createNotification(state, 'Batch could not advance', 'The selected dish could not be found.', '/app/kitchen-planner'), ...state.notifications] }
  }
  const status = nextBatchStatus(current.status)
  if (!status || (requestedStatus && requestedStatus !== status)) return state
  const consumption = status === 'In Preparation' ? consumeForBatch(state.inventory, dish, current.quantity) : { items: state.inventory, errors: [] }
  if (consumption.errors.length) {
    const failure = createEvent(state, 'BATCH_FAILED', `Batch #${current.number} could not start`, consumption.errors.join(' '), '/app/kitchen-planner', 'warning')
    return { ...state, events: [failure, ...state.events], notifications: [createNotification(state, `Batch #${current.number} blocked`, consumption.errors.join(' '), '/app/inventory'), ...state.notifications] }
  }
  const nextDishes = status === 'In Preparation' ? state.dishes.map(item => item.id === dish.id ? { ...item, prepared: item.prepared + current.quantity, status: 'Preparing' as const } : item) : status === 'Completed' ? state.dishes.map(item => item.id === dish.id ? { ...item, status: 'Completed' as const } : item) : state.dishes
  const nextBatches = state.batches.map(batch => batch.id === current.id ? { ...batch, status, updatedAt: now } : batch)
  const nextRecommendations = status === 'Completed' ? state.recommendations.filter(recommendation => recommendation.dishId !== dish.id) : state.recommendations
  const nextState = {
    ...state,
    dishes: nextDishes,
    batches: nextBatches,
    inventory: consumption.items,
    stations: updateStationStatus(state, dish.category, status),
    waste: state.waste,
    recommendations: nextRecommendations,
    events: [createEvent(state, `BATCH_${status.toUpperCase().replace(' ', '_')}`, `Batch #${current.number} ${status.toLowerCase()}`, `${dish.name} and its operational dependencies were updated.`, '/app/live-operations'), ...state.events],
    notifications: [createNotification(state, `Batch #${current.number} ${status}`, `${dish.name} batch state was updated.`, '/app/kitchen-planner'), ...state.notifications],
  }
  return syncState(nextState)
}

function resetDemo(state: PlateIQState): PlateIQState {
  const biryani = state.dishes.find(dish => dish.id === 'biryani')
  const demoMetrics = getDemoMetrics(0, state.demo.baselineVelocity)
  const biryaniRecord = state.forecasts.find(item => item.dishId === 'biryani')
  const forecast = biryani ? buildForecast(biryani, demoMetrics.orders, state.scenario, state.demo.kitchenCapacity, biryaniRecord?.baseline) : null
  const forecasts = forecast ? state.forecasts.map(item => item.dishId === 'biryani' ? { ...item, forecast: forecast.forecast, lowerBound: forecast.lowerBound, upperBound: forecast.upperBound, confidence: forecast.confidence, actual: demoMetrics.orders, projectedDemand: forecast.projectedDemand, recommendedPreparation: forecast.recommendedPreparation } : item) : state.forecasts
  const recommendedBatch = state.batches.find(batch => batch.dishId === 'biryani' && batch.status === 'Recommended')
  const recommendations = state.recommendations.filter(recommendation => recommendation.dishId !== 'biryani')
  if (recommendedBatch && forecast) recommendations.push({ id: 'rec-1', title: `Start preparation batch #${recommendedBatch.number} +${recommendedBatch.quantity}`, description: 'Biryani is tracking above the current preparation plan.', actionLabel: `Start Batch #${recommendedBatch.number}`, confidence: forecast.confidence, dishId: 'biryani' })
  return syncState({
    ...state,
    forecasts,
    recommendations,
    alerts: state.alerts.filter(alert => alert.id !== 'surge-live'),
    events: state.events.filter(event => !['FORECAST_UPDATED', 'SURGE_DETECTED', 'BATCH_RECOMMENDED'].includes(event.type)),
    notifications: state.notifications.filter(notification => !notification.title.toLowerCase().includes('surge')),
    demo: { ...state.demo, ...demoMetrics, step: 0, prepared: state.demo.prepared, forecast: forecast?.forecast ?? state.demo.forecast, lowerBound: forecast?.lowerBound ?? state.demo.lowerBound, upperBound: forecast?.upperBound ?? state.demo.upperBound, confidence: forecast?.confidence ?? state.demo.confidence, projectedDemand: forecast?.projectedDemand ?? state.demo.projectedDemand, running: false, simulatedTime: '2025-06-24T11:00:00+05:30' },
  })
}

export function reducer(state: PlateIQState, action: PlateIQAction): PlateIQState {
  switch (action.type) {
    case 'hydrate': return isValidPersistedState(action.state) ? syncState(action.state) : initialState
    case 'toggle': return { ...state, demo: { ...state.demo, running: !state.demo.running } }
    case 'speed': return { ...state, demo: { ...state.demo, speed: action.value } }
    case 'reset': return resetDemo(state)
    case 'reset-scenario': return { ...state, scenario, demo: { ...state.demo, scenario }, events: [createEvent(state, 'SCENARIO_RESET', 'Scenario reset', 'What-If inputs returned to the base scenario.', '/app/what-if'), ...state.events] }
    case 'reset-data': return initialState
    case 'reason': return { ...state, demo: { ...state.demo, showReason: action.value } }
    case 'dismiss-alert': return { ...state, alerts: state.alerts.map(alert => alert.id === action.alertId ? { ...alert, dismissed: true } : alert), demo: { ...state.demo, dismissedAlertIds: [...state.demo.dismissedAlertIds, action.alertId] } }
    case 'read-notifications': return { ...state, notifications: state.notifications.map(notification => ({ ...notification, read: true })) }
    case 'read-notification': return { ...state, notifications: state.notifications.map(notification => notification.id === action.notificationId ? { ...notification, read: true } : notification) }
    case 'scenario': {
      const nextScenario = { ...state.scenario, ...action.scenario }
      return { ...state, scenario: nextScenario, demo: { ...state.demo, scenario: nextScenario }, events: [createEvent(state, 'SCENARIO_CHANGED', 'Scenario changed', 'Forecast inputs were updated.', '/app/what-if'), ...state.events] }
    }
    case 'apply-plan': {
      const result = simulateScenario(state, state.scenario)
      const nextForecasts = state.forecasts.map(forecast => {
        const simulated = result.forecastByDish.find(item => item.dish.id === forecast.dishId)?.forecast
        return simulated ? { ...forecast, forecast: simulated.forecast, lowerBound: simulated.lowerBound, upperBound: simulated.upperBound, confidence: simulated.confidence, actual: forecast.actual, projectedDemand: simulated.projectedDemand, recommendedPreparation: simulated.recommendedPreparation } : forecast
      })
      const nextBatches = state.batches.map(batch => {
        const simulated = result.forecastByDish.find(item => item.dish.id === batch.dishId)?.forecast
        return simulated && batch.status === 'Recommended' && simulated.recommendedPreparation > 0 ? { ...batch, quantity: simulated.recommendedPreparation, updatedAt: now } : batch
      })
      const nextRecommendations = result.forecastByDish.filter(item => item.forecast.recommendedPreparation > 0).map(item => {
        const batch = nextBatches.find(candidate => candidate.dishId === item.dish.id && candidate.status === 'Recommended')
        return { id: `rec-${item.dish.id}`, title: batch ? `Start preparation batch #${batch.number} +${batch.quantity}` : `Schedule preparation for ${item.dish.name}`, description: result.recommendation, actionLabel: batch ? `Start Batch #${batch.number}` : 'Review plan', confidence: item.forecast.confidence, dishId: item.dish.id }
      })
      const event = createEvent(state, 'PLAN_APPLIED', 'Preparation plan scheduled', result.recommendation, '/app/kitchen-planner')
      return syncState({ ...state, forecasts: nextForecasts, batches: nextBatches, recommendations: nextRecommendations, events: [event, ...state.events], notifications: [createNotification(state, 'Preparation plan scheduled', result.recommendation, '/app/kitchen-planner'), ...state.notifications] })
    }
    case 'receive-stock': {
      const item = state.inventory.find(candidate => candidate.id === action.itemId)
      if (!item || item.orderStatus !== 'Ordered' || action.amount <= 0) return state
      const updated = receiveStock(item, action.amount)
      return { ...state, inventory: state.inventory.map(candidate => candidate.id === item.id ? updated : candidate), events: [createEvent(state, 'INVENTORY_RECEIVED', `${item.name} delivery received`, `${action.amount} ${item.unit} was added to inventory.`, '/app/inventory'), ...state.events], notifications: [createNotification(state, 'Delivery received', `${item.name} stock is now ${updated.currentStock} ${item.unit}.`, '/app/inventory'), ...state.notifications] }
    }
    case 'adjust-stock': {
      const item = state.inventory.find(candidate => candidate.id === action.itemId)
      const updated = item ? adjustStock(item, action.amount) : null
      if (!item || !updated) return { ...state, events: [createEvent(state, 'INVENTORY_ADJUSTMENT_FAILED', 'Inventory adjustment blocked', `${item?.name ?? 'Ingredient'} cannot be adjusted below zero.`, '/app/inventory', 'warning'), ...state.events] }
      return { ...state, inventory: state.inventory.map(candidate => candidate.id === item.id ? updated : candidate), events: [createEvent(state, 'INVENTORY_ADJUSTED', `${item.name} inventory adjusted`, 'Inventory quantity was updated safely.', '/app/inventory'), ...state.events] }
    }
    case 'mark-ordered': {
      const item = state.inventory.find(candidate => candidate.id === action.itemId)
      if (!item || item.orderStatus === 'Ordered') return state
      const updated = markOrdered(item)
      return { ...state, inventory: state.inventory.map(candidate => candidate.id === item.id ? updated : candidate), events: [createEvent(state, 'INVENTORY_ORDERED', `${item.name} ordered`, 'A replenishment order was placed without changing stock.', '/app/inventory'), ...state.events], notifications: [createNotification(state, 'Reorder placed', `${item.name} is now marked Ordered.`, '/app/inventory'), ...state.notifications] }
    }
    case 'record-waste': {
      const dish = state.dishes.find(candidate => candidate.id === action.dishId)
      if (!dish || action.wasteKg <= 0) return state
      const record = { id: `waste-${state.waste.length + 1}`, dishId: dish.id, prepared: dish.prepared, consumed: dish.actualOrders, spoilageKg: action.category === 'Spoilage' ? action.wasteKg : 0, overproductionKg: action.category === 'Overproduction' ? action.wasteKg / 0.045 : 0, wasteKg: Number(action.wasteKg.toFixed(1)), wasteCost: Math.round(action.wasteKg * 150), unit: 'kg' as const, category: action.category, cause: action.cause, date: state.demo.simulatedTime }
      const summary = wasteSummary([record, ...state.waste])
      return { ...state, waste: [record, ...state.waste], metrics: { ...state.metrics, wasteKg: summary.wasteKg, wasteCost: summary.wasteCost, savings: summary.potentialSavings ?? 0 }, events: [createEvent(state, 'WASTE_RECORDED', `${dish.name} waste recorded`, `${record.wasteKg.toFixed(1)} kg recorded as ${record.category}.`, '/app/waste-intelligence'), ...state.events], notifications: [createNotification(state, 'Waste recorded', `${dish.name}: ${record.wasteKg.toFixed(1)} kg.`, '/app/waste-intelligence'), ...state.notifications] }
    }
    case 'batch': return advanceBatch(state, action.batchId ?? state.demo.batch.id)
    case 'batch-status': return advanceBatch(state, action.batchId, action.status)
    case 'tick': {
      const step = Math.min(8, state.demo.step + 1)
      const demoMetrics = getDemoMetrics(step, state.demo.baselineVelocity)
      const biryani = state.dishes.find(dish => dish.id === 'biryani')
      if (!biryani) return state
      const biryaniRecord = state.forecasts.find(item => item.dishId === 'biryani')
      const forecast = buildForecast(biryani, demoMetrics.orders, state.scenario, demoMetrics.kitchenCapacity, biryaniRecord?.baseline)
      const forecasts = state.forecasts.map(item => item.dishId === biryani.id ? { ...item, forecast: forecast.forecast, lowerBound: forecast.lowerBound, upperBound: forecast.upperBound, confidence: forecast.confidence, actual: demoMetrics.orders, projectedDemand: forecast.projectedDemand, recommendedPreparation: forecast.recommendedPreparation } : item)
      const enteredSurge = isDemandSurge(demoMetrics.ordersPerMinute, state.demo.baselineVelocity) && state.demo.status !== 'Surge'
      const needsBatch = forecast.recommendedPreparation > 0 || forecast.projectedDemand > state.demo.prepared || demoMetrics.kitchenCapacity >= 90
      const recommendedBatch = state.batches.find(batch => batch.dishId === biryani.id && batch.status === 'Recommended')
      const recommendation = recommendedBatch && needsBatch ? { id: 'rec-1', title: `Start preparation batch #${recommendedBatch.number} +${recommendedBatch.quantity}`, description: `${biryani.name} is tracking above the current preparation plan.`, actionLabel: `Start Batch #${recommendedBatch.number}`, confidence: forecast.confidence, dishId: biryani.id } : null
      const nextRecommendations = recommendation ? [...state.recommendations.filter(item => item.dishId !== biryani.id), recommendation] : state.recommendations
      const nextAlerts = enteredSurge ? [...state.alerts, { id: 'surge-live', title: 'Demand Surge Detected', description: 'Chicken Biryani demand is accelerating. Start preparation batch #2.', severity: 'warning' as const, dismissed: false, relatedEntity: 'biryani' }] : state.alerts
      const forecastEvent = createEvent(state, 'FORECAST_UPDATED', 'Forecast recalculated', `Projected demand updated to ${forecast.projectedDemand} plates.`, '/app/demand-forecast')
      const surgeEvent = enteredSurge ? createEvent(state, 'SURGE_DETECTED', 'Demand surge detected', 'Order velocity crossed the live surge threshold.', '/app/live-operations', 'warning') : null
      const recommendationEvent = enteredSurge && recommendation ? createEvent(state, 'BATCH_RECOMMENDED', recommendation.title, 'The next batch recommendation was refreshed from the live forecast.', '/app/kitchen-planner') : null
      const nextState = { ...state, forecasts, recommendations: nextRecommendations, alerts: nextAlerts, events: [forecastEvent, ...(surgeEvent ? [surgeEvent] : []), ...(recommendationEvent ? [recommendationEvent] : []), ...state.events], notifications: enteredSurge ? [createNotification(state, 'Demand surge detected', 'PlateIQ recommends starting the next biryani batch.', '/app'), ...state.notifications] : state.notifications, demo: { ...state.demo, ...demoMetrics, prepared: state.demo.prepared, running: step < 8 && state.demo.running, status: demoMetrics.status as PlateIQState['demo']['status'], step, forecast: forecast.forecast, lowerBound: forecast.lowerBound, upperBound: forecast.upperBound, confidence: forecast.confidence, projectedDemand: forecast.projectedDemand, simulatedTime: advanceClock(state.demo.simulatedTime) }, }
      return syncState(nextState)
    }
    default: return state
  }
}

const Ctx = createContext<{ state: PlateIQState; dispatch: React.Dispatch<PlateIQAction> } | null>(null)

export function PlateIQProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    if (!state.demo.running || state.demo.step >= 8) return
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), Math.max(700, 2200 / state.demo.speed))
    return () => window.clearInterval(timer)
  }, [state.demo.running, state.demo.step, state.demo.speed])
  useEffect(() => {
    try {
      const saved = localStorage.getItem('plateiq-state')
      if (!saved) return
      const parsed: unknown = JSON.parse(saved)
      if (isValidPersistedState(parsed)) dispatch({ type: 'hydrate', state: parsed })
      else localStorage.removeItem('plateiq-state')
    } catch {
      localStorage.removeItem('plateiq-state')
    }
  }, [])
  useEffect(() => {
    try { localStorage.setItem('plateiq-state', JSON.stringify(state)) } catch {}
  }, [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function usePlateIQ() {
  const value = useContext(Ctx)
  if (!value) throw new Error('usePlateIQ must be used within PlateIQProvider')
  return value
}

export const navItems = [['Overview', '/app'], ['Live Operations', '/app/live-operations'], ['Kitchen Planner', '/app/kitchen-planner'], ['Demand Forecast', '/app/demand-forecast'], ['Inventory', '/app/inventory'], ['Waste Intelligence', '/app/waste-intelligence'], ['What-If Simulator', '/app/what-if'], ['Analytics', '/app/analytics'], ['AI Copilot', '/app/copilot']] as const

export function usePlateIQMetrics() {
  const { state } = usePlateIQ()
  return useMemo(() => {
    const metrics = getRestaurantMetrics(state)
    const forecast = getForecastMetrics(state)
    return { demand: metrics.demand, prepared: metrics.prepared, waste: `${metrics.wasteKg.toFixed(1)} kg`, wasteCost: `₹${metrics.wasteCost.toLocaleString('en-IN')}`, accuracy: `${metrics.forecastAccuracy.toFixed(1)}%`, orders: state.demo.orders, projected: forecast?.projectedDemand ?? metrics.projectedDemand, unread: state.notifications.filter(notification => !notification.read).length, capacity: state.demo.kitchenCapacity }
  }, [state])
}
