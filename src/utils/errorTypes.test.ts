/**
 * @fileoverview Unit tests for custom error types.
 */

import { describe, expect, it } from "bun:test";

import {
        ApiError,
        FileSystemError,
        NetworkError,
        ValidationError,
        YagiError,
} from "./errorTypes";

describe("YagiError", () => {
        it("should create error with message", () => {
                const error = new YagiError("Test error");
                expect(error.message).toBe("Test error");
                expect(error.name).toBe("YagiError");
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(YagiError);
        });

        it("should create error with cause", () => {
                const cause = new Error("Original error");
                const error = new YagiError("Wrapped error", cause);
                expect(error.message).toBe("Wrapped error");
                expect(error.errorCause).toBe(cause);
        });

        it("should have proper stack trace", () => {
                const error = new YagiError("Test error");
                expect(error.stack).toBeDefined();
                expect(typeof error.stack).toBe("string");
        });
});

describe("NetworkError", () => {
        it("should create network error with message", () => {
                const error = new NetworkError("Network error");
                expect(error.message).toBe("Network error");
                expect(error.name).toBe("NetworkError");
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(YagiError);
                expect(error).toBeInstanceOf(NetworkError);
        });

        it("should create network error with cause", () => {
                const cause = new Error("Connection failed");
                const error = new NetworkError("Network error", cause);
                expect(error.message).toBe("Network error");
                expect(error.errorCause).toBe(cause);
        });
});

describe("ApiError", () => {
        it("should create API error with message and status code", () => {
                const error = new ApiError("API error", 404);
                expect(error.message).toBe("API error");
                expect(error.statusCode).toBe(404);
                expect(error.name).toBe("ApiError");
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(YagiError);
                expect(error).toBeInstanceOf(ApiError);
        });

        it("should create API error without status code", () => {
                const error = new ApiError("API error", undefined);
                expect(error.message).toBe("API error");
                expect(error.statusCode).toBeUndefined();
        });

        it("should create API error with cause", () => {
                const cause = new Error("Request failed");
                const error = new ApiError("API error", 500, cause);
                expect(error.message).toBe("API error");
                expect(error.statusCode).toBe(500);
                expect(error.errorCause).toBe(cause);
        });

        it("should handle various status codes", () => {
                expect(new ApiError("Error", 400).statusCode).toBe(400);
                expect(new ApiError("Error", 401).statusCode).toBe(401);
                expect(new ApiError("Error", 500).statusCode).toBe(500);
        });
});

describe("ValidationError", () => {
        it("should create validation error with message", () => {
                const error = new ValidationError("Validation error");
                expect(error.message).toBe("Validation error");
                expect(error.name).toBe("ValidationError");
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(YagiError);
                expect(error).toBeInstanceOf(ValidationError);
        });

        it("should create validation error with cause", () => {
                const cause = new Error("Invalid input");
                const error = new ValidationError("Validation error", cause);
                expect(error.message).toBe("Validation error");
                expect(error.errorCause).toBe(cause);
        });
});

describe("FileSystemError", () => {
        it("should create file system error with message", () => {
                const error = new FileSystemError("File system error");
                expect(error.message).toBe("File system error");
                expect(error.name).toBe("FileSystemError");
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(YagiError);
                expect(error).toBeInstanceOf(FileSystemError);
        });

        it("should create file system error with cause", () => {
                const cause = new Error("Permission denied");
                const error = new FileSystemError("File system error", cause);
                expect(error.message).toBe("File system error");
                expect(error.errorCause).toBe(cause);
        });
});
