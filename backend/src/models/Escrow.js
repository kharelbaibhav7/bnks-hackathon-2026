import mongoose from "mongoose";

const escrowSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation", required: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["held", "released", "refunded"], default: "held" },
    heldAt: { type: Date, default: Date.now },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

const Escrow = mongoose.model("Escrow", escrowSchema);
export default Escrow;
