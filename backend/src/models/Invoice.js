import mongoose from "mongoose";

const partySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    storeName: { type: String, default: "" },
    farmName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    area: { type: String, default: "" },
    city: { type: String, default: "" },
  },
  { _id: false }
);

const invoiceItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    displayName: { type: String, required: true },
    unit: { type: String, default: "kg" },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    audience: { type: String, enum: ["retailer", "farmer"], required: true },
    number: { type: String, required: true },
    retailer: partySchema,
    farmer: partySchema,
    items: [invoiceItemSchema],
    produceTotal: { type: Number, default: 0 },
    transportTotal: { type: Number, default: 0 },
    transport: [
      {
        driverName: { type: String, default: "" },
        vehicleNumber: { type: String, default: "" },
        pickupArea: { type: String, default: "" },
        deliveryArea: { type: String, default: "" },
        totalKg: { type: Number, default: 0 },
        costPerTon: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    total: { type: Number, required: true },
    escrowRef: { type: String, default: "" },
    escrowStatus: { type: String, default: "released" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, issuedAt: -1 });
invoiceSchema.index({ order: 1, user: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
