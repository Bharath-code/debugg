/**
 * Debugg Next.js Integration Example
 * Demonstrates comprehensive error handling for Next.js applications
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorHandler, createSentryReporter, createConsoleReporter } from '../src/index';

// 🎨 Initialize Debugg for Next.js application
const debugg = new ErrorHandler({
  serviceName: 'nextjs-app',
  environment: process.env.NODE_ENV || 'development',
  defaultSeverity: 'medium'
});

// 🚀 Add reporters based on environment
if (process.env.NODE_ENV === 'production') {
  debugg.addReporter(createSentryReporter('YOUR_SENTRY_DSN'));
} else {
  debugg.addReporter(createConsoleReporter());
}

// 🛡️ Next.js API Route Error Handler
export function withDebuggErrorHandler(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      // 📊 Capture error with Debugg
      await debugg.handle(error, {
        endpoint: req.url || '/',
        method: req.method || 'GET',
        headers: req.headers,
        query: req.query,
        body: req.body,
        type: 'api_route_error'
      });

      // 📝 Send consistent error response
      res.status(500).json({
        success: false,
        error: {
          message: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

// 📱 Example API Route with Debugg
export default withDebuggErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 🔍 Simulate data fetching with error handling
    const data = await fetchData().catch(error => {
      debugg.handle(error, {
        endpoint: '/api/data',
        method: 'GET',
        type: 'data_fetch_error'
      });
      throw new Error('Failed to fetch data');
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    throw error; // Will be caught by withDebuggErrorHandler
  }
});

// 📝 Next.js Page Error Handling
export function getServerSidePropsWithDebugg(getServerSidePropsFunc: any) {
  return async (context: any) => {
    try {
      return await getServerSidePropsFunc(context);
    } catch (error) {
      // 📊 Capture server-side error with Debugg
      await debugg.handle(error, {
        page: context.resolvedUrl,
        method: context.req.method,
        query: context.query,
        type: 'server_side_error'
      });

      // 📱 Return error props
      return {
        props: {
          error: process.env.NODE_ENV === 'production'
            ? 'An error occurred'
            : (error as Error).message
        }
      };
    }
  };
}

// 🎯 Example Page Component (returns data structure for Next.js)
export function ExamplePage({ data, error }: { data?: any; error?: string }) {
  if (error) {
    return {
      type: 'error',
      message: error
    };
  }

  if (!data) {
    return {
      type: 'loading'
    };
  }

  return {
    type: 'data',
    content: {
      title: 'Data Page',
      data: JSON.stringify(data, null, 2)
    }
  };
}

// 📱 Example Page with Server-Side Props
export const getServerSideProps = getServerSidePropsWithDebugg(async (context: any) => {
  try {
    // 🔍 Fetch data with Debugg error handling
    const data = await fetchData().catch(error => {
      debugg.handle(error, {
        page: context.resolvedUrl,
        type: 'page_data_error'
      });
      throw new Error('Failed to load page data');
    });

    return {
      props: { data }
    };
  } catch (error) {
    throw error; // Will be caught by getServerSidePropsWithDebugg
  }
});

// 🛡️ Next.js Middleware with Debugg
export function debuggMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 📍 Log request with Debugg
    debugg.handle(new Error('Request received'), {
      endpoint: req.url || '/',
      method: req.method || 'GET',
      type: 'request_log',
      severityOverride: 'info'
    }).catch(console.error);

    return handler(req, res);
  };
}

// 📱 Example API Route with Middleware
export const apiRouteWithMiddleware = debuggMiddleware(
  withDebuggErrorHandler(async (req, res) => {
    // Your API logic here
    res.status(200).json({ message: 'Hello with middleware!' });
  })
);

// 🔧 Utility Functions
async function fetchData(): Promise<any> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));

  // 🎲 Simulate random error for demonstration
  if (Math.random() < 0.1) {
    throw new Error('Data fetch failed');
  }

  return {
    message: 'Success!',
    timestamp: new Date().toISOString(),
    data: [1, 2, 3, 4, 5]
  };
}

// 📊 Next.js Custom Error Handling
export function handleNextjsError(error: Error, context: {
  page?: string;
  component?: string;
  method?: string;
  [key: string]: any;
}) {
  debugg.handle(error, {
    ...context,
    framework: 'nextjs',
    nextjsVersion: require('next/package.json').version
  }).catch(console.error);
}

// 📚 Export for usage
export {
  debugg
};
// Note: withDebuggErrorHandler, debuggMiddleware, and handleNextjsError are already exported above