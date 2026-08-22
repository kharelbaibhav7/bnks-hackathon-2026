import InventoryItem from "../models/InventoryItem.js";
import { findProduce } from "../constant/produce.js";

const EMPTY_THRESHOLD = 10;

export const analyzeRetailerStock = async (retailerId, vision = {}) => {
  const inventory = await InventoryItem.find({ owner: retailerId, ownerRole: "retailer" });
  const emptinessScore = Number(vision.emptinessScore || 0);
  const colorHints = Array.isArray(vision.colorHints) ? vision.colorHints : [];

  const lowStock = inventory
    .filter((item) => item.quantity <= (item.minStock ?? EMPTY_THRESHOLD))
    .map((item) => ({
      name: item.name,
      displayName: item.displayName,
      quantity: item.quantity,
      minStock: item.minStock,
      unit: item.unit,
      suggestedOrder: Math.max(item.minStock * 4, 20),
      reason:
        item.quantity <= 0
          ? "Shelf is empty in your inventory"
          : `Stock is below your ${item.minStock}${item.unit} restock line`,
    }));

  const hinted = colorHints
    .map((hint) => findProduce(hint.name || hint))
    .filter((produce) => !lowStock.some((item) => item.name === produce.name))
    .map((produce) => ({
      name: produce.name,
      displayName: produce.displayName,
      quantity: 0,
      minStock: EMPTY_THRESHOLD,
      unit: produce.unit,
      suggestedOrder: 25,
      reason: "Camera scan suggested this produce may be missing from the shelf",
    }));

  const suggested = [...lowStock, ...(emptinessScore >= 0.35 ? hinted : [])];

  return {
    emptinessScore,
    emptyCellRatio: vision.emptyCellRatio || 0,
    cells: vision.cells || [],
    colorHints,
    inventoryCount: inventory.length,
    emptyOrLow: suggested,
    message:
      suggested.length > 0
        ? `Found ${suggested.length} item${suggested.length === 1 ? "" : "s"} that look empty or running low.`
        : emptinessScore >= 0.45
          ? "The shelf photo looks sparse. Add missing items manually if the camera missed them."
          : "Stock looks healthy. You can still add items by hand.",
  };
};
