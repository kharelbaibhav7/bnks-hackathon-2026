import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { money } from "../../utils/format.js";

export default function DriverDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    api.stats().then((data) => setStats(data.stats || {})).catch(() => {});
    api.openJobs().then((data) => setBundles(data.bundles || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{user.name}</h1>
          <p>{user.vehicleType} {user.vehicleNumber} · {money(user.costPerTon)} per ton · {user.capacityTons} ton capacity</p>
        </div>
        <div className="badge ok">Rating {user.rating}★</div>
      </div>
      <div className="stats">
        <div className="card stat"><b>{stats.open || 0}</b><span>Open pickups</span></div>
        <div className="card stat"><b>{stats.mine || 0}</b><span>On your list</span></div>
        <div className="card stat"><b>{stats.delivered || 0}</b><span>Completed</span></div>
        <div className="card stat"><b>{money(stats.costPerTon)}</b><span>Your ask / ton</span></div>
      </div>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h3 className="serif" style={{ margin: 0 }}>Same-area bundles</h3>
          <Link to="/driver/jobs">Open board</Link>
        </div>
        {bundles.length === 0 && <div className="empty-state">No grouped loads yet. Farmers need to accept orders first.</div>}
        {bundles.map((bundle) => (
          <div className="list-item" key={bundle.key}>
            <div>
              <b>{bundle.key}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {bundle.jobs.length} pickups · {bundle.totalKg} kg
              </div>
            </div>
            <Link className="btn small" to="/driver/jobs">Review</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
