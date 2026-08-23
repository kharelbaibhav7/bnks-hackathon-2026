import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counterparty: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "topup",
        "order_payment",
        "order_receipt",
        "transport_fee",
        "escrow_hold",
        "escrow_release",
        "escrow_refund",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation" },
    description: { type: String, default: "" },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
