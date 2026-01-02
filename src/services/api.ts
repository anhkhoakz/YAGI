/**
 * @fileoverview API service for fetching gitignore templates.
 */

import { API_ENDPOINTS, TEMPLATE_SPLIT_REGEX } from "../constants";
import { getErrorMessage } from "../utils/errors";

/**
 * Fetches available gitignore templates from API.
 * @param customApiEndpoint Optional custom API endpoint.
 * @return Promise resolving to array of template names.
 */
export const fetchTemplates = async (
        customApiEndpoint: string | null
): Promise<string[]> => {
        const endpoint = customApiEndpoint ?? API_ENDPOINTS.templateList;

        try {
                const response = await fetch(endpoint);

                if (!response.ok) {
                        throw new Error(
                                `HTTP ${response.status}: ${response.statusText}`
                        );
                }

                const text = await response.text();
                return text
                        .split(TEMPLATE_SPLIT_REGEX)
                        .map((template) => template.trim())
                        .filter((template) => template.length > 0);
        } catch (error) {
                throw new Error(
                        `Failed to fetch templates from ${endpoint}: ${getErrorMessage(error)}`
                );
        }
};

/**
 * Fetches gitignore content for specified templates.
 * @param templates Array of template names to fetch.
 * @param customApiEndpoint Optional custom API endpoint.
 * @return Promise resolving to gitignore content string.
 */
export const fetchGitignoreContent = async (
        templates: string[],
        customApiEndpoint: string | null
): Promise<string> => {
        const baseEndpoint = customApiEndpoint ?? API_ENDPOINTS.gitignore;
        const endpoint = `${baseEndpoint}/${templates.join(",")}`;

        try {
                const response = await fetch(endpoint);

                if (!response.ok) {
                        throw new Error(
                                `HTTP ${response.status}: ${response.statusText}`
                        );
                }

                return await response.text();
        } catch (error) {
                throw new Error(
                        `Failed to generate .gitignore from ${endpoint}: ${getErrorMessage(error)}`
                );
        }
};
