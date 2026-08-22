import asyncHandler from "express-async-handler";
import InventoryItem from "../models/InventoryItem.js";
import { findProduce, PRODUCE_CATALOG } from "../constant/produce.js";

const ownerRoleFor = (role) => (role === "farmer" ? "farmer" : "retailer");

export const listCatalog = asyncHandler(async (req, res) => {
  res.json({ success: true, catalog: PRODUCE_CATALOG });
});

export const listInventory = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({
    owner: req.user._id,
    ownerRole: ownerRoleFor(req.user.role),
  }).sort({ displayName: 1 });
  res.json({ success: true, items });
});

export const upsertInventory = asyncHandler(async (req, res) => {
  const { name, quantity, pricePerUnit, minStock, unit } = req.body;
  if (!name) {
    res.status(400);
    throw new Error("Produce name is required");
  }

  const produce = findProduce(name);
  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 0) {
    res.status(400);
    throw new Error("Quantity must be a number of 0 or more");
  }

  const item = await InventoryItem.findOneAndUpdate(
    { owner: req.user._id, name: produce.name },
    {
      owner: req.user._id,
      ownerRole: ownerRoleFor(req.user.role),
      name: produce.name,
      displayName: produce.displayName,
      category: produce.category,
      quantity: qty,
      unit: unit || produce.unit,
      pricePerUnit: req.user.role === "farmer" ? Number(pricePerUnit || 0) : Number(pricePerUnit || 0),
      minStock: Number(minStock ?? 10),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, item });
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, owner: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error("Inventory item not found");
  }
  if (req.body.quantity !== undefined) item.quantity = Number(req.body.quantity);
  if (req.body.pricePerUnit !== undefined) item.pricePerUnit = Number(req.body.pricePerUnit);
  if (req.body.minStock !== undefined) item.minStock = Number(req.body.minStock);
  await item.save();
  res.json({ success: true, item });
});

export const removeInventory = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error("Inventory item not found");
  }
  res.json({ success: true, message: "Item removed" });
});

export const lowStock = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({
    owner: req.user._id,
    ownerRole: "retailer",
  });
  const empty = items.filter((item) => item.quantity <= item.minStock);
  res.json({ success: true, items: empty });
});
