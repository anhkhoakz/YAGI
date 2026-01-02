/**
 * @fileoverview Unit tests for error utilities.
 */

import { describe, expect, it } from "bun:test";
import {
        getErrorMessage,
        isApiError,
        isFileSystemError,
        isNetworkError,
        isValidationError,
} from "./errors";
import {
        ApiError,
        FileSystemError,
        NetworkError,
        ValidationError,
        YagiError,
} from "./errorTypes";

describe("getErrorMessage", () => {
        it("should extract message from YagiError", () => {
                const error = new YagiError("Test error message");
                expect(getErrorMessage(error)).toBe("Test error message");
        });

        it("should extract message from NetworkError", () => {
                const error = new NetworkError("Network error message");
                expect(getErrorMessage(error)).toBe("Network error message");
        });

        it("should extract message from ApiError", () => {
                const error = new ApiError("API error message", 404);
                expect(getErrorMessage(error)).toBe("API error message");
        });

        it("should extract message from ValidationError", () => {
                const error = new ValidationError("Validation error message");
                expect(getErrorMessage(error)).toBe("Validation error message");
        });

        it("should extract message from FileSystemError", () => {
                const error = new FileSystemError("File system error message");
                expect(getErrorMessage(error)).toBe(
                        "File system error message"
                );
        });

        it("should extract message from standard Error", () => {
                const error = new Error("Standard error message");
                expect(getErrorMessage(error)).toBe("Standard error message");
        });

        it("should convert non-Error to string", () => {
                expect(getErrorMessage("string error")).toBe("string error");
                expect(getErrorMessage(123)).toBe("123");
                expect(getErrorMessage(null)).toBe("null");
                expect(getErrorMessage(undefined)).toBe("undefined");
        });

        it("should handle error with cause", () => {
                const cause = new Error("Original error");
                const error = new NetworkError("Wrapped error", cause);
                expect(getErrorMessage(error)).toBe("Wrapped error");
        });
});

describe("isNetworkError", () => {
        it("should return true for NetworkError", () => {
                const error = new NetworkError("Network error");
                expect(isNetworkError(error)).toBe(true);
        });

        it("should return false for other error types", () => {
                expect(isNetworkError(new ApiError("API error", 404))).toBe(
                        false
                );
                expect(
                        isNetworkError(new ValidationError("Validation error"))
                ).toBe(false);
                expect(
                        isNetworkError(new FileSystemError("File system error"))
                ).toBe(false);
                expect(isNetworkError(new Error("Standard error"))).toBe(false);
                expect(isNetworkError("string")).toBe(false);
                expect(isNetworkError(null)).toBe(false);
        });
});

describe("isApiError", () => {
        it("should return true for ApiError", () => {
                const error = new ApiError("API error", 404);
                expect(isApiError(error)).toBe(true);
        });

        it("should return false for other error types", () => {
                expect(isApiError(new NetworkError("Network error"))).toBe(
                        false
                );
                expect(
                        isApiError(new ValidationError("Validation error"))
                ).toBe(false);
                expect(
                        isApiError(new FileSystemError("File system error"))
                ).toBe(false);
                expect(isApiError(new Error("Standard error"))).toBe(false);
                expect(isApiError("string")).toBe(false);
                expect(isApiError(null)).toBe(false);
        });
});

describe("isValidationError", () => {
        it("should return true for ValidationError", () => {
                const error = new ValidationError("Validation error");
                expect(isValidationError(error)).toBe(true);
        });

        it("should return false for other error types", () => {
                expect(
                        isValidationError(new NetworkError("Network error"))
                ).toBe(false);
                expect(isValidationError(new ApiError("API error", 404))).toBe(
                        false
                );
                expect(
                        isValidationError(
                                new FileSystemError("File system error")
                        )
                ).toBe(false);
                expect(isValidationError(new Error("Standard error"))).toBe(
                        false
                );
                expect(isValidationError("string")).toBe(false);
                expect(isValidationError(null)).toBe(false);
        });
});

describe("isFileSystemError", () => {
        it("should return true for FileSystemError", () => {
                const error = new FileSystemError("File system error");
                expect(isFileSystemError(error)).toBe(true);
        });

        it("should return false for other error types", () => {
                expect(
                        isFileSystemError(new NetworkError("Network error"))
                ).toBe(false);
                expect(isFileSystemError(new ApiError("API error", 404))).toBe(
                        false
                );
                expect(
                        isFileSystemError(
                                new ValidationError("Validation error")
                        )
                ).toBe(false);
                expect(isFileSystemError(new Error("Standard error"))).toBe(
                        false
                );
                expect(isFileSystemError("string")).toBe(false);
                expect(isFileSystemError(null)).toBe(false);
        });
});
