/**
 * Storage Tests
 * Comprehensive unit tests for ErrorStorageSystem
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { ErrorStorageSystem } from '../src/storage/index';
import { UniversalError } from '../src/types/error';

// Helper to create mock errors
function createMockError(overrides: Partial<UniversalError> = {}): UniversalError {
    return {
        name: 'Error',
        errorId: `err_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
        timestamp: new Date(),
        severity: 'medium',
        message: 'Test error',
        context: {},
        metadata: { platform: 'node' as const, serviceName: 'test', environment: 'test' },
        ...overrides
    };
}

describe('ErrorStorageSystem', () => {
    let storage: ErrorStorageSystem;

    beforeEach(() => {
        storage = new ErrorStorageSystem({ maxErrors: 100, persist: false });
    });

    describe('storeError and getError', () => {
        test('stores and retrieves an error', () => {
            const error = createMockError({ message: 'Stored error' });
            storage.storeError(error);

            const retrieved = storage.getError(error.errorId);
            expect(retrieved).toBeDefined();
            expect(retrieved?.message).toBe('Stored error');
            expect(retrieved?.errorId).toBe(error.errorId);
        });

        test('returns undefined for non-existent error', () => {
            const retrieved = storage.getError('non_existent_id');
            expect(retrieved).toBeUndefined();
        });

        test('stores multiple errors', () => {
            const error1 = createMockError({ message: 'Error 1' });
            const error2 = createMockError({ message: 'Error 2' });
            const error3 = createMockError({ message: 'Error 3' });

            storage.storeError(error1);
            storage.storeError(error2);
            storage.storeError(error3);

            expect(storage.getError(error1.errorId)?.message).toBe('Error 1');
            expect(storage.getError(error2.errorId)?.message).toBe('Error 2');
            expect(storage.getError(error3.errorId)?.message).toBe('Error 3');
        });
    });

    describe('getAllErrors', () => {
        test('returns empty array when no errors stored', () => {
            expect(storage.getAllErrors()).toEqual([]);
        });

        test('returns all stored errors', () => {
            storage.storeError(createMockError({ message: 'Error 1' }));
            storage.storeError(createMockError({ message: 'Error 2' }));

            const all = storage.getAllErrors();
            expect(all.length).toBe(2);
        });
    });

    describe('getErrorsBySeverity', () => {
        test('filters errors by severity', () => {
            storage.storeError(createMockError({ severity: 'critical' }));
            storage.storeError(createMockError({ severity: 'high' }));
            storage.storeError(createMockError({ severity: 'high' }));
            storage.storeError(createMockError({ severity: 'medium' }));

            expect(storage.getErrorsBySeverity('critical').length).toBe(1);
            expect(storage.getErrorsBySeverity('high').length).toBe(2);
            expect(storage.getErrorsBySeverity('medium').length).toBe(1);
            expect(storage.getErrorsBySeverity('low').length).toBe(0);
        });
    });

    describe('getRecentErrors', () => {
        test('returns most recent errors first', () => {
            const error1 = createMockError({ message: 'Old', timestamp: new Date(Date.now() - 3000) });
            const error2 = createMockError({ message: 'Middle', timestamp: new Date(Date.now() - 2000) });
            const error3 = createMockError({ message: 'New', timestamp: new Date(Date.now() - 1000) });

            storage.storeError(error1);
            storage.storeError(error2);
            storage.storeError(error3);

            const recent = storage.getRecentErrors(2);
            expect(recent.length).toBe(2);
            expect(recent[0].message).toBe('New');
            expect(recent[1].message).toBe('Middle');
        });

        test('respects limit parameter', () => {
            for (let i = 0; i < 10; i++) {
                storage.storeError(createMockError({ message: `Error ${i}` }));
            }

            expect(storage.getRecentErrors(5).length).toBe(5);
            expect(storage.getRecentErrors(3).length).toBe(3);
        });
    });

    describe('clearAllErrors', () => {
        test('removes all stored errors', () => {
            storage.storeError(createMockError());
            storage.storeError(createMockError());
            storage.storeError(createMockError());

            expect(storage.getAllErrors().length).toBe(3);

            storage.clearAllErrors();

            expect(storage.getAllErrors().length).toBe(0);
        });
    });

    describe('removeError', () => {
        test('removes a specific error', () => {
            const error1 = createMockError({ message: 'Keep' });
            const error2 = createMockError({ message: 'Remove' });

            storage.storeError(error1);
            storage.storeError(error2);

            const removed = storage.removeError(error2.errorId);

            expect(removed).toBe(true);
            expect(storage.getError(error2.errorId)).toBeUndefined();
            expect(storage.getError(error1.errorId)).toBeDefined();
        });

        test('returns false for non-existent error', () => {
            const removed = storage.removeError('non_existent_id');
            expect(removed).toBe(false);
        });
    });

    describe('getStatistics', () => {
        test('returns correct statistics for empty storage', () => {
            const stats = storage.getStatistics();

            expect(stats.total).toBe(0);
            expect(stats.bySeverity.critical).toBe(0);
            expect(stats.recentTimestamp).toBeUndefined();
        });

        test('calculates correct severity counts', () => {
            storage.storeError(createMockError({ severity: 'critical' }));
            storage.storeError(createMockError({ severity: 'critical' }));
            storage.storeError(createMockError({ severity: 'high' }));
            storage.storeError(createMockError({ severity: 'medium' }));
            storage.storeError(createMockError({ severity: 'low' }));
            storage.storeError(createMockError({ severity: 'info' }));

            const stats = storage.getStatistics();

            expect(stats.total).toBe(6);
            expect(stats.bySeverity.critical).toBe(2);
            expect(stats.bySeverity.high).toBe(1);
            expect(stats.bySeverity.medium).toBe(1);
            expect(stats.bySeverity.low).toBe(1);
            expect(stats.bySeverity.info).toBe(1);
        });

        test('tracks most recent timestamp', () => {
            const now = new Date();
            storage.storeError(createMockError({ timestamp: now }));

            const stats = storage.getStatistics();
            expect(stats.recentTimestamp).toEqual(now);
        });
    });

    describe('storage limit and cleanup', () => {
        test('cleans up old errors when limit reached', () => {
            const smallStorage = new ErrorStorageSystem({ maxErrors: 10, persist: false });

            // Add 15 errors (exceeds limit of 10)
            for (let i = 0; i < 15; i++) {
                smallStorage.storeError(createMockError({
                    message: `Error ${i}`,
                    timestamp: new Date(Date.now() + i * 1000)
                }));
            }

            // Should have cleaned up some errors
            const all = smallStorage.getAllErrors();
            expect(all.length).toBeLessThanOrEqual(10);
        });
    });
});
