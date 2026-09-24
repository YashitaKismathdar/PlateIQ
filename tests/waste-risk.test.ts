import { describe, expect, it } from 'vitest'
import { initialState } from '@/components/plateiq-state'
import { getBatchImpact, getDishOperationalContext } from '@/lib/selectors'
import { calculateWasteRisk } from '@/lib/waste-risk-engine'

const dish = initialState.dishes.find(item => item.id === 'biryani')!
const forecast = initialState.forecasts.find(item => item.dishId === dish.id)!

const baseInput = {
  forecast: 100,
  lowerBound: 95,
  upperBound: 105,
  actual: 98,
  projectedDemand: 100,
  prepared: 60,
  preparationQuantity: 20,
  leadTimeMinutes: 15,
  batchSize: 20,
  ingredients: dish.ingredients,
}

describe('waste risk and operational batch context', () => {
  it('raises waste risk when preparation approaches or exceeds projected demand', () => {
    const low = calculateWasteRisk({ ...baseInput, preparationQuantity: 0 }, initialState.inventory)
    const high = calculateWasteRisk({ ...baseInput, preparationQuantity: 80, projectedDemand: 100 }, initialState.inventory)
    expect(high.score).toBeGreaterThan(low.score)
    expect(['Medium', 'High']).toContain(high.level)
    expect(high.reasons.length).toBeGreaterThan(0)
    expect(high.recommendedAction).toContain('batch')
  })

  it('identifies ingredient pressure and caps a recommendation at feasible inventory', () => {
    const scarceState = { ...initialState, inventory: initialState.inventory.map(item => item.id === 'chicken' ? { ...item, currentStock: 1 } : item) }
    const impact = getBatchImpact(scarceState, 'biryani', forecast.recommendedPreparation)
    const context = getDishOperationalContext(scarceState, 'biryani')!
    expect(impact.ready).toBe(false)
    expect(impact.shortages.some(item => item.ingredientId === 'chicken')).toBe(true)
    expect(context.risk?.stockoutRisk).toBe('High')
    expect(context.recommendedQuantity).toBeLessThanOrEqual(impact.maxFeasibleQuantity || context.recommendedQuantity)
  })
})
