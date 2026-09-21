const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function token(): string {
  if (typeof window === "undefined") {
    return "";
  }

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
