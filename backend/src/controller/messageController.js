import asyncHandler from "express-async-handler";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const listThreads = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ from: req.user._id }, { to: req.user._id }],
  })
    .populate("from", "name role phone storeName farmName")
    .populate("to", "name role phone storeName farmName")
    .populate("order", "status")
    .sort({ createdAt: -1 });

  res.json({ success: true, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { to, body, order } = req.body;
  if (!to || !body) {
    res.status(400);
    throw new Error("Recipient and message are required");
  }

  const recipient = await User.findById(to);
  if (!recipient) {
    res.status(404);
    throw new Error("Recipient not found");
  }

  const message = await Message.create({
    from: req.user._id,
    to,
    body,
    order,
  });

  const populated = await Message.findById(message._id)
    .populate("from", "name role phone storeName farmName")
    .populate("to", "name role phone storeName farmName");

  const io = req.app.get("io");
  if (io) io.to(`user:${to}`).emit("message", populated);

  res.status(201).json({ success: true, message: populated });
});

export const contactsForOrder = asyncHandler(async (req, res) => {
  const users = await User.find({
    _id: { $in: req.body.userIds || [] },
  }).select("name role phone storeName farmName email area");
  res.json({ success: true, contacts: users });
});
