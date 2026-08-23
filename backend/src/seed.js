import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { dbUrl } from "./constant/constant.js";
import Allocation from "./models/Allocation.js";
import Escrow from "./models/Escrow.js";
import InventoryItem from "./models/InventoryItem.js";
import Invoice from "./models/Invoice.js";
import Message from "./models/Message.js";
import Order from "./models/Order.js";
import SaleRecord from "./models/SaleRecord.js";
import Transaction from "./models/Transaction.js";
import TransportJob from "./models/TransportJob.js";
import User from "./models/User.js";

const hash = (value) => bcrypt.hash(value, 10);

export const seedDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    InventoryItem.deleteMany({}),
    Order.deleteMany({}),
    Allocation.deleteMany({}),
    TransportJob.deleteMany({}),
    Transaction.deleteMany({}),
    Message.deleteMany({}),
    SaleRecord.deleteMany({}),
    Escrow.deleteMany({}),
    Invoice.deleteMany({}),
  ]);

  const password = await hash("agriflow123");

  const [retailer, farmer1, farmer2, farmer3, driver1, driver2] = await User.create([
    {
      name: "Anita Shrestha",
      email: "mart@agriflow.com",
      phone: "9801112233",
      password,
      role: "retailer",
      storeName: "Green Valley Mart",
      address: "New Baneshwor, Kathmandu",
      area: "Baneshwor",
      city: "Kathmandu",
      lat: 27.694,
      lng: 85.342,
      walletBalance: 150000,
    },
    {
      name: "Ram Bahadur Magar",
      email: "ram@agriflow.com",
      phone: "9802223344",
      password,
      role: "farmer",
      farmName: "Magar Family Farm",
      address: "Suryabinayak",
      area: "Bhaktapur",
      city: "Bhaktapur",
      lat: 27.671,
      lng: 85.429,
      rating: 4.8,
      ratingCount: 24,
      walletBalance: 8200,
    },
    {
      name: "Sita Devi Karki",
      email: "sita@agriflow.com",
      phone: "9803334455",
      password,
      role: "farmer",
      farmName: "Karki Grain Fields",
      address: "Godawari",
      area: "Lalitpur",
      city: "Lalitpur",
      lat: 27.595,
      lng: 85.349,
      rating: 4.6,
      ratingCount: 18,
      walletBalance: 5400,
    },
    {
      name: "Hari Sharma",
      email: "hari@agriflow.com",
      phone: "9804445566",
      password,
      role: "farmer",
      farmName: "Sharma Orchard",
      address: "Dhulikhel",
      area: "Kavre",
      city: "Kavre",
      lat: 27.622,
      lng: 85.55,
      rating: 4.9,
      ratingCount: 31,
      walletBalance: 12100,
    },
    {
      name: "Bikash Tamang",
      email: "bikash@agriflow.com",
      phone: "9805556677",
      password,
      role: "driver",
      vehicleType: "Pickup truck",
      vehicleNumber: "Ba 12 Pa 4490",
      costPerTon: 1500,
      capacityTons: 3,
      address: "Koteshwor",
      area: "Kathmandu",
      city: "Kathmandu",
      lat: 27.678,
      lng: 85.349,
      rating: 4.7,
      ratingCount: 40,
    },
    {
      name: "Prakash Rai",
      email: "prakash@agriflow.com",
      phone: "9806667788",
      password,
      role: "driver",
      vehicleType: "Mini truck",
      vehicleNumber: "Ba 8 Pa 2104",
      costPerTon: 1400,
      capacityTons: 2.5,
      address: "Imadol",
      area: "Lalitpur",
      city: "Lalitpur",
      lat: 27.658,
      lng: 85.348,
      rating: 4.5,
      ratingCount: 22,
    },
  ]);

  await InventoryItem.insertMany([
    { owner: retailer._id, ownerRole: "retailer", name: "tomato", displayName: "Tomato", category: "vegetable", quantity: 0, unit: "kg", minStock: 20 },
    { owner: retailer._id, ownerRole: "retailer", name: "potato", displayName: "Potato", category: "vegetable", quantity: 8, unit: "kg", minStock: 30 },
    { owner: retailer._id, ownerRole: "retailer", name: "onion", displayName: "Onion", category: "vegetable", quantity: 4, unit: "kg", minStock: 20 },
    { owner: retailer._id, ownerRole: "retailer", name: "wheat", displayName: "Wheat", category: "grain", quantity: 0, unit: "kg", minStock: 25 },
    { owner: retailer._id, ownerRole: "retailer", name: "apple", displayName: "Apple", category: "fruit", quantity: 6, unit: "kg", minStock: 15 },
    { owner: retailer._id, ownerRole: "retailer", name: "banana", displayName: "Banana", category: "fruit", quantity: 40, unit: "kg", minStock: 15 },
    { owner: farmer1._id, ownerRole: "farmer", name: "tomato", displayName: "Tomato", category: "vegetable", quantity: 180, unit: "kg", pricePerUnit: 55 },
    { owner: farmer1._id, ownerRole: "farmer", name: "potato", displayName: "Potato", category: "vegetable", quantity: 260, unit: "kg", pricePerUnit: 40 },
    { owner: farmer1._id, ownerRole: "farmer", name: "onion", displayName: "Onion", category: "vegetable", quantity: 90, unit: "kg", pricePerUnit: 48 },
    { owner: farmer2._id, ownerRole: "farmer", name: "wheat", displayName: "Wheat", category: "grain", quantity: 400, unit: "kg", pricePerUnit: 62 },
    { owner: farmer2._id, ownerRole: "farmer", name: "rice", displayName: "Rice", category: "grain", quantity: 350, unit: "kg", pricePerUnit: 70 },
    { owner: farmer2._id, ownerRole: "farmer", name: "potato", displayName: "Potato", category: "vegetable", quantity: 140, unit: "kg", pricePerUnit: 38 },
    { owner: farmer3._id, ownerRole: "farmer", name: "tomato", displayName: "Tomato", category: "vegetable", quantity: 70, unit: "kg", pricePerUnit: 58 },
    { owner: farmer3._id, ownerRole: "farmer", name: "apple", displayName: "Apple", category: "fruit", quantity: 120, unit: "kg", pricePerUnit: 140 },
    { owner: farmer3._id, ownerRole: "farmer", name: "banana", displayName: "Banana", category: "fruit", quantity: 95, unit: "kg", pricePerUnit: 80 },
  ]);

  return {
    accounts: [
      { role: "retailer", email: "mart@agriflow.com", name: "Green Valley Mart" },
      { role: "farmer", email: "ram@agriflow.com", name: "Ram Bahadur Magar" },
      { role: "farmer", email: "sita@agriflow.com", name: "Sita Devi Karki" },
      { role: "farmer", email: "hari@agriflow.com", name: "Hari Sharma" },
      { role: "driver", email: "bikash@agriflow.com", name: "Bikash Tamang" },
      { role: "driver", email: "prakash@agriflow.com", name: "Prakash Rai" },
    ],
    password: "agriflow123",
  };
};

if (process.argv[1] && process.argv[1].includes("seed.js")) {
  await mongoose.connect(dbUrl);
  const result = await seedDatabase();
  console.log("AgriFlow accounts ready");
  console.log(result);
  await mongoose.disconnect();
  process.exit(0);
}
