import asyncHandler from "express-async-handler";
import Transaction from "../models/Transaction.js";
import { changeWallet } from "../service/walletService.js";

export const getWallet = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .populate("counterparty", "name role storeName farmName")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    balance: req.user.walletBalance,
    transactions,
  });
});

export const topUp = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("Enter a valid amount to load");
  }

  const { user, tx } = await changeWallet({
    userId: req.user._id,
    amount,
    type: "topup",
    description: req.body.note || "Dummy wallet top-up",
  });

  res.json({ success: true, balance: user.walletBalance, transaction: tx });
});
