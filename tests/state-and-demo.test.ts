import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '@/components/plateiq-state'
import { validateStateConsistency, isValidPersistedState } from '@/lib/selectors'

function batchFor(state: typeof initialState, dishId = 'biryani') {
  return state.batches.find(batch => batch.dishId === dishId)!
}

describe('batch lifecycle and application state', () => {
  it('transitions a batch through the valid lifecycle', () => {
    let state = initialState
    const batch = batchFor(state)
    state = reducer(state, { type: 'batch', batchId: batch.id })
    expect(state.batches.find(item => item.id === batch.id)?.status).toBe('In Preparation')
    expect(state.dishes.find(dish => dish.id === batch.dishId)?.prepared).toBe(biryaniPrepared(initialState) + batch.quantity)
    state = reducer(state, { type: 'batch', batchId: batch.id })
    expect(state.batches.find(item => item.id === batch.id)?.status).toBe('Ready')
    state = reducer(state, { type: 'batch', batchId: batch.id })
    expect(state.batches.find(item => item.id === batch.id)?.status).toBe('Completed')
    expect(reducer(state, { type: 'batch', batchId: batch.id }).batches.find(item => item.id === batch.id)?.status).toBe('Completed')
  })

  it('resets complete application data separately', () => {
    const changed = reducer(initialState, { type: 'record-waste', dishId: 'biryani', wasteKg: 1, category: 'Spoilage', cause: 'Test event' })
    expect(reducer(changed, { type: 'reset-data' })).toEqual(initialState)
  })

  it('applies a plan without preparing food, consuming inventory, or creating waste', () => {
    const result = reducer(initialState, { type: 'apply-plan' })
    expect(result.inventory).toEqual(initialState.inventory)
    expect(result.waste).toEqual(initialState.waste)
    expect(result.demo.prepared).toBe(initialState.demo.prepared)
    for (const batch of result.batches.filter(item => item.status === 'Recommended')) {
      const forecast = result.forecasts.find(item => item.dishId === batch.dishId)
      if (forecast && forecast.recommendedPreparation > 0) {
        expect(batch.quantity).toBe(forecast.recommendedPreparation)
      }
    }
    expect(result.events[0].type).toBe('PLAN_APPLIED')
  })
})

describe('state validation and persistence', () => {
  it('accepts the initial state and rejects malformed or inconsistent state', () => {
    expect(validateStateConsistency(initialState)).toEqual([])
    expect(isValidPersistedState(initialState)).toBe(true)
    expect(isValidPersistedState(null)).toBe(false)
    expect(isValidPersistedState({ version: 2 })).toBe(false)

    const invalid = JSON.parse(JSON.stringify(initialState))
    invalid.inventory[0].currentStock = -1
    expect(isValidPersistedState(invalid)).toBe(false)

    const invalidRange = JSON.parse(JSON.stringify(initialState))
    invalidRange.forecasts[0].lowerBound = invalidRange.forecasts[0].upperBound + 1
    expect(isValidPersistedState(invalidRange)).toBe(false)

    const invalidOrder = JSON.parse(JSON.stringify(initialState))
    invalidOrder.inventory[0].orderStatus = 'Lost'
    expect(isValidPersistedState(invalidOrder)).toBe(false)

    const invalidBatch = JSON.parse(JSON.stringify(initialState))
    invalidBatch.batches[0].status = 'Lost'
    expect(isValidPersistedState(invalidBatch)).toBe(false)

    const missingDish = JSON.parse(JSON.stringify(initialState))
    missingDish.batches[0].dishId = 'missing-dish'
    expect(isValidPersistedState(missingDish)).toBe(false)

    const inconsistentWaste = JSON.parse(JSON.stringify(initialState))
    inconsistentWaste.metrics.wasteKg += 1
    expect(isValidPersistedState(inconsistentWaste)).toBe(false)

    expect(reducer(initialState, { type: 'hydrate', state: invalidBatch })).toEqual(initialState)
  })
})

function biryaniPrepared(state: typeof initialState) {
  return state.dishes.find(dish => dish.id === 'biryani')!.prepared
}
