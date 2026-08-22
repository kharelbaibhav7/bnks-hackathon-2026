import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../utils/format.js";

const NAV = {
  retailer: [
    ["Overview", "/retailer"],
    ["Scan shelves", "/retailer/scan"],
    ["Inventory", "/retailer/inventory"],
    ["Orders", "/retailer/orders"],
    ["Wallet", "/retailer/wallet"],
    ["Messages", "/retailer/messages"],
  ],
  farmer: [
    ["Overview", "/farmer"],
    ["My produce", "/farmer/inventory"],
    ["Order requests", "/farmer/orders"],
    ["Sales history", "/farmer/history"],
    ["Wallet", "/farmer/wallet"],
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
        <div className="brand">
          <div className="mark">A</div>
          <div>
            <strong>AgriFlow</strong>
            <div style={{ fontSize: 12, color: "#c9bea4" }}>{user.role}</div>
          </div>
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
          <div>Wallet {money(user.walletBalance)}</div>
          <button className="btn small ghost" style={{ marginTop: 10, color: "#f8f1de", borderColor: "#6c8a70" }} onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      <nav className="mobile-nav">
        {links.slice(0, 4).map(([label, to]) => (
          <NavLink key={to} to={to} end={to.split("/").length === 2}>{label}</NavLink>
        ))}
      </nav>
    </div>
  );
}
