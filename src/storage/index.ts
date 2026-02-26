/**
 * Storage exports
 */

export * from './BaseStorage';
export * from './MemoryStorage';
export * from './LocalStorage';

// Backward compatibility alias
export { MemoryStorage as ErrorStorageSystem } from './MemoryStorage';
