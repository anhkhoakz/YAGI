/**
 * @fileoverview Error handling utilities.
 */

/**
 * Extracts error message from unknown error type.
 * @param error The error to extract message from.
 * @return The error message string.
 */
export const getErrorMessage = (error: unknown): string => {
        return error instanceof Error ? error.message : String(error);
};
