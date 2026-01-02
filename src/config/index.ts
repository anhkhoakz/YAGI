/**
 * @fileoverview Configuration management for YAGI extension.
 */

import * as vscode from "vscode";

import { DEFAULT_CONFIG } from "../constants";
import type { YagiConfig } from "../types";

/**
 * Loads configuration from VS Code workspace settings.
 * @return The merged configuration with defaults applied.
 */
export const loadConfiguration = (): YagiConfig => {
        const config = vscode.workspace.getConfiguration("yagi");

        return {
                templateListTtl:
                        config.get<number>("templateListTtl") ??
                        DEFAULT_CONFIG.templateListTtl,
                gitignoreCacheTtl:
                        config.get<number>("gitignoreCacheTtl") ??
                        DEFAULT_CONFIG.gitignoreCacheTtl,
                maxCacheSize:
                        config.get<number>("maxCacheSize") ??
                        DEFAULT_CONFIG.maxCacheSize,
                defaultTemplates:
                        config.get<string[]>("defaultTemplates") ??
                        DEFAULT_CONFIG.defaultTemplates,
                customApiEndpoint:
                        config.get<string>("customApiEndpoint") ?? null,
                customGitignorePath:
                        config.get<string>("customGitignorePath") ??
                        DEFAULT_CONFIG.customGitignorePath,
        };
};
