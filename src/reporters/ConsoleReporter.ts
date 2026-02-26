/**
 * ConsoleReporter - Reports errors to console with formatting
 */

import { UniversalError, ErrorReporter } from '../types';
import { ConsoleReporterOptions } from '../types/reporter.types';
import { formatErrorForConsole } from '../utils/format';

/**
 * Factory function to create console reporter
 * Returns a function that can be called with an error
 */
export const createConsoleReporter = (options: ConsoleReporterOptions = {}): ErrorReporter => {
  const useGroups = options.useGroups ?? true;
  const formatter = options.formatter;
  const logFailures = options.logFailures ?? true;

  const report = async (error: UniversalError): Promise<void> => {
    try {
      const formatted = formatter ? formatter(error) : formatErrorForConsole(error);

      if (useGroups && typeof console.groupCollapsed === 'function') {
        console.groupCollapsed(formatted);
        logDetails(error);
        console.groupEnd();
      } else {
        console.error(formatted);
        logDetails(error);
      }
    } catch (err) {
      if (logFailures) {
        console.error('[Console Reporter] Failed to log error:', err);
      }
    }
  };

  const logDetails = (error: UniversalError): void => {
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
  };

  return report;
};
