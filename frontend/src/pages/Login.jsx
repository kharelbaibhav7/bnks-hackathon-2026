import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { roleHome } from "../utils/format.js";

const DEMOS = [
  ["Green Valley Mart", "mart@agriflow.com", "retailer"],
  ["Ram Bahadur Magar", "ram@agriflow.com", "farmer"],
  ["Sita Devi Karki", "sita@agriflow.com", "farmer"],
  ["Hari Sharma", "hari@agriflow.com", "farmer"],
  ["Bikash Tamang", "bikash@agriflow.com", "driver"],
];

export default function Login() {
  const { persist } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "agriflow123" });
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api.login(form);
      persist(data.token, data.user);
      navigate(roleHome(data.user.role));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    try {
      await api.seed();
      toast.success("Demo farms, mart and drivers are ready. Password: agriflow123");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card card">
        <div className="brand" style={{ marginBottom: 16 }}><div className="mark">A</div> AgriFlow</div>
        <h2 className="serif" style={{ margin: "0 0 8px" }}>Sign in</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Use your account or a prepared demo role.</p>
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Continue"}</button>
        </form>
        <button className="btn ghost" style={{ width: "100%", marginTop: 10 }} onClick={seed}>
          Load demo data
        </button>
        <div className="demo-grid">
          {DEMOS.map(([name, email, role]) => (
            <button
              key={email}
              className="demo-btn"
              onClick={() => setForm({ email, password: "agriflow123" })}
            >
              <b>{name}</b>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{role} · {email}</div>
            </button>
          ))}
        </div>
        <p style={{ marginBottom: 0 }}>New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
