import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { money } from "../../utils/format.js";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.stats().then((data) => setStats(data.stats || {})).catch(() => {});
    api.farmerRequests().then((data) => setRequests((data.allocations || []).filter((item) => item.status === "requested"))).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{user.farmName || user.name}</h1>
          <p>Keep produce listed. Accept what you can fill. Money arrives when you hand the load to the driver.</p>
        </div>
        <div className="badge ok">Rating {user.rating}★</div>
      </div>
      <div className="stats">
        <div className="card stat"><b>{stats.requests || 0}</b><span>New mart requests</span></div>
        <div className="card stat"><b>{stats.accepted || 0}</b><span>Accepted, not done</span></div>
        <div className="card stat"><b>{money(stats.soldAmount)}</b><span>Lifetime sales</span></div>
        <div className="card stat"><b>{money(stats.wallet)}</b><span>AgriFlow wallet</span></div>
      </div>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h3 className="serif" style={{ margin: 0 }}>Waiting for you</h3>
          <Link to="/farmer/orders">See all</Link>
        </div>
        {requests.length === 0 && <div className="empty-state">No open requests. Update inventory so marts can find you.</div>}
        {requests.map((item) => (
          <Link key={item._id} to="/farmer/orders" className="list-item">
            <div>
              <b>{item.retailer?.storeName || item.retailer?.name}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {item.items.map((row) => `${row.displayName} ${row.quantity}kg`).join(" · ")}
              </div>
            </div>
            <b>{money(item.totalAmount)}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}
