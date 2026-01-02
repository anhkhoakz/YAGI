/**
 * @fileoverview Status bar UI components for YAGI extension.
 */

import * as vscode from "vscode";

/**
 * Creates status bar item for quick gitignore generation access.
 * @return Configured status bar item.
 */
export const createStatusBarItem = (): vscode.StatusBarItem => {
        const item = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Right,
                100
        );
        item.text = "$(file-code) GitIgnore";
        item.command = "yagi.generateGitignore";
        item.tooltip = "Generate .gitignore";
        return item;
};
