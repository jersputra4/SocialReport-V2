"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import {
  api,
  downloadFile,
} from "../../lib/api";

type Policy = {
  id: string;
  name: string;
  description: string;
  version: string;
  sourceUrl?: string | null;
};

type Report = {
  id: string;
  reportCode: string;
  platform: {
    id?: string;
    name: string;
    code?: string;
  };
  policy?: Policy | null;
  reporter: {
    username: string;
    name: string;
    email: string;
  };
  url: string;
  status: string;
  contentType: string;
  reportQuantity: number;
  unitPrice: number;
  totalPrice: number;
  priority: number;
  createdAt: string;
};

type EditForm = {
  url: string;
  contentType: string;
  policyId: string;
  reportQuantity: string;
  priority: string;
  status: string;
};

function rupiah(value: number) {
  return `Rp ${Number(
    value || 0,
  ).toLocaleString("id-ID")}`;
}

const statuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEED_INFORMATION",
  "APPROVED",
  "REPORTING",
  "PLATFORM_REVIEW",
  "ACTION_TAKEN",
  "RESOLVED",
  "REJECTED",
  "CLOSED",
];

export default function AdminPage() {
  const router = useRouter();

  const [reports, setReports] =
    useState<Report[]>([]);

  const [tab, setTab] =
    useState("dashboard");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [selected, setSelected] =
    useState<Report | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm | null>(null);

  const [editPolicies, setEditPolicies] =
    useState<Policy[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [downloading, setDownloading] =
    useState<string | null>(null);

  async function load() {
    try {
      const data = await api(
        `/reports?search=${encodeURIComponent(
          search,
        )}&status=${encodeURIComponent(
          status,
        )}`,
      );

      setReports(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (value) {
      const message =
        value instanceof Error
          ? value.message
          : "Gagal memuat laporan.";

      setError(message);

      if (
        message
          .toLowerCase()
          .includes("unauthorized")
      ) {
        router.push("/");
      }
    }
  }

  useEffect(() => {
    load();
  }, [search, status]);

  function logout() {
    localStorage.clear();
    router.push("/");
  }

  async function openEdit(
    report: Report,
  ) {
    setError("");
    setSuccess("");
    setSelected(report);

    setEditForm({
      url: report.url,
      contentType: report.contentType,
      policyId:
        report.policy?.id || "",
      reportQuantity: String(
        report.reportQuantity || 1,
      ),
      priority: String(
        report.priority || 2,
      ),
      status: report.status,
    });

    try {
      const detected =
        await api(
          `/platforms/detect?url=${encodeURIComponent(
            report.url,
          )}`,
        );

      setEditPolicies(
        detected.policies || [],
      );
    } catch (value) {
      setEditPolicies([]);

      setError(
        value instanceof Error
          ? value.message
          : "Policy tidak dapat dimuat.",
      );
    }
  }

  async function refreshPoliciesFromUrl(
    url: string,
  ) {
    if (!url.trim()) return;

    try {
      const detected =
        await api(
          `/platforms/detect?url=${encodeURIComponent(
            url.trim(),
          )}`,
        );

      setEditPolicies(
        detected.policies || [],
      );

      setEditForm(
        (current) =>
          current
            ? {
                ...current,
                policyId: "",
              }
            : current,
      );
    } catch (value) {
      setEditPolicies([]);

      setError(
        value instanceof Error
          ? value.message
          : "URL atau platform tidak valid.",
      );
    }
  }

  async function saveEdit() {
    if (!selected || !editForm)
      return;

    const quantity =
      Number(
        editForm.reportQuantity,
      );

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "Jumlah Report harus berupa angka bulat minimal 1.",
      );
      return;
    }

    if (!editForm.policyId) {
      setError(
        "Pilih policy sebelum menyimpan perubahan.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api(
        `/reports/${selected.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            url: editForm.url.trim(),
            contentType:
              editForm.contentType,
            policyId:
              editForm.policyId,
            reportQuantity:
              quantity,
            priority: Number(
              editForm.priority,
            ),
            status:
              editForm.status,
          }),
        },
      );

      setSuccess(
        `Laporan ${selected.reportCode} berhasil diperbarui.`,
      );

      setSelected(null);
      setEditForm(null);

      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Gagal menyimpan perubahan.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(
    report: Report,
  ) {
    const yes =
      window.confirm(
        `Hapus laporan ${report.reportCode}? Data akan disimpan sebagai arsip nonaktif dan tidak tampil pada daftar aktif.`,
      );

    if (!yes) return;

    try {
      await api(
        `/reports/${report.id}`,
        {
          method: "DELETE",
        },
      );

      setSuccess(
        `Laporan ${report.reportCode} berhasil dihapus dari daftar aktif.`,
      );

      setSelected(null);
      setEditForm(null);

      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Gagal menghapus laporan.",
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

  const stats =
    useMemo(
      () => ({
        total: reports.length,
        submitted:
          reports.filter(
            (x) =>
              x.status ===
              "SUBMITTED",
          ).length,
        review:
          reports.filter(
            (x) =>
              x.status ===
              "UNDER_REVIEW",
          ).length,
        resolved:
          reports.filter(
            (x) =>
              x.status ===
              "RESOLVED",
          ).length,
      }),
      [reports],
    );

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
          style={{
            marginBottom: 16,
          }}
        >
          ADMIN WORKSPACE
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
            <span>Kelola Laporan</span>
          </a>

          <a
            href="#"
            data-short="U"
            className={
              tab === "users"
                ? "active"
                : ""
            }
            onClick={(e) => {
              e.preventDefault();
              setTab("users");
            }}
          >
            <span>Users</span>
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
            style={{
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success"
            style={{
              marginBottom: 12,
            }}
          >
            {success}
          </div>
        )}

        {tab === "dashboard" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <div className="eyebrow">
                  ADMIN • GOVERNANCE • POLICY
                </div>

                <h2>
                  Command center untuk laporan.
                </h2>

                <p>
                  Kelola, edit, hapus, review,
                  dan unduh dokumen PDF laporan
                  dari satu workspace administratif.
                </p>

                <div className="hero-tags">
                  <div className="hero-tag">
                    Edit Report
                  </div>
                  <div className="hero-tag">
                    Soft Delete
                  </div>
                  <div className="hero-tag">
                    PDF Export
                  </div>
                  <div className="hero-tag">
                    Policy Management
                  </div>
                </div>
              </div>
            </section>

            <div style={{ height: 16 }} />

            <div className="top">
              <div>
                <h1>
                  Admin Dashboard
                </h1>
                <div className="muted">
                  Monitoring laporan aktif.
                </div>
              </div>

              <button
                className="primary"
                onClick={() =>
                  setTab("reports")
                }
              >
                Kelola Laporan
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="label">
                  Total
                </div>
                <div className="n">
                  {stats.total}
                </div>
              </div>

              <div className="stat">
                <div className="label">
                  Submitted
                </div>
                <div className="n">
                  {stats.submitted}
                </div>
              </div>

              <div className="stat">
                <div className="label">
                  Under Review
                </div>
                <div className="n">
                  {stats.review}
                </div>
              </div>

              <div className="stat">
                <div className="label">
                  Resolved
                </div>
                <div className="n">
                  {stats.resolved}
                </div>
              </div>
            </div>

            <AdminTable
              reports={reports.slice(
                0,
                10,
              )}
              onEdit={openEdit}
              onDelete={remove}
              onDownload={
                downloadReport
              }
              downloading={
                downloading
              }
            />
          </>
        )}

        {tab === "reports" && (
          <>
            <div className="top">
              <div>
                <h1>
                  Kelola Laporan
                </h1>
                <div className="muted">
                  Admin dapat mengedit,
                  menghapus, dan mengunduh PDF.
                </div>
              </div>
            </div>

            <div className="toolbar">
              <input
                placeholder="Cari report / URL / policy"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value,
                  )
                }
              >
                <option value="">
                  Semua status
                </option>

                {statuses.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ),
                )}
              </select>
            </div>

            <AdminTable
              reports={reports}
              onEdit={openEdit}
              onDelete={remove}
              onDownload={
                downloadReport
              }
              downloading={
                downloading
              }
            />
          </>
        )}

        {tab === "users" && (
          <div className="panel">
            <h2>
              User Management
            </h2>

            <table>
              <thead>
                <tr>
                  <th>
                    Username
                  </th>
                  <th>
                    Role
                  </th>
                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>
                    admin
                  </td>
                  <td>
                    ADMIN
                  </td>
                  <td>
                    <span className="badge success">
                      Active
                    </span>
                  </td>
                </tr>

                <tr>
                  <td>
                    user
                  </td>
                  <td>
                    USER
                  </td>
                  <td>
                    <span className="badge success">
                      Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selected && editForm && (
          <div className="modal">
            <div className="modalbox">
              <div className="modalhead">
                <div>
                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    Edit{" "}
                    {
                      selected.reportCode
                    }
                  </h2>

                  <div
                    className="muted"
                    style={{
                      marginTop: 5,
                    }}
                  >
                    Perubahan isi laporan
                    disimpan ke PostgreSQL.
                  </div>
                </div>

                <span className="badge">
                  ADMIN
                </span>
              </div>

              <div className="field">
                <label>
                  URL Target
                </label>

                <input
                  value={
                    editForm.url
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      url: e.target.value,
                    })
                  }
                  onBlur={() =>
                    refreshPoliciesFromUrl(
                      editForm.url,
                    )
                  }
                />
              </div>

              <div className="field">
                <label>
                  Jenis Konten
                </label>

                <select
                  value={
                    editForm.contentType
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contentType:
                        e.target.value,
                    })
                  }
                >
                  <option>
                    POST
                  </option>
                  <option>
                    ACCOUNT
                  </option>
                  <option>
                    VIDEO
                  </option>
                  <option>
                    PHOTO
                  </option>
                  <option>
                    OTHER
                  </option>
                </select>
              </div>

              <div className="field">
                <label>
                  Policy
                </label>

                <select
                  required
                  value={
                    editForm.policyId
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      policyId:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    Pilih policy
                  </option>

                  {editPolicies.map(
                    (policy) => (
                      <option
                        key={
                          policy.id
                        }
                        value={
                          policy.id
                        }
                      >
                        {
                          policy.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="field">
                <label>
                  Jumlah Report
                </label>

                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={
                    editForm.reportQuantity
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      reportQuantity:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label>
                  Prioritas
                </label>

                <select
                  value={
                    editForm.priority
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      priority:
                        e.target.value,
                    })
                  }
                >
                  <option value="1">
                    1 - Tertinggi
                  </option>
                  <option value="2">
                    2 - Tinggi
                  </option>
                  <option value="3">
                    3 - Normal
                  </option>
                  <option value="4">
                    4 - Rendah
                  </option>
                  <option value="5">
                    5 - Paling Rendah
                  </option>
                </select>
              </div>

              <div className="field">
                <label>
                  Status
                </label>

                <select
                  value={
                    editForm.status
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status:
                        e.target.value,
                    })
                  }
                >
                  {statuses.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="price-box">
                <div className="price-line">
                  <span>
                    Harga / report
                  </span>
                  <b>
                    {rupiah(1500)}
                  </b>
                </div>

                <div className="price-line">
                  <span>
                    Jumlah
                  </span>
                  <b>
                    {Number(
                      editForm.reportQuantity ||
                        1,
                    ).toLocaleString(
                      "id-ID",
                    )}
                  </b>
                </div>

                <div className="price-total">
                  <span>
                    Total
                  </span>

                  <span>
                    {rupiah(
                      (Number(
                        editForm.reportQuantity ||
                          1,
                      ) || 1) *
                        1500,
                    )}
                  </span>
                </div>
              </div>

              <div className="modalfoot">
                <button
                  className="secondary"
                  onClick={() => {
                    setSelected(null);
                    setEditForm(null);
                  }}
                >
                  Batal
                </button>

                <button
                  className="danger"
                  onClick={() =>
                    remove(
                      selected,
                    )
                  }
                >
                  Hapus
                </button>

                <button
                  className="primary"
                  onClick={
                    saveEdit
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminTable({
  reports,
  onEdit,
  onDelete,
  onDownload,
  downloading,
}: {
  reports: Report[];
  onEdit: (report: Report) => void;
  onDelete: (report: Report) => void;
  onDownload: (
    report: Report,
  ) => void;
  downloading: string | null;
}) {
  return (
    <div className="panel">
      <h2>
        Laporan Aktif
      </h2>

      <table>
        <thead>
          <tr>
            <th>Report</th>
            <th>User</th>
            <th>Platform</th>
            <th>Policy</th>
            <th>Jumlah</th>
            <th>Total</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {reports.length ===
          0 ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  textAlign: "center",
                }}
              >
                Tidak ada laporan.
              </td>
            </tr>
          ) : (
            reports.map(
              (report) => (
                <tr
                  key={report.id}
                >
                  <td>
                    <b>
                      {
                        report.reportCode
                      }
                    </b>

                    <div className="muted small">
                      {new Date(
                        report.createdAt,
                      ).toLocaleDateString(
                        "id-ID",
                      )}
                    </div>
                  </td>

                  <td>
                    <b>
                      {
                        report.reporter
                          .username
                      }
                    </b>

                    <div className="muted small">
                      {
                        report
                          .reporter
                          .email
                      }
                    </div>
                  </td>

                  <td>
                    {
                      report
                        .platform
                        .name
                    }
                  </td>

                  <td>
                    {
                      report
                        .policy
                        ?.name ||
                      "-"
                    }
                  </td>

                  <td>
                    {(
                      report.reportQuantity ||
                      1
                    ).toLocaleString(
                      "id-ID",
                    )}
                  </td>

                  <td>
                    <b>
                      {rupiah(
                        report.totalPrice ||
                          0,
                      )}
                    </b>
                  </td>

                  <td>
                    <span className="badge">
                      {
                        report.status
                      }
                    </span>
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() =>
                          onEdit(
                            report,
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="ghost"
                        onClick={() =>
                          onDownload(
                            report,
                          )
                        }
                        disabled={
                          downloading ===
                          report.id
                        }
                      >
                        {downloading ===
                        report.id
                          ? "..."
                          : "PDF"}
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          onDelete(
                            report,
                          )
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
