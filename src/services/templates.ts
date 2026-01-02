/**
 * @fileoverview Shared template service for fetching and caching templates.
 */

import type * as vscode from "vscode";

import { STORAGE_KEYS } from "../constants";
import type { YagiConfig } from "../types";
import { fetchGitignoreContent, fetchTemplates } from "./api";
import {
        isCacheValid,
        updateGitignoreCache,
        updateTemplateCache,
} from "./cache";
import { deduplicateRequest } from "./requestDeduplication";

/**
 * Gets templates from cache or fetches from API.
 * Uses request deduplication to prevent duplicate API calls.
 * @param context VS Code extension context.
 * @param config Extension configuration.
 * @return Promise resolving to array of template names.
 */
export async function getTemplates(
        context: vscode.ExtensionContext,
        config: YagiConfig
): Promise<string[]> {
        const now = Date.now();
        const cachedList = context.globalState.get<string[]>(
                STORAGE_KEYS.templateList
        );
        const cachedTimestamp = context.globalState.get<number>(
                STORAGE_KEYS.templateListTimestamp
        );

        if (
                isCacheValid(
                        cachedList,
                        cachedTimestamp,
                        now,
                        config.templateListTtl
                )
        ) {
                return cachedList;
        }

        // Use deduplication to prevent multiple simultaneous requests
        const cacheKey = `templates:${config.customApiEndpoint ?? "default"}`;
        const templates = await deduplicateRequest(cacheKey, async () => {
                const fetched = await fetchTemplates(config.customApiEndpoint);
                await updateTemplateCache(context, fetched, Date.now());
                return fetched;
        });

        return templates;
}

/**
 * Gets gitignore content from cache or fetches from API.
 * Uses request deduplication to prevent duplicate API calls.
 * @param context VS Code extension context.
 * @param config Extension configuration.
 * @param templates Template names to fetch content for.
 * @return Promise resolving to gitignore content string.
 */
export async function getGitignoreContent(
        context: vscode.ExtensionContext,
        config: YagiConfig,
        templates: string[]
): Promise<string> {
        const now = Date.now();
        const cacheKey = templates.sort().join(",");
        const cacheObj =
                context.globalState.get<
                        Record<string, { content: string; timestamp: number }>
                >(STORAGE_KEYS.gitignoreCache) ?? {};
        const cachedEntry = cacheObj[cacheKey];

        if (
                cachedEntry &&
                isCacheValid(
                        cachedEntry.content,
                        cachedEntry.timestamp,
                        now,
                        config.gitignoreCacheTtl
                )
        ) {
                return cachedEntry.content;
        }

        // Use deduplication to prevent multiple simultaneous requests for same templates
        const requestKey = `gitignore:${cacheKey}:${config.customApiEndpoint ?? "default"}`;
        const content = await deduplicateRequest(requestKey, async () => {
                const fetched = await fetchGitignoreContent(
                        templates,
                        config.customApiEndpoint
                );
                await updateGitignoreCache(
                        context,
                        cacheObj,
                        cacheKey,
                        fetched,
                        Date.now(),
                        config.maxCacheSize
                );
                return fetched;
        });

        return content;
}
