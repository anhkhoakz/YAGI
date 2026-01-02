/**
 * @fileoverview Unit tests for API utilities.
 */

import { describe, expect, it } from "bun:test";

import { ApiError } from "../utils/errorTypes";
import { parseTemplates } from "./api";

describe("parseTemplates", () => {
        it("should parse comma-separated templates", () => {
                const text = "node, python, java";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node", "python", "java"]);
        });

        it("should parse newline-separated templates", () => {
                const text = "node\npython\njava";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node", "python", "java"]);
        });

        it("should parse mixed separators", () => {
                const text = "node, python\njava, rust";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node", "python", "java", "rust"]);
        });

        it("should trim whitespace from templates", () => {
                const text = "  node  ,  python  ,  java  ";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node", "python", "java"]);
        });

        it("should filter out empty strings", () => {
                const text = "node,,python, ,java";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node", "python", "java"]);
        });

        it("should handle single template", () => {
                const text = "node";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node"]);
        });

        it("should throw ApiError for empty result", () => {
                const text = "   ,  ,  ";
                expect(() => {
                        parseTemplates(text, "http://example.com");
                }).toThrow(ApiError);
        });

        it("should throw ApiError with endpoint in message", () => {
                const text = "";
                expect(() => {
                        parseTemplates(text, "http://example.com/api");
                }).toThrow(
                        "No templates found in response from http://example.com/api"
                );
        });

        it("should handle templates with special characters", () => {
                const text = "node.js, python-3, c++";
                const result = parseTemplates(text, "http://example.com");
                expect(result).toEqual(["node.js", "python-3", "c++"]);
        });

        it("should handle large number of templates", () => {
                const templates = Array.from(
                        { length: 100 },
                        (_, i) => `template${i}`
                );
                const text = templates.join(",");
                const result = parseTemplates(text, "http://example.com");
                expect(result).toHaveLength(100);
                expect(result[0]).toBe("template0");
                expect(result[99]).toBe("template99");
        });
});
