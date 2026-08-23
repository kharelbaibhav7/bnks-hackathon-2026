import { Router } from "express";
import asyncHandler from "express-async-handler";
import { login, me, register, updateProfile } from "../controller/authController.js";
import {
  adjustInventory,
  listCatalog,
  listInventory,
  lowStock,
  removeInventory,
  upsertInventory,
} from "../controller/inventoryController.js";
import { contactsForOrder, listThreads, sendMessage } from "../controller/messageController.js";
import {
  createOrder,
  dashboardStats,
  farmerHistory,
  getOrder,
  listFarmerRequests,
  listRetailerOrders,
  getInvoice,
  listInvoices,
  rateDelivery,
  resendInvoice,
  respondAllocation,
  retailerHistory,
} from "../controller/orderController.js";
import { scanInventory } from "../controller/scanController.js";
import { trackOrder } from "../controller/trackingController.js";
import {
  acceptJobs,
  getJob,
  listMyJobs,
  listOpenJobs,
  nearbySuggestions,
  updateJobStatus,
  updateLocation,
} from "../controller/transportController.js";
import { getWallet, topUp } from "../controller/walletController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { seedDatabase } from "../seed.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, service: "agriflow" });
});

router.post(
  "/seed",
  asyncHandler(async (req, res) => {
    const result = await seedDatabase();
    res.json({ success: true, message: "Accounts loaded", ...result });
  })
);

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", protect, me);
router.patch("/auth/me", protect, updateProfile);

router.get("/catalog", protect, listCatalog);
router.get("/inventory", protect, restrictTo("farmer", "retailer"), listInventory);
router.post("/inventory", protect, restrictTo("farmer", "retailer"), upsertInventory);
router.patch("/inventory/:id", protect, restrictTo("farmer", "retailer"), adjustInventory);
router.delete("/inventory/:id", protect, restrictTo("farmer", "retailer"), removeInventory);
router.get("/inventory/low", protect, restrictTo("retailer"), lowStock);
router.post("/scan", protect, restrictTo("retailer"), scanInventory);

router.get("/stats", protect, dashboardStats);
router.post("/orders", protect, restrictTo("retailer"), createOrder);
router.get("/orders", protect, restrictTo("retailer"), listRetailerOrders);
router.get("/orders/:id", protect, getOrder);
router.get("/farmer/requests", protect, restrictTo("farmer"), listFarmerRequests);
router.post("/allocations/:id/respond", protect, restrictTo("farmer"), respondAllocation);
router.get("/history/retailer", protect, restrictTo("retailer"), retailerHistory);
router.get("/history/farmer", protect, restrictTo("farmer"), farmerHistory);
router.post("/ratings", protect, restrictTo("retailer"), rateDelivery);
router.post("/orders/:id/invoice", protect, resendInvoice);
router.get("/invoices", protect, restrictTo("retailer", "farmer"), listInvoices);
router.get("/invoices/:id", protect, restrictTo("retailer", "farmer"), getInvoice);

router.get("/transport/open", protect, restrictTo("driver"), listOpenJobs);
router.get("/transport/mine", protect, restrictTo("driver"), listMyJobs);
router.get("/transport/:id", protect, getJob);
router.post("/transport/accept", protect, restrictTo("driver"), acceptJobs);
router.post("/transport/:id/status", protect, restrictTo("driver"), updateJobStatus);
router.post("/transport/:id/location", protect, restrictTo("driver"), updateLocation);
router.get("/transport/:id/nearby", protect, restrictTo("driver"), nearbySuggestions);

router.get("/track/:orderId", protect, trackOrder);

router.get("/wallet", protect, getWallet);
router.post("/wallet/topup", protect, restrictTo("retailer"), topUp);

router.get("/messages", protect, listThreads);
router.post("/messages", protect, sendMessage);
router.post("/contacts", protect, contactsForOrder);

export default router;
