/**
 * @fileoverview Type definitions for YAGI extension.
 */

/** Configuration interface for YAGI extension settings. */
export interface YagiConfig {
        readonly templateListTtl: number;
        readonly gitignoreCacheTtl: number;
        readonly maxCacheSize: number;
        readonly defaultTemplates: readonly string[];
        readonly customApiEndpoint: string | null;
        readonly customGitignorePath: string;
}

/** Represents a gitignore template option in the picker UI. */
export interface GitignoreTemplate {
        readonly label: string;
        readonly description?: string;
        readonly picked?: boolean;
}

/** Cache entry containing content and timestamp. */
export interface CacheEntry {
        readonly content: string;
        readonly timestamp: number;
}

/** Cache object mapping keys to cache entries. */
export type CacheObject = Record<string, CacheEntry>;
