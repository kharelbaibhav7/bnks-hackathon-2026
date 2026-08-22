import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { money, when } from "../../utils/format.js";

export default function WalletPage() {
  const { user, setUser } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [amount, setAmount] = useState(25000);

  const load = async () => {
    const data = await api.wallet();
    setWallet(data);
  };

  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);

  const topup = async (event) => {
    event.preventDefault();
    try {
      const data = await api.topup(Number(amount));
      toast.success(`Loaded ${money(amount)}`);
      setUser({ ...user, walletBalance: data.balance });
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>AgriFlow wallet</h1>
          <p>
            {user.role === "retailer"
              ? "Load dummy funds here. The moment a farmer hands goods to a driver, that amount leaves this wallet and lands in the farm account."
              : "Incoming payments appear when you hand accepted goods to transport."}
          </p>
        </div>
        <div className="card stat"><b>{money(wallet.balance)}</b><span>Current balance</span></div>
      </div>
      <div className="grid-2">
        {user.role === "retailer" && (
          <form className="card form" onSubmit={topup}>
            <h3 className="serif" style={{ marginTop: 0 }}>Dummy top-up</h3>
            <label>
              Amount (Rs)
              <input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <div className="row">
              {[10000, 25000, 50000].map((value) => (
                <button key={value} type="button" className="btn small ghost" onClick={() => setAmount(value)}>
                  {money(value)}
                </button>
              ))}
            </div>
            <button className="btn gold">Load money</button>
          </form>
        )}
        <div className="card">
          <h3 className="serif" style={{ marginTop: 0 }}>Ledger</h3>
          {wallet.transactions.map((tx) => (
            <div className="list-item" key={tx._id}>
              <div>
                <b>{tx.description}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {tx.type.replace("_", " ")} · {when(tx.createdAt)}
                </div>
              </div>
              <b style={{ color: tx.amount < 0 ? "var(--clay)" : "var(--ok)" }}>
                {tx.amount > 0 ? "+" : ""}{money(tx.amount)}
              </b>
            </div>
          ))}
          {wallet.transactions.length === 0 && <div className="empty-state">No movements yet.</div>}
        </div>
      </div>
    </div>
  );
}
