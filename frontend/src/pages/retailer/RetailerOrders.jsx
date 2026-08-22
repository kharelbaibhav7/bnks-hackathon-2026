import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import { money, when } from "../../utils/format.js";

export default function RetailerOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.orders().then((data) => setOrders(data.orders || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Order history</h1>
          <p>Every restock request, from farmer split to final delivery.</p>
        </div>
        <Link className="btn" to="/retailer/scan">New restock</Link>
      </div>
      <div className="card">
        {orders.map((order) => (
          <Link key={order._id} to={`/retailer/orders/${order._id}`} className="list-item">
            <div>
              <b>{order.items.map((item) => `${item.displayName} ${item.quantityRequested}kg`).join(" · ")}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{when(order.createdAt)} · {money(order.estimatedTotal)}</div>
            </div>
            <StatusBadge status={order.status} />
          </Link>
        ))}
        {orders.length === 0 && <div className="empty-state">No orders yet.</div>}
      </div>
    </div>
  );
}
