/**
 * HTTP Handler Utility
 * Handles common HTTP responses including 401 Unauthorized
 */

import { env } from "@/config/env";

export interface HttpOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials;
}

/**
 * Makes an HTTP request with automatic 401 handling and token refresh
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Response object
 */
export async function httpRequest(
  url: string,
  options: HttpOptions = {},
): Promise<Response> {
  const {
    method = "GET",
    headers = { "Content-Type": "application/json" },
    body,
    credentials = "include",
  } = options;

  let response = await fetch(url, {
    method,
    headers,
    credentials,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    console.warn("Token expired or invalid, attempting refresh...");

    try {
      // Attempt to refresh token
      const refreshResponse = await fetch(
        `${env.API_BASE_URL}/admin-auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (refreshResponse.ok) {
        // Retry the original request with refreshed token
        response = await fetch(url, {
          method,
          headers,
          credentials,
          body: body ? JSON.stringify(body) : undefined,
        });

        return response;
      } else {
        // Token refresh failed, redirect to login
        console.error("Token refresh failed, redirecting to login...");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        throw new Error("Unauthorized: Please login again");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      throw error;
    }
  }

  return response;
}

/**
 * Makes an HTTP request and parses JSON response with 401 handling
 */
export async function httpRequestJson<T>(
  url: string,
  options: HttpOptions = {},
): Promise<T> {
  const response = await httpRequest(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}
