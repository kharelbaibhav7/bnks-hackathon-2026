import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function DriverProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    vehicleType: user.vehicleType || "",
    vehicleNumber: user.vehicleNumber || "",
    costPerTon: user.costPerTon || 0,
    capacityTons: user.capacityTons || 2,
    area: user.area || "",
    address: user.address || "",
  });

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    try {
      const data = await api.updateMe(form);
      setUser(data.user);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Driver profile</h1>
          <p>Marts and farms see your rating, vehicle and the rate you ask per ton.</p>
        </div>
        <div className="badge ok">{user.rating}★ from {user.ratingCount} trips</div>
      </div>
      <form className="card form" style={{ maxWidth: 560 }} onSubmit={save}>
        <label>Name<input value={form.name} onChange={set("name")} /></label>
        <label>Phone<input value={form.phone} onChange={set("phone")} /></label>
        <label>Vehicle type<input value={form.vehicleType} onChange={set("vehicleType")} /></label>
        <label>Vehicle number<input value={form.vehicleNumber} onChange={set("vehicleNumber")} /></label>
        <label>Ask per ton (Rs)<input type="number" value={form.costPerTon} onChange={set("costPerTon")} /></label>
        <label>Capacity (tons)<input type="number" step="0.1" value={form.capacityTons} onChange={set("capacityTons")} /></label>
        <label>Usual area<input value={form.area} onChange={set("area")} /></label>
        <label>Address<input value={form.address} onChange={set("address")} /></label>
        <button className="btn">Save details</button>
      </form>
    </div>
  );
}
