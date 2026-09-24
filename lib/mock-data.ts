import type { Alert, Dish, InventoryItem, KitchenStation, Restaurant, SimulationScenario, WasteRecord } from './types'
export const restaurant:Restaurant={id:'jubilee-hills',name:'Jubilee Hills Restaurant',city:'Hyderabad',country:'India',timezone:'Asia/Kolkata',currency:'₹'}
export const dishes:Dish[]=[
{id:'biryani',name:'Chicken Biryani',category:'Mains',forecast:126,lowerBound:118,upperBound:126,confidence:91,actualOrders:92,prepared:60,initialBatch:60,nextBatch:30,batchSize:30,leadTimeMinutes:18,status:'Batch Recommended',ingredients:{chicken:8,rice:5,yogurt:2,onions:2.5}},
{id:'paneer',name:'Paneer Curry',category:'Mains',forecast:82,lowerBound:76,upperBound:88,confidence:94,actualOrders:65,prepared:70,initialBatch:70,nextBatch:20,batchSize:20,leadTimeMinutes:15,status:'On Track',ingredients:{paneer:5,tomatoes:3,onions:1.5}},
{id:'rice',name:'Jeera Rice',category:'Sides',forecast:140,lowerBound:132,upperBound:148,confidence:96,actualOrders:112,prepared:120,initialBatch:120,nextBatch:20,batchSize:20,leadTimeMinutes:12,status:'Preparing',ingredients:{rice:8,spices:0.4}},
{id:'dal',name:'Dal Tadka',category:'Mains',forecast:74,lowerBound:68,upperBound:80,confidence:93,actualOrders:58,prepared:62,initialBatch:62,nextBatch:15,batchSize:15,leadTimeMinutes:14,status:'On Track',ingredients:{lentils:4,tomatoes:2}},
{id:'naan',name:'Naan',category:'Breads',forecast:188,lowerBound:175,upperBound:202,confidence:89,actualOrders:141,prepared:150,initialBatch:150,nextBatch:30,batchSize:30,leadTimeMinutes:8,status:'On Track',ingredients:{flour:10,butter:1.5}},
]
export const inventory:InventoryItem[]=[
{id:'chicken',name:'Chicken',unit:'kg',currentStock:38,reorderPoint:18,dailyUsage:14,unitCost:260,status:'Healthy',daysLeft:2.7,trend:'Falling',orderStatus:'Not Ordered'},
{id:'rice',name:'Basmati rice',unit:'kg',currentStock:26,reorderPoint:14,dailyUsage:9,unitCost:110,status:'Healthy',daysLeft:2.9,trend:'Falling',orderStatus:'Not Ordered'},
{id:'tomatoes',name:'Tomatoes',unit:'kg',currentStock:4.2,reorderPoint:8,dailyUsage:2.8,unitCost:70,status:'Low',daysLeft:1.5,trend:'Falling',orderStatus:'Not Ordered'},
{id:'spices',name:'Whole spices',unit:'kg',currentStock:1.8,reorderPoint:3,dailyUsage:2.2,unitCost:420,status:'Critical',daysLeft:.8,trend:'Falling',orderStatus:'Not Ordered'},
{id:'paneer',name:'Paneer',unit:'kg',currentStock:12,reorderPoint:7,dailyUsage:4.2,unitCost:380,status:'Healthy',daysLeft:2.8,trend:'Stable',orderStatus:'Not Ordered'},
{id:'yogurt',name:'Yogurt',unit:'kg',currentStock:10,reorderPoint:3,dailyUsage:2,unitCost:90,status:'Healthy',daysLeft:5,trend:'Stable',orderStatus:'Not Ordered'},
{id:'onions',name:'Onions',unit:'kg',currentStock:20,reorderPoint:8,dailyUsage:5,unitCost:45,status:'Healthy',daysLeft:4,trend:'Stable',orderStatus:'Not Ordered'},
{id:'lentils',name:'Lentils',unit:'kg',currentStock:12,reorderPoint:4,dailyUsage:3,unitCost:120,status:'Healthy',daysLeft:4,trend:'Stable',orderStatus:'Not Ordered'},
{id:'flour',name:'Flour',unit:'kg',currentStock:20,reorderPoint:8,dailyUsage:5,unitCost:55,status:'Healthy',daysLeft:4,trend:'Stable',orderStatus:'Not Ordered'},
{id:'butter',name:'Butter',unit:'kg',currentStock:5,reorderPoint:2,dailyUsage:1.2,unitCost:520,status:'Healthy',daysLeft:4.2,trend:'Stable',orderStatus:'Not Ordered'},
{id:'garlic',name:'Garlic',unit:'kg',currentStock:8,reorderPoint:2,dailyUsage:1.5,unitCost:180,status:'Healthy',daysLeft:5.3,trend:'Stable',orderStatus:'Not Ordered'},
{id:'ginger',name:'Ginger',unit:'kg',currentStock:6,reorderPoint:2,dailyUsage:1.1,unitCost:160,status:'Healthy',daysLeft:5.5,trend:'Stable',orderStatus:'Not Ordered'},
{id:'cilantro',name:'Cilantro',unit:'kg',currentStock:3,reorderPoint:1,dailyUsage:.8,unitCost:140,status:'Healthy',daysLeft:3.8,trend:'Falling',orderStatus:'Not Ordered'},
{id:'mint',name:'Mint',unit:'kg',currentStock:2,reorderPoint:.6,dailyUsage:.5,unitCost:130,status:'Healthy',daysLeft:4,trend:'Stable',orderStatus:'Not Ordered'},
{id:'green-chilies',name:'Green chilies',unit:'kg',currentStock:4,reorderPoint:1,dailyUsage:.9,unitCost:110,status:'Healthy',daysLeft:4.4,trend:'Stable',orderStatus:'Not Ordered'},
{id:'lemons',name:'Lemons',unit:'kg',currentStock:8,reorderPoint:2,dailyUsage:1.5,unitCost:90,status:'Healthy',daysLeft:5.3,trend:'Stable',orderStatus:'Not Ordered'},
{id:'cooking-oil',name:'Cooking oil',unit:'l',currentStock:18,reorderPoint:6,dailyUsage:4,unitCost:150,status:'Healthy',daysLeft:4.5,trend:'Stable',orderStatus:'Not Ordered'},
{id:'ghee',name:'Ghee',unit:'kg',currentStock:6,reorderPoint:2,dailyUsage:1.2,unitCost:620,status:'Healthy',daysLeft:5,trend:'Stable',orderStatus:'Not Ordered'},
{id:'tomato-sauce',name:'Tomato sauce',unit:'l',currentStock:8,reorderPoint:2,dailyUsage:1.5,unitCost:120,status:'Healthy',daysLeft:5.3,trend:'Stable',orderStatus:'Not Ordered'},
{id:'vinegar',name:'Vinegar',unit:'l',currentStock:5,reorderPoint:1,dailyUsage:.6,unitCost:90,status:'Healthy',daysLeft:8.3,trend:'Stable',orderStatus:'Not Ordered'},
{id:'soy-sauce',name:'Soy sauce',unit:'l',currentStock:4,reorderPoint:1,dailyUsage:.5,unitCost:180,status:'Healthy',daysLeft:8,trend:'Stable',orderStatus:'Not Ordered'},
{id:'salt',name:'Salt',unit:'kg',currentStock:12,reorderPoint:3,dailyUsage:1.5,unitCost:25,status:'Healthy',daysLeft:8,trend:'Stable',orderStatus:'Not Ordered'},
{id:'turmeric',name:'Turmeric',unit:'kg',currentStock:2,reorderPoint:.5,dailyUsage:.2,unitCost:260,status:'Healthy',daysLeft:10,trend:'Stable',orderStatus:'Not Ordered'},
{id:'chili-powder',name:'Chili powder',unit:'kg',currentStock:3,reorderPoint:.8,dailyUsage:.3,unitCost:300,status:'Healthy',daysLeft:10,trend:'Stable',orderStatus:'Not Ordered'},
{id:'cumin',name:'Cumin',unit:'kg',currentStock:2,reorderPoint:.5,dailyUsage:.2,unitCost:360,status:'Healthy',daysLeft:10,trend:'Stable',orderStatus:'Not Ordered'},
{id:'garam-masala',name:'Garam masala',unit:'kg',currentStock:2,reorderPoint:.5,dailyUsage:.2,unitCost:480,status:'Healthy',daysLeft:10,trend:'Stable',orderStatus:'Not Ordered'}]
export const stations:KitchenStation[]=[{id:'hot',name:'Hot kitchen',capacity:86,status:'Busy'},{id:'prep',name:'Prep station',capacity:72,status:'Ready'},{id:'bread',name:'Tandoor & breads',capacity:79,status:'Busy'}]
export const scenario:SimulationScenario={customerChange:0,weather:'Clear',holiday:'None',localEvent:'None',promotion:false}
export const alerts:Alert[]=[{id:'surge',title:'Demand surge detected',description:'Chicken Biryani demand is accelerating beyond the initial plan.',severity:'warning',dismissed:false,relatedEntity:'biryani'},{id:'spices',title:'Critical stock risk',description:'Whole spices are projected to reach critical stock in 0.8 days.',severity:'critical',dismissed:false,relatedEntity:'spices'}]
export const waste:WasteRecord[]=[
{id:'waste-biryani',dishId:'biryani',prepared:60,consumed:92,spoilageKg:1.2,overproductionKg:7.2,wasteKg:8.4,wasteCost:1260,unit:'kg',category:'Overproduction',cause:'Initial preparation exceeded lunch demand.',date:'2025-06-24T12:20:00+05:30'},
{id:'waste-paneer',dishId:'paneer',prepared:70,consumed:65,spoilageKg:.8,overproductionKg:4.3,wasteKg:5.1,wasteCost:765,unit:'kg',category:'Overproduction',cause:'Batch size exceeded late-service demand.',date:'2025-06-24T12:10:00+05:30'},
{id:'waste-rice',dishId:'rice',prepared:120,consumed:112,spoilageKg:.7,overproductionKg:4,wasteKg:4.7,wasteCost:470,unit:'kg',category:'Prepared Food',cause:'Prepared side dish remaining after service.',date:'2025-06-24T12:00:00+05:30'},
{id:'waste-dal',dishId:'dal',prepared:62,consumed:58,spoilageKg:.4,overproductionKg:2.4,wasteKg:2.8,wasteCost:350,unit:'kg',category:'Spoilage',cause:'Short holding-time window.',date:'2025-06-24T11:50:00+05:30'},
{id:'waste-naan',dishId:'naan',prepared:150,consumed:141,spoilageKg:.5,overproductionKg:3.1,wasteKg:3.6,wasteCost:288,unit:'kg',category:'Prepared Food',cause:'Unsold bread at service close.',date:'2025-06-24T11:40:00+05:30'}]
