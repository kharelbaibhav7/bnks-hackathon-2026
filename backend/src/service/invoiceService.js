import { KG_PER_TON } from "../constant/produce.js";
import Allocation from "../models/Allocation.js";
import Escrow from "../models/Escrow.js";
import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import TransportJob from "../models/TransportJob.js";
import User from "../models/User.js";

const snap = (user = {}) => ({
  name: user.name || "",
  storeName: user.storeName || "",
  farmName: user.farmName || "",
  email: user.email || "",
  phone: user.phone || "",
  address: user.address || "",
  area: user.area || "",
  city: user.city || "",
});

const asItems = (items = []) =>
  items.map((item) => ({
    name: item.name || "",
    displayName: item.displayName,
    unit: item.unit || "kg",
    quantity: item.quantity,
    pricePerUnit: item.pricePerUnit || 0,
    amount: item.amount,
  }));

export async function transportLinesForOrder(orderId) {
  const jobs = await TransportJob.find({ order: orderId }).populate("driver", "name vehicleNumber");
  return jobs.map((job) => {
    const tons = Number(((job.totalKg || 0) / KG_PER_TON).toFixed(3));
    const amount = Number(job.transportCost || tons * (job.costPerTon || 0));
    return {
      driverName: job.driver?.name || "Assigned driver",
      vehicleNumber: job.driver?.vehicleNumber || "",
      pickupArea: job.pickup?.area || "",
      deliveryArea: job.delivery?.area || "",
      totalKg: job.totalKg || 0,
      costPerTon: job.costPerTon || 0,
      amount: Number(amount.toFixed(2)),
    };
  }).filter((line) => line.totalKg > 0 || line.amount > 0);
}

const applyTransport = (invoice, produceTotal, lines) => {
  const transportTotal = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  invoice.produceTotal = produceTotal;
  invoice.transport = lines;
  invoice.transportTotal = transportTotal;
  invoice.total = Number((produceTotal + transportTotal).toFixed(2));
  return invoice;
};

export async function issueOrderInvoices(orderDoc) {
  if (!orderDoc) return [];
  const order = orderDoc.items ? orderDoc : await Order.findById(orderDoc);
  if (!order || order.status !== "delivered") return [];

  const existing = await Invoice.find({ order: order._id }).sort({ createdAt: 1 });
  if (existing.length) {
    const retailerInvoice = existing.find((item) => item.audience === "retailer");
    if (retailerInvoice && !(retailerInvoice.transport || []).length) {
      const produceTotal = retailerInvoice.produceTotal || retailerInvoice.items.reduce((sum, item) => sum + item.amount, 0);
      applyTransport(retailerInvoice, produceTotal, await transportLinesForOrder(order._id));
      await retailerInvoice.save();
    }
    if (!order.invoiceSent) {
      order.invoiceSent = true;
      order.invoiceSentAt = existing[0].issuedAt;
      order.invoiceNumber = existing.find((item) => item.audience === "retailer")?.number || existing[0].number;
      await order.save();
    }
    return existing;
  }

  const allocations = await Allocation.find({
    order: order._id,
    status: "delivered",
  })
    .populate("farmer")
    .populate("retailer");

  if (!allocations.length) return [];

  const retailer = allocations[0].retailer || (await User.findById(order.retailer));
  const invoiceNumber = order.invoiceNumber || `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const issuedAt = new Date();
  const firstEscrow = await Escrow.findOne({ order: order._id }).sort({ createdAt: 1 });
  const allItems = allocations.flatMap((allocation) => allocation.items);
  const produceTotal = allocations.reduce((sum, item) => sum + item.totalAmount, 0);
  const transport = await transportLinesForOrder(order._id);
  const transportTotal = transport.reduce((sum, line) => sum + line.amount, 0);

  const docs = [];
  docs.push(
    await Invoice.create({
      order: order._id,
      user: retailer._id,
      audience: "retailer",
      number: invoiceNumber,
      retailer: snap(retailer),
      farmer: {
        name: `${allocations.length} farm${allocations.length === 1 ? "" : "s"}`,
        farmName: allocations.map((item) => item.farmer?.farmName || item.farmer?.name).join(", "),
        email: allocations.map((item) => item.farmer?.email).filter(Boolean).join(", "),
        address: "Multiple pickups",
      },
      items: asItems(allItems),
      produceTotal,
      transport,
      transportTotal,
      total: Number((produceTotal + transportTotal).toFixed(2)),
      escrowRef: firstEscrow?.reference || allocations[0].escrowRef || "",
      escrowStatus: firstEscrow?.status || "released",
      issuedAt,
    })
  );

  for (const allocation of allocations) {
    const escrow = await Escrow.findOne({ allocation: allocation._id });
    docs.push(
      await Invoice.create({
        order: order._id,
        allocation: allocation._id,
        user: allocation.farmer._id,
        audience: "farmer",
        number: `${invoiceNumber}-${String(allocation._id).slice(-4).toUpperCase()}`,
        retailer: snap(retailer),
        farmer: snap(allocation.farmer),
        items: asItems(allocation.items),
        produceTotal: allocation.totalAmount,
        transport: [],
        transportTotal: 0,
        total: allocation.totalAmount,
        escrowRef: escrow?.reference || allocation.escrowRef || "",
        escrowStatus: escrow?.status || allocation.escrowStatus || "released",
        issuedAt,
      })
    );
  }

  order.invoiceSent = true;
  order.invoiceSentAt = issuedAt;
  order.invoiceNumber = invoiceNumber;
  await order.save();
  return docs;
}

export async function getMartStats(retailerId) {
  const retailer = await User.findById(retailerId).select("-password");
  if (!retailer) return null;

  const matchRetailer = retailer._id;
  const [ordersFulfilled, ordersOpen, loadsDelivered, inProgress, waitingOnFarmers, paid] = await Promise.all([
    Order.countDocuments({ retailer: matchRetailer, status: "delivered" }),
    Order.countDocuments({ retailer: matchRetailer, status: { $nin: ["delivered", "cancelled"] } }),
    Allocation.countDocuments({ retailer: matchRetailer, status: "delivered" }),
    Allocation.countDocuments({
      retailer: matchRetailer,
      status: { $in: ["accepted", "handed_over", "in_transit"] },
    }),
    Allocation.countDocuments({ retailer: matchRetailer, status: "requested" }),
    Allocation.aggregate([
      { $match: { retailer: matchRetailer, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, farms: { $addToSet: "$farmer" } } },
    ]),
  ]);

  return {
    retailerId: String(retailer._id),
    storeName: retailer.storeName || retailer.name,
    area: retailer.area,
    city: retailer.city,
    phone: retailer.phone,
    rating: retailer.rating,
    ordersFulfilled,
    ordersOpen,
    loadsDelivered,
    inProgress,
    waitingOnFarmers,
    paidOut: paid[0]?.total || 0,
    farmsServed: paid[0]?.farms?.length || 0,
  };
}

export async function attachMartStats(allocations = []) {
  const ids = [...new Set(allocations.map((item) => String(item.retailer?._id || item.retailer)).filter(Boolean))];
  const entries = await Promise.all(ids.map(async (id) => [id, await getMartStats(id)]));
  const map = Object.fromEntries(entries);
  return allocations.map((item) => {
    const json = item.toObject ? item.toObject() : item;
    json.martStats = map[String(json.retailer?._id || json.retailer)] || null;
    return json;
  });
}
