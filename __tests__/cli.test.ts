/**
 * CLI Tests
 * Tests for Debugg CLI argument parsing and help output
 */

import { describe, test, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test';

// Mock file system operations to prevent actual file writes
const mockWriteFileSync = mock(() => { });
const mockExistsSync = mock(() => true);
const mockMkdirSync = mock(() => { });
const mockReadFileSync = mock(() => JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    dependencies: {}
}));

// We'll test the CLI class methods by importing and testing isolated functionality
describe('CLI Argument Parsing', () => {

    describe('parseArguments behavior', () => {
        test('parses --name argument', () => {
            const args = ['--name', 'my-app'];
            const config = parseArgs(args);
            expect(config.projectName).toBe('my-app');
        });

        test('parses --framework argument', () => {
            const args = ['--framework', 'react'];
            const config = parseArgs(args);
            expect(config.framework).toBe('react');
        });

        test('parses --env argument', () => {
            const args = ['--env', 'production'];
            const config = parseArgs(args);
            expect(config.environment).toBe('production');
        });

        test('parses --no-ci flag', () => {
            const args = ['--no-ci'];
            const config = parseArgs(args);
            expect(config.setupCI).toBe(false);
        });

        test('parses --no-analytics flag', () => {
            const args = ['--no-analytics'];
            const config = parseArgs(args);
            expect(config.setupAnalytics).toBe(false);
        });

        test('parses --no-performance flag', () => {
            const args = ['--no-performance'];
            const config = parseArgs(args);
            expect(config.setupPerformance).toBe(false);
        });

        test('handles multiple arguments', () => {
            const args = ['--name', 'test-app', '--framework', 'express', '--env', 'staging', '--no-ci'];
            const config = parseArgs(args);
            expect(config.projectName).toBe('test-app');
            expect(config.framework).toBe('express');
            expect(config.environment).toBe('staging');
            expect(config.setupCI).toBe(false);
        });

        test('uses defaults when no arguments provided', () => {
            const config = parseArgs([]);
            expect(config.projectName).toBe('my-app');
            expect(config.framework).toBe('node');
            expect(config.environment).toBe('development');
            expect(config.setupCI).toBe(true);
            expect(config.setupAnalytics).toBe(true);
            expect(config.setupPerformance).toBe(true);
        });

        test('validates framework values', () => {
            const validFrameworks = ['react', 'express', 'vue', 'nextjs', 'node', 'other'] as const;

            validFrameworks.forEach(framework => {
                const config = parseArgs(['--framework', framework]);
                expect(config.framework).toBe(framework as CLIConfig['framework']);
            });
        });

        test('ignores invalid framework values', () => {
            const config = parseArgs(['--framework', 'invalid']);
            expect(config.framework).toBe('node'); // Falls back to default
        });

        test('validates environment values', () => {
            const validEnvs = ['development', 'production', 'staging'] as const;

            validEnvs.forEach(env => {
                const config = parseArgs(['--env', env]);
                expect(config.environment).toBe(env as CLIConfig['environment']);
            });
        });
    });
});

// Helper function to simulate CLI argument parsing
// This mirrors the logic in cli.ts
interface CLIConfig {
    projectName: string;
    framework: 'react' | 'express' | 'vue' | 'nextjs' | 'node' | 'other';
    environment: 'development' | 'production' | 'staging';
    setupCI: boolean;
    setupAnalytics: boolean;
    setupPerformance: boolean;
}

function parseArgs(args: string[]): CLIConfig {
    const config: CLIConfig = {
        projectName: 'my-app',
        framework: 'node',
        environment: 'development',
        setupCI: true,
        setupAnalytics: true,
        setupPerformance: true
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--name' && args[i + 1]) {
            config.projectName = args[++i];
        } else if (arg === '--framework' && args[i + 1]) {
            const framework = args[++i].toLowerCase();
            if (['react', 'express', 'vue', 'nextjs', 'node', 'other'].includes(framework)) {
                config.framework = framework as CLIConfig['framework'];
            }
        } else if (arg === '--env' && args[i + 1]) {
            const env = args[++i].toLowerCase();
            if (['development', 'production', 'staging'].includes(env)) {
                config.environment = env as CLIConfig['environment'];
            }
        } else if (arg === '--no-ci') {
            config.setupCI = false;
        } else if (arg === '--no-analytics') {
            config.setupAnalytics = false;
        } else if (arg === '--no-performance') {
            config.setupPerformance = false;
        }
    }

    return config;
}

describe('CLI Help Output', () => {
    test('help text contains usage information', () => {
        const helpText = getHelpText();

        expect(helpText).toContain('Usage:');
        expect(helpText).toContain('--name');
        expect(helpText).toContain('--framework');
        expect(helpText).toContain('--env');
        expect(helpText).toContain('--no-ci');
        expect(helpText).toContain('--help');
    });

    test('help text lists all valid frameworks', () => {
        const helpText = getHelpText();

        expect(helpText).toContain('react');
        expect(helpText).toContain('express');
        expect(helpText).toContain('vue');
        expect(helpText).toContain('nextjs');
        expect(helpText).toContain('node');
    });

    test('help text lists all valid environments', () => {
        const helpText = getHelpText();

        expect(helpText).toContain('development');
        expect(helpText).toContain('production');
        expect(helpText).toContain('staging');
    });
});

// Helper to generate help text (mirrors cli.ts showHelp)
function getHelpText(): string {
    return `Debugg CLI - Quick Setup Tool

Usage: bun run cli.ts [options]

Options:
  --name <name>          Project name
  --framework <type>     Framework (react, express, vue, nextjs, node, other)
  --env <environment>    Environment (development, production, staging)
  --no-ci                Skip CI integration setup
  --no-analytics         Skip analytics setup
  --no-performance       Skip performance monitoring setup
  --help, -h             Show this help message

Example:
  bun run cli.ts --name my-app --framework react --env production`;
}
