/**
 * @fileoverview Main entry point and public API for YAGI extension.
 */

// Export constants for external use
export { API_ENDPOINTS, DEFAULT_CONFIG, STORAGE_KEYS } from "./constants";
// Main entry point - re-export from extension
export { activate, deactivate } from "./extension";
// Export types for external use
export type {
        CacheEntry,
        CacheObject,
        GitignoreTemplate,
        YagiConfig,
} from "./types";
