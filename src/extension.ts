import * as vscode from 'vscode';

interface YagiConfig {
  readonly templateListTtl: number;
  readonly gitignoreCacheTtl: number;
  readonly maxCacheSize: number;
  readonly defaultTemplates: readonly string[];
  readonly customApiEndpoint: string | null;
  readonly customGitignorePath: string;
}

interface GitignoreTemplate {
  readonly label: string;
  readonly description?: string;
  readonly picked?: boolean;
}

interface CacheEntry {
  readonly content: string;
  readonly timestamp: number;
}

type CacheObject = Record<string, CacheEntry>;

const DEFAULT_CONFIG: Readonly<Required<Omit<YagiConfig, 'customApiEndpoint'>>> = {
  templateListTtl: 24 * 60 * 60 * 1000, // 24 hours
  gitignoreCacheTtl: 60 * 60 * 1000, // 1 hour
  maxCacheSize: 100,
  defaultTemplates: [],
  customGitignorePath: '.gitignore',
};

const API_ENDPOINTS = {
  templateList: 'https://www.toptal.com/developers/gitignore/api/list',
  gitignore: 'https://www.toptal.com/developers/gitignore/api',
} as const;

const STORAGE_KEYS = {
  templateList: 'yagi.gitignoreTemplateList',
  templateListTimestamp: 'yagi.gitignoreTemplateListTimestamp',
  gitignoreCache: 'yagi.gitignoreCache',
} as const;

const TEMPLATE_SPLIT_REGEX = /,|\n/;

class YagiExtension {
  private readonly context: vscode.ExtensionContext;
  private readonly config: YagiConfig;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): YagiConfig {
    const config = vscode.workspace.getConfiguration('yagi');

    return {
      templateListTtl: config.get<number>('templateListTtl') ?? DEFAULT_CONFIG.templateListTtl,
      gitignoreCacheTtl:
        config.get<number>('gitignoreCacheTtl') ?? DEFAULT_CONFIG.gitignoreCacheTtl,
      maxCacheSize: config.get<number>('maxCacheSize') ?? DEFAULT_CONFIG.maxCacheSize,
      defaultTemplates: config.get<string[]>('defaultTemplates') ?? DEFAULT_CONFIG.defaultTemplates,
      customApiEndpoint: config.get<string>('customApiEndpoint') ?? null,
      customGitignorePath:
        config.get<string>('customGitignorePath') ?? DEFAULT_CONFIG.customGitignorePath,
    };
  }

  private async fetchTemplates(): Promise<string[]> {
    const endpoint = this.config.customApiEndpoint ?? API_ENDPOINTS.templateList;

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return text
        .split(TEMPLATE_SPLIT_REGEX)
        .map((template) => template.trim())
        .filter((template) => template.length > 0);
    } catch (error) {
      throw new Error(`Failed to fetch templates from ${endpoint}: ${this.getErrorMessage(error)}`);
    }
  }

  private async getTemplates(): Promise<string[]> {
    const now = Date.now();
    const cachedList = this.context.globalState.get<string[]>(STORAGE_KEYS.templateList);
    const cachedTimestamp = this.context.globalState.get<number>(
      STORAGE_KEYS.templateListTimestamp
    );

    if (this.isCacheValid(cachedList, cachedTimestamp, now, this.config.templateListTtl)) {
      return cachedList;
    }

    const templates = await this.fetchTemplates();
    await this.updateTemplateCache(templates, now);
    return templates;
  }

  private isCacheValid<T>(
    cached: T | undefined,
    timestamp: number | undefined,
    now: number,
    ttl: number
  ): cached is T {
    return cached !== undefined && timestamp !== undefined && now - timestamp < ttl;
  }

  private async updateTemplateCache(templates: string[], timestamp: number): Promise<void> {
    await this.context.globalState.update(STORAGE_KEYS.templateList, templates);
    await this.context.globalState.update(STORAGE_KEYS.templateListTimestamp, timestamp);
  }

  private async getGitignoreContent(templates: string[]): Promise<string> {
    const now = Date.now();
    const cacheKey = templates.sort().join(',');
    const cacheObj = this.context.globalState.get<CacheObject>(STORAGE_KEYS.gitignoreCache) ?? {};
    const cachedEntry = cacheObj[cacheKey];

    if (
      cachedEntry !== undefined &&
      this.isCacheValid(
        cachedEntry.content,
        cachedEntry.timestamp,
        now,
        this.config.gitignoreCacheTtl
      )
    ) {
      return cachedEntry.content;
    }

    const content = await this.fetchGitignoreContent(templates);
    await this.updateGitignoreCache(cacheObj, cacheKey, content, now);
    return content;
  }

  private async fetchGitignoreContent(templates: string[]): Promise<string> {
    const baseEndpoint = this.config.customApiEndpoint ?? API_ENDPOINTS.gitignore;
    const endpoint = `${baseEndpoint}/${templates.join(',')}`;

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(
        `Failed to generate .gitignore from ${endpoint}: ${this.getErrorMessage(error)}`
      );
    }
  }

  private async updateGitignoreCache(
    cacheObj: CacheObject,
    cacheKey: string,
    content: string,
    timestamp: number
  ): Promise<void> {
    const updatedCache: CacheObject = {
      ...cacheObj,
      [cacheKey]: { content, timestamp },
    };

    const cleanedCache = this.cleanupCache(updatedCache);
    await this.context.globalState.update(STORAGE_KEYS.gitignoreCache, cleanedCache);
  }

  private cleanupCache(cacheObj: CacheObject): CacheObject {
    const entries = Object.entries(cacheObj);

    if (entries.length <= this.config.maxCacheSize) {
      return cacheObj;
    }

    // Keep most recently used entries
    const sortedEntries = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    return Object.fromEntries(sortedEntries.slice(0, this.config.maxCacheSize));
  }

  private async writeGitignore(content: string, gitignorePath: string): Promise<void> {
    const workspaceFolder = this.getWorkspaceFolder();
    const gitignoreUri = vscode.Uri.joinPath(workspaceFolder.uri, gitignorePath);
    const exists = await this.checkFileExists(gitignoreUri);

    if (exists) {
      await this.handleExistingGitignore(gitignoreUri, content, gitignorePath);
    } else {
      await this.createNewGitignore(gitignoreUri, content, gitignorePath);
    }
  }

  private getWorkspaceFolder(): vscode.WorkspaceFolder {
    const folders = vscode.workspace.workspaceFolders;

    if (folders === undefined || folders.length === 0) {
      throw new Error('No workspace folder is open. Please open a folder or workspace first.');
    }

    return folders[0];
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
    gitignorePath: string
  ): Promise<void> {
    const action = await vscode.window.showQuickPick(['Override', 'Append', 'Cancel'], {
      placeHolder: `${gitignorePath} already exists. What would you like to do?`,
      ignoreFocusOut: true,
    });

    if (action === undefined || action === 'Cancel') {
      vscode.window.showInformationMessage('Operation cancelled.');
      return;
    }

    if (action === 'Append') {
      await this.appendToGitignore(uri, content, gitignorePath);
    } else {
      await this.createNewGitignore(uri, content, gitignorePath);
    }
  }

  private async appendToGitignore(
    uri: vscode.Uri,
    content: string,
    gitignorePath: string
  ): Promise<void> {
    const existingContent = await this.readFileAsString(uri);
    const newContent = `${existingContent}\n${content}`;

    await vscode.workspace.fs.writeFile(uri, Buffer.from(newContent, 'utf8'));
    vscode.window.showInformationMessage(`Successfully appended to ${gitignorePath}`);
  }

  private async createNewGitignore(
    uri: vscode.Uri,
    content: string,
    gitignorePath: string
  ): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
    vscode.window.showInformationMessage(`Successfully created ${gitignorePath}`);
  }

  private async readFileAsString(uri: vscode.Uri): Promise<string> {
    const fileContent = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(fileContent).toString('utf8');
  }

  async generateGitignore(): Promise<void> {
    try {
      const templates = await this.getTemplates();

      if (templates.length === 0) {
        vscode.window.showWarningMessage('No templates are available from the API.');
        return;
      }

      const selectedTemplates = await this.showTemplatePicker(templates);

      if (selectedTemplates === undefined || selectedTemplates.length === 0) {
        vscode.window.showInformationMessage('No templates selected.');
        return;
      }

      const content = await this.getGitignoreContent(selectedTemplates.map((t) => t.label));
      await this.writeGitignore(content, this.config.customGitignorePath);
    } catch (error) {
      await this.handleError(error);
    }
  }

  private showTemplatePicker(templates: string[]): Thenable<GitignoreTemplate[] | undefined> {
    const items: GitignoreTemplate[] = templates.map((template) => ({
      label: template,
      description: this.config.defaultTemplates.includes(template) ? 'Default template' : undefined,
      picked: this.config.defaultTemplates.includes(template),
    }));

    return vscode.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: 'Select gitignore templates (e.g., Node, macOS, VisualStudioCode)',
      ignoreFocusOut: true,
      matchOnDescription: true,
    });
  }

  private async handleError(error: unknown): Promise<void> {
    const errorMessage = this.getErrorMessage(error);
    const selection = await vscode.window.showErrorMessage(
      `Failed to generate .gitignore: ${errorMessage}`,
      'Retry',
      'Cancel'
    );

    if (selection === 'Retry') {
      await vscode.commands.executeCommand('yagi.generateGitignore');
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  async clearCache(): Promise<void> {
    await this.context.globalState.update(STORAGE_KEYS.templateList, undefined);
    await this.context.globalState.update(STORAGE_KEYS.templateListTimestamp, undefined);
    await this.context.globalState.update(STORAGE_KEYS.gitignoreCache, undefined);

    vscode.window.showInformationMessage('YAGI cache cleared successfully.');
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const yagi = new YagiExtension(context);

  const generateCommand = vscode.commands.registerCommand('yagi.generateGitignore', async () =>
    yagi.generateGitignore()
  );

  const clearCacheCommand = vscode.commands.registerCommand('yagi.clearCache', async () =>
    yagi.clearCache()
  );

  context.subscriptions.push(generateCommand, clearCacheCommand);
}

export function deactivate(): void {
  // Extension cleanup is handled automatically by VS Code
}
