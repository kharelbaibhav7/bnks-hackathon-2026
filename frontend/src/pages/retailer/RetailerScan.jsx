import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { detectPotatoFrame } from "../../utils/vision.js";

const POTATO = { name: "potato", displayName: "Potato", quantity: 25 };

export default function RetailerScan() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const overlayRef = useRef(null);
  const timerRef = useRef(0);
  const streamRef = useRef(null);
  const seenRef = useRef(0);
  const goneRef = useRef(0);
  const peakRef = useRef(0);
  const lockedRef = useRef(false);
  const addedRef = useRef(false);
  const [live, setLive] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [status, setStatus] = useState("Camera is off");
  const [reading, setReading] = useState(null);
  const [manual, setManual] = useState({ name: "potato", quantity: 25 });
  const [cart, setCart] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.catalog().then((data) => setCatalog(data.catalog || [])).catch(() => {});
    return () => stopCamera();
  }, []);

  const addPotato = () => {
    if (addedRef.current) return;
    addedRef.current = true;
    setCart((prev) => (prev.some((item) => item.name === "potato") ? prev : [...prev, { ...POTATO }]));
    setPhase("gone");
    toast.success("Potato left the frame — added to restock");
  };

  const sampleFrame = () => {
    const result = detectPotatoFrame(cameraRef.current, overlayRef.current);
    if (!result) return;
    setReading(result);

    if (result.potatoPresent) {
      seenRef.current += 1;
      goneRef.current = 0;
      peakRef.current = Math.max(peakRef.current, result.potatoScore);
      if (seenRef.current >= 2) {
        lockedRef.current = true;
        setPhase("locked");
      } else {
        setPhase("seeing");
      }
      setStatus(
        lockedRef.current
          ? `Potato in frame · ${(result.potatoScore * 100).toFixed(0)}% · take it away to restock`
          : `Seeing potato… hold it in view (${seenRef.current}/2)`
      );
      return;
    }

    const dropped = peakRef.current > 0 && result.potatoScore < Math.max(0.012, peakRef.current * 0.45);
    if (lockedRef.current && (dropped || !result.potatoPresent)) {
      goneRef.current += 1;
      setPhase("leaving");
      setStatus(`Potato left the frame · confirming ${goneRef.current}/3`);
      if (goneRef.current >= 3) addPotato();
      return;
    }

    setPhase("wait");
    setStatus("Point the camera at potato first");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = cameraRef.current;
      video.srcObject = stream;
      await video.play();
      seenRef.current = 0;
      goneRef.current = 0;
      peakRef.current = 0;
      lockedRef.current = false;
      setLive(true);
      setStatus("Show potato to the camera");
      clearInterval(timerRef.current);
      const begin = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(sampleFrame, 280);
      };
      if (video.readyState >= 2) begin();
      else video.onloadeddata = begin;
    } catch {
      toast.error("Allow camera access and try again.");
    }
  };

  const stopCamera = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (cameraRef.current) cameraRef.current.srcObject = null;
    setLive(false);
    setStatus("Camera is off");
  };

  const addManual = (event) => {
    event.preventDefault();
    const produce = catalog.find((item) => item.name === manual.name);
    setCart((prev) => [
      ...prev.filter((item) => item.name !== manual.name),
      { name: manual.name, displayName: produce?.displayName || manual.name, quantity: Number(manual.quantity) },
    ]);
  };

  const placeOrder = async () => {
    if (!cart.length) return toast.error("Add at least one item");
    setBusy(true);
    try {
      const data = await api.createOrder({
        items: cart,
        source: "scan",
        notes: "Restock from live shelf scan",
      });
      toast.success(data.message);
      stopCamera();
      navigate(`/retailer/orders/${data.order._id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Live shelf scan</h1>
          <p>Show potato to the camera. When it leaves the frame, potato is added to restock automatically.</p>
        </div>
        {live ? (
          <button className="btn ghost" onClick={stopCamera}>Stop camera</button>
        ) : (
          <button className="btn gold" onClick={startCamera}>Start live scan</button>
        )}
      </div>
      <div className="grid-2">
        <div className="stack">
          <div className="scan-box">
            <div className="live-stage">
              <video ref={cameraRef} muted playsInline autoPlay />
              <canvas ref={overlayRef} className="live-overlay" />
              <div className={`live-badge ${phase === "locked" ? "ok" : phase === "leaving" || phase === "gone" ? "hot" : ""}`}>
                {status}
              </div>
            </div>
          </div>
          <form className="card form" onSubmit={addManual}>
            <h3 className="serif" style={{ marginTop: 0 }}>Add manually</h3>
            <label>
              Produce
              <select value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })}>
                {catalog.map((item) => <option key={item.name} value={item.name}>{item.displayName}</option>)}
              </select>
            </label>
            <label>How much to order (kg)
              <input type="number" min="1" value={manual.quantity} onChange={(e) => setManual({ ...manual, quantity: e.target.value })} />
            </label>
            <button className="btn ghost">Add to restock list</button>
          </form>
        </div>
        <div className="card stack">
          <h3 className="serif" style={{ marginTop: 0 }}>Restock list</h3>
          <p style={{ color: "var(--muted)" }}>
            1. Start the camera. 2. Hold a potato in view until it locks. 3. Move the potato out of frame.
          </p>
          {cart.map((item) => (
            <div className="list-item" key={item.name}>
              <div>
                <b>{item.displayName}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Order {item.quantity} kg</div>
              </div>
              <button
                className="btn small ghost"
                onClick={() => {
                  if (item.name === "potato") {
                    addedRef.current = false;
                    lockedRef.current = false;
                    seenRef.current = 0;
                    goneRef.current = 0;
                    peakRef.current = 0;
                  }
                  setCart((prev) => prev.filter((row) => row.name !== item.name));
                }}
              >
                Remove
              </button>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Potato will appear here when it leaves the camera.</div>}
          <button className="btn gold" disabled={busy} onClick={placeOrder}>
            {busy ? "Asking farmers…" : "Send to farmers"}
          </button>
        </div>
      </div>
    </div>
  );
}
