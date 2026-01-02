/**
 * @fileoverview Project type detection utilities for YAGI extension.
 */

import * as vscode from "vscode";

import { checkFileExists, getWorkspaceFolder } from "./fileSystem";

/** Project detection rules mapping file patterns to template names. */
const PROJECT_DETECTORS = [
        { files: ["package.json"], templates: ["Node"] },
        { files: ["pnpm-lock.yaml", "yarn.lock"], templates: ["Node"] },
        { files: ["pom.xml"], templates: ["Maven", "Java"] },
        {
                files: ["build.gradle", "build.gradle.kts"],
                templates: ["Gradle", "Java"],
        },
        {
                files: ["requirements.txt", "pyproject.toml"],
                templates: ["Python"],
        },
        { files: ["go.mod"], templates: ["Go"] },
        { files: ["Cargo.toml"], templates: ["Rust"] },
        { files: ["Gemfile"], templates: ["Ruby"] },
        { files: ["composer.json"], templates: ["PHP"] },
        { files: ["Packages/manifest.json", "Assets"], templates: ["Unity"] },
        { files: ["CMakeLists.txt"], templates: ["C"] },
] as const;

/** Platform-specific template mappings. */
const PLATFORM_TEMPLATES: Record<string, string> = {
        darwin: "macOS",
        win32: "Windows",
        linux: "Linux",
};

/**
 * Detects project type and platform for template suggestions.
 * @return Promise resolving to array of suggested template names.
 */
export const detectProjectType = async (): Promise<string[]> => {
        const workspaceFolder = getWorkspaceFolder();
        const suggestions = new Set<string>();

        const exists = (path: string) =>
                checkFileExists(vscode.Uri.joinPath(workspaceFolder.uri, path));

        // Check project files in parallel
        await Promise.all(
                PROJECT_DETECTORS.map(async ({ files, templates }) => {
                        const hasFile = await Promise.any(
                                files.map(exists)
                        ).catch(() => false);

                        if (hasFile) {
                                for (const template of templates) {
                                        suggestions.add(template);
                                }
                        }
                })
        );

        // Add platform-specific template
        const platformTemplate = PLATFORM_TEMPLATES[process.platform];
        if (platformTemplate) {
                suggestions.add(platformTemplate);
        }

        return [...suggestions];
};
