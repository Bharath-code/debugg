#!/usr/bin/env node

/**
 * Debugg CLI
 * Command-line interface for Debugg Dashboard
 */

import { Command } from 'commander';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const program = new Command();

// CLI Configuration
program
  .name('debugg')
  .description('Debugg CLI - Error Monitoring & Management')
  .version('2.0.0');

// ==================== Auth Commands ====================

program
  .command('login')
  .description('Login to Debugg Dashboard')
  .option('-u, --url <url>', 'Dashboard URL', 'http://localhost:3001')
  .option('-k, --api-key <key>', 'API Key')
  .action(async (options) => {
    console.log('🔐 Debugg Login\n');
    
    let apiKey = options.apiKey;
    
    if (!apiKey) {
      apiKey = await prompt('Enter API Key: ', { hide: true });
    }
    
    // Test API key
    try {
      const response = await fetch(`${options.url}/api/health`);
      const health = await response.json();
      
      console.log('✅ Connected to Debugg Dashboard');
      console.log(`   URL: ${options.url}`);
      console.log(`   Status: ${health.status}`);
      console.log(`   Version: ${health.version}`);
      
      // Save config
      saveConfig({
        url: options.url,
        apiKey
      });
      
      console.log('\n✅ Login successful!\n');
    } catch (error: any) {
      console.error('❌ Failed to connect:', error.message);
      process.exit(1);
    }
  });

// ==================== Error Commands ====================

program
  .command('errors:list')
  .description('List recent errors')
  .option('-l, --limit <number>', 'Number of errors', '10')
  .option('-s, --severity <severity>', 'Filter by severity')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = loadConfig();
    
    if (!config) {
      console.error('❌ Not logged in. Run "debugg login" first.');
      process.exit(1);
    }
    
    try {
      const params = new URLSearchParams({
        limit: options.limit
      });
      
      if (options.severity) {
        params.append('severity', options.severity);
      }
      
      const response = await fetch(`${config.url}/api/errors?${params}`, {
        headers: {
          'X-API-Key': config.apiKey
        }
      });
      
      const result = await response.json();
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n📊 Recent Errors\n');
        console.log('ID'.padEnd(30), 'Severity'.padEnd(10), 'Message');
        console.log('─'.repeat(80));
        
        result.data.forEach((error: any) => {
          console.log(
            error.errorId.padEnd(30),
            error.severity.padEnd(10),
            error.message.substring(0, 40) + (error.message.length > 40 ? '...' : '')
          );
        });
        
        console.log(`\nTotal: ${result.pagination.total} errors\n`);
      }
    } catch (error: any) {
      console.error('❌ Failed to list errors:', error.message);
      process.exit(1);
    }
  });

program
  .command('errors:get <id>')
  .description('Get error details')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    const config = loadConfig();
    
    if (!config) {
      console.error('❌ Not logged in. Run "debugg login" first.');
      process.exit(1);
    }
    
    try {
      const response = await fetch(`${config.url}/api/errors/${id}`, {
        headers: {
          'X-API-Key': config.apiKey
        }
      });
      
      const result = await response.json();
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n📋 Error Details\n');
        console.log(`ID:        ${result.data.errorId}`);
        console.log(`Severity:  ${result.data.severity}`);
        console.log(`Status:    ${result.data.status}`);
        console.log(`Message:   ${result.data.message}`);
        console.log(`Created:   ${new Date(result.data.timestamp).toLocaleString()}`);
        
        if (result.data.stack) {
          console.log(`\nStack Trace:\n${result.data.stack}\n`);
        }
        
        if (result.data.context) {
          console.log(`\nContext:\n${JSON.stringify(result.data.context, null, 2)}\n`);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to get error:', error.message);
      process.exit(1);
    }
  });

program
  .command('errors:resolve <id>')
  .description('Mark error as resolved')
  .action(async (id) => {
    const config = loadConfig();
    
    if (!config) {
      console.error('❌ Not logged in. Run "debugg login" first.');
      process.exit(1);
    }
    
    try {
      const response = await fetch(`${config.url}/api/errors/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey
        },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Error marked as resolved\n');
      } else {
        console.error('❌ Failed to resolve error:', result.error);
        process.exit(1);
      }
    } catch (error: any) {
      console.error('❌ Failed to resolve error:', error.message);
      process.exit(1);
    }
  });

// ==================== Analytics Commands ====================

program
  .command('analytics')
  .description('Get analytics overview')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = loadConfig();
    
    if (!config) {
      console.error('❌ Not logged in. Run "debugg login" first.');
      process.exit(1);
    }
    
    try {
      const response = await fetch(`${config.url}/api/analytics/overview`, {
        headers: {
          'X-API-Key': config.apiKey
        }
      });
      
      const result = await response.json();
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n📊 Analytics Overview (Last 24h)\n');
        console.log(`Total Errors:      ${result.data.total}`);
        console.log(`Critical Errors:   ${result.data.critical}`);
        console.log(`Resolved:          ${result.data.resolved}`);
        console.log(`Resolution Rate:   ${result.data.resolutionRate}%\n`);
      }
    } catch (error: any) {
      console.error('❌ Failed to get analytics:', error.message);
      process.exit(1);
    }
  });

// ==================== Config Commands ====================

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = loadConfig();
    
    if (!config) {
      console.log('❌ Not logged in. Run "debugg login" first.\n');
    } else {
      console.log('\n📋 Debugg Configuration\n');
      console.log(`URL:     ${config.url}`);
      console.log(`API Key: ${config.apiKey.substring(0, 10)}...\n`);
    }
  });

program
  .command('logout')
  .description('Logout from Debugg Dashboard')
  .action(() => {
    clearConfig();
    console.log('✅ Logged out successfully\n');
  });

// ==================== Helper Functions ====================

function loadConfig(): { url: string; apiKey: string } | null {
  try {
    const { readFileSync } = require('fs');
    const configPath = join(process.env.HOME || process.env.USERPROFILE || '', '.debugg', 'config.json');
    const config = readFileSync(configPath, 'utf-8');
    return JSON.parse(config);
  } catch {
    return null;
  }
}

function saveConfig(config: { url: string; apiKey: string }): void {
  const { mkdirSync, writeFileSync } = require('fs');
  const configDir = join(process.env.HOME || process.env.USERPROFILE || '', '.debugg');
  
  try {
    mkdirSync(configDir, { recursive: true });
  } catch {}
  
  const configPath = join(configDir, 'config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function clearConfig(): void {
  const { unlinkSync } = require('fs');
  const configPath = join(process.env.HOME || process.env.USERPROFILE || '', '.debugg', 'config.json');
  
  try {
    unlinkSync(configPath);
  } catch {}
}

async function prompt(question: string, options: { hide?: boolean } = {}): Promise<string> {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
