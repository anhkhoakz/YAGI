/**
 * @fileoverview Structured logging utility for YAGI extension.
 */

import type { OutputChannel } from "vscode";

/**
 * Log levels for structured logging.
 */
export enum LogLevel {
        Debug = 0,
        Info = 1,
        Warn = 2,
        Error = 3,
}

/**
 * Logger configuration interface.
 */
interface LoggerConfigInterface {
        level: LogLevel;
        outputChannel: OutputChannel;
}

/**
 * Global logger instance.
 */
let loggerConfig: LoggerConfigInterface | null = null;

/**
 * Initializes the logger with an output channel.
 * @param outputChannel VS Code output channel for logs.
 * @param level Minimum log level to output.
 */
export const initializeLogger = (
        outputChannel: OutputChannel,
        level: LogLevel = LogLevel.Info
): void => {
        loggerConfig = {
                level,
                outputChannel: outputChannel,
        };
};

/**
 * Formats log message with timestamp and level.
 * @param level Log level.
 * @param message Log message.
 * @param data Optional additional data.
 * @return Formatted log string.
 */
const formatLogMessage = (
        level: LogLevel,
        message: string,
        data?: unknown
): string => {
        const timestamp = new Date().toISOString();
        const levelNames = ["Debug", "Info", "Warn", "Error"] as const;
        const levelName = levelNames[level] ?? "Unknown";
        const dataStr = data ? ` ${JSON.stringify(data)}` : "";

        return `[${timestamp}] [${levelName}] ${message}${dataStr}`;
};

/**
 * Logs a message at the specified level.
 * @param level Log level.
 * @param message Log message.
 * @param data Optional additional data.
 */
const log = (level: LogLevel, message: string, data?: unknown): void => {
        if (!loggerConfig) {
                return;
        }

        if (level < loggerConfig.level) {
                return;
        }

        const formattedMessage = formatLogMessage(level, message, data);
        loggerConfig.outputChannel.appendLine(formattedMessage);

        if (level === LogLevel.Error) {
                loggerConfig.outputChannel.show(true);
        }
};

/**
 * Logs a debug message.
 * @param message Log message.
 * @param data Optional additional data.
 */
export const logDebug = (message: string, data?: unknown): void => {
        log(LogLevel.Debug, message, data);
};

/**
 * Logs an info message.
 * @param message Log message.
 * @param data Optional additional data.
 */
export const logInfo = (message: string, data?: unknown): void => {
        log(LogLevel.Info, message, data);
};

/**
 * Logs a warning message.
 * @param message Log message.
 * @param data Optional additional data.
 */
export const logWarn = (message: string, data?: unknown): void => {
        log(LogLevel.Warn, message, data);
};

/**
 * Logs an error message.
 * @param message Log message.
 * @param error Error object or additional data.
 */
export const logError = (message: string, error?: unknown): void => {
        const errorData =
                error instanceof Error
                        ? {
                                  message: error.message,
                                  stack: error.stack,
                                  name: error.name,
                          }
                        : error;

        log(LogLevel.Error, message, errorData);
};

/**
 * Disposes the logger.
 */
export const disposeLogger = (): void => {
        if (loggerConfig) {
                loggerConfig.outputChannel.dispose();
                loggerConfig = null;
        }
};
