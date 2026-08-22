import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import { kg, money } from "../../utils/format.js";

export default function DriverJobs() {
  const [jobs, setJobs] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [selected, setSelected] = useState([]);

  const load = async () => {
    const data = await api.openJobs();
    setJobs(data.jobs || []);
    setBundles(data.bundles || []);
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const accept = async (ids) => {
    try {
      const data = await api.acceptJobs(ids);
      toast.success(data.message);
      setSelected([]);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Open pickups</h1>
          <p>Select several loads from the same farm belt heading to the same mart area. Your rate per ton is applied when you accept.</p>
        </div>
        <button className="btn gold" disabled={!selected.length} onClick={() => accept(selected)}>
          Accept selected ({selected.length})
        </button>
      </div>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        {bundles.map((bundle) => (
          <div className="card" key={bundle.key}>
            <b>{bundle.key}</b>
            <p style={{ color: "var(--muted)" }}>{bundle.jobs.length} jobs · {kg(bundle.totalKg)}</p>
            <button className="btn small" onClick={() => accept(bundle.jobIds.map(String))}>Take this bundle</button>
          </div>
        ))}
      </div>
      <div className="stack">
        {jobs.map((job) => (
          <div className="card" key={job._id}>
            <div className="list-item">
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" checked={selected.includes(job._id)} onChange={() => toggle(job._id)} />
                <div>
                  <b>{job.pickup?.name}</b> → <b>{job.delivery?.name}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {job.pickup?.area} to {job.delivery?.area} · {job.goods.map((item) => `${item.displayName} ${item.quantity}kg`).join(", ")}
                  </div>
                </div>
              </label>
              <StatusBadge status={job.status} />
            </div>
            <div className="row">
              <span className="badge">{kg(job.totalKg)}</span>
              <span className="badge">{money((job.totalKg / 1000) * 1500)} est. at Rs 1500/t</span>
              <Link className="btn small ghost" to={`/driver/jobs/${job._id}`}>Details</Link>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <div className="card empty-state">No open loads. Check again after farmers accept mart requests.</div>}
      </div>
    </div>
  );
}
