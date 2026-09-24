import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '@/components/plateiq-state'
import { consumeForBatch, ingredientRequirements } from '@/lib/inventory-engine'
import { wasteSummary } from '@/lib/waste-engine'

const biryani = initialState.dishes.find(dish => dish.id === 'biryani')!

function item(id: string) {
  return initialState.inventory.find(inventoryItem => inventoryItem.id === id)!
}

describe('inventory actions and batch consumption', () => {
  it('moves an item from ordered to received without changing stock on order', () => {
    const before = item('tomatoes').currentStock
    const ordered = reducer(initialState, { type: 'mark-ordered', itemId: 'tomatoes' })
    expect(ordered.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.orderStatus).toBe('Ordered')
    expect(ordered.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.currentStock).toBe(before)

    const received = reducer(ordered, { type: 'receive-stock', itemId: 'tomatoes', amount: 8 })
    expect(received.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.orderStatus).toBe('Received')
    expect(received.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.currentStock).toBe(before + 8)

    const duplicate = reducer(received, { type: 'receive-stock', itemId: 'tomatoes', amount: 8 })
    expect(duplicate.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.currentStock).toBe(before + 8)
  })

  it('accepts safe adjustments and rejects adjustments below zero', () => {
    const adjusted = reducer(initialState, { type: 'adjust-stock', itemId: 'tomatoes', amount: 1 })
    expect(adjusted.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.currentStock).toBe(5.2)
    const rejected = reducer(adjusted, { type: 'adjust-stock', itemId: 'tomatoes', amount: -100 })
    expect(rejected.inventory.find(inventoryItem => inventoryItem.id === 'tomatoes')?.currentStock).toBe(5.2)
  })

  it('consumes only stable-ID recipe ingredients', () => {
    const result = consumeForBatch(initialState.inventory, biryani, 30)
    expect(result.errors).toEqual([])
    expect(result.items.find(inventoryItem => inventoryItem.id === 'chicken')?.currentStock).toBe(30)
    expect(result.items.find(inventoryItem => inventoryItem.id === 'rice')?.currentStock).toBe(21)
    expect(result.items.find(inventoryItem => inventoryItem.id === 'paneer')?.currentStock).toBe(item('paneer').currentStock)
    expect(ingredientRequirements(biryani, 30)).toEqual({ chicken: 8, rice: 5, yogurt: 2, onions: 2.5 })
  })

  it('fails batch consumption atomically when stock is insufficient', () => {
    const scarce = initialState.inventory.map(inventoryItem => inventoryItem.id === 'chicken' ? { ...inventoryItem, currentStock: 1 } : inventoryItem)
    const result = consumeForBatch(scarce, biryani, 30)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.items).toEqual(scarce)
    expect(result.items.every(inventoryItem => inventoryItem.currentStock >= 0)).toBe(true)
  })
})

describe('waste records and summaries', () => {
  it('records waste for one dish and derives totals by category and dish', () => {
    const before = wasteSummary(initialState.waste)
    const next = reducer(initialState, { type: 'record-waste', dishId: 'biryani', wasteKg: 0.5, category: 'Overproduction', cause: 'Late service overproduction' })
    const after = wasteSummary(next.waste)
    expect(next.waste).toHaveLength(initialState.waste.length + 1)
    expect(after.wasteKg).toBe(Number((before.wasteKg + 0.5).toFixed(1)))
    expect(after.wasteCost).toBe(before.wasteCost + 75)
    expect(after.byCategory.Overproduction.wasteKg).toBeGreaterThan(before.byCategory.Overproduction.wasteKg)
    expect(after.byDish.biryani.wasteKg).toBeGreaterThan(before.byDish.biryani.wasteKg)
    expect(after.byDish.paneer.wasteKg).toBe(before.byDish.paneer.wasteKg)
    const record = next.waste[0]
    expect(record).toMatchObject({ dishId: 'biryani', category: 'Overproduction', cause: 'Late service overproduction', unit: 'kg', wasteKg: 0.5 })
    expect(record.date).toBe(next.demo.simulatedTime)
  })

  it('does not increase waste when a preparation batch starts', () => {
    const batch = initialState.batches.find(candidate => candidate.dishId === 'biryani')!
    const next = reducer(initialState, { type: 'batch', batchId: batch.id })
    expect(next.inventory.find(inventoryItem => inventoryItem.id === 'chicken')?.currentStock).toBeLessThan(initialState.inventory.find(inventoryItem => inventoryItem.id === 'chicken')!.currentStock)
    expect(next.waste).toEqual(initialState.waste)
  })
})
