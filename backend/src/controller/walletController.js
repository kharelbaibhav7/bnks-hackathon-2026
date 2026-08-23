import asyncHandler from "express-async-handler";
import Transaction from "../models/Transaction.js";
import { listEscrowsForUser } from "../service/escrowService.js";
import { changeWallet } from "../service/walletService.js";

export const getWallet = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .populate("counterparty", "name role storeName farmName")
    .sort({ createdAt: -1 })
    .limit(50);

  const escrows = await listEscrowsForUser(req.user._id);
  const incomingEscrow = escrows
    .filter((item) => String(item.farmer?._id || item.farmer) === String(req.user._id) && item.status === "held")
    .reduce((sum, item) => sum + item.amount, 0);

  res.json({
    success: true,
    balance: req.user.walletBalance,
    escrowHeld: req.user.escrowHeld || 0,
    incomingEscrow,
    transactions,
    escrows,
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
    description: req.body.note || "Transfer from linked bank",
  });

  res.json({
    success: true,
    balance: user.walletBalance,
    escrowHeld: user.escrowHeld || 0,
    transaction: tx,
  });
});
