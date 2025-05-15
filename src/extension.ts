import * as vscode from "vscode";

interface YagiConfig {
	templateListTtl: number;
	gitignoreCacheTtl: number;
	maxCacheSize: number;
	defaultTemplates: string[];
	customApiEndpoint?: string;
	customGitignorePath?: string;
}

interface GitignoreTemplate {
	label: string;
	description?: string;
	picked?: boolean;
}

interface CacheEntry {
	content: string;
	timestamp: number;
}

interface CacheObject {
	[key: string]: CacheEntry;
}

class YagiExtension {
	private readonly context: vscode.ExtensionContext;
	private readonly config: YagiConfig;
	private readonly templateListKey = "yagi.gitignoreTemplateList";
	private readonly templateListTimestampKey =
		"yagi.gitignoreTemplateListTimestamp";
	private readonly gitignoreCacheKey = "yagi.gitignoreCache";

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		const config = vscode.workspace.getConfiguration("yagi");
		this.config = {
			templateListTtl: config.get("templateListTtl") || 24 * 60 * 60 * 1000,
			gitignoreCacheTtl: config.get("gitignoreCacheTtl") || 60 * 60 * 1000,
			maxCacheSize: config.get("maxCacheSize") || 100,
			defaultTemplates: config.get("defaultTemplates") || [],
			customApiEndpoint: config.get("customApiEndpoint"),
			customGitignorePath: config.get("customGitignorePath"),
		};
	}

	private async fetchTemplates(): Promise<string[]> {
		const apiEndpoint =
			this.config.customApiEndpoint ||
			"https://www.toptal.com/developers/gitignore/api/list";
		const response = await fetch(apiEndpoint);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch templates: ${response.status} ${response.statusText}`,
			);
		}

		const text = await response.text();
		return text
			.split(/,|\n/)
			.map((t) => t.trim())
			.filter(Boolean);
	}

	private async getTemplates(): Promise<string[]> {
		const now = Date.now();
		const cachedList = this.context.globalState.get<string[]>(
			this.templateListKey,
		);
		const cachedListTimestamp = this.context.globalState.get<number>(
			this.templateListTimestampKey,
		);

		if (
			this.isCacheValid(
				cachedList,
				cachedListTimestamp,
				now,
				this.config.templateListTtl,
			)
		) {
			return cachedList!;
		}

		const templates = await this.fetchTemplates();
		await this.updateTemplateCache(templates, now);
		return templates;
	}

	private isCacheValid<T>(
		cached: T | undefined,
		timestamp: number | undefined,
		now: number,
		ttl: number,
	): boolean {
		return Boolean(cached && timestamp && now - timestamp < ttl);
	}

	private async updateTemplateCache(
		templates: string[],
		timestamp: number,
	): Promise<void> {
		await this.context.globalState.update(this.templateListKey, templates);
		await this.context.globalState.update(
			this.templateListTimestampKey,
			timestamp,
		);
	}

	private async getGitignoreContent(templates: string[]): Promise<string> {
		const now = Date.now();
		const apiKey = templates.sort().join(",");
		const cacheObj =
			this.context.globalState.get<CacheObject>(this.gitignoreCacheKey) || {};

		if (
			this.isCacheValid(
				cacheObj[apiKey]?.content,
				cacheObj[apiKey]?.timestamp,
				now,
				this.config.gitignoreCacheTtl,
			)
		) {
			return cacheObj[apiKey].content;
		}

		const content = await this.fetchGitignoreContent(templates);
		await this.updateGitignoreCache(cacheObj, apiKey, content, now);
		return content;
	}

	private async fetchGitignoreContent(templates: string[]): Promise<string> {
		const apiEndpoint =
			this.config.customApiEndpoint ||
			"https://www.toptal.com/developers/gitignore/api";
		const apiUrl = `${apiEndpoint}/${templates.join(",")}`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(
				`Failed to generate .gitignore: ${response.status} ${response.statusText}`,
			);
		}

		return response.text();
	}

	private async updateGitignoreCache(
		cacheObj: CacheObject,
		apiKey: string,
		content: string,
		timestamp: number,
	): Promise<void> {
		cacheObj[apiKey] = { content, timestamp };
		await this.cleanupCache(cacheObj);
		await this.context.globalState.update(this.gitignoreCacheKey, cacheObj);
	}

	private async cleanupCache(cacheObj: CacheObject): Promise<void> {
		const entries = Object.entries(cacheObj);
		if (entries.length > this.config.maxCacheSize) {
			const sortedEntries = entries.sort(
				(a, b) => b[1].timestamp - a[1].timestamp,
			);
			const newCacheObj = Object.fromEntries(
				sortedEntries.slice(0, this.config.maxCacheSize),
			);
			await this.context.globalState.update(
				this.gitignoreCacheKey,
				newCacheObj,
			);
		}
	}

	private async writeGitignore(
		content: string,
		gitignorePath: string,
	): Promise<void> {
		const folders = vscode.workspace.workspaceFolders;
		if (!folders || folders.length === 0) {
			throw new Error("No workspace folder open");
		}

		const gitignoreUri = vscode.Uri.joinPath(folders[0].uri, gitignorePath);
		const exists = await this.checkFileExists(gitignoreUri);

		if (exists) {
			await this.handleExistingGitignore(gitignoreUri, content, gitignorePath);
		} else {
			await this.createNewGitignore(gitignoreUri, content, gitignorePath);
		}
	}

	private async checkFileExists(uri: vscode.Uri): Promise<boolean> {
		try {
			await vscode.workspace.fs.stat(uri);
			return true;
		} catch {
			return false;
		}
	}

	private async handleExistingGitignore(
		uri: vscode.Uri,
		content: string,
		gitignorePath: string,
	): Promise<void> {
		const action = await vscode.window.showQuickPick(
			["Override", "Append", "Cancel"],
			{
				placeHolder: `${gitignorePath} already exists. What do you want to do?`,
			},
		);

		if (action === "Cancel" || !action) {
			vscode.window.showInformationMessage("Operation cancelled.");
			return;
		}

		if (action === "Append") {
			await this.appendToGitignore(uri, content, gitignorePath);
		} else {
			await this.createNewGitignore(uri, content, gitignorePath);
		}
	}

	private async appendToGitignore(
		uri: vscode.Uri,
		content: string,
		gitignorePath: string,
	): Promise<void> {
		const oldContent = Buffer.from(
			await vscode.workspace.fs.readFile(uri),
		).toString("utf8");
		const newContent = oldContent + "\n" + content;
		await vscode.workspace.fs.writeFile(uri, Buffer.from(newContent, "utf8"));
		vscode.window.showInformationMessage(`Appended to ${gitignorePath}!`);
	}

	private async createNewGitignore(
		uri: vscode.Uri,
		content: string,
		gitignorePath: string,
	): Promise<void> {
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
		vscode.window.showInformationMessage(`${gitignorePath} generated!`);
	}

	public async generateGitignore(): Promise<void> {
		try {
			const templates = await this.getTemplates();
			if (!templates || templates.length === 0) {
				throw new Error("No templates available");
			}

			const picks = await this.showTemplatePicker(templates);
			if (!picks || picks.length === 0) {
				vscode.window.showInformationMessage("No templates selected.");
				return;
			}

			const selectedTemplates = picks.map((p) => p.label);
			const content = await this.getGitignoreContent(selectedTemplates);
			const gitignorePath = this.config.customGitignorePath || ".gitignore";
			await this.writeGitignore(content, gitignorePath);
		} catch (err: any) {
			const errorMessage = err?.message || String(err);
			vscode.window
				.showErrorMessage(
					`Failed to generate .gitignore: ${errorMessage}`,
					"Retry",
					"Cancel",
				)
				.then((selection) => {
					if (selection === "Retry") {
						vscode.commands.executeCommand("yagi.generateGitignore");
					}
				});
		}
	}

	private async showTemplatePicker(
		templates: string[],
	): Promise<GitignoreTemplate[] | undefined> {
		return vscode.window.showQuickPick(
			templates.map((t) => ({
				label: t,
				description: this.config.defaultTemplates.includes(t)
					? "Default template"
					: undefined,
				picked: this.config.defaultTemplates.includes(t),
			})),
			{
				canPickMany: true,
				placeHolder: "Select gitignore templates (e.g. node, macos, vscode)",
			},
		);
	}

	public async clearCache(): Promise<void> {
		await this.context.globalState.update(this.templateListKey, undefined);
		await this.context.globalState.update(
			this.templateListTimestampKey,
			undefined,
		);
		await this.context.globalState.update(this.gitignoreCacheKey, undefined);
		vscode.window.showInformationMessage("YAGI cache cleared.");
	}
}

export function activate(context: vscode.ExtensionContext): void {
	const yagi = new YagiExtension(context);

	const giDisposable = vscode.commands.registerCommand(
		"yagi.generateGitignore",
		() => yagi.generateGitignore(),
	);

	const clearCacheDisposable = vscode.commands.registerCommand(
		"yagi.clearCache",
		() => yagi.clearCache(),
	);

	context.subscriptions.push(giDisposable, clearCacheDisposable);
}

export function deactivate(): void {}
