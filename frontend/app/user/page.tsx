"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, downloadFile } from "../../lib/api";

type Policy = {
  id: string;
  name: string;
  description: string;
  version: string;
  sourceUrl?: string | null;
};

type Platform = {
  id: string;
  name: string;
  code: string;
  baseUrl?: string | null;
};

type DetectionResult = {
  detected: boolean;
  platform: Platform;
  policies: Policy[];
};

type Report = {
  id: string;
  reportCode: string;
  platform: { name: string };
  policy?: Policy | null;
  url: string;
  status: string;
  createdAt: string;
  reportQuantity: number;
  unitPrice: number;
  totalPrice: number;
  priority: number;
};

type FormState = {
  contentType: string;
  url: string;
  policyId: string;
  priority: number;
  reportQuantity: string;
};

const UNIT_PRICE = 1500;

const initialForm: FormState = {
  contentType: "POST",
  url: "",
  policyId: "",
  priority: 2,
  reportQuantity: "1",
};

function rupiah(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default function UserPage() {
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [detecting, setDetecting] =
    useState(false);

  const [detectedPlatform, setDetectedPlatform] =
    useState<Platform | null>(null);

  const [policies, setPolicies] =
    useState<Policy[]>([]);

  const [selectedPolicy, setSelectedPolicy] =
    useState<Policy | null>(null);

  const [downloading, setDownloading] =
    useState<string | null>(null);

  async function loadReports() {
    try {
      const data = await api("/reports");
      setReports(Array.isArray(data) ? data : []);
    } catch (value) {
      const message =
        value instanceof Error
          ? value.message
          : "Gagal mengambil data laporan.";

      setError(message);

      if (
        message.toLowerCase().includes("unauthorized")
      ) {
        router.push("/");
      }
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function logout() {
    localStorage.clear();
    router.push("/");
  }

  useEffect(() => {
    const value = form.url.trim();

    setDetectedPlatform(null);
    setPolicies([]);
    setSelectedPolicy(null);

    if (!value) {
      setDetecting(false);
      return;
    }

    const timer = window.setTimeout(
      async () => {
        try {
          setDetecting(true);
          setError("");

          const result: DetectionResult =
            await api(
              `/platforms/detect?url=${encodeURIComponent(value)}`,
            );

          setDetectedPlatform(
            result.platform,
          );

          setPolicies(
            result.policies || [],
          );
        } catch (valueError) {
          setError(
            valueError instanceof Error
              ? valueError.message
              : "Platform tidak dapat dideteksi.",
          );
        } finally {
          setDetecting(false);
        }
      },
      500,
    );

    return () =>
      window.clearTimeout(timer);
  }, [form.url]);

  function selectPolicy(policyId: string) {
    setForm((current) => ({
      ...current,
      policyId,
    }));

    setSelectedPolicy(
      policies.find(
        (item) => item.id === policyId,
      ) || null,
    );
  }

  const quantity =
    Math.max(
      1,
      Number.parseInt(
        form.reportQuantity || "1",
        10,
      ) || 1,
    );

  const totalPrice =
    quantity * UNIT_PRICE;

  async function create(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!detectedPlatform) {
      setError(
        "Masukkan link media sosial yang valid sampai platform terdeteksi.",
      );
      return;
    }

    if (!form.policyId) {
      setError(
        "Silakan pilih alasan / policy pelaporan.",
      );
      return;
    }

    try {
      await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          url: form.url.trim(),
          contentType: form.contentType,
          policyId: form.policyId,
          priority: form.priority,
          reportQuantity: quantity,
        }),
      });

      setForm(initialForm);
      setDetectedPlatform(null);
      setPolicies([]);
      setSelectedPolicy(null);
      setSuccess(
        "Laporan berhasil dibuat.",
      );
      setTab("reports");
      await loadReports();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Gagal membuat report.",
      );
    }
  }

  async function downloadReport(
    report: Report,
  ) {
    try {
      setDownloading(report.id);

      await downloadFile(
        `/reports/${report.id}/pdf`,
        `ReportHub-${report.reportCode}.pdf`,
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "PDF tidak dapat diunduh.",
      );
    } finally {
      setDownloading(null);
    }
  }

  const count = (status: string) =>
    reports.filter(
      (report) =>
        report.status === status,
    ).length;

  return (
    <div className="layout">
      <aside className="side">
        <div className="brand">
          <div className="logo">
            SR
          </div>
          <b>SOCIAL REPORT</b>
        </div>

        <div
          className="muted"
          style={{ marginBottom: 16 }}
        >
          USER WORKSPACE
        </div>

        <div className="side-nav">
          <a
            href="#"
            data-short="⌂"
            className={
              tab === "dashboard"
                ? "active"
                : ""
            }
            onClick={(e) => {
              e.preventDefault();
              setTab("dashboard");
            }}
          >
            <span>Dashboard</span>
          </a>

          <a
            href="#"
            data-short="＋"
            className={
              tab === "create"
                ? "active"
                : ""
            }
            onClick={(e) => {
              e.preventDefault();
              setTab("create");
            }}
          >
            <span>Buat Report</span>
          </a>

          <a
            href="#"
            data-short="▤"
            className={
              tab === "reports"
                ? "active"
                : ""
            }
            onClick={(e) => {
              e.preventDefault();
              setTab("reports");
            }}
          >
            <span>Laporan Saya</span>
          </a>
        </div>

        <button
          className="logout"
          onClick={logout}
        >
          Keluar
        </button>
      </aside>

      <main className="main">
        {error && (
          <div
            className="error"
            style={{ marginBottom: 12 }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success"
            style={{ marginBottom: 12 }}
          >
            {success}
          </div>
        )}

        {tab === "dashboard" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <div className="eyebrow">
                  SOCIAL MEDIA • POLICY • REPORTING
                </div>

                <h2>
                  Kelola laporan dalam satu workspace.
                </h2>

                <p>
                  Masukkan link, biarkan sistem
                  mendeteksi platform, pilih policy
                  yang sesuai, lalu tentukan jumlah
                  report dan biaya secara otomatis.
                </p>

                <div className="hero-tags">
                  <div className="hero-tag">
                    Auto Platform Detection
                  </div>
                  <div className="hero-tag">
                    Policy-aware
                  </div>
                  <div className="hero-tag">
                    PDF Report
                  </div>
                </div>
              </div>
            </section>

            <div style={{ height: 16 }} />

            <div className="top">
              <div>
                <h1>Dashboard User</h1>
                <div className="muted">
                  Ringkasan laporan yang kamu buat.
                </div>
              </div>

              <button
                className="primary"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setTab("create");
                }}
              >
                + Buat Report
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="label">
                  Total Laporan
                </div>
                <div className="n">
                  {reports.length}
                </div>
              </div>

              <div className="stat">
                <div className="label">
                  Submitted
                </div>
                <div className="n">
                  {count("SUBMITTED")}
                </div>
              </div>

              <div className="stat">
                <div className="label">
                  Under Review
                </div>
                <div className="n">
                  {count("UNDER_REVIEW")}
                </div>
              </div>

              <div className="stat">
                <div className="label">
                  Resolved
                </div>
                <div className="n">
                  {count("RESOLVED")}
                </div>
              </div>
            </div>

            <ReportTable
              reports={reports.slice(0, 8)}
              onDownload={downloadReport}
              downloading={downloading}
            />
          </>
        )}

        {tab === "reports" && (
          <>
            <div className="top">
              <div>
                <h1>Laporan Saya</h1>
                <div className="muted">
                  Riwayat laporan dan dokumen PDF kamu.
                </div>
              </div>
            </div>

            <ReportTable
              reports={reports}
              onDownload={downloadReport}
              downloading={downloading}
            />
          </>
        )}

        {tab === "create" && (
          <>
            <div className="top">
              <div>
                <h1>Buat Report</h1>
                <div className="muted">
                  URL → Deteksi Platform → Policy
                  → Jumlah Report → Kalkulasi Harga.
                </div>
              </div>
            </div>

            <div className="panel">
              <form onSubmit={create}>
                <div className="field">
                  <label htmlFor="target-url">
                    Link / URL Konten atau Akun
                  </label>

                  <input
                    id="target-url"
                    type="url"
                    required
                    placeholder="https://www.instagram.com/..."
                    value={form.url}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        url: e.target.value,
                      }))
                    }
                  />

                  <div
                    className="muted"
                    style={{
                      marginTop: 7,
                    }}
                  >
                    Sistem membaca hostname URL
                    untuk menentukan platform.
                  </div>
                </div>

                <div className="field">
                  <label>
                    Platform Terdeteksi
                  </label>

                  <div
                    className="panel"
                    style={{
                      marginTop: 0,
                      padding: 13,
                    }}
                  >
                    <div className="detect-card">
                      <div className="detect-meta">
                        <div className="detect-icon">
                          {detectedPlatform
                            ? detectedPlatform.name
                                .slice(0, 2)
                                .toUpperCase()
                            : "?"}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: 900,
                            }}
                          >
                            {detecting
                              ? "Mendeteksi..."
                              : detectedPlatform?.name ||
                                "Belum terdeteksi"}
                          </div>

                          <div className="muted">
                            {detectedPlatform?.baseUrl ||
                              "Masukkan URL terlebih dahulu"}
                          </div>
                        </div>
                      </div>

                      {detectedPlatform && (
                        <span className="badge">
                          {detectedPlatform.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="content-type">
                    Jenis Konten
                  </label>

                  <select
                    id="content-type"
                    value={form.contentType}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        contentType:
                          e.target.value,
                      }))
                    }
                  >
                    <option value="POST">
                      POST
                    </option>
                    <option value="ACCOUNT">
                      ACCOUNT
                    </option>
                    <option value="VIDEO">
                      VIDEO
                    </option>
                    <option value="PHOTO">
                      PHOTO
                    </option>
                    <option value="OTHER">
                      OTHER
                    </option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="policy">
                    Alasan / Policy Pelaporan
                  </label>

                  <select
                    id="policy"
                    required
                    disabled={
                      !detectedPlatform ||
                      policies.length === 0
                    }
                    value={form.policyId}
                    onChange={(e) =>
                      selectPolicy(
                        e.target.value,
                      )
                    }
                  >
                    <option value="">
                      {!detectedPlatform
                        ? "Deteksi platform terlebih dahulu"
                        : policies.length === 0
                          ? "Policy belum tersedia"
                          : "Pilih policy yang sesuai"}
                    </option>

                    {policies.map(
                      (policy) => (
                        <option
                          key={policy.id}
                          value={policy.id}
                        >
                          {policy.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {selectedPolicy && (
                  <div className="policy-card">
                    <div className="title">
                      {selectedPolicy.name}
                    </div>

                    <div className="desc">
                      {selectedPolicy.description}
                    </div>

                    <div
                      className="muted"
                      style={{
                        marginTop: 8,
                      }}
                    >
                      Versi katalog:{" "}
                      {selectedPolicy.version}
                    </div>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="report-quantity">
                    Jumlah Report
                  </label>

                  <input
                    id="report-quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100000}
                    step={1}
                    required
                    value={form.reportQuantity}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        reportQuantity:
                          e.target.value,
                      }))
                    }
                    placeholder="Contoh: 500"
                  />

                  <div
                    className="muted"
                    style={{ marginTop: 7 }}
                  >
                    Masukkan jumlah report yang
                    diinginkan.
                  </div>
                </div>

                <div className="price-box">
                  <div className="price-line">
                    <span>
                      Harga per report
                    </span>
                    <b>
                      {rupiah(UNIT_PRICE)}
                    </b>
                  </div>

                  <div className="price-line">
                    <span>
                      Jumlah report
                    </span>
                    <b>
                      {quantity.toLocaleString(
                        "id-ID",
                      )}
                    </b>
                  </div>

                  <div className="price-total">
                    <span>
                      Total Harga
                    </span>
                    <span>
                      {rupiah(totalPrice)}
                    </span>
                  </div>
                </div>

                <div
                  style={{ marginTop: 18 }}
                >
                  <button
                    className="primary"
                    type="submit"
                    disabled={
                      detecting ||
                      !detectedPlatform ||
                      !form.policyId
                    }
                  >
                    Buat Report
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ReportTable({
  reports,
  onDownload,
  downloading,
}: {
  reports: Report[];
  onDownload: (report: Report) => void;
  downloading: string | null;
}) {
  return (
    <div className="panel">
      <h2>Laporan</h2>

      <table>
        <thead>
          <tr>
            <th>Report</th>
            <th>Platform</th>
            <th>Policy</th>
            <th>Jumlah</th>
            <th>Total</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  textAlign: "center",
                }}
              >
                Belum ada laporan.
              </td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <b>{report.reportCode}</b>
                  <div className="muted small">
                    {new Date(
                      report.createdAt,
                    ).toLocaleDateString(
                      "id-ID",
                    )}
                  </div>
                </td>

                <td>
                  {report.platform.name}
                </td>

                <td>
                  {report.policy?.name || "-"}
                </td>

                <td>
                  {(report.reportQuantity || 1).toLocaleString(
                    "id-ID",
                  )}
                </td>

                <td>
                  <b>
                    {rupiah(
                      report.totalPrice || 0,
                    )}
                  </b>
                </td>

                <td>
                  <span className="badge">
                    {report.status}
                  </span>
                </td>

                <td>
                  <button
                    className="secondary"
                    onClick={() =>
                      onDownload(report)
                    }
                    disabled={
                      downloading ===
                      report.id
                    }
                  >
                    {downloading ===
                    report.id
                      ? "Menyiapkan..."
                      : "PDF"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
