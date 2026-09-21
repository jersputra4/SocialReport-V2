const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

export function token(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("reporthub_token") || "";
}

export async function api(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const currentToken = token();

  if (currentToken) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server. Pastikan backend ReportHub sedang berjalan.",
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;

    throw new Error(message || "Request gagal");
  }

  return data;
}

export async function downloadFile(
  path: string,
  suggestedFileName: string,
): Promise<void> {
  const currentToken = token();

  let response: Response;

  try {
    response = await fetch(`${API}${path}`, {
      method: "GET",
      headers: currentToken
        ? { Authorization: `Bearer ${currentToken}` }
        : undefined,
    });
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server. Pastikan backend ReportHub sedang berjalan.",
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;

    throw new Error(message || "File tidak dapat diunduh");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = suggestedFileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
