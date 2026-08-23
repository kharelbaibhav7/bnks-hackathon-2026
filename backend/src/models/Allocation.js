import mongoose from "mongoose";

const allocationItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    unit: { type: String, default: "kg" },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const allocationSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [allocationItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["requested", "accepted", "rejected", "handed_over", "in_transit", "delivered"],
      default: "requested",
    },
    rejectReason: { type: String, default: "" },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
    escrowStatus: { type: String, enum: ["none", "held", "released", "refunded"], default: "none" },
    escrowRef: { type: String, default: "" },
    transportJob: { type: mongoose.Schema.Types.ObjectId, ref: "TransportJob" },
  },
  { timestamps: true }
);

const Allocation = mongoose.model("Allocation", allocationSchema);
export default Allocation;
