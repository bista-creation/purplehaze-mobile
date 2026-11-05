import { supabase } from "./supabase";
import type { ApiResponse } from "../shared";

function cleanUrl(url?: string): string {
  if (!url) return "";
  return url
    .replace(/^[\uFEFF\u200B-\u200D\s]+|[\uFEFF\u200B-\u200D\s]+$/g, "")
    .trim()
    .replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `http://${host}:3000/api/v1`;
    }
  }

  const rawEnv = process.env.EXPO_PUBLIC_API_URL;
  const envUrl = cleanUrl(rawEnv);
  if (envUrl && !envUrl.includes("purple-haze-git-feature-api-v1-bistacreation-3818.vercel.app")) {
    return envUrl;
  }

  return "https://purplehaze-nine.vercel.app/api/v1";
}

export const API_BASE_URL = getApiBaseUrl();

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
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      void supabase.auth.signOut();
      return null;
    }
    if (!data.session?.access_token) {
      void supabase.auth.signOut();
      return null;
    }
    return data.session.access_token;
  } catch (e) {
    console.warn("Failed to refresh token", e);
  }

  return null;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const baseUrl = cleanUrl(getApiBaseUrl());
  const cleanEndpoint = endpoint.replace(/^[\uFEFF\u200B-\u200D\s]+/, "").trim();
  const url = cleanEndpoint.startsWith("http")
    ? cleanEndpoint
    : `${baseUrl}${cleanEndpoint.startsWith("/") ? "" : "/"}${cleanEndpoint}`;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

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
