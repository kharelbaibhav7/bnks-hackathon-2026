import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { kg } from "../../utils/format.js";

export default function RetailerInventory() {
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({ name: "tomato", quantity: 0, minStock: 15 });

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
      toast.success("Shelf stock updated");
      setForm({ ...form, quantity: 0 });
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Store inventory</h1>
          <p>Keep what is on the shelf here. Anything at or below the restock line is treated as empty.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Produce</th><th>On shelf</th><th>Restock line</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.displayName}</td>
                  <td>{kg(item.quantity, item.unit)}</td>
                  <td>{kg(item.minStock, item.unit)}</td>
                  <td>
                    {item.quantity <= item.minStock && <span className="badge hot">Needs restock</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="empty-state">No items listed yet.</div>}
        </div>
        <form className="card form" onSubmit={save}>
          <h3 className="serif" style={{ marginTop: 0 }}>Add or update by hand</h3>
          <label>
            Produce
            <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
              {catalog.map((item) => <option key={item.name} value={item.name}>{item.displayName}</option>)}
            </select>
          </label>
          <label>Quantity in kg<input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
          <label>Restock when below<input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></label>
          <button className="btn">Save stock</button>
        </form>
      </div>
    </div>
  );
}
