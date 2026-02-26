/**
 * Mock HTTP Server for Integration Testing
 * Provides test endpoints for webhook and API testing
 */

export interface MockServerConfig {
  port: number;
  /** Delay for all responses (ms) */
  responseDelay?: number;
  /** Whether to log requests */
  logRequests?: boolean;
}

export interface MockServerStats {
  requestCount: number;
  requests: MockRequest[];
  errors: Error[];
}

export interface MockRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  timestamp: Date;
}

export class MockServer {
  private port: number;
  private responseDelay: number;
  private logRequests: boolean;
  private requests: MockRequest[] = [];
  private errors: Error[] = [];
  private server?: any;
  private isRunning = false;

  constructor(config: MockServerConfig = { port: 9999 }) {
    this.port = config.port;
    this.responseDelay = config.responseDelay ?? 0;
    this.logRequests = config.logRequests ?? false;
  }

  /**
   * Start the mock server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    // Use Bun's native HTTP server
    const { serve } = await import('bun');

    this.server = serve({
      port: this.port,
      fetch: (req: Request) => this.handleRequest(req),
    });

    this.isRunning = true;

    if (this.logRequests) {
      console.log(`[MockServer] Started on port ${this.port}`);
    }
  }

  /**
   * Stop the mock server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.server?.stop?.();
    this.isRunning = false;

    if (this.logRequests) {
      console.log(`[MockServer] Stopped on port ${this.port}`);
    }
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const headers = Object.fromEntries(req.headers.entries());

    // Parse body
    let body: unknown = null;
    const contentType = req.headers.get('content-type');

    if (req.body && (contentType?.includes('application/json') || contentType?.includes('text/plain'))) {
      try {
        const text = await req.text();
        if (contentType.includes('application/json')) {
          body = JSON.parse(text);
        } else {
          body = text;
        }
      } catch (error) {
        this.errors.push(error as Error);
        return new Response('Invalid body', { status: 400 });
      }
    }

    // Record request
    const mockRequest: MockRequest = {
      method,
      url: url.pathname,
      headers,
      body,
      timestamp: new Date(),
    };

    this.requests.push(mockRequest);

    if (this.logRequests) {
      console.log(`[MockServer] ${method} ${url.pathname}`);
    }

    // Apply response delay
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    // Route handling
    return this.routeRequest(method, url.pathname, body, headers);
  }

  /**
   * Route requests to appropriate handlers
   */
  private routeRequest(
    method: string,
    path: string,
    body: unknown,
    headers: Record<string, string>
  ): Response {
    // Webhook endpoint
    if (path === '/webhook' && method === 'POST') {
      return this.handleWebhook(body, headers);
    }

    // Error endpoint (always returns 500)
    if (path === '/error' && method === 'POST') {
      return this.handleError(body);
    }

    // Slow endpoint (for timeout testing)
    if (path === '/slow' && method === 'POST') {
      return this.handleSlow(body);
    }

    // Health check
    if (path === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Not found
    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle webhook requests
   */
  private handleWebhook(body: unknown, headers: Record<string, string>): Response {
    // Validate error payload
    if (!body || typeof body !== 'object') {
      return new Response('Invalid payload', { status: 400 });
    }

    const payload = body as Record<string, unknown>;

    if (!payload.errorId || !payload.message) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        errorId: payload.errorId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Handle error endpoint (always returns 500)
   */
  private handleError(body: unknown): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Handle slow endpoint (for timeout testing)
   */
  private async handleSlow(body: unknown): Promise<Response> {
    // Wait 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Slow response',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Get server statistics
   */
  getStats(): MockServerStats {
    return {
      requestCount: this.requests.length,
      requests: [...this.requests],
      errors: [...this.errors],
    };
  }

  /**
   * Get all requests
   */
  getRequests(): MockRequest[] {
    return [...this.requests];
  }

  /**
   * Get requests by path
   */
  getRequestsByPath(path: string): MockRequest[] {
    return this.requests.filter((req) => req.url === path);
  }

  /**
   * Clear request history
   */
  clearHistory(): void {
    this.requests = [];
    this.errors = [];
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Get webhook URL
   */
  getWebhookUrl(): string {
    return `${this.getUrl()}/webhook`;
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Create and start a mock server
 */
export const createMockServer = async (config?: MockServerConfig): Promise<MockServer> => {
  const server = new MockServer(config);
  await server.start();
  return server;
};
