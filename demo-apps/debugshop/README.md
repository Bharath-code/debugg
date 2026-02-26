# 🛍️ DebugShop - Demo E-Commerce App

A complete e-commerce demo showcasing Debugg error monitoring.

---

## 🚀 **Quick Start (5 Minutes)**

### **Option 1: Docker (Easiest)**
```bash
# Clone repository
git clone https://github.com/debugg/demo-apps.git
cd demo-apps/debugshop

# Start with Docker
docker-compose up

# Open http://localhost:3000
# Debugg dashboard: http://localhost:3001
```

### **Option 2: Manual Setup**
```bash
# Clone
git clone https://github.com/debugg/demo-apps.git
cd demo-apps/debugshop

# Install frontend
cd frontend
npm install

# Install backend
cd ../backend
npm install

# Setup environment
cp ../.env.example .env
# Edit .env with your settings

# Run backend
npm run dev

# Run frontend (new terminal)
cd ../frontend
npm run dev

# Open http://localhost:3000
```

---

## 🎯 **What You'll Learn**

1. ✅ Setup Debugg in 5 minutes
2. ✅ Handle frontend errors
3. ✅ Handle backend errors
4. ✅ View errors in real-time
5. ✅ Use advanced features
6. ✅ Best practices

---

## 🎮 **Interactive Features**

### **Error Playground**
```
Visit: http://localhost:3000/playground

Trigger different types of errors:
- Frontend errors (React)
- Backend errors (API)
- Payment errors (Stripe)
- Database errors
- Network errors
```

### **Demo User Flow**
```
1. Browse products
2. Add to cart
3. Checkout
4. Payment fails (simulated)
5. See error in Debugg dashboard
6. Fix and retry
```

---

## 📁 **Project Structure**

```
debugshop/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Pages
│   │   │   ├── Home.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   └── Playground.tsx  # Error playground
│   │   ├── utils/
│   │   │   └── debugg.ts  # Debugg setup
│   │   └── App.tsx
│   └── package.json
│
├── backend/              # Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   │   ├── products.ts
│   │   │   ├── cart.ts
│   │   │   ├── checkout.ts
│   │   │   └── errors.ts  # Error triggers
│   │   ├── middleware/   # Error handling
│   │   │   └── debugg.ts
│   │   ├── services/     # Business logic
│   │   │   ├── payment.ts
│   │   │   └── database.ts
│   │   └── debugg.ts     # Debugg setup
│   └── package.json
│
├── docker-compose.yml    # Docker setup
├── .env.example          # Environment template
└── README.md            # This file
```

---

## 🎬 **Demo Scenarios**

### **Scenario 1: Frontend Error**
```typescript
// In Playground.tsx
function triggerFrontendError() {
  // ReferenceError: variable not defined
  console.log(undefinedVariable);
}

// What happens:
// 1. Error occurs
// 2. Debugg catches it
// 3. Error appears in dashboard
// 4. Full stack trace included
// 5. User context attached
```

### **Scenario 2: Backend Error**
```typescript
// In checkout.ts
router.post('/checkout', async (req, res) => {
  try {
    const payment = await paymentService.process(req.body);
    res.json({ success: true });
  } catch (error) {
    // Debugg automatically catches this
    await debugg.handle(error, {
      userId: req.user.id,
      amount: req.body.amount,
      items: req.body.items
    });
    res.status(500).json({ error: 'Payment failed' });
  }
});
```

### **Scenario 3: Payment Error**
```typescript
// Simulate payment failure
function triggerPaymentError() {
  fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({
      card: '4000000000000002', // Test card that fails
      amount: 99.99
    })
  });
}

// Debugg tracks:
// - Error type
// - Payment amount
// - User ID
// - Card type
// - Timestamp
```

---

## 🔧 **Configuration**

### **Frontend Setup** (`frontend/src/utils/debugg.ts`)
```typescript
import { debugg, createWebhookReporter } from 'debugg';

// Initialize Debugg
const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'debugshop-frontend',
  environment: import.meta.env.DEV ? 'development' : 'production',
  logToConsole: true,
});

// Add reporter
debuggInstance.addReporter(
  createWebhookReporter(import.meta.env.VITE_DEBUGG_URL + '/api/errors')
);

// Global error handler
window.addEventListener('error', (event) => {
  debuggInstance.handle(event.error, {
    source: 'window',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  debuggInstance.handle(event.reason, {
    source: 'unhandledrejection'
  });
});

export default debuggInstance;
```

### **Backend Setup** (`backend/src/debugg.ts`)
```typescript
import { debugg, createConsoleReporter } from 'debugg';

// Initialize Debugg
const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'debugshop-backend',
  environment: process.env.NODE_ENV || 'development',
  logToConsole: true,
  security: {
    redactFields: ['password', 'cardNumber', 'cvv'],
    enableRateLimiting: true,
    maxErrorsPerMinute: 100
  }
});

// Add reporters
debuggInstance.addReporter(createConsoleReporter());

// Add webhook reporter (send to Debugg dashboard)
if (process.env.DEBUGG_DASHBOARD_URL) {
  debuggInstance.addReporter(
    debugg.createWebhookReporter(
      `${process.env.DEBUGG_DASHBOARD_URL}/api/errors`
    )
  );
}

// Global error handler
process.on('uncaughtException', (error) => {
  debuggInstance.handle(error, { source: 'uncaughtException' });
});

process.on('unhandledRejection', (reason) => {
  debuggInstance.handle(reason, { source: 'unhandledRejection' });
});

export default debuggInstance;
```

---

## 🎮 **Error Triggers**

### **Frontend Triggers**
```javascript
// Visit /playground to trigger:

// 1. Reference Error
triggerReferenceError()

// 2. Type Error
triggerTypeError()

// 3. Range Error
triggerRangeError()

// 4. Network Error
triggerNetworkError()

// 5. Custom Error
triggerCustomError({
  message: 'Custom error',
  severity: 'high'
})
```

### **Backend Triggers**
```bash
# Trigger via API
curl http://localhost:3001/api/errors/trigger?type=database
curl http://localhost:3001/api/errors/trigger?type=payment
curl http://localhost:3001/api/errors/trigger?type=validation
```

---

## 📊 **What Gets Tracked**

### **Error Information**
- ✅ Error type and message
- ✅ Full stack trace
- ✅ Timestamp
- ✅ Severity (auto-classified)

### **User Context**
- ✅ User ID (if logged in)
- ✅ Session ID
- ✅ IP address
- ✅ User agent

### **Application Context**
- ✅ Service name
- ✅ Environment
- ✅ Version
- ✅ Page/Route

### **Request Context**
- ✅ URL
- ✅ Method
- ✅ Headers
- ✅ Body (redacted)

---

## 🎯 **Learning Path**

### **Level 1: Beginner (15 minutes)**
```
1. Setup DebugShop
2. Trigger first error
3. View in Debugg dashboard
4. Understand error details
```

### **Level 2: Intermediate (30 minutes)**
```
1. Integrate Debugg in your code
2. Add custom context
3. Configure reporters
4. Setup alerts
```

### **Level 3: Advanced (1 hour)**
```
1. Custom error clustering
2. Advanced filtering
3. Compliance reports
4. Team collaboration
```

### **Level 4: Expert (2 hours)**
```
1. Custom plugins
2. Advanced analytics
3. Performance optimization
4. Production deployment
```

---

## 🎥 **Video Tutorials**

### **Video 1: Quick Start (5 min)**
```
0:00 - Intro
0:30 - Clone demo
1:30 - Start Docker
2:30 - Trigger first error
3:30 - View in dashboard
4:30 - Next steps
```

### **Video 2: Integration (15 min)**
```
0:00 - Intro
1:00 - Install Debugg
3:00 - Frontend setup
6:00 - Backend setup
10:00 - Add context
13:00 - Test integration
```

### **Video 3: Advanced Features (30 min)**
```
0:00 - Intro
2:00 - Custom reporters
8:00 - Error clustering
15:00 - Analytics
22:00 - Compliance
28:00 - Best practices
```

---

## ✅ **Troubleshooting**

### **Demo Won't Start**
```bash
# Check Docker
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose down
docker-compose up
```

### **Errors Not Appearing**
```bash
# Check Debugg URL
# Frontend: VITE_DEBUGG_URL=http://localhost:3001
# Backend: DEBUGG_DASHBOARD_URL=http://localhost:3001

# Check network
curl http://localhost:3001/health

# View Debugg logs
docker-compose logs debugg
```

### **Can't Access Dashboard**
```bash
# Check port
# Debugg dashboard: http://localhost:3001
# Demo app: http://localhost:3000

# Restart containers
docker-compose restart
```

---

## 🎉 **Next Steps**

After completing the demo:

1. **Try Your Own Errors**
   - Modify demo code
   - Add new error scenarios
   - Test different features

2. **Integrate in Your App**
   - Follow same pattern
   - Use your API key
   - Configure for production

3. **Explore Advanced Features**
   - SSO integration
   - Multi-tenancy
   - Compliance reports
   - Custom plugins

4. **Deploy to Production**
   - Follow deployment guide
   - Configure for scale
   - Setup monitoring
   - Invite team

---

## 📞 **Support**

### **Documentation**
- [Debugg Docs](https://docs.debugg.example.com)
- [API Reference](https://api.debugg.example.com)
- [Tutorials](https://learn.debugg.example.com)

### **Community**
- [Discord](https://discord.gg/debugg)
- [GitHub](https://github.com/debugg/debugg)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/debugg)

### **Help**
- Email: support@debugg.example.com
- Twitter: @debugg
- Website: https://debugg.example.com

---

**Happy Debugging! 🐞**
