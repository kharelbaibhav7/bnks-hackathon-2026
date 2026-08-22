import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import StatusBadge from "../../components/StatusBadge.jsx";
import { money, when } from "../../utils/format.js";

export default function FarmerHistory() {
  const [sales, setSales] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    api.farmerHistory().then((data) => {
      setSales(data.sales || []);
      setAllocations(data.allocations || []);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>What sold</h1>
          <p>Every accepted load, payment and delivery stays on this farm record.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3 className="serif" style={{ marginTop: 0 }}>Sales ledger</h3>
          {sales.map((sale) => (
            <div className="list-item" key={sale._id}>
              <div>
                <b>{sale.displayName}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {sale.quantity} {sale.unit} · {sale.retailer?.storeName || sale.retailer?.name} · {when(sale.createdAt)}
                </div>
              </div>
              <b>{money(sale.amount)}</b>
            </div>
          ))}
          {sales.length === 0 && <div className="empty-state">Payments appear when a driver collects your goods.</div>}
        </div>
        <div className="card">
          <h3 className="serif" style={{ marginTop: 0 }}>Order outcomes</h3>
          {allocations.map((item) => (
            <div className="list-item" key={item._id}>
              <div>
                <b>{item.retailer?.storeName || item.retailer?.name}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{money(item.totalAmount)}</div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
