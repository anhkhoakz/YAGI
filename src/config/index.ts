/**
 * @fileoverview Configuration management for YAGI extension.
 */

import * as vscode from "vscode";

import { DEFAULT_CONFIG } from "../constants";
import type { YagiConfig } from "../types";
import { ValidationError } from "../utils/errorTypes";
import {
        isValidUrl,
        validateCacheSize,
        validateDefaultTemplates,
        validateTtl,
} from "./validation";

/**
 * Validates configuration values and returns validated config.
 * @param rawConfig Raw configuration object.
 * @return Validated configuration.
 * @throws ValidationError if configuration is invalid.
 */
const validateConfiguration = (rawConfig: {
        templateListTtl?: number | undefined;
        gitignoreCacheTtl?: number | undefined;
        maxCacheSize?: number | undefined;
        defaultTemplates?: string[] | undefined;
        customApiEndpoint?: string | undefined;
        customGitignorePath?: string | undefined;
}): YagiConfig => {
        const templateListTtl =
                rawConfig.templateListTtl ?? DEFAULT_CONFIG.templateListTtl;
        const gitignoreCacheTtl =
                rawConfig.gitignoreCacheTtl ?? DEFAULT_CONFIG.gitignoreCacheTtl;
        const maxCacheSize =
                rawConfig.maxCacheSize ?? DEFAULT_CONFIG.maxCacheSize;
        const defaultTemplates =
                rawConfig.defaultTemplates ?? DEFAULT_CONFIG.defaultTemplates;
        const customApiEndpoint = rawConfig.customApiEndpoint ?? null;
        const customGitignorePath =
                rawConfig.customGitignorePath ??
                DEFAULT_CONFIG.customGitignorePath;

        validateTtl(templateListTtl, "templateListTtl");
        validateTtl(gitignoreCacheTtl, "gitignoreCacheTtl");
        validateCacheSize(maxCacheSize, "maxCacheSize");

        if (customApiEndpoint !== null && !isValidUrl(customApiEndpoint)) {
                throw new ValidationError(
                        `customApiEndpoint must be a valid HTTP/HTTPS URL, got ${customApiEndpoint}`
                );
        }

        if (customGitignorePath.trim().length === 0) {
                throw new ValidationError(
                        "customGitignorePath cannot be empty"
                );
        }

        validateDefaultTemplates(defaultTemplates);

        return {
                templateListTtl,
                gitignoreCacheTtl,
                maxCacheSize,
                defaultTemplates,
                customApiEndpoint,
                customGitignorePath,
        };
};

/**
 * Loads configuration from VS Code workspace settings.
 * @return The merged configuration with defaults applied.
 * @throws ValidationError if configuration is invalid.
 */
export const loadConfiguration = (): YagiConfig => {
        const config = vscode.workspace.getConfiguration("yagi");

        const rawConfig = {
                templateListTtl: config.get<number>("templateListTtl"),
                gitignoreCacheTtl: config.get<number>("gitignoreCacheTtl"),
                maxCacheSize: config.get<number>("maxCacheSize"),
                defaultTemplates: config.get<string[]>("defaultTemplates"),
                customApiEndpoint: config.get<string>("customApiEndpoint"),
                customGitignorePath: config.get<string>("customGitignorePath"),
        };

        return validateConfiguration(rawConfig);
};

/**
 * Creates a configuration change listener that reloads config on changes.
 * @param onConfigChange Callback invoked when configuration changes.
 * @return Disposable subscription.
 */
export const onConfigurationChange = (
        onConfigChange: (config: YagiConfig) => void
): vscode.Disposable => {
        return vscode.workspace.onDidChangeConfiguration((event) => {
                if (!event.affectsConfiguration("yagi")) {
                        return;
                }

                try {
                        const newConfig = loadConfiguration();
                        onConfigChange(newConfig);
                } catch (error) {
                        if (!(error instanceof ValidationError)) {
                                return;
                        }

                        vscode.window.showErrorMessage(
                                `Invalid YAGI configuration: ${error.message}`
                        );
                }
        });
};
