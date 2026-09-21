"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { api } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1") {
      setSuccess(
        "Pendaftaran berhasil. Silakan login menggunakan akun yang baru dibuat.",
      );
      window.history.replaceState({}, "", "/");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      localStorage.setItem("reporthub_token", data.accessToken);
      localStorage.setItem("reporthub_user", JSON.stringify(data.user));

      router.push(data.user.role === "ADMIN" ? "/admin" : "/user");
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Username atau password salah.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <section className="auth-visual">
        <div className="auth-copy">
          <div className="eyebrow">REPORTING • POLICY • TECHNOLOGY</div>
          <h1>SOCIAL REPORT</h1>
          <p>
            Workspace digital untuk mendokumentasikan target media sosial,
            memilih policy yang sesuai, menghitung kebutuhan report, dan
            mengelola laporan secara terstruktur.
          </p>

          <div className="auth-pills">
            <div className="auth-pill">Instagram</div>
            <div className="auth-pill">Facebook</div>
            <div className="auth-pill">TikTok</div>
            <div className="auth-pill">X</div>
            <div className="auth-pill">YouTube</div>
            <div className="auth-pill">Policy Engine</div>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="brand">
          <div className="logo">RH</div>
          <div>
            <h2 className="auth-title">Selamat datang</h2>
            <div className="muted auth-subtitle">
              Masuk ke workspace social report
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              minLength={3}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </div>

          {success && <div className="success">{success}</div>}
          {error && <div className="error">{error}</div>}

          <button
            className="primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="panel" style={{ textAlign: "center", marginTop: 16 }}>
          Belum punya akun?{" "}
          <a
            href="/register"
            style={{
              color: "#2563eb",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Daftar sekarang
          </a>
        </div>

        {/* <div className="muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
          Demo: <b>admin/admin123</b> atau <b>user/user123</b>
        </div> */}
      </section>
    </main>
  );
}
