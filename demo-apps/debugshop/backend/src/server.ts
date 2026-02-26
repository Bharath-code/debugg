/**
 * DebugShop Backend Server
 * 
 * Express server with Debugg error monitoring integration.
 * Demonstrates backend error handling, API routes, and real-time monitoring.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import debuggInstance from './debugg.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      debuggInstance.createError(null, {
        type: 'slow_request',
        method: req.method,
        url: req.url,
        duration,
        status: res.statusCode
      }, 'medium');
    }
  });
  
  next();
});

// ==================== API Routes ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'debugshop-backend'
  });
});

// Products API
app.get('/api/products', (req, res) => {
  const products = [
    { id: 1, name: 'Debugg T-Shirt', price: 29.99, stock: 100 },
    { id: 2, name: 'Debugg Hoodie', price: 59.99, stock: 50 },
    { id: 3, name: 'Debugg Stickers', price: 9.99, stock: 500 },
    { id: 4, name: 'Debugg Mug', price: 14.99, stock: 75 },
  ];
  
  res.json({ success: true, data: products });
});

// Cart API
app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId) {
    const error = new Error('Product ID is required');
    (error as any).code = 'VALIDATION_ERROR';
    throw error;
  }
  
  res.json({ 
    success: true, 
    message: 'Product added to cart',
    data: { productId, quantity: quantity || 1 }
  });
});

// Checkout API
app.post('/api/checkout', async (req, res) => {
  try {
    const { card, amount, currency } = req.body;
    
    // Validate required fields
    if (!card || !amount) {
      const error = new Error('Card and amount are required');
      (error as any).code = 'VALIDATION_ERROR';
      throw error;
    }
    
    // Simulate payment processing
    if (card === '4000000000000002') {
      // Simulate payment failure
      const error = new Error('Payment failed: Card declined');
      (error as any).code = 'PAYMENT_DECLINED';
      (error as any).status = 402;
      throw error;
    }
    
    // Simulate successful payment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        transactionId: `txn_${Date.now()}`,
        amount,
        currency
      }
    });
    
  } catch (error: any) {
    // Debugg automatically catches and logs this error
    await debuggInstance.handle(error, {
      source: 'checkout',
      payment: {
        amount: req.body.amount,
        currency: req.body.currency,
        cardType: 'test_card'
      }
    });
    
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Error Trigger API (for testing)
app.get('/api/errors/trigger', async (req, res) => {
  const { type } = req.query;
  
  try {
    switch (type) {
      case 'database':
        // Simulate database error
        const dbError = new Error('Database connection failed: ECONNREFUSED');
        (dbError as any).code = 'ECONNREFUSED';
        (dbError as any).status = 503;
        throw dbError;
        
      case 'validation':
        // Simulate validation error
        const validationError = new Error('Validation failed: Invalid input');
        (validationError as any).code = 'VALIDATION_ERROR';
        (validationError as any).status = 400;
        throw validationError;
        
      case 'payment':
        // Simulate payment error
        const paymentError = new Error('Payment gateway timeout');
        (paymentError as any).code = 'GATEWAY_TIMEOUT';
        (paymentError as any).status = 504;
        throw paymentError;
        
      case 'external':
        // Simulate external API error
        const externalError = new Error('External API returned 500');
        (externalError as any).code = 'EXTERNAL_API_ERROR';
        (externalError as any).status = 502;
        throw externalError;
        
      default:
        res.json({
          success: true,
          message: 'Specify error type: database, validation, payment, or external'
        });
    }
  } catch (error: any) {
    // Debugg catches this error
    await debuggInstance.handle(error, {
      source: 'error_trigger_api',
      requestedType: type
    });
    
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      code: error.code,
      triggered: true
    });
  }
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Debugg automatically logs the error
  debuggInstance.handle(err, {
    source: 'express_error_handler',
    method: req.method,
    url: req.url,
    headers: req.headers
  });
  
  // Send error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message,
    code: err.code
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DebugShop Backend running on http://localhost:${PORT}`);
  console.log(`📊 Debugg Dashboard: http://localhost:3001`);
  console.log(`🎮 Playground: http://localhost:3000/playground`);
  
  // Log startup
  debuggInstance.createError(null, {
    event: 'server_start',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  }, 'info');
});

export default app;
