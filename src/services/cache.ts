/**
 * @fileoverview Cache management service for YAGI extension.
 */

import type * as vscode from "vscode";

import { STORAGE_KEYS } from "../constants";
import type { CacheObject } from "../types";

/**
 * Checks if cached data is still valid based on TTL.
 * @param cached The cached data to validate.
 * @param timestamp When the data was cached.
 * @param now Current timestamp.
 * @param ttl Time-to-live in milliseconds.
 * @return True if cache is valid, false otherwise.
 */
export function isCacheValid<T>(
        cached: T | undefined,
        timestamp: number | undefined,
        now: number,
        ttl: number
): cached is T {
        return (
                cached !== undefined &&
                timestamp !== undefined &&
                now - timestamp < ttl
        );
}

/**
 * Updates template list cache in VS Code global state.
 * @param context VS Code extension context.
 * @param templates Array of template names to cache.
 * @param timestamp Current timestamp.
 */
export async function updateTemplateCache(
        context: vscode.ExtensionContext,
        templates: string[],
        timestamp: number
): Promise<void> {
        await Promise.all([
                context.globalState.update(
                        STORAGE_KEYS.templateList,
                        templates
                ),
                context.globalState.update(
                        STORAGE_KEYS.templateListTimestamp,
                        timestamp
                ),
        ]);
}

/**
 * Updates gitignore content cache with cleanup.
 * @param context VS Code extension context.
 * @param cacheObj Current cache object.
 * @param cacheKey Key for the cache entry.
 * @param content Content to cache.
 * @param timestamp Current timestamp.
 * @param maxCacheSize Maximum number of cache entries to keep.
 */
export async function updateGitignoreCache(
        context: vscode.ExtensionContext,
        cacheObj: CacheObject,
        cacheKey: string,
        content: string,
        timestamp: number,
        maxCacheSize: number
): Promise<void> {
        const updatedCache: CacheObject = {
                ...cacheObj,
                [cacheKey]: { content, timestamp },
        };

        const entries = Object.entries(updatedCache);
        const needsCleanup = entries.length > maxCacheSize;

        if (!needsCleanup) {
                await context.globalState.update(
                        STORAGE_KEYS.gitignoreCache,
                        updatedCache
                );
                return;
        }

        const cleanedCache = cleanupCache(updatedCache, maxCacheSize);
        await context.globalState.update(
                STORAGE_KEYS.gitignoreCache,
                cleanedCache
        );
}

/**
 * Removes old cache entries to maintain size limit.
 * @param cacheObj Cache object to clean up.
 * @param maxCacheSize Maximum number of entries to keep.
 * @return Cleaned cache object.
 */
export function cleanupCache(
        cacheObj: CacheObject,
        maxCacheSize: number
): CacheObject {
        const entries = Object.entries(cacheObj);

        if (entries.length <= maxCacheSize) {
                return cacheObj;
        }

        const sortedEntries = entries.sort(
                ([, a], [, b]) => b.timestamp - a.timestamp
        );
        const keptEntries = sortedEntries.slice(0, maxCacheSize);

        return Object.fromEntries(keptEntries);
}

/**
 * Clears all cached data from VS Code global state.
 * @param context VS Code extension context.
 */
export async function clearAllCache(
        context: vscode.ExtensionContext
): Promise<void> {
        await Promise.all([
                context.globalState.update(
                        STORAGE_KEYS.templateList,
                        undefined
                ),
                context.globalState.update(
                        STORAGE_KEYS.templateListTimestamp,
                        undefined
                ),
                context.globalState.update(
                        STORAGE_KEYS.gitignoreCache,
                        undefined
                ),
        ]);
}
