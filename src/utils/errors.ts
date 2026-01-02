/**
 * @fileoverview Error handling utilities.
 */

import {
        ApiError,
        FileSystemError,
        NetworkError,
        ValidationError,
        YagiError,
} from "./errorTypes";

/**
 * Extracts error message from unknown error type.
 * @param error The error to extract message from.
 * @return The error message string.
 */
export const getErrorMessage = (error: unknown): string => {
        if (error instanceof YagiError) {
                return error.message;
        }
        if (error instanceof Error) {
                return error.message;
        }
        return String(error);
};

/**
 * Checks if error is a network error (timeout, connection issues).
 * @param error The error to check.
 * @return True if error is a network error.
 */
export const isNetworkError = (error: unknown): error is NetworkError => {
        return error instanceof NetworkError;
};

/**
 * Checks if error is an API error (HTTP errors, invalid responses).
 * @param error The error to check.
 * @return True if error is an API error.
 */
export const isApiError = (error: unknown): error is ApiError => {
        return error instanceof ApiError;
};

/**
 * Checks if error is a validation error.
 * @param error The error to check.
 * @return True if error is a validation error.
 */
export const isValidationError = (error: unknown): error is ValidationError => {
        return error instanceof ValidationError;
};

/**
 * Checks if error is a file system error.
 * @param error The error to check.
 * @return True if error is a file system error.
 */
export const isFileSystemError = (error: unknown): error is FileSystemError => {
        return error instanceof FileSystemError;
};
