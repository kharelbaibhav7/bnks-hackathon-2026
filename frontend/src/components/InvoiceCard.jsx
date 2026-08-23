import Brand from "./Brand.jsx";
import { money, when } from "../utils/format.js";

const partyName = (party = {}, role) =>
  (role === "retailer" ? party.storeName : party.farmName) || party.name || "—";

const routeLabel = (line) =>
  [line.pickupArea, line.deliveryArea].filter(Boolean).join(" → ") || "Farm to mart";

export default function InvoiceCard({ invoice, compact = false }) {
  if (!invoice) return null;

  const printInvoice = () => window.print();
  const produceTotal = invoice.produceTotal || (invoice.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const transport = invoice.transport || [];
  const transportTotal = invoice.transportTotal || transport.reduce((sum, line) => sum + (line.amount || 0), 0);
  const isMart = invoice.audience === "retailer";

  return (
    <div className={`invoice${compact ? " invoice-compact" : ""}`} id={`invoice-${invoice._id}`}>
      <div className="invoice-head">
        <div className="invoice-brand">
          <Brand size={36} />
          <div>
            <div className="kicker" style={{ marginBottom: 6 }}>
              {isMart ? "Produce + transport" : "Escrow settlement"}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Issued {when(invoice.issuedAt)} · {invoice.escrowRef || "Released on delivery"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="serif" style={{ fontSize: 22 }}>{invoice.number}</div>
          <div className="badge ok">{isMart ? "Mart invoice" : "Farm receipt"}</div>
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>BILLED TO</div>
          <b>{partyName(invoice.retailer, "retailer")}</b>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {[invoice.retailer?.area, invoice.retailer?.city].filter(Boolean).join(", ")}
            {invoice.retailer?.phone ? ` · ${invoice.retailer.phone}` : ""}
          </div>
        </div>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>SUPPLIED BY</div>
          <b>{partyName(invoice.farmer, "farmer")}</b>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {invoice.farmer?.farmName || invoice.farmer?.address || "Farm pickup"}
          </div>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Produce</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, index) => (
            <tr key={`${item.displayName}-${index}`}>
              <td>{item.displayName}</td>
              <td>{item.quantity} {item.unit}</td>
              <td>{money(item.pricePerUnit)}</td>
              <td>{money(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isMart && transport.length > 0 && (
        <>
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Transport</th>
                <th>Load</th>
                <th>Rate / ton</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transport.map((line, index) => (
                <tr key={`${line.driverName}-${index}`}>
                  <td>
                    {routeLabel(line)}
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {line.driverName}{line.vehicleNumber ? ` · ${line.vehicleNumber}` : ""}
                    </div>
                  </td>
                  <td>{line.totalKg} kg</td>
                  <td>{money(line.costPerTon)}</td>
                  <td>{money(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-totals">
            <div className="list-item"><span>Produce (escrow to farms)</span><b>{money(produceTotal)}</b></div>
            <div className="list-item"><span>Transportation</span><b>{money(transportTotal)}</b></div>
            <div className="list-item" style={{ borderBottom: 0 }}>
              <span>Invoice total</span>
              <b className="serif" style={{ fontSize: 22 }}>{money(invoice.total)}</b>
            </div>
          </div>
        </>
      )}
      {(!isMart || transport.length === 0) && (
        <div className="list-item" style={{ borderBottom: 0 }}>
          <span>{isMart ? "Invoice total" : "Escrow released to farmer"}</span>
          <b className="serif" style={{ fontSize: 22 }}>{money(invoice.total)}</b>
        </div>
      )}
      {!compact && (
        <div className="row no-print" style={{ marginTop: 8 }}>
          <button className="btn small ghost" type="button" onClick={printInvoice}>Print / save PDF</button>
        </div>
      )}
    </div>
  );
}
