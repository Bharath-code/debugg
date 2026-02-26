/**
 * Platform detection utility
 */

import { Platform } from '../types';

/**
 * Detect the current platform
 * @returns The detected platform
 */
export const detectPlatform = (): Platform => {
  // Bun runtime detection (Bun sets process.versions.bun)
  if (typeof process !== 'undefined' && process.versions && process.versions.bun) {
    return 'node'; // Treat Bun as Node.js-like environment
  }

  // Node.js detection
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }

  // Browser detection
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return 'browser';
  }

  // Mobile detection (check after browser since mobile browsers also have window)
  if (typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return 'mobile';
  }

  return 'unknown';
};

/**
 * Get platform-specific metadata
 * @param platform - The platform to get metadata for
 * @returns Platform-specific metadata object
 */
export const getPlatformMetadata = (platform: Platform): Record<string, unknown> => {
  switch (platform) {
    case 'browser':
      return {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        language: typeof navigator !== 'undefined' ? navigator.language : undefined,
        online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
      };
    case 'node':
      return {
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
        runtime: typeof process !== 'undefined' && process.versions?.bun ? 'bun' : 'node',
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
        arch: typeof process !== 'undefined' ? process.arch : 'unknown',
      };
    case 'mobile':
      return {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        touchPoints: typeof navigator !== 'undefined' && 'maxTouchPoints' in navigator ? navigator.maxTouchPoints : undefined,
      };
    default:
      return {};
  }
};
