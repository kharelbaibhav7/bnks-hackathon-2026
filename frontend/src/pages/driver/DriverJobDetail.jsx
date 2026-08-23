import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import RouteMap from "../../components/RouteMap.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { kg, money, when } from "../../utils/format.js";

const STEPS = [
  ["en_route_pickup", "Heading to farm"],
  ["picked_up", "Collected — escrow still held"],
  ["en_route_delivery", "Driving to mart"],
  ["delivered", "Handed to mart"],
];

export default function DriverJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [nearby, setNearby] = useState([]);

  const load = async () => {
    const data = await api.job(id);
    setJob(data.job);
    if (data.job?.status === "open") {
      const extra = await api.nearby(id);
      setNearby(extra.jobs || []);
    }
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, [id]);

  const advance = async (status) => {
    if (!job) return;
    const lat = job.currentLocation?.lat + (status === "delivered" ? 0.01 : 0.004);
    const lng = job.currentLocation?.lng + (status === "delivered" ? -0.01 : 0.003);
    try {
      await api.jobStatus(job._id, { status, lat, lng });
      if (status === "picked_up") toast.success("Goods collected. Funds stay in AgriFlow escrow");
      if (status === "delivered") toast.success("Delivered. Escrow released and invoices emailed");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const ping = async () => {
    try {
      await api.jobLocation(job._id, {
        lat: job.currentLocation.lat + 0.002,
        lng: job.currentLocation.lng + 0.002,
        note: "Live location shared",
      });
      toast.success("Location sent to farm and mart");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!job) return <div className="card">Loading job…</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{job.pickup?.name} → {job.delivery?.name}</h1>
          <p>{job.pickup?.address} to {job.delivery?.address}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <div className="grid-2">
        <div className="stack">
          <RouteMap pickup={job.pickup} delivery={job.delivery} current={job.currentLocation} label="You" />
          <div className="card">
            <h3 className="serif" style={{ marginTop: 0 }}>Goods</h3>
            {job.goods.map((item) => (
              <div className="list-item" key={item.name}>
                <span>{item.displayName}</span>
                <span>{item.quantity} {item.unit} · {item.weightTons} t</span>
              </div>
            ))}
            <div className="list-item">
              <span>Your fare</span>
              <b>{money(job.transportCost)} ({money(job.costPerTon)}/t · {kg(job.totalKg)})</b>
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="serif" style={{ marginTop: 0 }}>Contacts</h3>
            <div className="list-item">
              <span>Farmer {job.pickup?.name}</span>
              <a className="btn small ghost" href={`tel:${job.pickup?.phone}`}>Call</a>
            </div>
            <div className="list-item">
              <span>Mart {job.delivery?.name}</span>
              <a className="btn small ghost" href={`tel:${job.delivery?.phone}`}>Call</a>
            </div>
          </div>
          <div className="card stack">
            <h3 className="serif" style={{ marginTop: 0 }}>Move the load</h3>
            {job.status === "open" && (
              <button className="btn" onClick={() => api.acceptJobs([job._id]).then(load)}>Accept this pickup</button>
            )}
            {STEPS.map(([status, label]) => (
              <button key={status} className="btn ghost" onClick={() => advance(status)} disabled={job.status === "delivered"}>
                {label}
              </button>
            ))}
            <button className="btn clay" onClick={ping} disabled={job.status === "open" || job.status === "delivered"}>
              Share live location
            </button>
          </div>
          <div className="card">
            <h3 className="serif" style={{ marginTop: 0 }}>Trail</h3>
            {(job.trackingHistory || []).slice().reverse().map((point, index) => (
              <div className="tl" key={`${point.at}-${index}`}>
                <div className="dot" />
                <div>
                  <b>{point.note}</b>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{when(point.at)}</div>
                </div>
              </div>
            ))}
          </div>
          {nearby.length > 0 && (
            <div className="card">
              <h3 className="serif" style={{ marginTop: 0 }}>Also nearby today</h3>
              {nearby.map((item) => (
                <div className="list-item" key={item._id}>
                  <span>{item.pickup?.name} · {kg(item.totalKg)}</span>
                  <button className="btn small" onClick={() => api.acceptJobs([item._id]).then(() => toast.success("Added to your day"))}>
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
