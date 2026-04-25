import { API_BASE } from "../config";

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

const API_BASE_STORAGE_KEY = "studyflow_api_base";

function normalizeOrigin(value: string | null | undefined) {
  if (!value || !value.trim()) return null;
  try {
    return new URL(value, window.location.origin).origin;
  } catch {
    return null;
  }
}

function getPinnedApiBase() {
  try {
    return normalizeOrigin(localStorage.getItem(API_BASE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function setPinnedApiBase(base: string) {
  try {
    localStorage.setItem(API_BASE_STORAGE_KEY, base);
  } catch {
    // Ignore storage errors.
  }
}

function getCandidateApiBases() {
  const candidates: string[] = [];
  const add = (value: string | null | undefined) => {
    const origin = normalizeOrigin(value);
    if (origin && !candidates.includes(origin)) {
      candidates.push(origin);
    }
  };

  add(getPinnedApiBase());
  add(API_BASE);

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocal) {
    add("http://localhost:5000");
  }

  add(window.location.origin);

  return candidates;
}

export function getApiBase() {
  return getCandidateApiBases()[0] ?? window.location.origin;
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

  const bases = getCandidateApiBases();
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    try {
      const res = await fetch(`${base}${endpoint}`, {
        ...requestOptions,
        headers,
      });

      // Pin the working API origin so all subsequent requests stay consistent.
      if (res.ok) {
        setPinnedApiBase(base);
        return res;
      }

      lastResponse = res;

      const isRetryableStatus = res.status === 401 || res.status === 404 || res.status >= 500;
      const hasFallback = i < bases.length - 1;

      if (isRetryableStatus && hasFallback) {
        continue;
      }

      if (res.status === 401) {
        // If we are in Focus Mode or the request explicitly asked to skip redirect,
        // we just return the response and let the caller handle it.
        const isFocusMode = typeof window !== "undefined" && window.location.pathname.includes("/pomodoro");
        if (skipAuthRedirect || isFocusMode) {
          console.warn(`401 Unauthorized for ${endpoint} (skipped redirect)`);
          return res;
        }

        localStorage.removeItem("token");
        localStorage.removeItem(API_BASE_STORAGE_KEY);
        window.location.reload();
      }

      return res;
    } catch (error) {
      lastError = error;
      const hasFallback = i < bases.length - 1;
      if (hasFallback) {
        continue;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}