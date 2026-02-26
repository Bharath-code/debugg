# 🎮 Debugg Demo Apps - Complete Guide

Showcase the full power of Debugg through interactive demo applications.

---

## 📦 **What's Included**

### **1. DebugShop** - E-Commerce Demo ✅
A complete e-commerce application demonstrating:
- ✅ Frontend error tracking (React)
- ✅ Backend error tracking (Express)
- ✅ Payment error handling
- ✅ Database error handling
- ✅ Real-time error monitoring
- ✅ Interactive error playground

**Tech Stack:**
- Frontend: React + Vite
- Backend: Express.js
- Database: PostgreSQL
- Cache: Redis
- Monitoring: Debugg

### **2. TaskFlow** - SaaS Demo (Coming Soon)
A project management SaaS demonstrating:
- Multi-tenancy
- Team collaboration
- SSO integration
- Role-based access
- Audit logging

### **3. HealthTrack** - Mobile Demo (Coming Soon)
A health tracking app demonstrating:
- Mobile crash reporting
- Offline error queuing
- Performance monitoring
- User analytics

### **4. DataSync** - CLI Demo (Coming Soon)
A data synchronization CLI demonstrating:
- CLI error handling
- Progress tracking
- Logging
- Configuration management

---

## 🚀 **Quick Start (5 Minutes)**

### **Option 1: Docker (Recommended)**
```bash
# Clone repository
git clone https://github.com/debugg/demo-apps.git
cd demo-apps/debugshop

# Start all services
docker-compose up

# Open applications
# DebugShop Frontend: http://localhost:3000
# DebugShop Backend: http://localhost:3001
# Debugg Dashboard: http://localhost:4000
```

### **Option 2: Manual Setup**
```bash
# Clone
git clone https://github.com/debugg/demo-apps.git
cd demo-apps/debugshop

# Setup frontend
cd frontend
npm install

# Setup backend
cd ../backend
npm install

# Run backend
cd backend
npm run dev

# Run frontend (new terminal)
cd ../frontend
npm run dev

# Open http://localhost:3000
```

---

## 🎯 **Demo Scenarios**

### **Scenario 1: Error Playground**
**URL:** `http://localhost:3000/playground`

**What to Do:**
1. Click "Trigger Error" buttons
2. Watch errors appear in Debugg dashboard
3. View error details, stack traces, context
4. See automatic error classification

**Errors to Try:**
- ❌ Reference Error
- 🔧 Type Error
- 📏 Range Error
- 🌐 Network Error
- 💳 Payment Error
- 🗄️ Database Error
- ⚙️ Custom Error

---

### **Scenario 2: Shopping Flow**
**URL:** `http://localhost:3000`

**What to Do:**
1. Browse products
2. Add to cart
3. Proceed to checkout
4. Enter test card: `4000000000000002` (fails)
5. See payment error in Debugg dashboard
6. Fix and retry with valid card

**Errors Tracked:**
- ✅ Validation errors
- ✅ Payment errors
- ✅ Network errors
- ✅ Database errors

---

### **Scenario 3: API Testing**
**URL:** `http://localhost:3001/api/errors/trigger?type=database`

**What to Do:**
```bash
# Trigger database error
curl http://localhost:3001/api/errors/trigger?type=database

# Trigger validation error
curl http://localhost:3001/api/errors/trigger?type=validation

# Trigger payment error
curl http://localhost:3001/api/errors/trigger?type=payment

# View errors in Debugg dashboard
# http://localhost:4000
```

---

## 📊 **What Gets Tracked**

### **Frontend Errors**
```javascript
// Automatic tracking
- JavaScript errors
- Unhandled promise rejections
- Network failures
- Slow operations (>1s)
- Failed fetch requests

// Context included
- User agent
- URL
- User ID (if logged in)
- Session ID
- Timestamp
```

### **Backend Errors**
```javascript
// Automatic tracking
- Uncaught exceptions
- Unhandled rejections
- Express errors
- Database errors
- API errors

// Context included
- Request details
- User context
- Database query
- Payment info (redacted)
- Stack trace
```

---

## 🎨 **Features Demonstrated**

### **1. Real-time Monitoring**
- ✅ Errors appear instantly in dashboard
- ✅ WebSocket-powered live updates
- ✅ No page refresh needed

### **2. Error Classification**
- ✅ Automatic severity assignment
- ✅ Error grouping by similarity
- ✅ Root cause suggestions

### **3. Rich Context**
- ✅ Full stack traces
- ✅ Request/response data
- ✅ User information
- ✅ Custom context

### **4. Search & Filter**
- ✅ Full-text search
- ✅ Filter by severity
- ✅ Filter by type
- ✅ Filter by date

### **5. Team Collaboration**
- ✅ Assign errors
- ✅ Add comments
- ✅ Track resolution
- ✅ Export reports

---

## 📖 **Learning Path**

### **Level 1: Beginner (15 minutes)**
```
1. Start DebugShop (docker-compose up)
2. Open http://localhost:3000/playground
3. Trigger your first error
4. View in Debugg dashboard
5. Understand error details
```

**Goal:** See Debugg in action

---

### **Level 2: Intermediate (30 minutes)**
```
1. Browse DebugShop products
2. Add items to cart
3. Checkout with failing card
4. See payment error in Debugg
5. Fix card and complete purchase
6. View error resolution
```

**Goal:** Understand real-world integration

---

### **Level 3: Advanced (1 hour)**
```
1. Study Debugg setup code
2. Add custom error tracking
3. Configure custom reporters
4. Setup alerts
5. Generate compliance report
```

**Goal:** Master Debugg integration

---

### **Level 4: Expert (2 hours)**
```
1. Modify demo app code
2. Add new error scenarios
3. Create custom plugins
4. Setup multi-tenancy
5. Deploy to production
```

**Goal:** Production-ready expertise

---

## 🔧 **Configuration**

### **Frontend Config** (`frontend/src/debugg.ts`)
```typescript
import { debugg } from 'debugg';

const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'debugshop-frontend',
  environment: 'development',
  logToConsole: true,
  performanceMonitoring: true,
  analytics: true,
});

// Add reporters
debuggInstance.addReporter(
  debuggInstance.createWebhookReporter('http://localhost:4000/api/errors')
);

export default debuggInstance;
```

### **Backend Config** (`backend/src/debugg.ts`)
```typescript
import { debugg } from 'debugg';

const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'debugshop-backend',
  environment: 'development',
  logToConsole: true,
  security: {
    redactFields: ['password', 'cardNumber', 'cvv'],
    enableRateLimiting: true
  }
});

export default debuggInstance;
```

---

## 🎥 **Video Tutorials**

### **Video 1: Quick Start (5 min)**
```
0:00 - Intro
0:30 - Start Docker
1:30 - Open DebugShop
2:30 - Trigger first error
3:30 - View in Debugg
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
22:00 - Compliance reports
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
# Frontend: VITE_DEBUGG_URL=http://localhost:4000
# Backend: DEBUGG_DASHBOARD_URL=http://localhost:4000

# Check network
curl http://localhost:4000/health

# View Debugg logs
docker-compose logs debugg
```

### **Can't Access Dashboard**
```bash
# Check port
# Debugg dashboard: http://localhost:4000
# DebugShop frontend: http://localhost:3000
# DebugShop backend: http://localhost:3001

# Restart
docker-compose restart debugg
```

---

## 📊 **Demo Metrics**

### **Track Usage**
```typescript
// In your Debugg dashboard, you'll see:
- Errors triggered per session
- Most common error types
- Average resolution time
- User engagement metrics
```

### **Success Metrics**
- ✅ Time to first error: < 5 minutes
- ✅ Understanding score: > 80%
- ✅ Conversion rate: > 30%
- ✅ Satisfaction: > 4.5/5

---

## 🎯 **Next Steps**

### **After Completing Demo:**

1. **Try Your Own Errors**
   - Modify demo code
   - Add new scenarios
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

## 🎉 **Expected Outcomes**

### **For Users:**
- ✅ Understand Debugg in 5 minutes
- ✅ See all features in action
- ✅ Learn best practices
- ✅ Build confidence
- ✅ Faster adoption

### **For Debugg:**
- ✅ Higher conversion rate
- ✅ Lower support burden
- ✅ Better user education
- ✅ More engagement
- ✅ Faster sales cycle

---

**Happy Debugging! 🐞**
