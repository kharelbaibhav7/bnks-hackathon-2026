import { useState } from "react";
import { Link } from "react-router-dom";
import InvoiceCard from "./InvoiceCard.jsx";
import { money, when } from "../utils/format.js";

export default function RecentInvoices({ invoices = [], to, showTransport = false }) {
  const [openId, setOpenId] = useState("");
  const latest = invoices.slice(0, 4);

  return (
    <div className="card">
      <div className="page-head" style={{ marginBottom: 8 }}>
        <h3 className="serif" style={{ margin: 0 }}>Invoices</h3>
        <Link to={to}>Open all</Link>
      </div>
      {latest.map((invoice) => (
        <div key={invoice._id}>
          <button
            type="button"
            className="list-item"
            style={{ width: "100%", background: "none", border: 0, padding: "12px 0", textAlign: "left" }}
            onClick={() => setOpenId(openId === invoice._id ? "" : invoice._id)}
          >
            <div>
              <b>{invoice.number}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {when(invoice.issuedAt)}
                {showTransport && invoice.transportTotal
                  ? ` · produce ${money(invoice.produceTotal)} · transport ${money(invoice.transportTotal)}`
                  : ` · ${invoice.audience === "farmer" ? invoice.retailer?.storeName : invoice.farmer?.farmName || "Settlement"}`}
              </div>
            </div>
            <b>{money(invoice.total)}</b>
          </button>
          {openId === invoice._id && (
            <div style={{ marginBottom: 12 }}>
              <InvoiceCard invoice={invoice} compact />
            </div>
          )}
        </div>
      ))}
      {latest.length === 0 && (
        <div className="empty-state">Invoices appear here automatically after delivery.</div>
      )}
    </div>
  );
}
