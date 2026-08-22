import asyncHandler from "express-async-handler";
import { analyzeRetailerStock } from "../service/scanService.js";

export const scanInventory = asyncHandler(async (req, res) => {
  const result = await analyzeRetailerStock(req.user._id, req.body.vision || {});
  res.json({ success: true, ...result });
});
