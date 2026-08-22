import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { kg, money } from "../../utils/format.js";

export default function FarmerInventory() {
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({ name: "tomato", quantity: 50, pricePerUnit: 55 });

  const load = async () => {
    const [inv, cat] = await Promise.all([api.inventory(), api.catalog()]);
    setItems(inv.items || []);
    setCatalog(cat.catalog || []);
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      await api.saveInventory(form);
      toast.success("Produce listed for marts");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async (id) => {
    await api.deleteInventory(id);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>What you have</h1>
          <p>Marts only see produce you list here. Price is what you receive — no middleman cut.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Crop</th><th>In store</th><th>Your price</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.displayName}</td>
                  <td>{kg(item.quantity)}</td>
                  <td>{money(item.pricePerUnit)}/kg</td>
                  <td><button className="btn small ghost" onClick={() => remove(item._id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="empty-state">Add tomato, potato, wheat — whatever is ready.</div>}
        </div>
        <form className="card form" onSubmit={save}>
          <h3 className="serif" style={{ marginTop: 0 }}>Add produce</h3>
          <label>
            Crop
            <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
              {catalog.map((item) => <option key={item.name} value={item.name}>{item.displayName}</option>)}
            </select>
          </label>
          <label>Quantity (kg)<input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
          <label>Price per kg (Rs)<input type="number" min="0" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} /></label>
          <button className="btn">Save listing</button>
        </form>
      </div>
    </div>
  );
}
