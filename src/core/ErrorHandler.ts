/**
 * ErrorHandler - Core class for error handling
 * Extracted to avoid circular dependencies
 */

import { UniversalError, ErrorSeverity, ErrorContext, ErrorReporter, ErrorHandlerConfig } from '../types/error';
import { classifyError } from '../utils/classify';
import { createUniversalError, formatErrorForConsole } from './capture';
import { ErrorStorageSystem } from '../storage/index';

export class ErrorHandler {
    private config: Required<ErrorHandlerConfig>;
    private platform: 'browser' | 'node' | 'mobile' | 'unknown';
    private storage: ErrorStorageSystem;

    constructor(config: ErrorHandlerConfig = {}) {
        // Detect platform
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
            this.platform = 'browser';
        } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            this.platform = 'node';
        } else if (typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            this.platform = 'mobile';
        } else {
            this.platform = 'unknown';
        }

        // Set default configuration
        this.config = {
            serviceName: config.serviceName || 'application',
            environment: config.environment || 'development',
            defaultSeverity: config.defaultSeverity || 'medium',
            reporters: config.reporters || [],
            logToConsole: config.logToConsole !== false, // default true
            includeStackTrace: config.includeStackTrace !== false, // default true
            maxContextDepth: config.maxContextDepth || 5,
        };

        // Initialize storage system
        this.storage = new ErrorStorageSystem({
            maxErrors: 1000,
            persist: false // Default to in-memory only
        });
    }

    // Create a universal error from any input
    public createError(
        error: any,
        context: ErrorContext = {},
        severity?: ErrorSeverity
    ): UniversalError {
        const universalError = createUniversalError(error, context, {
            serviceName: this.config.serviceName,
            environment: this.config.environment,
            includeStackTrace: this.config.includeStackTrace,
            maxContextDepth: this.config.maxContextDepth
        }, severity);

        // Store the error
        this.storage.storeError(universalError);

        return universalError;
    }

    // Handle an error with automatic reporting
    public async handle(error: any, context: ErrorContext = {}, severity?: ErrorSeverity): Promise<void> {
        const universalError = this.createError(error, context, severity);

        // Log to console if enabled
        if (this.config.logToConsole) {
            this.logToConsole(universalError);
        }

        // Report to all configured reporters
        const reportPromises = this.config.reporters.map(reporter => {
            try {
                return reporter(universalError);
            } catch (reporterError) {
                console.error('Error reporter failed:', reporterError);
                return Promise.resolve();
            }
        });

        await Promise.all(reportPromises);
    }

    // Log error to console with formatting
    private logToConsole(error: UniversalError): void {
        const formatted = formatErrorForConsole(error);

        console.groupCollapsed(formatted);
        console.log('Service:', error.metadata.serviceName);
        console.log('Environment:', error.metadata.environment);
        console.log('Platform:', error.metadata.platform);

        if (Object.keys(error.context).length > 0) {
            console.log('Context:', error.context);
        }

        if (error.stack) {
            console.log('Stack:', error.stack);
        }

        if (error.originalError) {
            console.log('Original Error:', error.originalError);
        }

        console.groupEnd();
    }

    // Add a custom error reporter
    public addReporter(reporter: ErrorReporter): void {
        this.config.reporters.push(reporter);
    }

    // Remove all reporters
    public clearReporters(): void {
        this.config.reporters = [];
    }

    // Get current configuration
    public getConfig(): ErrorHandlerConfig {
        return { ...this.config };
    }

    // Update configuration
    public updateConfig(newConfig: ErrorHandlerConfig): void {
        this.config = { ...this.config, ...newConfig };
    }

    // Access storage system
    public getStorage(): ErrorStorageSystem {
        return this.storage;
    }
}
