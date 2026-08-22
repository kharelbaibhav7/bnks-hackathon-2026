import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerRole: { type: String, enum: ["farmer", "retailer"], required: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    category: { type: String, default: "other" },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "kg" },
    pricePerUnit: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ owner: 1, name: 1 }, { unique: true });

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
export default InventoryItem;
