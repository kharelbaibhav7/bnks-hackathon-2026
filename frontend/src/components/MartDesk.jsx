import { money } from "../utils/format.js";

export default function MartDesk({ stats }) {
  if (!stats) return null;

  return (
    <div className="mart-dash">
      <div className="list-item" style={{ paddingTop: 0 }}>
        <div>
          <h4 className="serif" style={{ margin: 0 }}>{stats.storeName} desk</h4>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {[stats.area, stats.city].filter(Boolean).join(", ")}
            {stats.phone ? ` · ${stats.phone}` : ""}
            {stats.rating ? ` · ${stats.rating}★` : ""}
          </div>
        </div>
      </div>
      <div className="stats mini-stats" style={{ marginBottom: 0 }}>
        <div className="stat"><b>{stats.ordersFulfilled || 0}</b><span>Orders fulfilled</span></div>
        <div className="stat"><b>{stats.inProgress || 0}</b><span>In progress</span></div>
        <div className="stat"><b>{stats.ordersOpen || 0}</b><span>Open orders</span></div>
        <div className="stat"><b>{stats.loadsDelivered || 0}</b><span>Loads received</span></div>
        <div className="stat"><b>{money(stats.paidOut)}</b><span>Paid to farms</span></div>
        <div className="stat"><b>{stats.farmsServed || 0}</b><span>Farms served</span></div>
      </div>
    </div>
  );
}
