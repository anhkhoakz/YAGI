/**
 * @fileoverview Template picker UI components for YAGI extension.
 */

import * as vscode from "vscode";

import type { GitignoreTemplate } from "../types";
import { detectProjectType } from "../utils/detection";

/**
 * Shows template picker with smart suggestions.
 * @param templates Available template names.
 * @param defaultTemplates User-configured default templates.
 * @return Promise resolving to selected templates or undefined if cancelled.
 */
export const showTemplatePicker = async (
    templates: string[],
    defaultTemplates: readonly string[]
): Promise<GitignoreTemplate[] | undefined> => {
    const defaultSet = new Set(defaultTemplates.map((t) => t.toLowerCase()));

    // Prepare suggestions, but don't block UI if detection fails
    const suggestions = await detectProjectType().catch(() => [] as string[]);
    const suggestedSet = new Set(suggestions.map((s) => s.toLowerCase()));

    const items: GitignoreTemplate[] = templates.map((template) => {
        const key = template.toLowerCase();
        const isDefault = defaultSet.has(key);
        const isSuggested = suggestedSet.has(key);

        return {
            label: template,
            description: isDefault ? "Default template" : isSuggested ? "Suggested" : "",
            ...(isDefault || isSuggested ? { picked: true } : {}),
        };
    });

    return vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: "Select gitignore templates (e.g., Node, macOS, VisualStudioCode)",
        ignoreFocusOut: true,
        matchOnDescription: true,
    });
};

/**
 * Shows gitignore content preview in new editor tab.
 * @param content The gitignore content to preview.
 */
export const showTemplatePreview = async (content: string): Promise<void> => {
    const doc = await vscode.workspace.openTextDocument({
        content,
        language: "gitignore",
    });
    await vscode.window.showTextDocument(doc, { preview: true });
};
