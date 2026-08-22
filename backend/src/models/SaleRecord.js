import mongoose from "mongoose";

const saleRecordSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation" },
    itemName: { type: String, required: true },
    displayName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "kg" },
    pricePerUnit: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

const SaleRecord = mongoose.model("SaleRecord", saleRecordSchema);
export default SaleRecord;
