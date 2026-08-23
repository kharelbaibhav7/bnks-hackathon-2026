import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import Brand from "../components/Brand.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { roleHome } from "../utils/format.js";

const AREAS = ["Baneshwor", "Bhaktapur", "Lalitpur", "Kavre", "Kathmandu"];

export default function Register() {
  const { persist } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "retailer",
    address: "",
    area: "Baneshwor",
    city: "Kathmandu",
    storeName: "",
    farmName: "",
    vehicleType: "",
    vehicleNumber: "",
    costPerTon: 1500,
    capacityTons: 2,
  });
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api.register(form);
      persist(data.token, data.user);
      navigate(roleHome(data.user.role));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card card" style={{ width: "min(560px, 100%)" }}>
        <Brand />
        <h2 className="serif" style={{ margin: "12px 0 0" }}>Join AgriFlow</h2>
        <form className="form" onSubmit={submit}>
          <label>
            I am a
            <select value={form.role} onChange={set("role")}>
              <option value="retailer">Retail mart</option>
              <option value="farmer">Farmer</option>
              <option value="driver">Transport driver</option>
            </select>
          </label>
          <label>Full name<input value={form.name} onChange={set("name")} required /></label>
          <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
          <label>Phone<input value={form.phone} onChange={set("phone")} required /></label>
          <label>Password<input type="password" value={form.password} onChange={set("password")} required /></label>
          {form.role === "retailer" && (
            <label>Mart name<input value={form.storeName} onChange={set("storeName")} /></label>
          )}
          {form.role === "farmer" && (
            <label>Farm name<input value={form.farmName} onChange={set("farmName")} /></label>
          )}
          {form.role === "driver" && (
            <>
              <label>Vehicle type<input value={form.vehicleType} onChange={set("vehicleType")} placeholder="Pickup truck" /></label>
              <label>Vehicle number<input value={form.vehicleNumber} onChange={set("vehicleNumber")} /></label>
              <label>Ask per ton (Rs)<input type="number" value={form.costPerTon} onChange={set("costPerTon")} /></label>
              <label>Capacity in tons<input type="number" step="0.1" value={form.capacityTons} onChange={set("capacityTons")} /></label>
            </>
          )}
          <label>Area
            <select value={form.area} onChange={set("area")}>
              {AREAS.map((area) => <option key={area}>{area}</option>)}
            </select>
          </label>
          <label>Address<input value={form.address} onChange={set("address")} /></label>
          <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
        <p>Already on AgriFlow? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
