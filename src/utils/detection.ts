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

/** Cache for project detection results per workspace. */
const detectionCache = new Map<string, Promise<string[]>>();

/**
 * Detects project type and platform for template suggestions.
 * Results are cached per workspace to avoid repeated file system checks.
 * @return Promise resolving to array of suggested template names.
 */
export const detectProjectType = async (): Promise<string[]> => {
        const workspaceFolder = getWorkspaceFolder();
        const workspaceKey = workspaceFolder.uri.toString();

        // Check cache first
        const cached = detectionCache.get(workspaceKey);
        if (cached) {
                return await cached;
        }

        // Perform detection
        const detectionPromise = performDetection(workspaceFolder);
        detectionCache.set(workspaceKey, detectionPromise);

        // Clean up cache on error to allow retry
        detectionPromise.catch(() => {
                detectionCache.delete(workspaceKey);
        });

        return await detectionPromise;
};

/**
 * Checks if any file from detector exists.
 * @param files File paths to check.
 * @param workspaceUri Workspace URI.
 * @return Promise resolving to true if any file exists.
 */
const hasAnyFile = async (
        files: readonly string[],
        workspaceUri: vscode.Uri
): Promise<boolean> => {
        const exists = (path: string) =>
                checkFileExists(vscode.Uri.joinPath(workspaceUri, path));

        const results = await Promise.allSettled(files.map(exists));
        return results.some(
                (result) =>
                        result.status === "fulfilled" && result.value === true
        );
};

/**
 * Adds templates to suggestions set if detector files exist.
 * @param detector Project detector configuration.
 * @param workspaceUri Workspace URI.
 * @param suggestions Suggestions set to update.
 */
const checkDetector = async (
        detector: { files: readonly string[]; templates: readonly string[] },
        workspaceUri: vscode.Uri,
        suggestions: Set<string>
): Promise<void> => {
        const fileExists = await hasAnyFile(detector.files, workspaceUri);

        if (!fileExists) {
                return;
        }

        for (const template of detector.templates) {
                suggestions.add(template);
        }
};

/**
 * Performs the actual project type detection.
 * @param workspaceFolder The workspace folder to check.
 * @return Promise resolving to array of suggested template names.
 */
const performDetection = async (
        workspaceFolder: vscode.WorkspaceFolder
): Promise<string[]> => {
        const suggestions = new Set<string>();
        const workspaceUri = workspaceFolder.uri;

        await Promise.all(
                PROJECT_DETECTORS.map((detector) =>
                        checkDetector(detector, workspaceUri, suggestions)
                )
        );

        const platformTemplate = PLATFORM_TEMPLATES[process.platform];
        if (platformTemplate) {
                suggestions.add(platformTemplate);
        }

        return [...suggestions];
};

/**
 * Clears the project detection cache (useful for testing).
 */
export const clearDetectionCache = (): void => {
        detectionCache.clear();
};
