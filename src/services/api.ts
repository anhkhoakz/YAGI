/**
 * @fileoverview API service for fetching gitignore templates.
 */

import { API_ENDPOINTS, TEMPLATE_SPLIT_REGEX } from "../constants";
import { ApiError, NetworkError } from "../utils/errorTypes";
import { logDebug, logError } from "../utils/logger";
import { fetchWithRetry } from "../utils/network";

/**
 * Parses template list from API response text.
 * @param text Response text from API.
 * @param endpoint Endpoint URL for error messages.
 * @return Array of template names.
 * @throws ApiError if no templates found.
 */
export const parseTemplates = (text: string, endpoint: string): string[] => {
        const templates = text
                .split(TEMPLATE_SPLIT_REGEX)
                .map((template) => template.trim())
                .filter((template) => template.length > 0);

        if (templates.length === 0) {
                throw new ApiError(
                        `No templates found in response from ${endpoint}`,
                        undefined
                );
        }

        return templates;
};

/**
 * Fetches available gitignore templates from API.
 * @param customApiEndpoint Optional custom API endpoint.
 * @return Promise resolving to array of template names.
 * @throws NetworkError for network issues or timeouts.
 * @throws ApiError for HTTP errors.
 */
export const fetchTemplates = async (
        customApiEndpoint: string | null
): Promise<string[]> => {
        const endpoint = customApiEndpoint ?? API_ENDPOINTS.templateList;
        logDebug(`Fetching templates from: ${endpoint}`);

        try {
                const response = await fetchWithRetry(endpoint);
                const text = await response.text();
                const templates = parseTemplates(text, endpoint);
                logDebug(`Fetched ${templates.length} templates`);
                return templates;
        } catch (error) {
                logError(`Failed to fetch templates from ${endpoint}`, error);

                if (
                        error instanceof ApiError ||
                        error instanceof NetworkError
                ) {
                        throw error;
                }

                throw new ApiError(
                        `Failed to fetch templates from ${endpoint}`,
                        undefined,
                        error
                );
        }
};

/**
 * Fetches gitignore content for specified templates.
 * @param templates Array of template names to fetch.
 * @param customApiEndpoint Optional custom API endpoint.
 * @return Promise resolving to gitignore content string.
 * @throws NetworkError for network issues or timeouts.
 * @throws ApiError for HTTP errors.
 */
export const fetchGitignoreContent = async (
        templates: string[],
        customApiEndpoint: string | null
): Promise<string> => {
        if (templates.length === 0) {
                throw new ApiError("No templates provided", undefined);
        }

        const baseEndpoint = customApiEndpoint ?? API_ENDPOINTS.gitignore;
        const endpoint = `${baseEndpoint}/${templates.join(",")}`;
        logDebug(
                `Fetching gitignore content for templates: ${templates.join(", ")}`
        );

        try {
                const response = await fetchWithRetry(endpoint);
                const content = await response.text();
                logDebug(
                        `Fetched gitignore content (${content.length} characters)`
                );
                return content;
        } catch (error) {
                logError(
                        `Failed to generate .gitignore from ${endpoint}`,
                        error
                );

                if (
                        error instanceof ApiError ||
                        error instanceof NetworkError
                ) {
                        throw error;
                }

                throw new ApiError(
                        `Failed to generate .gitignore from ${endpoint}`,
                        undefined,
                        error
                );
        }
};
