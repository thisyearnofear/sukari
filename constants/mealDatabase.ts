/**
 * Comprehensive meal database for Slow Mo Mode
 * Sourced from USDA nutrition database and diabetes management resources
 */

export interface Meal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  type: 'healthy' | 'moderate' | 'unhealthy';
  glucoseImpact: number; // Estimated glucose rise in mg/dL
  carbs: number; // grams
  protein: number; // grams
  fat: number; // grams
  fiber: number; // grams
  calories: number;
  glycemicIndex: number; // 0-100
  glycemicLoad: number; // Carbs × (GI/100)
  description: string;
  tips: string[];
}

export const BREAKFAST_MEALS: Meal[] = [
  // Healthy options
  {
    id: 'breakfast_oatmeal_berries',
    name: 'Oatmeal with Berries',
    mealType: 'breakfast',
    type: 'healthy',
    glucoseImpact: 35,
    carbs: 38,
    protein: 8,
    fat: 4,
    fiber: 6,
    calories: 180,
    glycemicIndex: 51,
    glycemicLoad: 19,
    description: '½ cup oats with mixed berries and cinnamon',
    tips: [
      'High fiber helps slow glucose absorption',
      'Berries add antioxidants',
      'Cinnamon may help with insulin sensitivity'
    ]
  },
  {
    id: 'breakfast_eggs_toast',
    name: 'Scrambled Eggs & Whole Wheat Toast',
    mealType: 'breakfast',
    type: 'healthy',
    glucoseImpact: 28,
    carbs: 24,
    protein: 18,
    fat: 10,
    fiber: 3,
    calories: 280,
    glycemicIndex: 50,
    glycemicLoad: 12,
    description: '2 eggs, 1 slice whole wheat toast, avocado',
    tips: [
      'Protein helps stabilize blood sugar',
      'Healthy fats provide satiety',
      'Whole grain over white bread'
    ]
  },
  {
    id: 'breakfast_greek_yogurt',
    name: 'Greek Yogurt with Granola',
    mealType: 'breakfast',
    type: 'healthy',
    glucoseImpact: 32,
    carbs: 36,
    protein: 20,
    fat: 5,
    fiber: 2,
    calories: 240,
    glycemicIndex: 56,
    glycemicLoad: 20,
    description: '6oz Greek yogurt, ¼ cup granola, honey drizzle',
    tips: [
      'Protein-rich keeps you full longer',
      'Probiotics support gut health',
      'Measure granola - it can add up quickly'
    ]
  },
  {
    id: 'breakfast_veggie_omelet',
    name: 'Vegetable Omelet',
    mealType: 'breakfast',
    type: 'healthy',
    glucoseImpact: 22,
    carbs: 12,
    protein: 16,
    fat: 8,
    fiber: 2,
    calories: 200,
    glycemicIndex: 45,
    glycemicLoad: 5,
    description: '2-egg omelet with spinach, peppers, mushrooms',
    tips: [
      'Non-starchy veggies add nutrients with minimal carbs',
      'Very low glucose impact',
      'Filling and satisfying'
    ]
  },
  // Moderate options
  {
    id: 'breakfast_banana_toast',
    name: 'Whole Wheat Toast with Peanut Butter & Banana',
    mealType: 'breakfast',
    type: 'moderate',
    glucoseImpact: 48,
    carbs: 48,
    protein: 12,
    fat: 8,
    fiber: 5,
    calories: 320,
    glycemicIndex: 61,
    glycemicLoad: 29,
    description: '2 slices whole wheat, 2 tbsp PB, ½ banana',
    tips: [
      'Bananas have moderate GI but add carbs',
      'Peanut butter protein balances carbs',
      'Good quick energy option'
    ]
  },
  // Unhealthy options
  {
    id: 'breakfast_pancakes',
    name: 'Pancakes with Syrup',
    mealType: 'breakfast',
    type: 'unhealthy',
    glucoseImpact: 72,
    carbs: 56,
    protein: 6,
    fat: 8,
    fiber: 1,
    calories: 380,
    glycemicIndex: 75,
    glycemicLoad: 42,
    description: '3 pancakes with ¼ cup maple syrup',
    tips: [
      'High glycemic index causes rapid spike',
      'Low protein, low fiber',
      'Consider whole grain alternatives'
    ]
  },
  {
    id: 'breakfast_cereal',
    name: 'Sugary Cereal with Milk',
    mealType: 'breakfast',
    type: 'unhealthy',
    glucoseImpact: 65,
    carbs: 48,
    protein: 4,
    fat: 2,
    fiber: 0,
    calories: 220,
    glycemicIndex: 80,
    glycemicLoad: 38,
    description: '1.5 cups sugary cereal with 1 cup milk',
    tips: [
      'Added sugars spike blood glucose quickly',
      'Minimal fiber and protein',
      'Look for high-fiber, low-sugar cereals'
    ]
  },
];

export const LUNCH_MEALS: Meal[] = [
  // Healthy
  {
    id: 'lunch_grilled_chicken_salad',
    name: 'Grilled Chicken Salad',
    mealType: 'lunch',
    type: 'healthy',
    glucoseImpact: 28,
    carbs: 14,
    protein: 38,
    fat: 8,
    fiber: 4,
    calories: 320,
    glycemicIndex: 30,
    glycemicLoad: 4,
    description: 'Grilled chicken breast, mixed greens, veggies, olive oil dressing',
    tips: [
      'Lean protein minimal carbs',
      'Salad vegetables add fiber and nutrients',
      'Very stable glucose response'
    ]
  },
  {
    id: 'lunch_turkey_wrap',
    name: 'Turkey & Vegetable Wrap',
    mealType: 'lunch',
    type: 'healthy',
    glucoseImpact: 35,
    carbs: 28,
    protein: 24,
    fat: 6,
    fiber: 4,
    calories: 280,
    glycemicIndex: 48,
    glycemicLoad: 13,
    description: 'Whole wheat tortilla, lean turkey, lettuce, tomato, hummus',
    tips: [
      'Whole grain adds fiber',
      'High protein keeps satiated',
      'Portable lunch option'
    ]
  },
  {
    id: 'lunch_salmon_veggies',
    name: 'Baked Salmon with Vegetables',
    mealType: 'lunch',
    type: 'healthy',
    glucoseImpact: 25,
    carbs: 12,
    protein: 32,
    fat: 12,
    fiber: 3,
    calories: 380,
    glycemicIndex: 35,
    glycemicLoad: 4,
    description: '4oz salmon, broccoli, sweet potato',
    tips: [
      'Omega-3s support heart health',
      'Excellent protein',
      'Sweet potato adds slow-release carbs'
    ]
  },
  // Moderate
  {
    id: 'lunch_pasta',
    name: 'Whole Wheat Pasta with Tomato Sauce',
    mealType: 'lunch',
    type: 'moderate',
    glucoseImpact: 55,
    carbs: 52,
    protein: 14,
    fat: 4,
    fiber: 6,
    calories: 340,
    glycemicIndex: 68,
    glycemicLoad: 35,
    description: '1.5 cups whole wheat pasta, 1 cup tomato sauce',
    tips: [
      'Whole grain better than white',
      'Consider portion size',
      'Add protein (meat or beans) to slow digestion'
    ]
  },
  // Unhealthy
  {
    id: 'lunch_burger_fries',
    name: 'Burger and French Fries',
    mealType: 'lunch',
    type: 'unhealthy',
    glucoseImpact: 78,
    carbs: 64,
    protein: 24,
    fat: 28,
    fiber: 2,
    calories: 820,
    glycemicIndex: 75,
    glycemicLoad: 48,
    description: 'Cheeseburger with large fries',
    tips: [
      'High saturated fat and refined carbs',
      'Significant glucose spike',
      'High calorie density',
      'Consider lean burger on whole grain'
    ]
  },
  {
    id: 'lunch_pizza',
    name: 'Pepperoni Pizza (2 slices)',
    mealType: 'lunch',
    type: 'unhealthy',
    glucoseImpact: 82,
    carbs: 68,
    protein: 20,
    fat: 24,
    fiber: 2,
    calories: 720,
    glycemicIndex: 86,
    glycemicLoad: 58,
    description: '2 slices regular crust pepperoni pizza',
    tips: [
      'White flour crust = high GI',
      'High fat slows digestion slightly',
      'Try thin crust or cauliflower crust alternatives'
    ]
  },
];

export const DINNER_MEALS: Meal[] = [
  // Healthy
  {
    id: 'dinner_baked_salmon',
    name: 'Baked Salmon with Roasted Vegetables',
    mealType: 'dinner',
    type: 'healthy',
    glucoseImpact: 22,
    carbs: 18,
    protein: 36,
    fat: 14,
    fiber: 4,
    calories: 420,
    glycemicIndex: 40,
    glycemicLoad: 7,
    description: '5oz salmon, roasted broccoli, carrots, Brussels sprouts',
    tips: [
      'Low glucose impact',
      'Excellent for evening meal',
      'Omega-3s support sleep quality'
    ]
  },
  {
    id: 'dinner_grilled_chicken_quinoa',
    name: 'Grilled Chicken with Quinoa & Greens',
    mealType: 'dinner',
    type: 'healthy',
    glucoseImpact: 38,
    carbs: 36,
    protein: 32,
    fat: 6,
    fiber: 5,
    calories: 380,
    glycemicIndex: 53,
    glycemicLoad: 19,
    description: '5oz grilled chicken, ½ cup cooked quinoa, spinach salad',
    tips: [
      'Complete protein with quinoa',
      'High fiber aids digestion',
      'Good satiety for evening'
    ]
  },
  {
    id: 'dinner_veggie_stir_fry',
    name: 'Vegetable Stir-Fry with Tofu',
    mealType: 'dinner',
    type: 'healthy',
    glucoseImpact: 28,
    carbs: 22,
    protein: 18,
    fat: 8,
    fiber: 4,
    calories: 280,
    glycemicIndex: 45,
    glycemicLoad: 10,
    description: 'Mixed vegetables, tofu, brown rice, sesame oil',
    tips: [
      'Plant-based protein option',
      'Lots of vegetables = fiber',
      'Brown rice adds whole grains'
    ]
  },
  // Moderate
  {
    id: 'dinner_lean_beef_rice',
    name: 'Lean Beef Stir-Fry with White Rice',
    mealType: 'dinner',
    type: 'moderate',
    glucoseImpact: 62,
    carbs: 58,
    protein: 28,
    fat: 12,
    fiber: 2,
    calories: 520,
    glycemicIndex: 72,
    glycemicLoad: 42,
    description: '4oz lean beef, stir-fried veggies, 1 cup white rice',
    tips: [
      'White rice increases glucose impact',
      'Switch to brown rice to lower it',
      'Good protein content'
    ]
  },
  // Unhealthy
  {
    id: 'dinner_pasta_carbonara',
    name: 'Pasta Carbonara',
    mealType: 'dinner',
    type: 'unhealthy',
    glucoseImpact: 74,
    carbs: 62,
    protein: 18,
    fat: 26,
    fiber: 2,
    calories: 680,
    glycemicIndex: 80,
    glycemicLoad: 50,
    description: '2 cups white pasta with cream sauce',
    tips: [
      'Combination of refined carbs and saturated fat',
      'Significant glucose spike',
      'High calorie meal',
      'Consider whole wheat pasta and lighter sauce'
    ]
  },
  {
    id: 'dinner_fried_chicken',
    name: 'Fried Chicken with Biscuits',
    mealType: 'dinner',
    type: 'unhealthy',
    glucoseImpact: 68,
    carbs: 56,
    protein: 24,
    fat: 32,
    fiber: 2,
    calories: 780,
    glycemicIndex: 76,
    glycemicLoad: 42,
    description: '3 pieces fried chicken, 2 biscuits',
    tips: [
      'Fried preparation adds unhealthy fats',
      'White flour biscuits = high GI',
      'Try grilled chicken instead',
      'Whole grain bread alternative'
    ]
  },
];

// Export combined database
export const SNACK_MEALS: Meal[] = [
  {
    id: 'snack_apple_peanut_butter', name: 'Apple with Peanut Butter', mealType: 'snack', type: 'healthy',
    glucoseImpact: 25, carbs: 20, protein: 7, fat: 16, fiber: 4, calories: 250, glycemicIndex: 38, glycemicLoad: 8,
    description: 'Sliced apple with 2 tbsp natural peanut butter',
    tips: ['Fat and protein slow the glucose rise from the apple', 'Great pre-exercise snack'],
  },
  {
    id: 'snack_greek_yogurt_berries', name: 'Greek Yogurt & Berries', mealType: 'snack', type: 'healthy',
    glucoseImpact: 15, carbs: 18, protein: 15, fat: 3, fiber: 2, calories: 160, glycemicIndex: 30, glycemicLoad: 5,
    description: 'Plain Greek yogurt with mixed berries',
    tips: ['High protein keeps you full', 'Berries have the lowest glycemic impact of all fruits'],
  },
  {
    id: 'snack_trail_mix', name: 'Trail Mix', mealType: 'snack', type: 'moderate',
    glucoseImpact: 30, carbs: 25, protein: 6, fat: 18, fiber: 3, calories: 280, glycemicIndex: 45, glycemicLoad: 11,
    description: 'Nuts, seeds, and dried fruit mix (1/4 cup)',
    tips: ['Watch portion size — dried fruit concentrates sugar', 'Nuts provide healthy fats that slow absorption'],
  },
  {
    id: 'snack_candy_bar', name: 'Candy Bar', mealType: 'snack', type: 'unhealthy',
    glucoseImpact: 55, carbs: 35, protein: 3, fat: 14, fiber: 1, calories: 270, glycemicIndex: 70, glycemicLoad: 25,
    description: 'Chocolate candy bar',
    tips: ['Rapid glucose spike followed by crash', 'If craving chocolate, dark chocolate (70%+) has lower impact'],
  },
  {
    id: 'snack_veggie_hummus', name: 'Veggies & Hummus', mealType: 'snack', type: 'healthy',
    glucoseImpact: 10, carbs: 12, protein: 5, fat: 6, fiber: 4, calories: 120, glycemicIndex: 25, glycemicLoad: 3,
    description: 'Carrot sticks, cucumber, and bell pepper with hummus',
    tips: ['Fiber-rich vegetables barely raise glucose', 'Hummus adds protein and healthy fats'],
  },
];

export const ALL_MEALS: Meal[] = [
  ...BREAKFAST_MEALS,
  ...LUNCH_MEALS,
  ...DINNER_MEALS,
  ...SNACK_MEALS,
];

// Helper functions
export function getMealsByType(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Meal[] {
  return ALL_MEALS.filter(meal => meal.mealType === mealType);
}

export function getMealsByHealthiness(type: 'healthy' | 'moderate' | 'unhealthy'): Meal[] {
  return ALL_MEALS.filter(meal => meal.type === type);
}

export function getMeal(id: string): Meal | undefined {
  return ALL_MEALS.find(meal => meal.id === id);
}

export function searchMeals(query: string): Meal[] {
  const q = query.toLowerCase();
  return ALL_MEALS.filter(meal => 
    meal.name.toLowerCase().includes(q) || 
    meal.description.toLowerCase().includes(q)
  );
}
