/**
 * @fileoverview Pure validation functions for configuration.
 */

import { ValidationError } from "../utils/errorTypes";

/** Maximum allowed cache size to prevent memory issues. */
export const MAX_CACHE_SIZE_LIMIT = 10000;

/** Maximum allowed TTL value in milliseconds (approximately 1 year). */
export const MAX_TTL_LIMIT = 365 * 24 * 60 * 60 * 1000;

/**
 * Validates a URL string.
 * @param url The URL to validate.
 * @return True if URL is valid.
 */
export const isValidUrl = (url: string): boolean => {
        try {
                const parsed = new URL(url);
                return (
                        parsed.protocol === "http:" ||
                        parsed.protocol === "https:"
                );
        } catch {
                return false;
        }
};

/**
 * Validates TTL value is positive and within reasonable limits.
 * @param value TTL value to validate.
 * @param name Name of the configuration field.
 * @throws ValidationError if value is invalid.
 */
export const validateTtl = (value: number, name: string): void => {
        if (value <= 0) {
                throw new ValidationError(
                        `${name} must be positive, got ${value}`
                );
        }

        if (value > MAX_TTL_LIMIT) {
                throw new ValidationError(
                        `${name} exceeds maximum limit of ${MAX_TTL_LIMIT}ms (approximately 1 year), got ${value}`
                );
        }
};

/**
 * Validates cache size is positive and within reasonable limits.
 * @param value Cache size value to validate.
 * @param name Name of the configuration field.
 * @throws ValidationError if value is invalid.
 */
export const validateCacheSize = (value: number, name: string): void => {
        if (value <= 0) {
                throw new ValidationError(
                        `${name} must be positive, got ${value}`
                );
        }

        if (value > MAX_CACHE_SIZE_LIMIT) {
                throw new ValidationError(
                        `${name} exceeds maximum limit of ${MAX_CACHE_SIZE_LIMIT}, got ${value}. This limit prevents excessive memory usage.`
                );
        }
};

/**
 * Validates default templates array.
 * @param templates Templates array to validate.
 * @throws ValidationError if templates are invalid.
 */
export const validateDefaultTemplates = (templates: unknown): void => {
        if (!Array.isArray(templates)) {
                throw new ValidationError("defaultTemplates must be an array");
        }

        for (const template of templates) {
                if (
                        typeof template !== "string" ||
                        template.trim().length === 0
                ) {
                        throw new ValidationError(
                                "defaultTemplates must contain non-empty strings"
                        );
                }
        }
};
