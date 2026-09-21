"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { api } from "../../lib/api";

type RegisterForm = {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialForm: RegisterForm = {
  username: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(field: keyof RegisterForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.username.trim().length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: form.username.trim(),
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });

      router.push("/?registered=1");
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Pendaftaran gagal.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <section className="auth-visual">
        <div className="auth-copy">
          <div className="eyebrow">CREATE YOUR WORKSPACE</div>
          <h1>Build a safer report.</h1>
          <p>
            Buat akun untuk menyimpan laporan, pilihan policy, jumlah report,
            status proses, dan dokumen PDF dalam satu workspace.
          </p>
          <div className="auth-pills">
            <div className="auth-pill">Secure Account</div>
            <div className="auth-pill">Policy-aware</div>
            <div className="auth-pill">PDF Report</div>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="brand">
          <div className="logo">RH</div>
          <div>
            <h2 className="auth-title">Buat akun</h2>
            <div className="muted auth-subtitle">
              Daftar sebagai pengguna ReportHub
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Username *</label>
            <input
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="Contoh: jerysaputra"
              minLength={3}
              maxLength={50}
              required
            />
          </div>

          <div className="field">
            <label>Nama Lengkap *</label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="field">
            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className="field">
            <label>Nomor Telepon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="field">
            <label>Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
            />
          </div>

          <div className="field">
            <label>Konfirmasi Password *</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              placeholder="Ulangi password"
              minLength={8}
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <div className="panel" style={{ textAlign: "center" }}>
          Sudah punya akun?{" "}
          <a
            href="/"
            style={{
              color: "#2563eb",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Kembali ke login
          </a>
        </div>
      </section>
    </main>
  );
}
