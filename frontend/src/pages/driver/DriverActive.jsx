import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import { kg, money } from "../../utils/format.js";

export default function DriverActive() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    api.myJobs().then((data) => setJobs(data.jobs || [])).catch(() => {});
  }, []);

  const active = jobs.filter((job) => job.status !== "delivered");
  const done = jobs.filter((job) => job.status === "delivered");

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My deliveries</h1>
          <p>Update each stop so the farm and the mart can see where the goods are.</p>
        </div>
      </div>
      <div className="stack">
        {active.map((job) => (
          <Link key={job._id} to={`/driver/jobs/${job._id}`} className="card list-item">
            <div>
              <b>{job.pickup?.name} → {job.delivery?.name}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {kg(job.totalKg)} · fare {money(job.transportCost)}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </Link>
        ))}
        {active.length === 0 && <div className="card empty-state">No active loads. Accept a pickup from the board.</div>}
        {done.length > 0 && <h3 className="serif">Finished</h3>}
        {done.map((job) => (
          <div key={job._id} className="card list-item">
            <div>
              <b>{job.pickup?.name} → {job.delivery?.name}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Earned {money(job.transportCost)}</div>
            </div>
            <StatusBadge status={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
