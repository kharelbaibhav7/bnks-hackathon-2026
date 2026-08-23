import Allocation from "../models/Allocation.js";
import Escrow from "../models/Escrow.js";
import { changeWallet } from "./walletService.js";

const makeRef = () => `ESC-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

export const holdInEscrow = async ({ allocation, note }) => {
  if (!allocation || allocation.escrowStatus === "held" || allocation.escrowStatus === "released") {
    return Escrow.findOne({ allocation: allocation._id });
  }

  const reference = makeRef();
  await changeWallet({
    userId: allocation.retailer,
    amount: -allocation.totalAmount,
    type: "escrow_hold",
    description: note || `Held in AgriFlow escrow ${reference}`,
    counterparty: allocation.farmer,
    order: allocation.order,
    allocation: allocation._id,
  });

  const retailer = await (await import("../models/User.js")).default.findById(allocation.retailer);
  retailer.escrowHeld = Number(((retailer.escrowHeld || 0) + allocation.totalAmount).toFixed(2));
  await retailer.save();

  const escrow = await Escrow.create({
    reference,
    order: allocation.order,
    allocation: allocation._id,
    retailer: allocation.retailer,
    farmer: allocation.farmer,
    amount: allocation.totalAmount,
    status: "held",
    note: note || "Locked when the farmer accepted the order",
  });

  allocation.escrowStatus = "held";
  allocation.escrowRef = reference;
  await allocation.save();
  return escrow;
};

export const releaseEscrow = async ({ allocation, note }) => {
  let escrow = await Escrow.findOne({ allocation: allocation._id, status: "held" });

  if (!escrow && allocation.escrowStatus !== "held") {
    await changeWallet({
      userId: allocation.retailer,
      amount: -allocation.totalAmount,
      type: "escrow_hold",
      description: "Escrow hold at delivery",
      counterparty: allocation.farmer,
      order: allocation.order,
      allocation: allocation._id,
    });
    const retailer = await (await import("../models/User.js")).default.findById(allocation.retailer);
    retailer.escrowHeld = Number(((retailer.escrowHeld || 0) + allocation.totalAmount).toFixed(2));
    await retailer.save();
    escrow = await Escrow.create({
      reference: makeRef(),
      order: allocation.order,
      allocation: allocation._id,
      retailer: allocation.retailer,
      farmer: allocation.farmer,
      amount: allocation.totalAmount,
      status: "held",
    });
    allocation.escrowRef = escrow.reference;
  }

  if (!escrow || escrow.status !== "held") return escrow;

  const User = (await import("../models/User.js")).default;
  const retailer = await User.findById(escrow.retailer);
  retailer.escrowHeld = Number(Math.max(0, (retailer.escrowHeld || 0) - escrow.amount).toFixed(2));
  await retailer.save();

  await changeWallet({
    userId: escrow.farmer,
    amount: escrow.amount,
    type: "escrow_release",
    description: note || `Released from AgriFlow escrow ${escrow.reference}`,
    counterparty: escrow.retailer,
    order: escrow.order,
    allocation: escrow.allocation,
  });

  escrow.status = "released";
  escrow.releasedAt = new Date();
  await escrow.save();

  allocation.escrowStatus = "released";
  allocation.paid = true;
  allocation.paidAt = new Date();
  allocation.escrowRef = escrow.reference;
  await allocation.save();
  return escrow;
};

export const refundEscrow = async ({ allocation, note }) => {
  const escrow = await Escrow.findOne({ allocation: allocation._id, status: "held" });
  if (!escrow) return null;

  const User = (await import("../models/User.js")).default;
  const retailer = await User.findById(escrow.retailer);
  retailer.escrowHeld = Number(Math.max(0, (retailer.escrowHeld || 0) - escrow.amount).toFixed(2));
  await retailer.save();

  await changeWallet({
    userId: escrow.retailer,
    amount: escrow.amount,
    type: "escrow_refund",
    description: note || `Refunded from AgriFlow escrow ${escrow.reference}`,
    counterparty: escrow.farmer,
    order: escrow.order,
    allocation: escrow.allocation,
  });

  escrow.status = "refunded";
  escrow.refundedAt = new Date();
  await escrow.save();

  allocation.escrowStatus = "refunded";
  await allocation.save();
  return escrow;
};

export const listEscrowsForUser = async (userId) =>
  Escrow.find({ $or: [{ retailer: userId }, { farmer: userId }] })
    .populate("retailer", "name storeName email")
    .populate("farmer", "name farmName email")
    .populate("order", "status invoiceNumber")
    .sort({ createdAt: -1 });
