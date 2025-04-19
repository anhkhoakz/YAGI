import * as assert from "assert";
import * as vscode from "vscode";

describe("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	it("Sample test", () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
	});

	it("should generate a .gitignore file when yagi.generateGitignore is executed", async () => {
		const sinon = require("sinon");
		const fs = require("fs");
		const path = require("path");

		const globalAny = global as any;
		const fetchStub = sinon.stub();
		fetchStub
			.onFirstCall()
			.resolves({ text: async () => "node,macos,vscode" })
			.onSecondCall()
			.resolves({ text: async () => "# Node\nnode_modules/\n" });
		globalAny.fetch = fetchStub;

		const qpStub = sinon.stub(vscode.window, "showQuickPick");
		qpStub.onFirstCall().resolves(["node"]);
		qpStub.onSecondCall().resolves("Override");

		const folders = vscode.workspace.workspaceFolders;
		assert.ok(folders && folders.length > 0, "No workspace folder");
		const gitignorePath = path.join(folders[0].uri.fsPath, ".gitignore");

		if (fs.existsSync(gitignorePath)) {
			fs.unlinkSync(gitignorePath);
		}

		await vscode.commands.executeCommand("yagi.generateGitignore");

		assert.ok(fs.existsSync(gitignorePath), ".gitignore was not created");
		const content = fs.readFileSync(gitignorePath, "utf8");
		assert.ok(
			content.includes("node_modules/"),
			".gitignore content incorrect",
		);

		fs.unlinkSync(gitignorePath);
		qpStub.restore();
		delete globalAny.fetch;
	});
});
