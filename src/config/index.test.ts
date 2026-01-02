/**
 * @fileoverview Unit tests for configuration utilities.
 */

import { describe, expect, it } from "bun:test";

import { ValidationError } from "../utils/errorTypes";
import {
        isValidUrl,
        validateCacheSize,
        validateDefaultTemplates,
        validateTtl,
} from "./validation";

describe("isValidUrl", () => {
        it("should return true for valid HTTP URLs", () => {
                expect(isValidUrl("http://example.com")).toBe(true);
                expect(isValidUrl("http://example.com/path")).toBe(true);
                expect(isValidUrl("http://example.com:8080")).toBe(true);
        });

        it("should return true for valid HTTPS URLs", () => {
                expect(isValidUrl("https://example.com")).toBe(true);
                expect(isValidUrl("https://example.com/path")).toBe(true);
                expect(isValidUrl("https://example.com:443")).toBe(true);
        });

        it("should return false for invalid URLs", () => {
                expect(isValidUrl("not-a-url")).toBe(false);
                expect(isValidUrl("ftp://example.com")).toBe(false);
                expect(isValidUrl("file:///path/to/file")).toBe(false);
                expect(isValidUrl("")).toBe(false);
        });

        it("should return false for malformed URLs", () => {
                expect(isValidUrl("http://")).toBe(false);
                expect(isValidUrl("://example.com")).toBe(false);
        });

        it("should handle URLs with query parameters", () => {
                expect(isValidUrl("https://example.com?param=value")).toBe(
                        true
                );
                expect(
                        isValidUrl("http://example.com?param=value&other=test")
                ).toBe(true);
        });

        it("should handle URLs with fragments", () => {
                expect(isValidUrl("https://example.com#section")).toBe(true);
        });
});

describe("validateTtl", () => {
        it("should not throw for valid positive TTL", () => {
                expect(() => {
                        validateTtl(1000, "testTtl");
                }).not.toThrow();
        });

        it("should throw ValidationError for zero TTL", () => {
                expect(() => {
                        validateTtl(0, "testTtl");
                }).toThrow(ValidationError);
                expect(() => {
                        validateTtl(0, "testTtl");
                }).toThrow("testTtl must be positive, got 0");
        });

        it("should throw ValidationError for negative TTL", () => {
                expect(() => {
                        validateTtl(-100, "testTtl");
                }).toThrow(ValidationError);
                expect(() => {
                        validateTtl(-100, "testTtl");
                }).toThrow("testTtl must be positive, got -100");
        });

        it("should throw ValidationError for TTL exceeding limit", () => {
                const maxLimit = 365 * 24 * 60 * 60 * 1000; // 1 year
                expect(() => {
                        validateTtl(maxLimit + 1, "testTtl");
                }).toThrow(ValidationError);
                expect(() => {
                        validateTtl(maxLimit + 1, "testTtl");
                }).toThrow("testTtl exceeds maximum limit");
        });

        it("should not throw for TTL at maximum limit", () => {
                const maxLimit = 365 * 24 * 60 * 60 * 1000; // 1 year
                expect(() => {
                        validateTtl(maxLimit, "testTtl");
                }).not.toThrow();
        });

        it("should include field name in error message", () => {
                expect(() => {
                        validateTtl(0, "templateListTtl");
                }).toThrow("templateListTtl must be positive");
        });
});

describe("validateCacheSize", () => {
        it("should not throw for valid positive cache size", () => {
                expect(() => {
                        validateCacheSize(100, "testCacheSize");
                }).not.toThrow();
        });

        it("should throw ValidationError for zero cache size", () => {
                expect(() => {
                        validateCacheSize(0, "testCacheSize");
                }).toThrow(ValidationError);
                expect(() => {
                        validateCacheSize(0, "testCacheSize");
                }).toThrow("testCacheSize must be positive, got 0");
        });

        it("should throw ValidationError for negative cache size", () => {
                expect(() => {
                        validateCacheSize(-10, "testCacheSize");
                }).toThrow(ValidationError);
                expect(() => {
                        validateCacheSize(-10, "testCacheSize");
                }).toThrow("testCacheSize must be positive, got -10");
        });

        it("should throw ValidationError for cache size exceeding limit", () => {
                const maxLimit = 10000;
                expect(() => {
                        validateCacheSize(maxLimit + 1, "testCacheSize");
                }).toThrow(ValidationError);
                expect(() => {
                        validateCacheSize(maxLimit + 1, "testCacheSize");
                }).toThrow("testCacheSize exceeds maximum limit");
        });

        it("should not throw for cache size at maximum limit", () => {
                const maxLimit = 10000;
                expect(() => {
                        validateCacheSize(maxLimit, "testCacheSize");
                }).not.toThrow();
        });

        it("should include field name in error message", () => {
                expect(() => {
                        validateCacheSize(0, "maxCacheSize");
                }).toThrow("maxCacheSize must be positive");
        });
});

describe("validateDefaultTemplates", () => {
        it("should not throw for valid array of strings", () => {
                expect(() => {
                        validateDefaultTemplates(["node", "python", "java"]);
                }).not.toThrow();
        });

        it("should not throw for empty array", () => {
                expect(() => {
                        validateDefaultTemplates([]);
                }).not.toThrow();
        });

        it("should throw ValidationError for non-array", () => {
                expect(() => {
                        validateDefaultTemplates("not an array");
                }).toThrow(ValidationError);
                expect(() => {
                        validateDefaultTemplates("not an array");
                }).toThrow("defaultTemplates must be an array");
        });

        it("should throw ValidationError for null", () => {
                expect(() => {
                        validateDefaultTemplates(null);
                }).toThrow(ValidationError);
        });

        it("should throw ValidationError for object", () => {
                expect(() => {
                        validateDefaultTemplates({});
                }).toThrow(ValidationError);
        });

        it("should throw ValidationError for array with empty strings", () => {
                expect(() => {
                        validateDefaultTemplates(["node", "", "python"]);
                }).toThrow(ValidationError);
                expect(() => {
                        validateDefaultTemplates(["node", "", "python"]);
                }).toThrow("defaultTemplates must contain non-empty strings");
        });

        it("should throw ValidationError for array with whitespace-only strings", () => {
                expect(() => {
                        validateDefaultTemplates(["node", "   ", "python"]);
                }).toThrow(ValidationError);
                expect(() => {
                        validateDefaultTemplates(["node", "   ", "python"]);
                }).toThrow("defaultTemplates must contain non-empty strings");
        });

        it("should throw ValidationError for array with non-string elements", () => {
                expect(() => {
                        validateDefaultTemplates(["node", 123, "python"]);
                }).toThrow(ValidationError);
                expect(() => {
                        validateDefaultTemplates(["node", null, "python"]);
                }).toThrow(ValidationError);
        });

        it("should accept valid strings with special characters", () => {
                expect(() => {
                        validateDefaultTemplates([
                                "node.js",
                                "python-3",
                                "c++",
                        ]);
                }).not.toThrow();
        });
});
