import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { analyzeShelfImage, fileToImage } from "../../utils/vision.js";

export default function RetailerScan() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const [vision, setVision] = useState(null);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState({ name: "tomato", quantity: 25 });
  const [cart, setCart] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.catalog().then((data) => setCatalog(data.catalog || [])).catch(() => {});
  }, []);

  const runScan = async (image) => {
    const analysis = analyzeShelfImage(image);
    setVision(analysis);
    const data = await api.scan(analysis);
    setResult(data);
    setCart(
      (data.emptyOrLow || []).map((item) => ({
        name: item.name,
        displayName: item.displayName,
        quantity: item.suggestedOrder,
      }))
    );
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await fileToImage(file);
      await runScan(image);
      toast.success("Shelf photo read");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      cameraRef.current.srcObject = stream;
      await cameraRef.current.play();
    } catch {
      toast.error("Camera is not available. Upload a photo instead.");
    }
  };

  const capture = async () => {
    const video = cameraRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const image = new Image();
    image.onload = () => runScan(image).catch((error) => toast.error(error.message));
    image.src = canvas.toDataURL("image/jpeg");
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
        source: vision ? "scan" : "manual",
        notes: "Restock from shelf check",
      });
      toast.success(data.message);
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
          <h1>Shelf scan</h1>
          <p>Photograph the produce bay. AgriFlow looks for empty-looking cells and matches them with your low stock. You can always correct the list by hand.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="stack">
          <div className="scan-box">
            <p>Upload a shelf photo or use the camera.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <label className="btn">
                Upload photo
                <input type="file" accept="image/*" hidden onChange={onFile} />
              </label>
              <button className="btn ghost" type="button" onClick={openCamera}>Open camera</button>
              <button className="btn clay" type="button" onClick={capture}>Capture</button>
            </div>
            <video ref={cameraRef} style={{ width: "100%", marginTop: 12, borderRadius: 16 }} muted playsInline />
            {vision && (
              <>
                <img src={vision.preview} alt="scan preview" style={{ width: "100%", borderRadius: 16, marginTop: 12 }} />
                <div className="scan-grid">
                  {vision.cells.map((cell, index) => (
                    <div key={index} className={`scan-cell ${cell.empty ? "empty" : "full"}`} />
                  ))}
                </div>
                <p>Emptiness score {(vision.emptinessScore * 100).toFixed(0)}%</p>
              </>
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
          {result && <p style={{ color: "var(--muted)" }}>{result.message}</p>}
          {cart.map((item) => (
            <div className="list-item" key={item.name}>
              <div>
                <b>{item.displayName}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Order {item.quantity} kg</div>
              </div>
              <button className="btn small ghost" onClick={() => setCart((prev) => prev.filter((row) => row.name !== item.name))}>
                Remove
              </button>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Nothing flagged yet. Scan a photo or add produce yourself.</div>}
          <button className="btn gold" disabled={busy} onClick={placeOrder}>
            {busy ? "Asking farmers…" : "Send to farmers"}
          </button>
        </div>
      </div>
    </div>
  );
}
