import Constants from "expo-constants";
import { tokenStorage } from "./token-storage";
import type { ApiResponse, AuthTokens } from "../shared";

function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
    return "http://localhost:3000/api/v1";
  }
  return "http://localhost:3000/api/v1";
}

export const API_BASE_URL = resolveApiBaseUrl();

class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAuthTokens(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await tokenStorage.clearTokens();
      return null;
    }

    const json = (await res.json()) as ApiResponse<AuthTokens>;
    if (json.data?.accessToken && json.data?.refreshToken) {
      await tokenStorage.setAccessToken(json.data.accessToken);
      await tokenStorage.setRefreshToken(json.data.refreshToken);
      return json.data.accessToken;
    }
  } catch (e) {
    console.warn("Failed to refresh token", e);
  }

  await tokenStorage.clearTokens();
  return null;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = await tokenStorage.getAccessToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized with token refresh
  if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAuthTokens();
      isRefreshing = false;
      onRefreshed(newToken);

      if (newToken) {
        return request<T>(endpoint, options, true);
      }
    } else {
      // Wait for concurrent refresh
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push((newToken) => {
          if (newToken) {
            resolve(request<T>(endpoint, options, true));
          } else {
            reject(new ApiError("UNAUTHORIZED", "Session expired. Please sign in again.", 401));
          }
        });
      });
    }
  }

  const data = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || (data && data.success === false)) {
    const code = data?.error?.code || `HTTP_${response.status}`;
    const message = data?.error?.message || response.statusText || "Something went wrong.";
    throw new ApiError(code, message, response.status, data?.error?.details);
  }

  return (data?.data ?? data) as T;
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", headers }),

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "DELETE", headers }),
};
