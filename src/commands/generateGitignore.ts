/**
 * @fileoverview Generate gitignore command implementation.
 */

import * as vscode from "vscode";

import { STORAGE_KEYS } from "../constants";
import { fetchGitignoreContent, fetchTemplates } from "../services/api";
import { isCacheValid, updateGitignoreCache, updateTemplateCache } from "../services/cache";
import type { YagiConfig } from "../types";
import { showTemplatePicker } from "../ui/templatePicker";
import { getErrorMessage } from "../utils/errors";
import { writeGitignoreFile } from "../utils/fileSystem";

/**
 * Generates gitignore file based on user-selected templates.
 * @param context VS Code extension context.
 * @param config Extension configuration.
 */
export const generateGitignore = async (
    context: vscode.ExtensionContext,
    config: YagiConfig
): Promise<void> => {
    try {
        const templates = await getTemplates(context, config);

        if (templates.length === 0) {
            vscode.window.showWarningMessage("No templates are available from the API.");
            return;
        }

        const selectedTemplates = await showTemplatePicker(templates, config.defaultTemplates);

        if (selectedTemplates?.length === 0) {
            vscode.window.showInformationMessage("No templates selected.");
            return;
        }

        if (!selectedTemplates || selectedTemplates.length === 0) {
            vscode.window.showInformationMessage("No templates selected.");
            return;
        }

        const content = await getGitignoreContent(
            context,
            config,
            selectedTemplates.map((t) => t.label)
        );

        await writeGitignoreFile(content, config.customGitignorePath);
    } catch (error) {
        await handleError(error);
    }
};

/**
 * Gets templates from cache or fetches from API.
 * @param context VS Code extension context.
 * @param config Extension configuration.
 * @return Promise resolving to array of template names.
 */
async function getTemplates(
    context: vscode.ExtensionContext,
    config: YagiConfig
): Promise<string[]> {
    const now = Date.now();
    const cachedList = context.globalState.get<string[]>(STORAGE_KEYS.templateList);
    const cachedTimestamp = context.globalState.get<number>(STORAGE_KEYS.templateListTimestamp);

    if (isCacheValid(cachedList, cachedTimestamp, now, config.templateListTtl)) {
        return cachedList;
    }

    const templates = await fetchTemplates(config.customApiEndpoint);
    await updateTemplateCache(context, templates, now);
    return templates;
}

/**
 * Gets gitignore content from cache or fetches from API.
 * @param context VS Code extension context.
 * @param config Extension configuration.
 * @param templates Template names to fetch content for.
 * @return Promise resolving to gitignore content string.
 */
async function getGitignoreContent(
    context: vscode.ExtensionContext,
    config: YagiConfig,
    templates: string[]
): Promise<string> {
    const now = Date.now();
    const cacheKey = templates.sort().join(",");
    const cacheObj =
        context.globalState.get<Record<string, { content: string; timestamp: number }>>(
            STORAGE_KEYS.gitignoreCache
        ) ?? {};
    const cachedEntry = cacheObj[cacheKey];

    if (
        cachedEntry &&
        isCacheValid(cachedEntry.content, cachedEntry.timestamp, now, config.gitignoreCacheTtl)
    ) {
        return cachedEntry.content;
    }

    const content = await fetchGitignoreContent(templates, config.customApiEndpoint);
    await updateGitignoreCache(context, cacheObj, cacheKey, content, now, config.maxCacheSize);
    return content;
}

/**
 * Handles errors with user interaction for retry.
 * @param error The error that occurred.
 */
async function handleError(error: unknown): Promise<void> {
    const errorMessage = getErrorMessage(error);
    const selection = await vscode.window.showErrorMessage(
        `Failed to generate .gitignore: ${errorMessage}`,
        "Retry",
        "Cancel"
    );

    if (selection === "Retry") {
        await vscode.commands.executeCommand("yagi.generateGitignore");
    }
}
