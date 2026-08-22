import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { secretKey } from "../constant/constant.js";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error("Please sign in to continue");
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Account not found");
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.message === "Account not found") throw error;
    res.status(401);
    throw new Error("Session expired. Please sign in again");
  }
});

export const restrictTo = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("You do not have access to this action");
    }
    next();
  };
