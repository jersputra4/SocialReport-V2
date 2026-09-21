"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("reporthub_token", data.accessToken);
      localStorage.setItem("reporthub_user", JSON.stringify(data.user));

      router.push(data.user.role === "ADMIN" ? "/admin" : "/user");
    } catch (err: any) {
      setError(err.message || "Username atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <div className="card">
        <div className="brand">
          <div className="logo">RH</div>
          <div>
            <h2 style={{ margin: 0 }}>ReportHub</h2>
            <span className="muted">Social Media Reporting System</span>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="primary"
            style={{ width: "100%" }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div
          className="panel"
          style={{ marginTop: 18, fontSize: 13, textAlign: "center" }}
        >
          Belum punya akun?{" "}
          <a
            href="/register"
            style={{ color: "#1769e0", fontWeight: 700, textDecoration: "none" }}
          >
            Daftar sekarang
          </a>
        </div>

        <div className="panel" style={{ marginTop: 10, fontSize: 12 }}>
          Demo: <b>admin/admin123</b> atau <b>user/user123</b>
        </div>
      </div>
    </main>
  );
}
