import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import { money, when } from "../../utils/format.js";

export default function FarmerOrders() {
  const [allocations, setAllocations] = useState([]);

  const load = async () => {
    const data = await api.farmerRequests();
    setAllocations(data.allocations || []);
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);

  const respond = async (id, action) => {
    try {
      const data = await api.respond(id, { action });
      toast.success(action === "accept" ? "Accepted. A driver can now pick this up." : "Declined. AgriFlow will ask another farm.");
      load();
      return data;
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mart requests</h1>
          <p>Accept only if you can supply today. Rejected quantity is offered to the next farm automatically.</p>
        </div>
      </div>
      <div className="stack">
        {allocations.map((item) => (
          <div className="card" key={item._id}>
            <div className="list-item">
              <div>
                <b>{item.retailer?.storeName || item.retailer?.name}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {item.retailer?.area} · {when(item.createdAt)} · {item.retailer?.phone}
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
            {item.items.map((row) => (
              <div key={row.name} className="list-item">
                <span>{row.displayName}</span>
                <span>{row.quantity} kg · {money(row.amount)}</span>
              </div>
            ))}
            <div className="row">
              {item.status === "requested" && (
                <>
                  <button className="btn" onClick={() => respond(item._id, "accept")}>Accept</button>
                  <button className="btn ghost" onClick={() => respond(item._id, "reject")}>Cannot supply</button>
                </>
              )}
              <Link className="btn ghost" to={`/farmer/orders/${item.order?._id || item.order}`}>Track</Link>
              {item.retailer?.phone && <a className="btn ghost" href={`tel:${item.retailer.phone}`}>Call mart</a>}
            </div>
          </div>
        ))}
        {allocations.length === 0 && <div className="card empty-state">No requests yet.</div>}
      </div>
    </div>
  );
}
