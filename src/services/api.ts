/**
 * GapHunter API Client
 * Centralized fetch wrapper with timeout, retry, and error handling
 */

const RAW_API_BASE =
    (import.meta as any)?.env?.VITE_API_BASE?.trim() || "http://localhost:3001/api";

// Normalize: remove trailing slash
export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// Configuration
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Custom API error with status code and response body
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public body?: unknown
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
    timeout?: number;
    retries?: number;
    signal?: AbortSignal;
    headers?: Record<string, string>;
}

/**
 * Sleep helper for retry backoff
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network error or 5xx status)
 */
function isRetryable(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status >= 500 && error.status < 600;
    }
    // Network errors (TypeError from fetch)
    if (error instanceof TypeError) {
        return true;
    }
    return false;
}

/**
 * Core fetch wrapper with timeout support
 */
async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Combine with external signal if provided
    const externalSignal = init.signal;
    if (externalSignal) {
        externalSignal.addEventListener("abort", () => controller.abort());
    }

    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Parse response body as JSON, handling errors
 */
async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
        let body: unknown;
        try {
            body = contentType.includes("application/json")
                ? await response.json()
                : await response.text();
        } catch {
            body = null;
        }

        const message = typeof body === "object" && body && "error" in body
            ? String((body as any).error)
            : `HTTP ${response.status}`;

        throw new ApiError(message, response.status, body);
    }

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text() as unknown as T;
}

/**
 * Make a typed API request with retry logic
 */
export async function apiRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    options: ApiRequestOptions = {}
): Promise<T> {
    const {
        timeout = DEFAULT_TIMEOUT_MS,
        retries = MAX_RETRIES,
        signal,
        headers: extraHeaders = {},
    } = options;

    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...extraHeaders,
    };

    const init: RequestInit = {
        method,
        headers,
        signal,
        ...(body !== undefined && { body: JSON.stringify(body) }),
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, init, timeout);
            return await parseResponse<T>(response);
        } catch (error) {
            lastError = error;

            // Don't retry on abort
            if (error instanceof DOMException && error.name === "AbortError") {
                throw new ApiError("Request timeout", 408);
            }

            // Check if we should retry
            if (attempt < retries && isRetryable(error)) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
                console.warn(`[API] Retry ${attempt + 1}/${retries} after ${delay}ms for ${path}`);
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

// Convenience methods
export const api = {
    get: <T>(path: string, options?: ApiRequestOptions) =>
        apiRequest<T>("GET", path, undefined, options),

    post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
        apiRequest<T>("POST", path, body, options),

    put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
        apiRequest<T>("PUT", path, body, options),

    delete: <T>(path: string, options?: ApiRequestOptions) =>
        apiRequest<T>("DELETE", path, undefined, options),
};

export default api;
