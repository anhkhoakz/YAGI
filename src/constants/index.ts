/**
 * @fileoverview Constants and default configuration for YAGI extension.
 */

import type { YagiConfig } from "../types";

/** Default configuration values for YAGI extension. */
export const DEFAULT_CONFIG: Readonly<
        Required<Omit<YagiConfig, "customApiEndpoint">>
> = {
        templateListTtl: 24 * 60 * 60 * 1000, // 24 hours
        gitignoreCacheTtl: 60 * 60 * 1000, // 1 hour
        maxCacheSize: 100,
        defaultTemplates: [],
        customGitignorePath: ".gitignore",
};

/** API endpoints for gitignore template service. */
export const API_ENDPOINTS = {
        templateList: "https://www.toptal.com/developers/gitignore/api/list",
        gitignore: "https://www.toptal.com/developers/gitignore/api",
} as const;

/** Storage keys for VS Code global state. */
export const STORAGE_KEYS = {
        templateList: "yagi.gitignoreTemplateList",
        templateListTimestamp: "yagi.gitignoreTemplateListTimestamp",
        gitignoreCache: "yagi.gitignoreCache",
} as const;

/** Regular expression for splitting template strings. */
export const TEMPLATE_SPLIT_REGEX = /,|\n/;
