import mongoose from "mongoose";

const placeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    phone: String,
    address: String,
    area: String,
    city: String,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const trackingPointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    status: String,
    note: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const transportJobSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    allocation: { type: mongoose.Schema.Types.ObjectId, ref: "Allocation", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    pickup: placeSchema,
    delivery: placeSchema,
    goods: [
      {
        name: String,
        displayName: String,
        quantity: Number,
        unit: { type: String, default: "kg" },
        weightTons: Number,
      },
    ],
    totalKg: { type: Number, default: 0 },
    costPerTon: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "accepted", "en_route_pickup", "picked_up", "en_route_delivery", "delivered"],
      default: "open",
    },
    currentLocation: {
      lat: { type: Number, default: 27.7172 },
      lng: { type: Number, default: 85.324 },
      updatedAt: { type: Date, default: Date.now },
    },
    scheduledDate: { type: Date, default: Date.now },
    trackingHistory: [trackingPointSchema],
  },
  { timestamps: true }
);

const TransportJob = mongoose.model("TransportJob", transportJobSchema);
export default TransportJob;
