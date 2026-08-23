import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { detectPotatoFrame } from "../../utils/vision.js";

const POTATO = { name: "potato", displayName: "Potato", quantity: 25 };
const MISSING_FRAMES = 4;

export default function RetailerScan() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const overlayRef = useRef(null);
  const loopRef = useRef(0);
  const streamRef = useRef(null);
  const seenPotatoRef = useRef(false);
  const missingRef = useRef(0);
  const addedRef = useRef(false);
  const [live, setLive] = useState(false);
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
    setCart((prev) => {
      if (prev.some((item) => item.name === "potato")) return prev;
      return [...prev, { ...POTATO }];
    });
    toast.success("Potato is off the shelf — added to restock");
  };

  const sampleFrame = () => {
    const video = cameraRef.current;
    const result = detectPotatoFrame(video, overlayRef.current);
    if (!result) return;

    setReading(result);

    if (result.potatoPresent) {
      seenPotatoRef.current = true;
      missingRef.current = 0;
      setStatus(`Potato in frame · ${(result.potatoScore * 100).toFixed(0)}% of the shelf`);
      return;
    }

    const looksEmpty = result.empty || result.emptiness >= 0.32;
    if (!looksEmpty) {
      missingRef.current = 0;
      setStatus("Looking for potato… keep the shelf in view");
      return;
    }

    missingRef.current += 1;
    const needed = seenPotatoRef.current ? MISSING_FRAMES : MISSING_FRAMES + 2;
    setStatus(`Potato not in frame · empty shelf ${missingRef.current}/${needed}`);
    if (missingRef.current >= needed) addPotato();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      cameraRef.current.srcObject = stream;
      await cameraRef.current.play();
      setLive(true);
      setStatus("Live scan started · show potato, then an empty shelf");
      cancelAnimationFrame(loopRef.current);
      let last = 0;
      const tick = (time) => {
        if (time - last > 450) {
          sampleFrame();
          last = time;
        }
        loopRef.current = requestAnimationFrame(tick);
      };
      loopRef.current = requestAnimationFrame(tick);
    } catch {
      toast.error("Camera is not available. Allow camera access and try again.");
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(loopRef.current);
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
          <p>The camera watches for potato. When potato leaves the frame and the shelf looks empty, it is added to restock on its own.</p>
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
              <div className={`live-badge ${reading?.potatoPresent ? "ok" : reading?.empty ? "hot" : ""}`}>
                {status}
              </div>
            </div>
            {reading && (
              <div className="scan-grid" style={{ marginTop: 12 }}>
                {reading.cells.map((cell, index) => (
                  <div
                    key={index}
                    className={`scan-cell ${cell.potato ? "full" : cell.empty ? "empty" : ""}`}
                    style={cell.potato ? { background: "#c4953a" } : undefined}
                  />
                ))}
              </div>
            )}
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
            Live watch is set to potato. Hold potatoes in view, then show the empty bay.
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
                  if (item.name === "potato") addedRef.current = false;
                  setCart((prev) => prev.filter((row) => row.name !== item.name));
                }}
              >
                Remove
              </button>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Waiting for an empty potato shelf.</div>}
          <button className="btn gold" disabled={busy} onClick={placeOrder}>
            {busy ? "Asking farmers…" : "Send to farmers"}
          </button>
        </div>
      </div>
    </div>
  );
}
