const DEFAULT_BACKEND_URL = "https://fianance-management-system-erp.onrender.com";
const CSRF_STORAGE_KEY = "jewel_finance_csrf_token";

export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_DJANGO_API_URL ??
  process.env.DJANGO_API_URL ??
  DEFAULT_BACKEND_URL
).replace(/\/+$/, "");

export function isUnsafeMethod(method) {
  return !["GET", "HEAD", "OPTIONS"].includes(String(method || "GET").toUpperCase());
}

export function getStoredCsrfToken() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(CSRF_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeCsrfToken(token) {
  if (!token || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures in constrained browsers.
  }
}

export function clearStoredCsrfToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    // Ignore storage failures in constrained browsers.
  }
}

export function buildBackendApiUrl(inputUrl) {
  if (!inputUrl || typeof window === "undefined") {
    return null;
  }

  const url = new URL(String(inputUrl), window.location.origin);

  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  const pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  return `${BACKEND_URL}${pathname}${url.search}`;
}

export async function fetchCsrfToken(fetchImpl = fetch) {
  const response = await fetchImpl(`${BACKEND_URL}/api/csrf/`, {
    method: "GET",
    credentials: "include",
    mode: "cors",
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  const data = await response.json().catch(() => ({}));
  const csrfToken = String(data.csrf_token ?? "").trim();

  if (csrfToken) {
    storeCsrfToken(csrfToken);
  }

  return csrfToken;
}
