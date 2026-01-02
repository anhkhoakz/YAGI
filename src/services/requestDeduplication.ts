/**
 * @fileoverview Request deduplication service to prevent duplicate API calls.
 */

/**
 * Map of pending requests by key.
 */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Gets or creates a request promise to prevent duplicate calls.
 * @param key Unique key for the request.
 * @param requestFactory Factory function that creates the request promise.
 * @return Promise resolving to the request result.
 */
export function deduplicateRequest<T>(
        key: string,
        requestFactory: () => Promise<T>
): Promise<T> {
        const existingRequest = pendingRequests.get(key);
        if (existingRequest) {
                return existingRequest as Promise<T>;
        }

        const requestPromise = requestFactory()
                .then((result) => {
                        pendingRequests.delete(key);
                        return result;
                })
                .catch((error) => {
                        pendingRequests.delete(key);
                        throw error;
                });

        pendingRequests.set(key, requestPromise);
        return requestPromise;
}

/**
 * Clears all pending requests (useful for testing or cleanup).
 */
export function clearPendingRequests(): void {
        pendingRequests.clear();
}
