/**
 * @fileoverview Network utilities for API requests with timeout and retry logic.
 */

import { ApiError, NetworkError } from "./errorTypes";
import { logDebug } from "./logger";

/** Default timeout for fetch requests in milliseconds. */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/** Default maximum number of retry attempts. */
const DEFAULT_MAX_RETRIES = 3;

/** Default initial retry delay in milliseconds. */
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Options for fetch with timeout and retry.
 */
export interface FetchOptions {
        /** Request timeout in milliseconds. */
        timeout?: number;
        /** Maximum number of retry attempts. */
        maxRetries?: number;
        /** Initial retry delay in milliseconds. */
        retryDelay?: number;
        /** Signal to abort the request. */
        signal?: AbortSignal;
}

/**
 * Sleeps for the specified number of milliseconds.
 * @param ms Milliseconds to sleep.
 * @return Promise that resolves after the delay.
 */
const sleep = (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculates exponential backoff delay.
 * @param attempt Current attempt number (0-indexed).
 * @param baseDelay Base delay in milliseconds.
 * @return Delay in milliseconds.
 */
export const calculateBackoffDelay = (
        attempt: number,
        baseDelay: number
): number => {
        return baseDelay * 2 ** attempt;
};

/**
 * Creates combined abort signal from external signal and timeout.
 * @param externalSignal Optional external abort signal.
 * @param timeout Timeout in milliseconds.
 * @return Object with combined signal and cleanup function.
 */
const createAbortSignal = (
        externalSignal: AbortSignal | undefined,
        timeout: number
): { signal: AbortSignal; cleanup: () => void } => {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeout);

        if (!externalSignal || externalSignal.aborted) {
                return {
                        signal: abortController.signal,
                        cleanup: () => clearTimeout(timeoutId),
                };
        }

        const combined = new AbortController();
        externalSignal.addEventListener("abort", () => combined.abort());
        abortController.signal.addEventListener("abort", () =>
                combined.abort()
        );

        return {
                signal: combined.signal,
                cleanup: () => clearTimeout(timeoutId),
        };
};

/**
 * Checks if error is an abort error (timeout or cancellation).
 * @param error Error to check.
 * @param externalSignal Optional external signal.
 * @param timeout Timeout value.
 * @return NetworkError if abort, null otherwise.
 */
const handleAbortError = (
        error: unknown,
        externalSignal: AbortSignal | undefined,
        timeout: number
): NetworkError | null => {
        if (!(error instanceof Error && error.name === "AbortError")) {
                return null;
        }

        if (externalSignal?.aborted) {
                return new NetworkError("Request was cancelled", error);
        }

        return new NetworkError(`Request timeout after ${timeout}ms`, error);
};

/**
 * Checks if error is a non-retryable client error.
 * @param error Error to check.
 * @return True if error should not be retried.
 */
export const isNonRetryableClientError = (error: unknown): boolean => {
        if (!(error instanceof ApiError)) {
                return false;
        }

        if (error.statusCode === undefined) {
                return false;
        }

        if (error.statusCode === 429) {
                return false;
        }

        return error.statusCode >= 400 && error.statusCode < 500;
};

/**
 * Attempts a single fetch request with timeout.
 * @param url URL to fetch.
 * @param externalSignal Optional external abort signal.
 * @param timeout Timeout in milliseconds.
 * @return Promise resolving to Response.
 */
const attemptFetch = async (
        url: string,
        externalSignal: AbortSignal | undefined,
        timeout: number
): Promise<Response> => {
        const { signal, cleanup } = createAbortSignal(externalSignal, timeout);

        try {
                const response = await fetch(url, { signal });
                cleanup();

                if (!response.ok) {
                        throw new ApiError(
                                `HTTP ${response.status}: ${response.statusText}`,
                                response.status
                        );
                }

                return response;
        } catch (fetchError) {
                cleanup();

                const abortError = handleAbortError(
                        fetchError,
                        externalSignal,
                        timeout
                );
                if (abortError) {
                        throw abortError;
                }

                if (isNonRetryableClientError(fetchError)) {
                        throw fetchError;
                }

                throw fetchError;
        }
};

/**
 * Wraps unknown error into NetworkError.
 * Always throws - never returns.
 * @param error Error to wrap.
 * @param maxRetries Maximum retry attempts.
 * @throws NetworkError or re-throws known error types.
 */
const wrapUnknownError = (error: unknown, maxRetries: number): never => {
        if (error instanceof ApiError || error instanceof NetworkError) {
                throw error;
        }

        if (!(error instanceof Error)) {
                throw new NetworkError(
                        `Request failed after ${maxRetries + 1} attempts`,
                        error
                );
        }

        const isNetworkError =
                error.message.includes("fetch") ||
                error.message.includes("network") ||
                error.message.includes("ECONNREFUSED") ||
                error.message.includes("ENOTFOUND");

        if (isNetworkError) {
                throw new NetworkError(
                        `Network error: ${error.message}`,
                        error
                );
        }

        throw new NetworkError(`Request failed: ${error.message}`, error);
};

/**
 * Fetches a resource with timeout and retry logic.
 * @param url The URL to fetch.
 * @param options Fetch options including timeout and retry configuration.
 * @return Promise resolving to the Response.
 * @throws NetworkError for network issues or timeouts.
 * @throws ApiError for HTTP errors.
 */
export const fetchWithRetry = async (
        url: string,
        options: FetchOptions = {}
): Promise<Response> => {
        const {
                timeout = DEFAULT_TIMEOUT,
                maxRetries = DEFAULT_MAX_RETRIES,
                retryDelay = DEFAULT_RETRY_DELAY,
                signal: externalSignal,
        } = options;

        let lastError: unknown;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                        if (attempt > 0) {
                                logDebug(
                                        `Retrying fetch (attempt ${attempt + 1}/${maxRetries + 1}): ${url}`
                                );
                        }

                        return await attemptFetch(url, externalSignal, timeout);
                } catch (error) {
                        lastError = error;

                        if (attempt === maxRetries) {
                                logDebug(
                                        `Max retries (${maxRetries + 1}) reached for: ${url}`
                                );
                                break;
                        }

                        if (isNonRetryableClientError(error)) {
                                logDebug(
                                        `Non-retryable client error, stopping retries: ${url}`
                                );
                                break;
                        }

                        const delay = calculateBackoffDelay(
                                attempt,
                                retryDelay
                        );
                        logDebug(
                                `Retry attempt ${attempt + 1} failed, waiting ${delay}ms before retry`
                        );
                        await sleep(delay);
                }
        }

        return wrapUnknownError(lastError, maxRetries);
};
