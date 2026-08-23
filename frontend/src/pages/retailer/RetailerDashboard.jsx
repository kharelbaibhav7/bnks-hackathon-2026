import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { Stagger, StaggerItem } from "../../components/PageMotion.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { money, when } from "../../utils/format.js";

export default function RetailerDashboard() {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.stats().then((data) => setStats(data.stats || {})).catch(() => {});
    api.orders().then((data) => setOrders(data.orders || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Mart desk</h1>
          <p>See empty stock, send farmer requests, and follow goods until they reach the store.</p>
        </div>
        <Link className="btn gold" to="/retailer/scan">Scan shelves</Link>
      </div>
      <Stagger className="stats">
        <StaggerItem className="card stat"><b>{stats.empty || 0}</b><span>Empty / low items</span></StaggerItem>
        <StaggerItem className="card stat"><b>{stats.pending || 0}</b><span>Waiting on farmers</span></StaggerItem>
        <StaggerItem className="card stat"><b>{stats.inTransit || 0}</b><span>On the road</span></StaggerItem>
        <StaggerItem className="card stat"><b>{money(stats.escrowHeld)}</b><span>Locked in escrow</span></StaggerItem>
      </Stagger>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h3 className="serif" style={{ margin: 0 }}>Recent orders</h3>
          <Link to="/retailer/orders">Open all</Link>
        </div>
        {orders.length === 0 && <div className="empty-state">No orders yet. Scan a shelf or create one by hand.</div>}
        {orders.slice(0, 6).map((order) => (
          <Link key={order._id} to={`/retailer/orders/${order._id}`} className="list-item">
            <div>
              <b>{order.items.map((item) => item.displayName).join(", ")}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{when(order.createdAt)}</div>
            </div>
            <StatusBadge status={order.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
