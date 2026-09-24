import type { Dish, InventoryItem } from './types'

export interface BatchConsumptionResult {
	items: InventoryItem[]
	errors: string[]
}

export function ingredientRequirements(dish: Dish, quantity: number) {
	if (quantity <= 0 || dish.batchSize <= 0) return {}
	return Object.fromEntries(Object.entries(dish.ingredients).map(([ingredientId, amount]) => [ingredientId, amount * quantity / dish.batchSize]))
}

function inventoryStatus(daysLeft: number): InventoryItem['status'] {
	return daysLeft <= 0.8 ? 'Critical' : daysLeft <= 2 ? 'Low' : 'Healthy'
}

export function deriveInventoryState(item: InventoryItem, currentStock = item.currentStock, trend = item.trend): InventoryItem {
	const safeStock = Math.max(0, Number(currentStock.toFixed(1)))
	const daysLeft = Number((safeStock / Math.max(item.dailyUsage, 0.1)).toFixed(1))
	return { ...item, currentStock: safeStock, daysLeft, status: inventoryStatus(daysLeft), trend }
}

function updateInventoryItem(item: InventoryItem, amount: number): InventoryItem {
	return deriveInventoryState(item, item.currentStock - amount, 'Falling')
}

export function consumeForBatch(items: InventoryItem[], dish: Dish, quantity: number): BatchConsumptionResult {
	if (quantity <= 0 || dish.batchSize <= 0) return { items, errors: [`Batch quantity for ${dish.name} must be positive.`] }

	const inventoryById = new Map(items.map(item => [item.id, item]))
	const requirements = Object.entries(ingredientRequirements(dish, quantity)).map(([ingredientId, amount]) => ({ ingredientId, amount }))
	const errors: string[] = []

	for (const requirement of requirements) {
		const item = inventoryById.get(requirement.ingredientId)
		if (!item) errors.push(`Ingredient ${requirement.ingredientId} is not present in inventory.`)
		else if (item.currentStock < requirement.amount) errors.push(`Insufficient ${item.name} for ${dish.name} batch.`)
	}

	if (errors.length) return { items, errors }

	return {
		items: requirements.reduce((nextItems, requirement) => nextItems.map(item => item.id === requirement.ingredientId ? updateInventoryItem(item, requirement.amount) : item), items),
		errors: [],
	}
}

export function receiveStock(item: InventoryItem, amount: number) {
	if (amount <= 0) return item
	return { ...deriveInventoryState(item, item.currentStock + amount, 'Rising'), orderStatus: 'Received' as const }
}

export function markOrdered(item: InventoryItem) {
	return { ...item, orderStatus: 'Ordered' as const }
}

export function adjustStock(item: InventoryItem, amount: number) {
	if (item.currentStock + amount < 0) return null
	return deriveInventoryState(item, item.currentStock + amount, amount >= 0 ? 'Rising' : 'Falling')
}
