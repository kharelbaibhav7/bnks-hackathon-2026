import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../utils/format.js";
import { FadeIn } from "./PageMotion.jsx";
import Brand from "./Brand.jsx";

const NAV = {
  retailer: [
    ["Overview", "/retailer"],
    ["Scan shelves", "/retailer/scan"],
    ["Inventory", "/retailer/inventory"],
    ["Orders", "/retailer/orders"],
    ["Invoices", "/retailer/invoices"],
    ["Escrow wallet", "/retailer/wallet"],
    ["Messages", "/retailer/messages"],
  ],
  farmer: [
    ["Overview", "/farmer"],
    ["My produce", "/farmer/inventory"],
    ["Order requests", "/farmer/orders"],
    ["Invoices", "/farmer/invoices"],
    ["Sales history", "/farmer/history"],
    ["Escrow wallet", "/farmer/wallet"],
    ["Messages", "/farmer/messages"],
  ],
  driver: [
    ["Overview", "/driver"],
    ["Open pickups", "/driver/jobs"],
    ["My deliveries", "/driver/active"],
    ["Profile", "/driver/profile"],
    ["Messages", "/driver/messages"],
  ],
};

export default function Layout({ role }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="auth"><div className="card">Loading AgriFlow…</div></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  const links = NAV[user.role] || [];
  const title = user.storeName || user.farmName || user.name;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <Brand light />
          <div style={{ fontSize: 12, color: "#c9bea4", marginTop: 4 }}>{user.role}</div>
        </div>
        <nav className="stack">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} end={to.split("/").length === 2}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-meta">
          <div>{title}</div>
          <div>{user.area}, {user.city}</div>
          <div>Available {money(user.walletBalance)}</div>
          {user.role === "retailer" && <div>Escrow {money(user.escrowHeld)}</div>}
          <button className="btn small ghost" style={{ marginTop: 10, color: "#f8f1de", borderColor: "#6c8a70" }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <PageMotion>
          <Outlet />
        </PageMotion>
      </main>
      <nav className="mobile-nav">
        {(user.role === "driver"
          ? links.slice(0, 4)
          : links.filter(([label]) => ["Overview", "Orders", "Order requests", "Invoices"].includes(label))
        ).map(([label, to]) => (
          <NavLink key={to} to={to} end={to.split("/").length === 2}>{label}</NavLink>
        ))}
      </nav>
    </div>
  );
}
