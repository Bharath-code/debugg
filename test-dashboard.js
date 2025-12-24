import { ErrorHandler } from './src/index.ts';

const debugg = new ErrorHandler({
  serviceName: 'test-app',
  environment: 'development'
});

// Add reporter to send errors to dashboard
debugg.addReporter(async (error) => {
  try {
    const response = await fetch('http://localhost:3001/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    });
    console.log('Sent error to dashboard:', error.errorId);
  } catch (e) {
    console.error('Failed to send error:', e);
  }
});

// Generate test errors
debugg.handle(new Error('Test error 1'), { context: 'test' });
debugg.handle(new TypeError('Test type error'), { context: 'test' });
debugg.handle(new SyntaxError('Test syntax error'), { context: 'test' });
debugg.handle(new Error('Network timeout'), { context: 'api_call' });
debugg.handle(new Error('Database connection failed'), { context: 'database' });

console.log('Test errors sent to dashboard!');