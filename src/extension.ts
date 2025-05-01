import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
	const templateListKey = "yagi.gitignoreTemplateList";
	const templateListTimestampKey = "yagi.gitignoreTemplateListTimestamp";
	const templateListTtl = 24 * 60 * 60 * 1000; // 24 hours
	const gitignoreCacheKey = "yagi.gitignoreCache";
	const gitignoreCacheTtl = 60 * 60 * 1000; // 1 hour

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
				let templates: string[] | undefined = undefined;
				const now = Date.now();
				const cachedList = context.globalState.get<string[]>(templateListKey);
				const cachedListTimestamp = context.globalState.get<number>(
					templateListTimestampKey,
				);
				if (
					cachedList &&
					cachedListTimestamp &&
					now - cachedListTimestamp < templateListTtl
				) {
					templates = cachedList;
				} else {
					const listResp: Response = await fetch(
						"https://www.toptal.com/developers/gitignore/api/list",
					);
					const listText: string = await listResp.text();
					templates = listText
						.split(/,|\n/)
						.map((t: string) => t.trim())
						.filter(Boolean);
					await context.globalState.update(templateListKey, templates);
					await context.globalState.update(templateListTimestampKey, now);
				}

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

				const apiKey = picks.sort().join(",");
				const cacheObj =
					context.globalState.get<
						Record<string, { content: string; timestamp: number }>
					>(gitignoreCacheKey) || {};
				let content: string | undefined = undefined;
				if (
					cacheObj[apiKey] &&
					now - cacheObj[apiKey].timestamp < gitignoreCacheTtl
				) {
					content = cacheObj[apiKey].content;
				} else {
					const apiUrl: string = `https://www.toptal.com/developers/gitignore/api/${picks.join(",")}`;
					const resp: Response = await fetch(apiUrl);
					content = await resp.text();
					cacheObj[apiKey] = { content, timestamp: now };
					await context.globalState.update(gitignoreCacheKey, cacheObj);
				}

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
						await context.globalState.update(gitignoreCacheKey, cacheObj);
						vscode.window.showInformationMessage("Appended to .gitignore!");
						return;
					}
				}
				await vscode.workspace.fs.writeFile(
					gitignoreUri,
					Buffer.from(content, "utf8"),
				);
				await context.globalState.update(gitignoreCacheKey, cacheObj);
				vscode.window.showInformationMessage(".gitignore generated!");
			} catch (err: any) {
				vscode.window.showErrorMessage(
					"Failed to generate .gitignore: " + (err?.message || String(err)),
				);
			}
		},
	);

	context.subscriptions.push(giDisposable);

	const clearCacheDisposable: vscode.Disposable =
		vscode.commands.registerCommand(
			"yagi.clearCache",
			async (): Promise<void> => {
				await context.globalState.update(templateListKey, undefined);
				await context.globalState.update(templateListTimestampKey, undefined);
				await context.globalState.update(gitignoreCacheKey, undefined);
				vscode.window.showInformationMessage("YAGI cache cleared.");
			},
		);
	context.subscriptions.push(clearCacheDisposable);
}

export function deactivate(): void {}
