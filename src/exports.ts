/**
 * Debugg Library Exports
 * Organized for optimal tree-shaking
 */

// Core exports
export { ErrorHandler } from './core/ErrorHandler';
export { ErrorBuilder } from './core/ErrorBuilder';
export { ErrorClassifier } from './core/ErrorClassifier';
export { ConfigManager } from './core/ConfigManager';
export { ReporterManager } from './core/ReporterManager';
export { SecurityManager } from './core/SecurityManager';
export { ErrorBatcher } from './core/ErrorBatcher';
export { ErrorDebouncer } from './core/ErrorDebouncer';

// Type exports
export type {
  UniversalError,
  ErrorSeverity,
  ErrorContext,
  ErrorReporter,
  ErrorHandlerConfig,
  ErrorStorage,
  ErrorStatistics,
} from './types';

// Reporter exports
export {
  BaseReporter,
  createConsoleReporter,
  createSentryReporter,
  createWebhookReporter,
} from './reporters';

// Storage exports
export {
  BaseStorage,
  MemoryStorage,
  LocalStorage,
} from './storage';

// Utility exports
export {
  classifyError,
  getErrorClassification,
  detectPlatform,
  getPlatformMetadata,
  limitContextDepth,
  formatErrorForConsole,
  generateErrorId,
  redactSensitiveFields,
  serializeError,
} from './utils';

// Constants exports
export {
  DEFAULTS,
  SEVERITY_LEVELS,
  PLATFORMS,
  ENVIRONMENTS,
  ERROR_TYPES,
  HTTP_STATUS,
  SECURITY_PATTERNS,
} from './constants/defaults';

// Enhanced exports
export { EnhancedErrorHandler } from './enhanced';
export type { EnhancedErrorHandlerConfig } from './enhanced';

// Performance exports
export { PerformanceMonitor } from './performance';
export type { PerformanceMetrics, PerformanceMonitorConfig } from './performance';

// Analytics exports
export { ErrorAnalytics } from './analytics';
export type { ErrorMetrics, IncidentTimeline } from './analytics';

// CI exports
export { CIIntegration } from './ci';
export type { CIConfig, CIReport } from './ci';

// Middleware exports
export {
  createExpressErrorHandler,
  asyncHandler,
} from './middleware/express';

// Convenience exports
export {
  getDefaultErrorHandler,
  handleError,
  createError,
  debugg,
} from './index';
