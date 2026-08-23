import Brand from "./Brand.jsx";
import { money, when } from "../utils/format.js";

const partyName = (party = {}, role) =>
  (role === "retailer" ? party.storeName : party.farmName) || party.name || "—";

export default function InvoiceCard({ invoice, compact = false }) {
  if (!invoice) return null;

  const printInvoice = () => window.print();

  return (
    <div className={`invoice${compact ? " invoice-compact" : ""}`} id={`invoice-${invoice._id}`}>
      <div className="invoice-head">
        <div className="invoice-brand">
          <Brand size={36} />
          <div>
            <div className="kicker" style={{ marginBottom: 6 }}>Escrow settlement</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Issued {when(invoice.issuedAt)} · {invoice.escrowRef || "Released on delivery"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="serif" style={{ fontSize: 22 }}>{invoice.number}</div>
          <div className="badge ok">{invoice.audience === "farmer" ? "Farm receipt" : "Mart invoice"}</div>
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
      <div className="list-item" style={{ borderBottom: 0 }}>
        <span>Escrow released to farmer</span>
        <b className="serif" style={{ fontSize: 22 }}>{money(invoice.total)}</b>
      </div>
      {!compact && (
        <div className="row no-print" style={{ marginTop: 8 }}>
          <button className="btn small ghost" type="button" onClick={printInvoice}>Print / save PDF</button>
        </div>
      )}
    </div>
  );
}
