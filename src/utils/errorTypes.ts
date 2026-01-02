/**
 * @fileoverview Custom error types for YAGI extension.
 */

/**
 * Base error class for all YAGI errors.
 */
export class YagiError extends Error {
        readonly errorCause?: unknown;

        constructor(message: string, cause?: unknown) {
                super(message);
                this.errorCause = cause;
                // Set name property using defineProperty to override readonly property
                Object.defineProperty(this, "name", {
                        value: "YagiError",
                        configurable: true,
                        writable: true,
                });
                // Maintains proper stack trace for where our error was thrown (only available on V8)
                if (Error.captureStackTrace) {
                        Error.captureStackTrace(this, YagiError);
                }
        }
}

/**
 * Network-related errors (timeout, connection issues, etc.).
 */
export class NetworkError extends YagiError {
        constructor(message: string, cause?: unknown) {
                super(message, cause);
                Object.defineProperty(this, "name", {
                        value: "NetworkError",
                        configurable: true,
                        writable: true,
                });
        }
}

/**
 * API-related errors (HTTP errors, invalid responses, etc.).
 */
export class ApiError extends YagiError {
        readonly statusCode: number | undefined;

        constructor(
                message: string,
                statusCode: number | undefined,
                cause?: unknown
        ) {
                super(message, cause);
                Object.defineProperty(this, "name", {
                        value: "ApiError",
                        configurable: true,
                        writable: true,
                });
                this.statusCode = statusCode;
        }
}

/**
 * Validation errors (invalid configuration, invalid input, etc.).
 */
export class ValidationError extends YagiError {
        constructor(message: string, cause?: unknown) {
                super(message, cause);
                Object.defineProperty(this, "name", {
                        value: "ValidationError",
                        configurable: true,
                        writable: true,
                });
        }
}

/**
 * File system errors (permissions, not found, etc.).
 */
export class FileSystemError extends YagiError {
        constructor(message: string, cause?: unknown) {
                super(message, cause);
                Object.defineProperty(this, "name", {
                        value: "FileSystemError",
                        configurable: true,
                        writable: true,
                });
        }
}
