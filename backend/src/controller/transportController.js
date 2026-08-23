import asyncHandler from "express-async-handler";
import Allocation from "../models/Allocation.js";
import InventoryItem from "../models/InventoryItem.js";
import Order from "../models/Order.js";
import SaleRecord from "../models/SaleRecord.js";
import TransportJob from "../models/TransportJob.js";
import { KG_PER_TON } from "../constant/produce.js";
import { refreshOrderTotals } from "../service/matchingService.js";
import { releaseEscrow } from "../service/escrowService.js";
import { issueOrderInvoices } from "../service/invoiceService.js";

const populateJob = (id) =>
  TransportJob.findById(id)
    .populate("driver", "-password")
    .populate("allocation")
    .populate("order");

const emitTracking = (req, job) => {
  const io = req.app.get("io");
  if (!io) return;
  const payload = {
    jobId: job._id,
    orderId: job.order,
    status: job.status,
    currentLocation: job.currentLocation,
    trackingHistory: job.trackingHistory,
    pickup: job.pickup,
    delivery: job.delivery,
  };
  io.to(`order:${job.order}`).emit("tracking", payload);
  if (job.pickup?.user) io.to(`user:${job.pickup.user}`).emit("tracking", payload);
  if (job.delivery?.user) io.to(`user:${job.delivery.user}`).emit("tracking", payload);
};

const addHistory = (job, status, note) => {
  job.trackingHistory.push({
    lat: job.currentLocation.lat,
    lng: job.currentLocation.lng,
    status,
    note,
    at: new Date(),
  });
};

export const listOpenJobs = asyncHandler(async (req, res) => {
  const { area, date } = req.query;
  const filter = { status: "open" };
  if (area) filter["pickup.area"] = new RegExp(area, "i");
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.scheduledDate = { $gte: start, $lte: end };
  }

  const jobs = await TransportJob.find(filter)
    .populate("allocation")
    .populate("order")
    .sort({ createdAt: -1 });

  const bundles = {};
  for (const job of jobs) {
    const key = `${job.pickup?.area || "Unknown"} → ${job.delivery?.area || "Unknown"}`;
    if (!bundles[key]) {
      bundles[key] = {
        key,
        pickupArea: job.pickup?.area,
        deliveryArea: job.delivery?.area,
        jobIds: [],
        totalKg: 0,
        jobs: [],
      };
    }
    bundles[key].jobIds.push(job._id);
    bundles[key].totalKg += job.totalKg;
    bundles[key].jobs.push(job);
  }

  res.json({
    success: true,
    jobs,
    bundles: Object.values(bundles).sort((a, b) => b.jobs.length - a.jobs.length),
  });
});

export const listMyJobs = asyncHandler(async (req, res) => {
  const jobs = await TransportJob.find({ driver: req.user._id })
    .populate("allocation")
    .populate("order")
    .sort({ updatedAt: -1 });
  res.json({ success: true, jobs });
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await populateJob(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Delivery job not found");
  }
  res.json({ success: true, job });
});

export const acceptJobs = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.jobIds) ? req.body.jobIds : [req.body.jobId].filter(Boolean);
  if (!ids.length) {
    res.status(400);
    throw new Error("Select at least one delivery to accept");
  }

  const accepted = [];
  for (const id of ids) {
    const job = await TransportJob.findById(id);
    if (!job || job.status !== "open") continue;

    const extraKg = accepted.reduce((sum, item) => sum + item.totalKg, 0) + job.totalKg;
    const capacityKg = (req.user.capacityTons || 2) * KG_PER_TON;
    if (extraKg > capacityKg) {
      res.status(400);
      throw new Error(
        `These loads exceed your ${req.user.capacityTons} ton vehicle capacity`
      );
    }

    job.driver = req.user._id;
    job.status = "accepted";
    job.costPerTon = req.user.costPerTon || 0;
    job.transportCost = Number(((job.totalKg / KG_PER_TON) * job.costPerTon).toFixed(2));
    job.currentLocation = {
      lat: req.user.lat,
      lng: req.user.lng,
      updatedAt: new Date(),
    };
    addHistory(job, "accepted", `${req.user.name} accepted this pickup`);
    await job.save();
    emitTracking(req, job);
    accepted.push(job);
  }

  res.json({
    success: true,
    jobs: accepted,
    message: `Accepted ${accepted.length} pickup${accepted.length === 1 ? "" : "s"}`,
  });
});

export const updateJobStatus = asyncHandler(async (req, res) => {
  const job = await TransportJob.findById(req.params.id);
  if (!job || String(job.driver) !== String(req.user._id)) {
    res.status(404);
    throw new Error("This job is not assigned to you");
  }

  const next = req.body.status;
  const allowed = ["en_route_pickup", "picked_up", "en_route_delivery", "delivered"];
  if (!allowed.includes(next)) {
    res.status(400);
    throw new Error("Invalid delivery status");
  }

  if (req.body.lat !== undefined && req.body.lng !== undefined) {
    job.currentLocation = {
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      updatedAt: new Date(),
    };
  }

  if (next === "picked_up") {
    const allocation = await Allocation.findById(job.allocation);
    if (allocation) {
      allocation.status = "handed_over";
      await allocation.save();
    }
    addHistory(job, "picked_up", req.body.note || "Goods collected. Funds remain in AgriFlow escrow until delivery.");
  } else if (next === "delivered") {
    const allocation = await Allocation.findById(job.allocation);
    if (allocation) {
      if (allocation.escrowStatus !== "released") {
        await releaseEscrow({
          allocation,
          note: `Escrow released when ${req.user.name} delivered goods to the mart`,
        });
      }
      allocation.status = "delivered";
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
      for (const item of allocation.items) {
        await InventoryItem.findOneAndUpdate(
          { owner: allocation.retailer, name: item.name },
          {
            $inc: { quantity: item.quantity },
            $setOnInsert: {
              owner: allocation.retailer,
              ownerRole: "retailer",
              name: item.name,
              displayName: item.displayName,
              unit: item.unit,
              minStock: 10,
            },
          },
          { upsert: true }
        );
      }
    }
    addHistory(job, "delivered", req.body.note || "Goods delivered. Escrow released to the farmer.");
  } else {
    addHistory(job, next, req.body.note || `Status updated to ${next.replace(/_/g, " ")}`);
    if (next === "en_route_delivery") {
      const allocation = await Allocation.findById(job.allocation);
      if (allocation) {
        allocation.status = "in_transit";
        await allocation.save();
      }
    }
  }

  job.status = next;
  await job.save();

  const order = await Order.findById(job.order);
  if (order) {
    await refreshOrderTotals(order);
    if (order.status === "delivered") {
      await issueOrderInvoices(order);
    }
  }

  emitTracking(req, job);
  const fresh = await populateJob(job._id);
  res.json({ success: true, job: fresh });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const job = await TransportJob.findById(req.params.id);
  if (!job || String(job.driver) !== String(req.user._id)) {
    res.status(404);
    throw new Error("This job is not assigned to you");
  }

  job.currentLocation = {
    lat: Number(req.body.lat),
    lng: Number(req.body.lng),
    updatedAt: new Date(),
  };
  addHistory(job, job.status, req.body.note || "Live location updated");
  await job.save();
  emitTracking(req, job);
  res.json({ success: true, job });
});

export const nearbySuggestions = asyncHandler(async (req, res) => {
  const job = await TransportJob.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const others = await TransportJob.find({
    _id: { $ne: job._id },
    status: "open",
    "pickup.area": job.pickup.area,
    "delivery.area": job.delivery.area,
  }).populate("allocation");

  res.json({ success: true, jobs: others });
});
