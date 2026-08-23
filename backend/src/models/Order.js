import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    unit: { type: String, default: "kg" },
    quantityRequested: { type: Number, required: true, min: 0 },
    quantityAllocated: { type: Number, default: 0 },
    quantityAccepted: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: [
        "sourcing",
        "awaiting_farmers",
        "partially_accepted",
        "ready_for_transport",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      default: "sourcing",
    },
    notes: { type: String, default: "" },
    estimatedTotal: { type: Number, default: 0 },
    paidTotal: { type: Number, default: 0 },
    source: { type: String, enum: ["scan", "manual"], default: "manual" },
    invoiceSent: { type: Boolean, default: false },
    invoiceSentAt: { type: Date },
    invoiceNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
