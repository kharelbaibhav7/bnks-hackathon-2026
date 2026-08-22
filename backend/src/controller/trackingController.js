import asyncHandler from "express-async-handler";
import Allocation from "../models/Allocation.js";
import TransportJob from "../models/TransportJob.js";

export const trackOrder = asyncHandler(async (req, res) => {
  const jobs = await TransportJob.find({ order: req.params.orderId })
    .populate("driver", "name phone vehicleType vehicleNumber rating costPerTon")
    .populate("allocation")
    .sort({ createdAt: 1 });

  const allocations = await Allocation.find({ order: req.params.orderId })
    .populate("farmer", "name phone farmName area rating")
    .populate("retailer", "name phone storeName area");

  res.json({ success: true, jobs, allocations });
});
