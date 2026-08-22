const placePoint = (place = {}) => {
  const lat = place.lat ?? 27.7;
  const lng = place.lng ?? 85.32;
  const x = ((lng - 85.28) / 0.32) * 100;
  const y = ((27.74 - lat) / 0.2) * 100;
  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(88, Math.max(10, y)),
  };
};

export default function RouteMap({ pickup, delivery, current, label }) {
  const from = placePoint(pickup);
  const to = placePoint(delivery);
  const now = placePoint(current || pickup);

  return (
    <div className="map">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M8 72 C 22 50, 30 78, 48 60 S 78 30, 94 42" fill="none" stroke="#8aa37a" strokeWidth="6" />
        <path d="M4 40 C 20 28, 38 36, 55 22 S 80 18, 96 28" fill="none" stroke="#9bb58a" strokeWidth="4" />
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#c45c26" strokeWidth="1.2" strokeDasharray="2 2" />
      </svg>
      <div className="pin farm" style={{ left: `${from.x}%`, top: `${from.y}%` }}>
        Pickup · {pickup?.area || "Farm"}
      </div>
      <div className="pin mart" style={{ left: `${to.x}%`, top: `${to.y}%` }}>
        Mart · {delivery?.area || "Store"}
      </div>
      <div className="pin truck" style={{ left: `${now.x}%`, top: `${now.y}%` }}>
        {label || "Goods"}
      </div>
    </div>
  );
}
