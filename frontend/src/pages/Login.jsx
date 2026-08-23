import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import Brand from "../components/Brand.jsx";
import { FadeIn } from "../components/PageMotion.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { roleHome } from "../utils/format.js";

export default function Login() {
  const { persist } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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

  return (
    <div className="auth">
      <FadeIn className="auth-card card">
        <div style={{ marginBottom: 16 }}><Brand size={48} /></div>
        <h2 className="serif" style={{ margin: "0 0 8px" }}>Sign in</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Use your AgriFlow email and password.</p>
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
        <p style={{ marginBottom: 0 }}>New here? <Link to="/register">Create an account</Link></p>
      </FadeIn>
    </div>
  );
}
