import Allocation from "../models/Allocation.js";
import InventoryItem from "../models/InventoryItem.js";
import TransportJob from "../models/TransportJob.js";
import User from "../models/User.js";
import { KG_PER_TON } from "../constant/produce.js";

const populateAllocation = (query) =>
  query.populate("farmer", "-password").populate("retailer", "-password").populate("order");

export const refreshOrderTotals = async (order) => {
  const allocations = await Allocation.find({
    order: order._id,
    status: { $nin: ["rejected"] },
  });

  const accepted = allocations.filter((item) =>
    ["accepted", "handed_over", "in_transit", "delivered"].includes(item.status)
  );

  order.items = order.items.map((item) => {
    const allocated = allocations.reduce((sum, allocation) => {
      const match = allocation.items.find((entry) => entry.name === item.name);
      return sum + (match?.quantity || 0);
    }, 0);
    const acceptedQty = accepted.reduce((sum, allocation) => {
      const match = allocation.items.find((entry) => entry.name === item.name);
      return sum + (match?.quantity || 0);
    }, 0);
    item.quantityAllocated = allocated;
    item.quantityAccepted = acceptedQty;
    return item;
  });

  order.estimatedTotal = allocations.reduce((sum, item) => sum + item.totalAmount, 0);
  order.paidTotal = allocations
    .filter((item) => item.paid)
    .reduce((sum, item) => sum + item.totalAmount, 0);

  const pending = allocations.some((item) => item.status === "requested");
  const hasAccepted = accepted.length > 0;
  const allDelivered =
    allocations.length > 0 &&
    allocations.every((item) => item.status === "delivered");
  const anyTransit = allocations.some((item) =>
    ["handed_over", "in_transit"].includes(item.status)
  );

  if (allDelivered) order.status = "delivered";
  else if (anyTransit) order.status = "in_transit";
  else if (hasAccepted && pending) order.status = "partially_accepted";
  else if (hasAccepted && !pending) order.status = "ready_for_transport";
  else if (pending) order.status = "awaiting_farmers";
  else order.status = "sourcing";

  await order.save();
  return order;
};

const groupByFarmer = (rows) => {
  const map = new Map();
  for (const row of rows) {
    const key = String(row.farmerId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
};

export const sourceOrderFromFarmers = async (order, { excludeFarmerIds = [] } = {}) => {
  const retailer = await User.findById(order.retailer);
  const planned = [];

  for (const item of order.items) {
    const stillNeeded = Math.max(0, item.quantityRequested - item.quantityAllocated);
    if (stillNeeded <= 0) continue;

    const stocks = await InventoryItem.find({
      ownerRole: "farmer",
      name: item.name,
      quantity: { $gt: 0 },
      owner: { $nin: excludeFarmerIds },
    }).populate("owner");

    stocks.sort((a, b) => {
      const areaScore = (farmer) => (farmer.owner.area === retailer.area ? 0 : 1);
      const areaDiff = areaScore(a) - areaScore(b);
      if (areaDiff !== 0) return areaDiff;
      const ratingDiff = (b.owner.rating || 0) - (a.owner.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (a.pricePerUnit || 0) - (b.pricePerUnit || 0);
    });

    let remaining = stillNeeded;
    for (const stock of stocks) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, stock.quantity);
      planned.push({
        farmerId: stock.owner._id,
        name: item.name,
        displayName: item.displayName,
        unit: item.unit,
        quantity: take,
        pricePerUnit: stock.pricePerUnit,
        amount: Number((take * stock.pricePerUnit).toFixed(2)),
      });
      remaining -= take;
    }
  }

  const created = [];
  for (const [farmerId, items] of groupByFarmer(planned)) {
    const totalAmount = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    const allocation = await Allocation.create({
      order: order._id,
      farmer: farmerId,
      retailer: order.retailer,
      items,
      totalAmount,
      status: "requested",
    });
    created.push(allocation);
  }

  await refreshOrderTotals(order);
  return populateAllocation(Allocation.find({ _id: { $in: created.map((item) => item._id) } }));
};

export const createTransportJobForAllocation = async (allocation) => {
  const existing = await TransportJob.findOne({
    allocation: allocation._id,
    status: { $ne: "delivered" },
  });
  if (existing) return existing;

  const farmer = await User.findById(allocation.farmer);
  const retailer = await User.findById(allocation.retailer);
  const goods = allocation.items.map((item) => ({
    name: item.name,
    displayName: item.displayName,
    quantity: item.quantity,
    unit: item.unit,
    weightTons: Number((item.quantity / KG_PER_TON).toFixed(3)),
  }));
  const totalKg = allocation.items.reduce((sum, item) => sum + item.quantity, 0);

  const job = await TransportJob.create({
    allocation: allocation._id,
    order: allocation.order,
    pickup: {
      user: farmer._id,
      name: farmer.farmName || farmer.name,
      phone: farmer.phone,
      address: farmer.address,
      area: farmer.area,
      city: farmer.city,
      lat: farmer.lat,
      lng: farmer.lng,
    },
    delivery: {
      user: retailer._id,
      name: retailer.storeName || retailer.name,
      phone: retailer.phone,
      address: retailer.address,
      area: retailer.area,
      city: retailer.city,
      lat: retailer.lat,
      lng: retailer.lng,
    },
    goods,
    totalKg,
    currentLocation: { lat: farmer.lat, lng: farmer.lng, updatedAt: new Date() },
    trackingHistory: [
      {
        lat: farmer.lat,
        lng: farmer.lng,
        status: "open",
        note: "Waiting for a driver near the pickup area",
      },
    ],
  });

  allocation.transportJob = job._id;
  await allocation.save();
  return job;
};

export const applyFarmerRating = async (farmerId, stars) => {
  const farmer = await User.findById(farmerId);
  if (!farmer) return null;
  const nextCount = farmer.ratingCount + 1;
  farmer.rating = Number(((farmer.rating * farmer.ratingCount + stars) / nextCount).toFixed(2));
  farmer.ratingCount = nextCount;
  await farmer.save();
  return farmer;
};

export const applyDriverRating = async (driverId, stars) => {
  const driver = await User.findById(driverId);
  if (!driver) return null;
  const nextCount = driver.ratingCount + 1;
  driver.rating = Number(((driver.rating * driver.ratingCount + stars) / nextCount).toFixed(2));
  driver.ratingCount = nextCount;
  await driver.save();
  return driver;
};
