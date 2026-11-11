import { getApiBaseUrl } from "@/lib/env";

// MediNex API Client

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string> | null;
  timestamp: string;
}

export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string> | null;

  constructor(message: string, status: number, errors?: Record<string, string> | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("medinex_access_token") : null;
  const apiBaseUrl = endpoint.startsWith("http") ? "" : getApiBaseUrl();

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${apiBaseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data: ApiEnvelope<T> | null = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data?.errors);
    }

    return (data ? data.data : ({} as T)) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "An unexpected network error occurred",
      0
    );
  }
}
