import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { money, statusLabel, when } from "../../utils/format.js";

const BANKS = [
  "Nabil Bank",
  "NIC Asia Bank",
  "Global IME Bank",
  "Himalayan Bank",
  "NMB Bank",
  "Prabhu Bank",
  "Rastriya Banijya Bank",
  "Nepal Investment Mega Bank",
];

const bankKey = (userId) => `agriflow_bank_${userId}`;

const loadBankState = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(bankKey(userId))) || { account: null, transfers: [] };
  } catch {
    return { account: null, transfers: [] };
  }
};

const saveBankState = (userId, next) => {
  localStorage.setItem(bankKey(userId), JSON.stringify(next));
};

const maskAccount = (value = "") => {
  const digits = String(value).replace(/\s/g, "");
  if (digits.length < 4) return digits;
  return `•••• ${digits.slice(-4)}`;
};

export default function WalletPage() {
  const { user, setUser } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, escrowHeld: 0, incomingEscrow: 0, transactions: [], escrows: [] });
  const [bank, setBank] = useState({ account: null, transfers: [] });
  const [topupAmount, setTopupAmount] = useState(25000);
  const [step, setStep] = useState("form");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    bankName: "Nabil Bank",
    holder: user.name || "",
    accountNumber: "",
    branch: "",
    amount: "",
  });

  const load = async () => {
    const data = await api.wallet();
    setWallet(data);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
    const stored = loadBankState(user._id);
    setBank(stored);
    if (stored.account) {
      setForm((prev) => ({
        ...prev,
        bankName: stored.account.bankName,
        holder: stored.account.holder,
        accountNumber: stored.account.accountNumber,
        branch: stored.account.branch,
      }));
    }
  }, [user._id]);

  const withdrawn = useMemo(
    () => (bank.transfers || []).filter((item) => item.status === "sent").reduce((sum, item) => sum + Number(item.amount), 0),
    [bank.transfers]
  );
  const available = Math.max(0, Number(wallet.balance || 0) - withdrawn);

  const setField = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const topup = async (event) => {
    event.preventDefault();
    try {
      const data = await api.topup(Number(topupAmount));
      toast.success(`${money(topupAmount)} received from ${form.bankName || "your bank"}`);
      setUser({ ...user, walletBalance: data.balance, escrowHeld: data.escrowHeld });
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const beginTransfer = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.accountNumber || form.accountNumber.replace(/\s/g, "").length < 8) {
      toast.error("Enter a valid bank account number");
      return;
    }
    if (!form.holder.trim()) {
      toast.error("Account holder name is required");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter an amount to transfer");
      return;
    }
    if (amount > available) {
      toast.error("Amount is more than your available AgriFlow balance");
      return;
    }
    setStep("confirm");
  };

  const sendToBank = async () => {
    setSending(true);
    setStep("sending");
    const amount = Number(form.amount);
    const transfer = {
      id: `NPS${Date.now()}`,
      amount,
      bankName: form.bankName,
      holder: form.holder,
      accountNumber: form.accountNumber,
      branch: form.branch,
      status: "sent",
      at: new Date().toISOString(),
    };
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const next = {
      account: {
        bankName: form.bankName,
        holder: form.holder,
        accountNumber: form.accountNumber,
        branch: form.branch,
      },
      transfers: [transfer, ...(bank.transfers || [])],
    };
    setBank(next);
    saveBankState(user._id, next);
    setSending(false);
    setStep("done");
    setForm((prev) => ({ ...prev, amount: "" }));
    toast.success(`${money(amount)} sent to ${form.bankName} ${maskAccount(form.accountNumber)}`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Escrow wallet</h1>
          <p>
            {user.role === "retailer"
              ? "Move money in from your bank, lock it in AgriFlow escrow when a farmer accepts, and send unused balance back to your account."
              : "Escrow lands here after delivery. Transfer that balance straight to your bank account."}
          </p>
        </div>
      </div>
      <div className="stats">
        <div className="card stat"><b>{money(available)}</b><span>Available</span></div>
        {user.role === "retailer" && (
          <div className="card stat"><b>{money(wallet.escrowHeld)}</b><span>Locked in escrow</span></div>
        )}
        {user.role === "farmer" && (
          <div className="card stat"><b>{money(wallet.incomingEscrow)}</b><span>Incoming escrow</span></div>
        )}
        <div className="card stat"><b>{money(withdrawn)}</b><span>Sent to bank</span></div>
      </div>
      <div className="grid-2">
        <form className="card form" onSubmit={beginTransfer}>
          <h3 className="serif" style={{ marginTop: 0 }}>Transfer to bank</h3>
          <div className="bank-steps">
            <span className={step === "form" ? "on" : ""}>1. Account</span>
            <span className={step === "confirm" ? "on" : ""}>2. Review</span>
            <span className={step === "sending" || step === "done" ? "on" : ""}>3. Send</span>
          </div>
          {step === "form" && (
            <>
              <label>
                Bank
                <select value={form.bankName} onChange={setField("bankName")}>
                  {BANKS.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label>Account holder<input value={form.holder} onChange={setField("holder")} required /></label>
              <label>Account number<input value={form.accountNumber} onChange={setField("accountNumber")} placeholder="001234567890" required /></label>
              <label>Branch<input value={form.branch} onChange={setField("branch")} placeholder="New Baneshwor" /></label>
              <label>Amount (Rs)<input type="number" min="1" max={available} value={form.amount} onChange={setField("amount")} required /></label>
              <button className="btn" disabled={available <= 0}>Continue to review</button>
            </>
          )}
          {step === "confirm" && (
            <div className="stack">
              <div className="bank-box">
                <div className="list-item"><span>Bank</span><b>{form.bankName}</b></div>
                <div className="list-item"><span>Holder</span><b>{form.holder}</b></div>
                <div className="list-item"><span>Account</span><b>{maskAccount(form.accountNumber)}</b></div>
                <div className="list-item"><span>Branch</span><b>{form.branch || "—"}</b></div>
                <div className="list-item"><span>You send</span><b>{money(form.amount)}</b></div>
                <div className="list-item"><span>Rail</span><b>NPS instant credit</b></div>
              </div>
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setStep("form")}>Back</button>
                <button type="button" className="btn gold" onClick={sendToBank}>Send to bank</button>
              </div>
            </div>
          )}
          {step === "sending" && (
            <div className="empty-state">Contacting {form.bankName}… {sending ? "authorizing transfer" : ""}</div>
          )}
          {step === "done" && (
            <div className="stack">
              <div className="badge ok">Transfer completed</div>
              <p>The amount has left your AgriFlow wallet and is on the way to {form.bankName} {maskAccount(form.accountNumber)}.</p>
              <button type="button" className="btn" onClick={() => setStep("form")}>New transfer</button>
            </div>
          )}
        </form>

        {user.role === "retailer" && (
          <form className="card form" onSubmit={topup}>
            <h3 className="serif" style={{ marginTop: 0 }}>Add from bank</h3>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>Debit your linked account and credit AgriFlow.</p>
            <label>
              From bank
              <select value={form.bankName} onChange={setField("bankName")}>
                {BANKS.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label>
              Amount (Rs)
              <input type="number" min="100" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} />
            </label>
            <div className="row">
              {[10000, 25000, 50000].map((value) => (
                <button key={value} type="button" className="btn small ghost" onClick={() => setTopupAmount(value)}>
                  {money(value)}
                </button>
              ))}
            </div>
            <button className="btn gold">Transfer into AgriFlow</button>
          </form>
        )}

        <div className="card">
          <h3 className="serif" style={{ marginTop: 0 }}>Bank transfers</h3>
          {(bank.transfers || []).map((item) => (
            <div className="list-item" key={item.id}>
              <div>
                <b>{item.bankName} {maskAccount(item.accountNumber)}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {item.id} · {item.holder} · {when(item.at)}
                </div>
              </div>
              <b style={{ color: "var(--clay)" }}>-{money(item.amount)}</b>
            </div>
          ))}
          {(bank.transfers || []).length === 0 && <div className="empty-state">No bank transfers yet.</div>}
        </div>

        <div className="card">
          <h3 className="serif" style={{ marginTop: 0 }}>Escrow contracts</h3>
          {(wallet.escrows || []).map((escrow) => (
            <div className="list-item" key={escrow._id}>
              <div>
                <b>{escrow.reference}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {escrow.farmer?.farmName || escrow.farmer?.name} · {statusLabel(escrow.status)} · {when(escrow.heldAt)}
                </div>
              </div>
              <b>{money(escrow.amount)}</b>
            </div>
          ))}
          {(wallet.escrows || []).length === 0 && <div className="empty-state">No escrow holds yet.</div>}
        </div>

        <div className="card">
          <h3 className="serif" style={{ marginTop: 0 }}>Ledger</h3>
          {wallet.transactions.map((tx) => (
            <div className="list-item" key={tx._id}>
              <div>
                <b>{tx.description}</b>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {tx.type.replace(/_/g, " ")} · {when(tx.createdAt)}
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
