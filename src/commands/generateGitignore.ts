/**
 * @fileoverview Generate gitignore command implementation.
 */

import * as vscode from "vscode";

import { getGitignoreContent, getTemplates } from "../services/templates";
import type { YagiConfig } from "../types";
import { showTemplatePicker } from "../ui/templatePicker";
import { getErrorMessage } from "../utils/errors";
import { writeGitignoreFile } from "../utils/fileSystem";
import { logError, logInfo } from "../utils/logger";

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
                logInfo("Starting gitignore generation");

                const templates = await getTemplates(context, config);

                if (templates.length === 0) {
                        vscode.window.showWarningMessage(
                                "No templates are available from the API."
                        );
                        return;
                }

                const selectedTemplates = await showTemplatePicker(
                        templates,
                        config.defaultTemplates
                );

                if (!selectedTemplates || selectedTemplates.length === 0) {
                        vscode.window.showInformationMessage(
                                "No templates selected."
                        );
                        return;
                }

                logInfo(
                        `Generating gitignore for templates: ${selectedTemplates.map((t) => t.label).join(", ")}`
                );

                const content = await getGitignoreContent(
                        context,
                        config,
                        selectedTemplates.map((t) => t.label)
                );

                await writeGitignoreFile(content, config.customGitignorePath);
                logInfo("Gitignore file generated successfully");
        } catch (error) {
                logError("Failed to generate gitignore", error);
                await handleError(error);
        }
};

/**
 * Handles errors with user interaction for retry.
 * @param error The error that occurred.
 */
const handleError = async (error: unknown): Promise<void> => {
        const errorMessage = getErrorMessage(error);
        const selection = await vscode.window.showErrorMessage(
                `Failed to generate .gitignore: ${errorMessage}`,
                "Retry",
                "Cancel"
        );

        if (selection === "Retry") {
                await vscode.commands.executeCommand("yagi.generateGitignore");
        }
};
