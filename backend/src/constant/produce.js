export const PRODUCE_CATALOG = [
  { name: "tomato", displayName: "Tomato", category: "vegetable", unit: "kg" },
  { name: "potato", displayName: "Potato", category: "vegetable", unit: "kg" },
  { name: "onion", displayName: "Onion", category: "vegetable", unit: "kg" },
  { name: "cabbage", displayName: "Cabbage", category: "vegetable", unit: "kg" },
  { name: "carrot", displayName: "Carrot", category: "vegetable", unit: "kg" },
  { name: "cauliflower", displayName: "Cauliflower", category: "vegetable", unit: "kg" },
  { name: "spinach", displayName: "Spinach", category: "vegetable", unit: "kg" },
  { name: "chili", displayName: "Green Chili", category: "vegetable", unit: "kg" },
  { name: "garlic", displayName: "Garlic", category: "vegetable", unit: "kg" },
  { name: "ginger", displayName: "Ginger", category: "vegetable", unit: "kg" },
  { name: "cucumber", displayName: "Cucumber", category: "vegetable", unit: "kg" },
  { name: "beans", displayName: "Green Beans", category: "vegetable", unit: "kg" },
  { name: "wheat", displayName: "Wheat", category: "grain", unit: "kg" },
  { name: "rice", displayName: "Rice", category: "grain", unit: "kg" },
  { name: "corn", displayName: "Corn", category: "grain", unit: "kg" },
  { name: "apple", displayName: "Apple", category: "fruit", unit: "kg" },
  { name: "banana", displayName: "Banana", category: "fruit", unit: "kg" },
  { name: "mango", displayName: "Mango", category: "fruit", unit: "kg" },
  { name: "orange", displayName: "Orange", category: "fruit", unit: "kg" },
  { name: "grapes", displayName: "Grapes", category: "fruit", unit: "kg" },
];

export const normalizeProduceName = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ");

export const findProduce = (value) => {
  const normalized = normalizeProduceName(value);
  return (
    PRODUCE_CATALOG.find(
      (item) =>
        item.name === normalized ||
        item.displayName.toLowerCase() === normalized
    ) || {
      name: normalized,
      displayName: value.trim() || normalized,
      category: "other",
      unit: "kg",
    }
  );
};

export const KG_PER_TON = 1000;
