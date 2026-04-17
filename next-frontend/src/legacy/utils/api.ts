import { API_BASE } from "../config";

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

export function getApiBase() {
  if (API_BASE?.trim()) {
    return API_BASE;
  }

  // In local dev, default to Express backend unless NEXT_PUBLIC_API_URL overrides it.
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  return window.location.origin;
}

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {}
) {
  const base = getApiBase();
  const { skipAuthRedirect = false, ...requestOptions } = options;

  const token = localStorage.getItem("token");
  const isFormData = requestOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(requestOptions.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${base}${endpoint}`, {
    ...requestOptions,
    headers,
  });

  if (res.status === 401 && !skipAuthRedirect) {
    localStorage.removeItem("token");
    window.location.reload();
  }

  return res;
}