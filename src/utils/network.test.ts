/**
 * @fileoverview Unit tests for network utilities.
 */

import { describe, expect, it } from "bun:test";

import { ApiError } from "./errorTypes";
import { calculateBackoffDelay, isNonRetryableClientError } from "./network";

describe("calculateBackoffDelay", () => {
        it("should calculate exponential backoff correctly", () => {
                const baseDelay = 1000;

                expect(calculateBackoffDelay(0, baseDelay)).toBe(1000); // 2^0 * 1000
                expect(calculateBackoffDelay(1, baseDelay)).toBe(2000); // 2^1 * 1000
                expect(calculateBackoffDelay(2, baseDelay)).toBe(4000); // 2^2 * 1000
                expect(calculateBackoffDelay(3, baseDelay)).toBe(8000); // 2^3 * 1000
        });

        it("should work with different base delays", () => {
                expect(calculateBackoffDelay(0, 500)).toBe(500);
                expect(calculateBackoffDelay(1, 500)).toBe(1000);
                expect(calculateBackoffDelay(2, 500)).toBe(2000);
        });

        it("should handle zero attempt", () => {
                expect(calculateBackoffDelay(0, 1000)).toBe(1000);
        });

        it("should handle large attempt numbers", () => {
                expect(calculateBackoffDelay(10, 1000)).toBe(1024000); // 2^10 * 1000
        });

        it("should work with fractional base delays", () => {
                expect(calculateBackoffDelay(0, 100.5)).toBe(100.5);
                expect(calculateBackoffDelay(1, 100.5)).toBe(201);
        });
});

describe("isNonRetryableClientError", () => {
        it("should return true for 4xx errors (except 429)", () => {
                expect(
                        isNonRetryableClientError(
                                new ApiError("Bad Request", 400)
                        )
                ).toBe(true);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Unauthorized", 401)
                        )
                ).toBe(true);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Forbidden", 403)
                        )
                ).toBe(true);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Not Found", 404)
                        )
                ).toBe(true);
                expect(
                        isNonRetryableClientError(new ApiError("Conflict", 409))
                ).toBe(true);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Unprocessable", 422)
                        )
                ).toBe(true);
        });

        it("should return false for 429 (rate limit)", () => {
                expect(
                        isNonRetryableClientError(
                                new ApiError("Too Many Requests", 429)
                        )
                ).toBe(false);
        });

        it("should return false for 5xx errors", () => {
                expect(
                        isNonRetryableClientError(
                                new ApiError("Internal Server Error", 500)
                        )
                ).toBe(false);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Bad Gateway", 502)
                        )
                ).toBe(false);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Service Unavailable", 503)
                        )
                ).toBe(false);
        });

        it("should return false for 2xx errors", () => {
                expect(isNonRetryableClientError(new ApiError("OK", 200))).toBe(
                        false
                );
                expect(
                        isNonRetryableClientError(new ApiError("Created", 201))
                ).toBe(false);
        });

        it("should return false for ApiError without status code", () => {
                expect(
                        isNonRetryableClientError(
                                new ApiError("Error", undefined)
                        )
                ).toBe(false);
        });

        it("should return false for non-ApiError errors", () => {
                expect(
                        isNonRetryableClientError(new Error("Standard error"))
                ).toBe(false);
                expect(isNonRetryableClientError("string error")).toBe(false);
                expect(isNonRetryableClientError(null)).toBe(false);
                expect(isNonRetryableClientError(undefined)).toBe(false);
        });

        it("should return false for 3xx errors", () => {
                expect(
                        isNonRetryableClientError(new ApiError("Moved", 301))
                ).toBe(false);
                expect(
                        isNonRetryableClientError(
                                new ApiError("Not Modified", 304)
                        )
                ).toBe(false);
        });
});
