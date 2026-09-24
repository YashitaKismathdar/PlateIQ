import { describe, expect, it } from 'vitest'
import { buildForecast } from '@/lib/forecasting'
import { simulateScenario } from '@/lib/selectors'
import { initialState } from '@/components/plateiq-state'

const baseScenario = initialState.scenario
const biryani = initialState.dishes.find(dish => dish.id === 'biryani')!

function expectCoherentForecast(forecast: ReturnType<typeof buildForecast>) {
  expect(forecast.forecast).toBeGreaterThanOrEqual(0)
  expect(forecast.lowerBound).toBeGreaterThanOrEqual(0)
  expect(forecast.lowerBound).toBeLessThanOrEqual(forecast.forecast)
  expect(forecast.forecast).toBeLessThanOrEqual(forecast.upperBound)
  expect(forecast.confidence).toBeGreaterThanOrEqual(0)
  expect(forecast.confidence).toBeLessThanOrEqual(100)
  expect(forecast.projectedDemand).toBeGreaterThanOrEqual(0)
  expect(forecast.recommendedPreparation).toBeGreaterThanOrEqual(0)
}

describe('forecast authority', () => {
  it('keeps forecast outputs coherent through the shared pipeline', () => {
    const forecast = buildForecast(biryani, initialState.demo.orders, baseScenario, initialState.demo.kitchenCapacity, initialState.forecasts[0].baseline)
    expectCoherentForecast(forecast)
  })

  it('does not compound the same scenario against its previous result', () => {
    const scenario = { ...baseScenario, customerChange: 30, weather: 'Rain' as const, promotion: true }
    const first = buildForecast(biryani, initialState.demo.orders, scenario, initialState.demo.kitchenCapacity, initialState.forecasts[0].baseline)
    const second = buildForecast(biryani, initialState.demo.orders, scenario, initialState.demo.kitchenCapacity, initialState.forecasts[0].baseline)
    expect(second).toEqual(first)
  })

  it('keeps What-If simulation read-only and scenario-sensitive', () => {
    const original = JSON.parse(JSON.stringify(initialState))
    const clear = simulateScenario(initialState, baseScenario)
    const changed = simulateScenario(initialState, { ...baseScenario, customerChange: 30, weather: 'Heavy Rain', holiday: 'High', localEvent: 'High', promotion: true })
    expect(changed.projectedDemand).not.toBe(clear.projectedDemand)
    expect(changed.recommendedPreparation).not.toBe(clear.recommendedPreparation)
    expect(initialState).toEqual(original)
  })

  it('responds to each scenario control independently', () => {
    const baseline = simulateScenario(initialState, baseScenario)
    const variants = [
      { customerChange: 30 },
      { weather: 'Heavy Rain' as const },
      { holiday: 'High' as const },
      { localEvent: 'High' as const },
      { promotion: true },
    ]
    for (const change of variants) {
      const result = simulateScenario(initialState, { ...baseScenario, ...change })
      expect(result.projectedDemand).not.toBe(baseline.projectedDemand)
    }
  })
})
