/**
 * WebhookReporter - Reports errors to a webhook endpoint
 */

import { UniversalError, ErrorReporter } from '../types';
import { WebhookReporterOptions } from '../types/reporter.types';
import { DEFAULTS } from '../constants/defaults';
import { serializeError } from '../utils/format';

/**
 * Factory function to create webhook reporter
 * Returns a function that can be called with an error
 */
export const createWebhookReporter = (webhookUrl: string, options: WebhookReporterOptions = {}): ErrorReporter => {
  // Validate webhook URL
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    throw new Error('Webhook URL is required and must be a string');
  }

  try {
    const url = new URL(webhookUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Webhook URL must use http or https protocol');
    }
  } catch {
    throw new Error('Invalid webhook URL format');
  }

  // Validate and set options
  const retries = options.retries ?? DEFAULTS.MAX_RETRIES;
  const timeout = options.timeout ?? DEFAULTS.REQUEST_TIMEOUT_MS;
  const logFailures = options.logFailures ?? true;

  if (retries < DEFAULTS.MIN_RETRIES || retries > DEFAULTS.MAX_RETRIES_ALLOWED) {
    throw new Error(`Retries must be between ${DEFAULTS.MIN_RETRIES} and ${DEFAULTS.MAX_RETRIES_ALLOWED}`);
  }

  if (timeout < DEFAULTS.MIN_TIMEOUT_MS || timeout > DEFAULTS.MAX_TIMEOUT_MS) {
    throw new Error(`Timeout must be between ${DEFAULTS.MIN_TIMEOUT_MS}ms and ${DEFAULTS.MAX_TIMEOUT_MS}ms`);
  }

  const reporterOptions = {
    headers: options.headers ?? {},
    retries,
    timeout,
    logFailures,
  };

  const report = async (error: UniversalError): Promise<void> => {
    const payload = JSON.stringify(serializeError(error));
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= reporterOptions.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), reporterOptions.timeout);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Error-Id': error.errorId,
            'X-Error-Severity': error.severity,
            ...reporterOptions.headers,
          },
          body: payload,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        // Success - exit the retry loop
        return;
      } catch (fetchError) {
        lastError = fetchError as Error;

        // Don't retry on abort (timeout)
        if ((fetchError as Error).name === 'AbortError') {
          if (reporterOptions.logFailures) {
            console.error(`[Webhook Reporter] Request timed out after ${reporterOptions.timeout}ms for error ${error.errorId}`);
          }
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < reporterOptions.retries) {
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    if (reporterOptions.logFailures && lastError) {
      console.error(`[Webhook Reporter] Failed to send error ${error.errorId} to ${webhookUrl}:`, lastError.message);
    }
  };

  // Return a function that calls the reporter
  const reporterFn: ErrorReporter = async (error: UniversalError) => {
    report(error).catch((err) => {
      if (reporterOptions.logFailures) {
        console.error(`[Webhook Reporter] Failed to report error ${error.errorId}:`, err);
      }
    });
  };

  return reporterFn;
};
