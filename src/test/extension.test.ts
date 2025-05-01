import * as assert from "assert";
import fs from "fs";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";

describe("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	it("Sample test", () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
	});

	async function setupGitignoreTest({
		picks = ["node"],
		overwriteAction = "Override",
	} = {}) {
		const globalAny = global as any;
		const fetchStub = sinon.stub();
		fetchStub
			.onFirstCall()
			.resolves({ text: async () => "node,macos,vscode" })
			.onSecondCall()
			.resolves({ text: async () => "# Node\nnode_modules/\n" });
		globalAny.fetch = fetchStub;

		const qpStub = sinon.stub(vscode.window, "showQuickPick");
		// Wrap picks as QuickPickItem objects if they are strings
		// showQuickPick should resolve to a single QuickPickItem or undefined
		if (picks.length > 0) {
			qpStub.onFirstCall().resolves({ label: picks[0] });
		} else {
			qpStub.onFirstCall().resolves(undefined);
		}
		if (overwriteAction) {
			qpStub.onSecondCall().resolves({ label: overwriteAction });
		}

		let folders = vscode.workspace.workspaceFolders;
		let gitignorePath =
			folders && folders.length > 0
				? path.join(folders[0].uri.fsPath, ".gitignore")
				: undefined;
		if (gitignorePath && fs.existsSync(gitignorePath)) {
			fs.unlinkSync(gitignorePath);
		}

		return { fetchStub, qpStub, gitignorePath };
	}

	afterEach(() => {
		sinon.restore();
		const globalAny = global as any;
		if (globalAny.fetch) {
			delete globalAny.fetch;
		}
	});

	it("should generate a .gitignore file when yagi.generateGitignore is executed", async () => {
		const { gitignorePath } = await setupGitignoreTest();
		await vscode.commands.executeCommand("yagi.generateGitignore");
		if (!gitignorePath) {
			throw new Error("No gitignorePath");
		}
		assert.ok(fs.existsSync(gitignorePath), ".gitignore was not created");
		const content = fs.readFileSync(gitignorePath, "utf8");
		assert.ok(
			content.includes("node_modules/"),
			".gitignore content incorrect",
		);
		fs.unlinkSync(gitignorePath);
	});

	it("should append to .gitignore if user selects Append", async () => {
		const { gitignorePath } = await setupGitignoreTest({
			overwriteAction: "Append",
		});
		if (!gitignorePath) {
			throw new Error("No gitignorePath");
		}
		fs.writeFileSync(gitignorePath, "# Existing\nfoo\n");
		await vscode.commands.executeCommand("yagi.generateGitignore");
		const content = fs.readFileSync(gitignorePath, "utf8");
		assert.ok(content.includes("# Existing"), "Original content missing");
		assert.ok(content.includes("node_modules/"), "Appended content missing");
		fs.unlinkSync(gitignorePath);
	});

	it("should cancel if user selects Cancel on overwrite", async () => {
		const { gitignorePath } = await setupGitignoreTest({
			overwriteAction: "Cancel",
		});
		if (!gitignorePath) {
			throw new Error("No gitignorePath");
		}
		fs.writeFileSync(gitignorePath, "# Existing\nfoo\n");
		await vscode.commands.executeCommand("yagi.generateGitignore");
		const content = fs.readFileSync(gitignorePath, "utf8");
		assert.strictEqual(content, "# Existing\nfoo\n");
		fs.unlinkSync(gitignorePath);
	});

	it("should show info if no templates selected", async () => {
		const { gitignorePath } = await setupGitignoreTest({ picks: [] });
		await vscode.commands.executeCommand("yagi.generateGitignore");
		assert.ok(
			!gitignorePath || !fs.existsSync(gitignorePath),
			".gitignore should not be created",
		);
	});

	it("should show error if no workspace folder", async () => {
		const foldersStub = sinon
			.stub(vscode.workspace, "workspaceFolders")
			.get(() => undefined);
		const globalAny = global as any;
		const fetchStub = sinon.stub();
		fetchStub
			.onFirstCall()
			.resolves({ text: async () => "node,macos,vscode" })
			.onSecondCall()
			.resolves({ text: async () => "# Node\nnode_modules/\n" });
		globalAny.fetch = fetchStub;
		const qpStub = sinon.stub(vscode.window, "showQuickPick");
		qpStub.onFirstCall().resolves({ label: "node" });
		qpStub.onSecondCall().resolves({ label: "Override" });
		await vscode.commands.executeCommand("yagi.generateGitignore");
		foldersStub.restore();
		qpStub.restore();
		delete globalAny.fetch;
	});
});
