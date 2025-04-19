import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
	const disposable: vscode.Disposable = vscode.commands.registerCommand(
		"yagi.helloWorld",
		(): void => {
			vscode.window.showInformationMessage("Hello World from YAGI!");
		},
	);

	context.subscriptions.push(disposable);

	const giDisposable: vscode.Disposable = vscode.commands.registerCommand(
		"yagi.generateGitignore",
		async (): Promise<void> => {
			try {
				const listResp: Response = await fetch(
					"https://www.toptal.com/developers/gitignore/api/list",
				);
				const listText: string = await listResp.text();
				const templates: string[] = listText
					.split(/,|\n/)
					.map((t: string) => t.trim())
					.filter(Boolean);

				const picks: string[] | undefined = await vscode.window.showQuickPick(
					templates,
					{
						canPickMany: true,
						placeHolder:
							"Select gitignore templates (e.g. node, macos, vscode)",
					},
				);
				if (!picks || picks.length === 0) {
					vscode.window.showInformationMessage("No templates selected.");
					return;
				}

				const apiUrl: string = `https://www.toptal.com/developers/gitignore/api/${picks.join(",")}`;
				const resp: Response = await fetch(apiUrl);
				const content: string = await resp.text();

				const folders: readonly vscode.WorkspaceFolder[] | undefined =
					vscode.workspace.workspaceFolders;
				if (!folders || folders.length === 0) {
					vscode.window.showErrorMessage("No workspace folder open.");
					return;
				}
				const gitignoreUri = vscode.Uri.joinPath(folders[0].uri, ".gitignore");

				let exists = false;
				try {
					await vscode.workspace.fs.stat(gitignoreUri);
					exists = true;
				} catch {
					exists = false;
				}

				if (exists) {
					const action: string | undefined = await vscode.window.showQuickPick(
						["Override", "Append", "Cancel"],
						{
							placeHolder: ".gitignore already exists. What do you want to do?",
						},
					);
					if (action === "Cancel" || !action) {
						vscode.window.showInformationMessage("Operation cancelled.");
						return;
					} else if (action === "Append") {
						const oldContent = Buffer.from(
							await vscode.workspace.fs.readFile(gitignoreUri),
						).toString("utf8");
						const newContent = oldContent + "\n" + content;
						await vscode.workspace.fs.writeFile(
							gitignoreUri,
							Buffer.from(newContent, "utf8"),
						);
						vscode.window.showInformationMessage("Appended to .gitignore!");
						return;
					}
				}
				await vscode.workspace.fs.writeFile(
					gitignoreUri,
					Buffer.from(content, "utf8"),
				);
				vscode.window.showInformationMessage(".gitignore generated!");
			} catch (err: any) {
				vscode.window.showErrorMessage(
					"Failed to generate .gitignore: " + (err?.message || String(err)),
				);
			}
		},
	);

	context.subscriptions.push(giDisposable);
}

export function deactivate(): void {}
