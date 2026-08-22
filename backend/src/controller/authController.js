import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { secretKey } from "../constant/constant.js";

const signToken = (id) => jwt.sign({ id }, secretKey, { expiresIn: "7d" });

const authPayload = (user) => ({
  success: true,
  token: signToken(user._id),
  user: user.toSafeJSON(),
});

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    address,
    area,
    city,
    lat,
    lng,
    farmName,
    storeName,
    vehicleType,
    vehicleNumber,
    costPerTon,
    capacityTons,
  } = req.body;

  if (!name || !email || !phone || !password || !role) {
    res.status(400);
    throw new Error("Name, email, phone, password and role are required");
  }

  if (!["farmer", "retailer", "driver"].includes(role)) {
    res.status(400);
    throw new Error("Role must be farmer, retailer or driver");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    phone,
    password: hashed,
    role,
    address: address || "",
    area: area || "",
    city: city || "Kathmandu",
    lat: lat ?? 27.7172,
    lng: lng ?? 85.324,
    farmName: farmName || "",
    storeName: storeName || "",
    vehicleType: vehicleType || "",
    vehicleNumber: vehicleNumber || "",
    costPerTon: Number(costPerTon || 0),
    capacityTons: Number(capacityTons || 2),
    walletBalance: role === "retailer" ? 0 : 0,
  });

  res.status(201).json(authPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    res.status(401);
    throw new Error("Incorrect email or password");
  }
  res.json(authPayload(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "phone",
    "address",
    "area",
    "city",
    "lat",
    "lng",
    "farmName",
    "storeName",
    "vehicleType",
    "vehicleNumber",
    "costPerTon",
    "capacityTons",
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  res.json({ success: true, user: req.user });
});
