import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import InvoiceCard from "../../components/InvoiceCard.jsx";
import { FadeIn } from "../../components/PageMotion.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { money, when } from "../../utils/format.js";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [openId, setOpenId] = useState("");
  const base = user.role === "farmer" ? "/farmer" : "/retailer";

  useEffect(() => {
    api.invoices().then((data) => setInvoices(data.invoices || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Invoices</h1>
          <p>
            {user.role === "retailer"
              ? "Each completed order invoice includes produce and the driver haulage for that trip."
              : "Created automatically when an order is delivered and escrow is released."}
          </p>
        </div>
      </div>
      <div className="stack">
        {invoices.map((invoice, index) => (
          <FadeIn key={invoice._id} delay={index * 0.04}>
            <div className="card">
              <button
                type="button"
                className="list-item"
                style={{ width: "100%", background: "none", border: 0, padding: 0, textAlign: "left" }}
                onClick={() => setOpenId(openId === invoice._id ? "" : invoice._id)}
              >
                <div>
                  <b>{invoice.number}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {when(invoice.issuedAt)} · {invoice.audience === "farmer" ? invoice.retailer?.storeName : invoice.farmer?.farmName}
                    {invoice.transportTotal ? ` · transport ${money(invoice.transportTotal)}` : ""}
                  </div>
                </div>
                <b>{money(invoice.total)}</b>
              </button>
              {openId === invoice._id && (
                <div style={{ marginTop: 12 }}>
                  <InvoiceCard invoice={invoice} />
                  {invoice.order?._id && (
                    <Link className="btn small ghost" style={{ marginTop: 10 }} to={`${base}/orders/${invoice.order._id || invoice.order}`}>
                      Open order
                    </Link>
                  )}
                </div>
              )}
            </div>
          </FadeIn>
        ))}
        {invoices.length === 0 && <div className="card empty-state">Invoices appear here after a delivery is completed.</div>}
      </div>
    </div>
  );
}
