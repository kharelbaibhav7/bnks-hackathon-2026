import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["farmer", "retailer", "driver"], required: true },
    address: { type: String, default: "" },
    area: { type: String, default: "" },
    city: { type: String, default: "Kathmandu" },
    lat: { type: Number, default: 27.7172 },
    lng: { type: Number, default: 85.324 },
    rating: { type: Number, default: 5 },
    ratingCount: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    escrowHeld: { type: Number, default: 0 },
    farmName: { type: String, default: "" },
    storeName: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    vehicleNumber: { type: String, default: "" },
    costPerTon: { type: Number, default: 0 },
    capacityTons: { type: Number, default: 2 },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
