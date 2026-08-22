import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import RouteMap from "../../components/RouteMap.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { money, when } from "../../utils/format.js";

export default function OrderDetail() {
  const { id } = useParams();
  const { user, socket } = useAuth();
  const [data, setData] = useState(null);
  const [note, setNote] = useState("");

  const load = async () => {
    const next = await api.order(id);
    setData(next);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return undefined;
    socket.emit("join", `order:${id}`);
    const onTrack = () => load().catch(() => {});
    socket.on("tracking", onTrack);
    socket.on("payment", onTrack);
    return () => {
      socket.off("tracking", onTrack);
      socket.off("payment", onTrack);
    };
  }, [socket, id]);

  if (!data) return <div className="card">Loading order…</div>;

  const { order, allocations = [], jobs = [] } = data;
  const live = jobs.find((job) => job.status !== "delivered") || jobs[0];

  const sendNote = async (to) => {
    if (!note.trim()) return;
    try {
      await api.sendMessage({ to, body: note, order: order._id });
      toast.success("Message sent");
      setNote("");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const rate = async (allocationId) => {
    try {
      await api.rate({ allocationId, farmerStars: 5, driverStars: 5 });
      toast.success("Thanks — ratings help the next match");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Order tracking</h1>
          <p>Split across farmers, then handed to transport. Payment leaves the mart wallet at pickup.</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="grid-2">
        <div className="stack">
          {live && (
            <RouteMap
              pickup={live.pickup}
              delivery={live.delivery}
              current={live.currentLocation}
              label={live.driver?.name || "Awaiting driver"}
            />
          )}
          <div className="card">
            <h3 className="serif" style={{ marginTop: 0 }}>Requested produce</h3>
            {order.items.map((item) => (
              <div className="list-item" key={item.name}>
                <span>{item.displayName}</span>
                <span>{item.quantityAccepted}/{item.quantityRequested} {item.unit} accepted</span>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          {allocations.map((allocation) => (
            <div className="card" key={allocation._id}>
              <div className="list-item">
                <div>
                  <b>{allocation.farmer?.farmName || allocation.farmer?.name}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {allocation.farmer?.area} · {allocation.farmer?.phone} · {money(allocation.totalAmount)}
                  </div>
                </div>
                <StatusBadge status={allocation.status} />
              </div>
              {allocation.items.map((item) => (
                <div key={item.name} style={{ fontSize: 14 }}>{item.displayName} · {item.quantity}{item.unit}</div>
              ))}
              {allocation.paid && <div className="badge ok" style={{ marginTop: 8 }}>Paid on handover {when(allocation.paidAt)}</div>}
              {user.role === "retailer" && allocation.farmer && (
                <div className="row" style={{ marginTop: 10 }}>
                  <a className="btn small ghost" href={`tel:${allocation.farmer.phone}`}>Call farmer</a>
                  {allocation.status === "delivered" && (
                    <button className="btn small" onClick={() => rate(allocation._id)}>Rate 5★</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {jobs.map((job) => (
            <div className="card" key={job._id}>
              <div className="list-item">
                <div>
                  <b>{job.driver?.name || "No driver yet"}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {job.pickup?.area} → {job.delivery?.area}
                    {job.driver?.phone ? ` · ${job.driver.phone}` : ""}
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="timeline">
                {(job.trackingHistory || []).slice(-4).reverse().map((point, index) => (
                  <div className="tl" key={`${point.at}-${index}`}>
                    <div className="dot" />
                    <div>
                      <b>{point.note}</b>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>{when(point.at)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {job.driver && (
                <div className="row" style={{ marginTop: 10 }}>
                  <a className="btn small ghost" href={`tel:${job.driver.phone}`}>Call driver</a>
                </div>
              )}
            </div>
          ))}
          <div className="card form">
            <h3 className="serif" style={{ marginTop: 0 }}>Message</h3>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ask about timing, quantity or access" />
            <div className="row">
              {allocations[0]?.farmer && user.role !== "farmer" && (
                <button className="btn small" type="button" onClick={() => sendNote(allocations[0].farmer._id)}>To farmer</button>
              )}
              {jobs.find((job) => job.driver)?._id && (
                <button
                  className="btn small ghost"
                  type="button"
                  onClick={() => sendNote(jobs.find((job) => job.driver).driver._id)}
                >
                  To driver
                </button>
              )}
              {user.role !== "retailer" && order.retailer && (
                <button className="btn small" type="button" onClick={() => sendNote(order.retailer._id || order.retailer)}>
                  To mart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
