import asyncHandler from "express-async-handler";
import Allocation from "../models/Allocation.js";
import InventoryItem from "../models/InventoryItem.js";
import Order from "../models/Order.js";
import SaleRecord from "../models/SaleRecord.js";
import TransportJob from "../models/TransportJob.js";
import User from "../models/User.js";
import { findProduce } from "../constant/produce.js";
import {
  applyDriverRating,
  applyFarmerRating,
  createTransportJobForAllocation,
  refreshOrderTotals,
  sourceOrderFromFarmers,
} from "../service/matchingService.js";
import { payFarmerOnHandover } from "../service/walletService.js";

const populateOrder = (id) =>
  Order.findById(id).populate("retailer", "-password");

export const createOrder = asyncHandler(async (req, res) => {
  const items = (req.body.items || [])
    .filter((item) => item.name && Number(item.quantity) > 0)
    .map((item) => {
      const produce = findProduce(item.name);
      return {
        name: produce.name,
        displayName: produce.displayName,
        unit: item.unit || produce.unit,
        quantityRequested: Number(item.quantity),
        quantityAllocated: 0,
        quantityAccepted: 0,
      };
    });

  if (!items.length) {
    res.status(400);
    throw new Error("Add at least one produce item to order");
  }

  const order = await Order.create({
    retailer: req.user._id,
    items,
    notes: req.body.notes || "",
    source: req.body.source === "scan" ? "scan" : "manual",
    status: "sourcing",
  });

  const allocations = await sourceOrderFromFarmers(order);
  if (!allocations.length) {
    order.status = "sourcing";
    await order.save();
  }

  const fresh = await populateOrder(order._id);
  res.status(201).json({
    success: true,
    order: fresh,
    allocations,
    message: allocations.length
      ? `Request sent to ${allocations.length} farmer${allocations.length === 1 ? "" : "s"}`
      : "No farmer currently has the requested produce. Try again after farmers update stock.",
  });
});

export const listRetailerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ retailer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const listFarmerRequests = asyncHandler(async (req, res) => {
  const allocations = await Allocation.find({ farmer: req.user._id })
    .populate("retailer", "-password")
    .populate("order")
    .populate("transportJob")
    .sort({ createdAt: -1 });
  res.json({ success: true, allocations });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await populateOrder(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner =
    String(order.retailer._id) === String(req.user._id) || req.user.role === "driver";
  const allocations = await Allocation.find({ order: order._id })
    .populate("farmer", "-password")
    .populate("retailer", "-password")
    .populate("transportJob");

  if (!isOwner && !allocations.some((item) => String(item.farmer._id) === String(req.user._id))) {
    res.status(403);
    throw new Error("You cannot view this order");
  }

  const jobs = await TransportJob.find({ order: order._id }).populate("driver", "-password");
  res.json({ success: true, order, allocations, jobs });
});

export const respondAllocation = asyncHandler(async (req, res) => {
  const allocation = await Allocation.findById(req.params.id);
  if (!allocation || String(allocation.farmer) !== String(req.user._id)) {
    res.status(404);
    throw new Error("Request not found");
  }
  if (allocation.status !== "requested") {
    res.status(400);
    throw new Error("This request was already answered");
  }

  const accept = req.body.action === "accept";
  const order = await Order.findById(allocation.order);

  if (accept) {
    for (const item of allocation.items) {
      const stock = await InventoryItem.findOne({
        owner: req.user._id,
        name: item.name,
      });
      if (!stock || stock.quantity < item.quantity) {
        res.status(400);
        throw new Error(`Not enough ${item.displayName} left in your inventory`);
      }
      stock.quantity = Number((stock.quantity - item.quantity).toFixed(2));
      await stock.save();
    }
    allocation.status = "accepted";
    await allocation.save();
    await createTransportJobForAllocation(allocation);
  } else {
    allocation.status = "rejected";
    allocation.rejectReason = req.body.reason || "Farmer declined the request";
    await allocation.save();
    await refreshOrderTotals(order);
    await sourceOrderFromFarmers(order, { excludeFarmerIds: [req.user._id] });
  }

  await refreshOrderTotals(order);
  const fresh = await Allocation.findById(allocation._id)
    .populate("retailer", "-password")
    .populate("order")
    .populate("transportJob");

  res.json({ success: true, allocation: fresh, order });
});

export const retailerHistory = asyncHandler(async (req, res) => {
  const orders = await Order.find({ retailer: req.user._id }).sort({ createdAt: -1 });
  const allocations = await Allocation.find({ retailer: req.user._id })
    .populate("farmer", "-password")
    .populate("order")
    .sort({ createdAt: -1 });
  res.json({ success: true, orders, allocations });
});

export const farmerHistory = asyncHandler(async (req, res) => {
  const allocations = await Allocation.find({ farmer: req.user._id })
    .populate("retailer", "-password")
    .populate("order")
    .sort({ createdAt: -1 });
  const sales = await SaleRecord.find({ farmer: req.user._id })
    .populate("retailer", "name storeName")
    .sort({ createdAt: -1 });
  res.json({ success: true, allocations, sales });
});

export const rateDelivery = asyncHandler(async (req, res) => {
  const { farmerStars, driverStars, allocationId } = req.body;
  const allocation = await Allocation.findById(allocationId).populate("transportJob");
  if (!allocation || String(allocation.retailer) !== String(req.user._id)) {
    res.status(404);
    throw new Error("Delivery not found");
  }
  if (allocation.status !== "delivered") {
    res.status(400);
    throw new Error("You can rate only after delivery");
  }
  if (farmerStars) await applyFarmerRating(allocation.farmer, Number(farmerStars));
  if (driverStars && allocation.transportJob?.driver) {
    await applyDriverRating(allocation.transportJob.driver, Number(driverStars));
  }
  res.json({ success: true, message: "Ratings saved" });
});

export const dashboardStats = asyncHandler(async (req, res) => {
  if (req.user.role === "retailer") {
    const [orders, pending, inTransit, inventory] = await Promise.all([
      Order.countDocuments({ retailer: req.user._id }),
      Allocation.countDocuments({ retailer: req.user._id, status: "requested" }),
      Allocation.countDocuments({
        retailer: req.user._id,
        status: { $in: ["handed_over", "in_transit"] },
      }),
      InventoryItem.find({ owner: req.user._id }),
    ]);
    const empty = inventory.filter((item) => item.quantity <= item.minStock).length;
    return res.json({
      success: true,
      stats: {
        orders,
        pending,
        inTransit,
        empty,
        wallet: req.user.walletBalance,
      },
    });
  }

  if (req.user.role === "farmer") {
    const [requests, accepted, sales, inventory] = await Promise.all([
      Allocation.countDocuments({ farmer: req.user._id, status: "requested" }),
      Allocation.countDocuments({
        farmer: req.user._id,
        status: { $in: ["accepted", "handed_over", "in_transit"] },
      }),
      SaleRecord.find({ farmer: req.user._id }),
      InventoryItem.find({ owner: req.user._id }),
    ]);
    const soldAmount = sales.reduce((sum, item) => sum + item.amount, 0);
    return res.json({
      success: true,
      stats: {
        requests,
        accepted,
        soldAmount,
        listedItems: inventory.length,
        wallet: req.user.walletBalance,
        rating: req.user.rating,
      },
    });
  }

  const [open, mine, delivered] = await Promise.all([
    TransportJob.countDocuments({ status: "open" }),
    TransportJob.countDocuments({
      driver: req.user._id,
      status: { $nin: ["delivered"] },
    }),
    TransportJob.countDocuments({ driver: req.user._id, status: "delivered" }),
  ]);

  res.json({
    success: true,
    stats: {
      open,
      mine,
      delivered,
      rating: req.user.rating,
      costPerTon: req.user.costPerTon,
    },
  });
});

export const completeHandoverPayment = asyncHandler(async ({ allocation, job, note }) => {
  if (allocation.paid) return allocation;
  await payFarmerOnHandover({
    retailerId: allocation.retailer,
    farmerId: allocation.farmer,
    amount: allocation.totalAmount,
    order: allocation.order,
    allocation: allocation._id,
    note,
  });
  allocation.paid = true;
  allocation.paidAt = new Date();
  allocation.status = "handed_over";
  await allocation.save();

  for (const item of allocation.items) {
    await SaleRecord.create({
      farmer: allocation.farmer,
      retailer: allocation.retailer,
      order: allocation.order,
      allocation: allocation._id,
      itemName: item.name,
      displayName: item.displayName,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      amount: item.amount,
    });
  }

  const io = job?.reqApp?.get?.("io");
  if (io) {
    io.to(`order:${allocation.order}`).emit("payment", {
      allocationId: allocation._id,
      amount: allocation.totalAmount,
    });
  }
  return allocation;
});

export { User };
