/**
 * @fileoverview File system utilities for YAGI extension.
 */

import * as vscode from "vscode";

/**
 * Gets the first workspace folder.
 * @return The workspace folder.
 * @throws Error if no workspace folder is open.
 */
export const getWorkspaceFolder = (): vscode.WorkspaceFolder => {
        const folders = vscode.workspace.workspaceFolders;

        if (!folders || folders.length === 0) {
                throw new Error(
                        "No workspace folder is open. Please open a folder or workspace first."
                );
        }

        const firstFolder = folders[0];
        if (!firstFolder) {
                throw new Error(
                        "No workspace folder is open. Please open a folder or workspace first."
                );
        }

        return firstFolder;
};

/**
 * Checks if a file exists at the given URI.
 * @param uri The file URI to check.
 * @return Promise resolving to true if file exists.
 */
export const checkFileExists = async (uri: vscode.Uri): Promise<boolean> => {
        try {
                await vscode.workspace.fs.stat(uri);
                return true;
        } catch {
                return false;
        }
};

/**
 * Reads file content as UTF-8 string.
 * @param uri The file URI to read.
 * @return Promise resolving to file content.
 */
export const readFileAsString = async (uri: vscode.Uri): Promise<string> => {
        const fileContent = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(fileContent).toString("utf8");
};

/**
 * Writes gitignore file with user interaction for existing files.
 * @param content The gitignore content to write.
 * @param gitignorePath Path to the gitignore file.
 */
export const writeGitignoreFile = async (
        content: string,
        gitignorePath: string
): Promise<void> => {
        const workspaceFolder = getWorkspaceFolder();
        const gitignoreUri = vscode.Uri.joinPath(
                workspaceFolder.uri,
                gitignorePath
        );
        const exists = await checkFileExists(gitignoreUri);

        if (!exists) {
                await createNewGitignore(gitignoreUri, content, gitignorePath);
                return;
        }

        await handleExistingGitignore(gitignoreUri, content, gitignorePath);
};

/**
 * Handles interaction when gitignore file already exists.
 * @param uri The gitignore file URI.
 * @param content Content to write.
 * @param gitignorePath Path for user messages.
 */
const handleExistingGitignore = async (
        uri: vscode.Uri,
        content: string,
        gitignorePath: string
): Promise<void> => {
        const action = await vscode.window.showQuickPick(
                ["Override", "Append", "Cancel"],
                {
                        placeHolder: `${gitignorePath} already exists. What would you like to do?`,
                        ignoreFocusOut: true,
                }
        );

        if (!action || action === "Cancel") {
                vscode.window.showInformationMessage("Operation cancelled.");
                return;
        }

        if (action === "Append") {
                await appendToGitignore(uri, content, gitignorePath);
                return;
        }

        await createNewGitignore(uri, content, gitignorePath);
};

/**
 * Appends content to existing gitignore file.
 * @param uri The gitignore file URI.
 * @param content Content to append.
 * @param gitignorePath Path for user messages.
 */
const appendToGitignore = async (
        uri: vscode.Uri,
        content: string,
        gitignorePath: string
): Promise<void> => {
        const existingContent = await readFileAsString(uri);
        const newContent = `${existingContent}\n${content}`;

        await vscode.workspace.fs.writeFile(
                uri,
                Buffer.from(newContent, "utf8")
        );
        vscode.window.showInformationMessage(
                `Successfully appended to ${gitignorePath}`
        );
};

/**
 * Creates new gitignore file with content.
 * @param uri The gitignore file URI.
 * @param content Content to write.
 * @param gitignorePath Path for user messages.
 */
const createNewGitignore = async (
        uri: vscode.Uri,
        content: string,
        gitignorePath: string
): Promise<void> => {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
        vscode.window.showInformationMessage(
                `Successfully created ${gitignorePath}`
        );
};
