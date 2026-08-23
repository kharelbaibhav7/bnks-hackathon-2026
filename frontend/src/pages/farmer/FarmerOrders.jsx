import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import MartDesk from "../../components/MartDesk.jsx";
import { FadeIn } from "../../components/PageMotion.jsx";
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
      await api.respond(id, { action });
      toast.success(action === "accept" ? "Accepted. Mart funds are now locked in AgriFlow escrow." : "Declined. AgriFlow will ask another farm.");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const acceptedMarts = [];
  const seenMarts = new Set();
  allocations.forEach((item) => {
    const key = item.retailer?._id || item.retailer;
    if (item.martStats && item.status !== "requested" && item.status !== "rejected" && key && !seenMarts.has(String(key))) {
      seenMarts.add(String(key));
      acceptedMarts.push(item.martStats);
    }
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mart requests</h1>
          <p>Accept only if you can supply today. After you accept, you can see that mart’s fulfillment desk.</p>
        </div>
      </div>
      {acceptedMarts.map((stats) => (
        <FadeIn key={stats.retailerId} className="card" style={{ marginBottom: 14 }}>
          <MartDesk stats={stats} />
        </FadeIn>
      ))}
      <div className="stack">
        {allocations.map((item, index) => {
          const showDesk = item.martStats && item.status !== "requested" && item.status !== "rejected";
          return (
            <FadeIn key={item._id} delay={index * 0.04} className="card">
              <div className="list-item">
                <div>
                  <b>{item.retailer?.storeName || item.retailer?.name}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {item.retailer?.area} · {when(item.createdAt)} · {item.retailer?.phone}
                    {showDesk ? ` · ${item.martStats.ordersFulfilled} fulfilled` : ""}
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
              <div className="row" style={{ marginTop: 12 }}>
                {item.status === "requested" && (
                  <>
                    <button className="btn" onClick={() => respond(item._id, "accept")}>Accept</button>
                    <button className="btn ghost" onClick={() => respond(item._id, "reject")}>Cannot supply</button>
                  </>
                )}
                <Link className="btn ghost" to={`/farmer/orders/${item.order?._id || item.order}`}>Track</Link>
                {item.retailer?.phone && <a className="btn ghost" href={`tel:${item.retailer.phone}`}>Call mart</a>}
              </div>
            </FadeIn>
          );
        })}
        {allocations.length === 0 && <div className="card empty-state">No requests yet.</div>}
      </div>
    </div>
  );
}
