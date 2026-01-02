/**
 * @fileoverview Unit tests for cache utilities.
 */

import { describe, expect, it } from "bun:test";
import type { CacheObject } from "../types";
import { cleanupCache, isCacheValid } from "./cache";

describe("isCacheValid", () => {
        it("should return true when cache is valid", () => {
                const now = Date.now();
                const timestamp = now - 1000; // 1 second ago
                const ttl = 5000; // 5 seconds

                expect(
                        isCacheValid(
                                ["template1", "template2"],
                                timestamp,
                                now,
                                ttl
                        )
                ).toBe(true);
        });

        it("should return false when cache is expired", () => {
                const now = Date.now();
                const timestamp = now - 10000; // 10 seconds ago
                const ttl = 5000; // 5 seconds

                expect(
                        isCacheValid(
                                ["template1", "template2"],
                                timestamp,
                                now,
                                ttl
                        )
                ).toBe(false);
        });

        it("should return false when cache is undefined", () => {
                const now = Date.now();
                const timestamp = now - 1000;
                const ttl = 5000;

                expect(isCacheValid(undefined, timestamp, now, ttl)).toBe(
                        false
                );
        });

        it("should return false when timestamp is undefined", () => {
                const now = Date.now();
                const ttl = 5000;

                expect(isCacheValid(["template1"], undefined, now, ttl)).toBe(
                        false
                );
        });

        it("should return false when cache is exactly at TTL boundary", () => {
                const now = Date.now();
                const timestamp = now - 5000; // exactly TTL ago
                const ttl = 5000;

                expect(isCacheValid(["template1"], timestamp, now, ttl)).toBe(
                        false
                );
        });

        it("should return true when cache is just before TTL boundary", () => {
                const now = Date.now();
                const timestamp = now - 4999; // 1ms before TTL
                const ttl = 5000;

                expect(isCacheValid(["template1"], timestamp, now, ttl)).toBe(
                        true
                );
        });

        it("should work with zero TTL (always invalid)", () => {
                const now = Date.now();
                const timestamp = now - 1000;
                const ttl = 0;

                expect(isCacheValid(["template1"], timestamp, now, ttl)).toBe(
                        false
                );
        });
});

describe("cleanupCache", () => {
        it("should return cache unchanged when size is within limit", () => {
                const cache: CacheObject = {
                        key1: { content: "content1", timestamp: 1000 },
                        key2: { content: "content2", timestamp: 2000 },
                };

                const result = cleanupCache(cache, 5);

                expect(result).toEqual(cache);
        });

        it("should keep only newest entries when exceeding limit", () => {
                const cache: CacheObject = {
                        key1: { content: "content1", timestamp: 1000 },
                        key2: { content: "content2", timestamp: 2000 },
                        key3: { content: "content3", timestamp: 3000 },
                        key4: { content: "content4", timestamp: 4000 },
                        key5: { content: "content5", timestamp: 5000 },
                };

                const result = cleanupCache(cache, 3);

                expect(Object.keys(result)).toHaveLength(3);
                expect(result.key3).toBeDefined();
                expect(result.key4).toBeDefined();
                expect(result.key5).toBeDefined();
                expect(result.key1).toBeUndefined();
                expect(result.key2).toBeUndefined();
        });

        it("should keep all entries when exactly at limit", () => {
                const cache: CacheObject = {
                        key1: { content: "content1", timestamp: 1000 },
                        key2: { content: "content2", timestamp: 2000 },
                };

                const result = cleanupCache(cache, 2);

                expect(Object.keys(result)).toHaveLength(2);
                expect(result.key1).toBeDefined();
                expect(result.key2).toBeDefined();
        });

        it("should handle empty cache", () => {
                const cache: CacheObject = {};

                const result = cleanupCache(cache, 5);

                expect(Object.keys(result)).toHaveLength(0);
        });

        it("should sort by timestamp correctly", () => {
                const cache: CacheObject = {
                        oldest: { content: "old", timestamp: 1000 },
                        newest: { content: "new", timestamp: 5000 },
                        middle: { content: "mid", timestamp: 3000 },
                };

                const result = cleanupCache(cache, 2);

                expect(Object.keys(result)).toHaveLength(2);
                expect(result.newest).toBeDefined();
                expect(result.middle).toBeDefined();
                expect(result.oldest).toBeUndefined();
        });

        it("should handle single entry cache", () => {
                const cache: CacheObject = {
                        key1: { content: "content1", timestamp: 1000 },
                };

                const result = cleanupCache(cache, 1);

                expect(Object.keys(result)).toHaveLength(1);
                expect(result.key1).toBeDefined();
        });
});
