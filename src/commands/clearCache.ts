/**
 * @fileoverview Clear cache command implementation.
 */

import * as vscode from "vscode";

import { clearAllCache } from "../services/cache";

/**
 * Clears all cached data and shows confirmation message.
 * @param context VS Code extension context.
 */
export const clearCache = async (
        context: vscode.ExtensionContext
): Promise<void> => {
        await clearAllCache(context);
        vscode.window.showInformationMessage(
                "YAGI cache cleared successfully."
        );
};
