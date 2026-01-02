/**
 * @fileoverview Main extension entry point for YAGI.
 */

import * as vscode from "vscode";

import { clearCache, generateGitignore, previewGitignore } from "./commands";
import { loadConfiguration, onConfigurationChange } from "./config";
import { clearPendingRequests } from "./services/requestDeduplication";
import { createStatusBarItem } from "./ui/statusBar";
import { clearDetectionCache } from "./utils/detection";
import {
        disposeLogger,
        initializeLogger,
        LogLevel,
        logInfo,
} from "./utils/logger";

/**
 * Activates the YAGI extension.
 * @param context VS Code extension context.
 */
export const activate = (context: vscode.ExtensionContext): void => {
        const outputChannel = vscode.window.createOutputChannel("YAGI");
        initializeLogger(outputChannel, LogLevel.Info);

        logInfo("YAGI extension activated");

        let config = loadConfiguration();
        const statusBarItem = createStatusBarItem();
        statusBarItem.show();

        // Listen for configuration changes
        const configListener = onConfigurationChange((newConfig) => {
                logInfo("Configuration changed, reloading...");
                config = newConfig;
        });

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

        context.subscriptions.push(
                statusBarItem,
                configListener,
                outputChannel,
                ...commands
        );
};

/**
 * Deactivates the YAGI extension.
 * Performs explicit cleanup of resources.
 */
export const deactivate = (): void => {
        logInfo("YAGI extension deactivating...");

        clearDetectionCache();
        clearPendingRequests();
        disposeLogger();
};
