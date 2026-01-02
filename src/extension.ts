/**
 * @fileoverview Main extension entry point for YAGI.
 */

import * as vscode from "vscode";

import { clearCache, generateGitignore, previewGitignore } from "./commands";
import { loadConfiguration } from "./config";
import { createStatusBarItem } from "./ui/statusBar";

/**
 * Activates the YAGI extension.
 * @param context VS Code extension context.
 */
export const activate = (context: vscode.ExtensionContext): void => {
        const config = loadConfiguration();
        const statusBarItem = createStatusBarItem();
        statusBarItem.show();

        const commands = [
                vscode.commands.registerCommand("yagi.generateGitignore", () =>
                        generateGitignore(context, config)
                ),
                vscode.commands.registerCommand("yagi.previewGitignore", () =>
                        previewGitignore(context, config)
                ),
                vscode.commands.registerCommand("yagi.clearCache", () =>
                        clearCache(context)
                ),
        ];

        context.subscriptions.push(statusBarItem, ...commands);
};

/**
 * Deactivates the YAGI extension.
 * Extension cleanup is handled automatically by VS Code.
 */
export const deactivate = (): void => {
        // Extension cleanup is handled automatically by VS Code
};
