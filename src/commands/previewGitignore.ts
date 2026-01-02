/**
 * @fileoverview Preview gitignore command implementation.
 */

import * as vscode from "vscode";

import { getGitignoreContent, getTemplates } from "../services/templates";
import type { YagiConfig } from "../types";
import { showTemplatePicker, showTemplatePreview } from "../ui/templatePicker";
import { getErrorMessage } from "../utils/errors";
import { logError, logInfo } from "../utils/logger";

/**
 * Previews gitignore content based on user-selected templates.
 * @param context VS Code extension context.
 * @param config Extension configuration.
 */
export const previewGitignore = async (
        context: vscode.ExtensionContext,
        config: YagiConfig
): Promise<void> => {
        try {
                logInfo("Starting gitignore preview");

                await vscode.window.withProgress(
                        {
                                location: vscode.ProgressLocation.Notification,
                                title: "YAGI: Previewing .gitignore",
                                cancellable: false,
                        },
                        async (progress) => {
                                progress.report({
                                        increment: 0,
                                        message: "Fetching templates...",
                                });

                                const templates = await getTemplates(
                                        context,
                                        config
                                );

                                if (templates.length === 0) {
                                        vscode.window.showWarningMessage(
                                                "No templates are available from the API."
                                        );
                                        return;
                                }

                                progress.report({
                                        increment: 30,
                                        message: "Selecting templates...",
                                });

                                const selected = await showTemplatePicker(
                                        templates,
                                        config.defaultTemplates
                                );

                                if (!selected || selected.length === 0) {
                                        vscode.window.showInformationMessage(
                                                "No templates selected."
                                        );
                                        return;
                                }

                                logInfo(
                                        `Previewing gitignore for templates: ${selected.map((t) => t.label).join(", ")}`
                                );

                                progress.report({
                                        increment: 50,
                                        message: "Fetching gitignore content...",
                                });

                                const content = await getGitignoreContent(
                                        context,
                                        config,
                                        selected.map((t) => t.label)
                                );

                                progress.report({
                                        increment: 90,
                                        message: "Opening preview...",
                                });

                                await showTemplatePreview(content);
                                progress.report({
                                        increment: 100,
                                        message: "Complete!",
                                });
                                logInfo("Gitignore preview displayed");
                        }
                );
        } catch (error) {
                logError("Failed to preview gitignore", error);
                const errorMessage = getErrorMessage(error);
                vscode.window.showErrorMessage(
                        `Failed to preview .gitignore: ${errorMessage}`
                );
        }
};
