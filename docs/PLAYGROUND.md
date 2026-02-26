# Debugg Interactive Playground

Try Debugg online without installing anything!

## 🎮 CodeSandbox Templates

### React Playground
[![Edit Debugg React Playground](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/debugg-react-playground)

**Features:**
- React Error Boundary setup
- Functional components with hooks
- Custom error handler hook
- Console output
- Sentry integration (optional)

**Link:** https://codesandbox.io/s/debugg-react-playground

### Express Playground
[![Edit Debugg Express Playground](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/debugg-express-playground)

**Features:**
- Express error middleware
- Async route wrapper
- Multiple error scenarios
- Console logging
- Webhook reporter testing

**Link:** https://codesandbox.io/s/debugg-express-playground

### Vanilla TypeScript Playground
[![Edit Debugg TypeScript Playground](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/debugg-typescript-playground)

**Features:**
- Basic error handling
- Custom reporters
- Security features demo
- Performance monitoring
- Batching and debouncing

**Link:** https://codesandbox.io/s/debugg-typescript-playground

## 🚀 StackBlitz Templates

### React + TypeScript
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/debugg-react)

**Link:** https://stackblitz.com/edit/debugg-react

### Express API
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/debugg-express)

**Link:** https://stackblitz.com/edit/debugg-express

### Next.js App Router
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/debugg-nextjs)

**Link:** https://stackblitz.com/edit/debugg-nextjs

## 📋 Playground Features

All playgrounds include:

### Basic Features
- ✅ Pre-configured Debugg setup
- ✅ Example error scenarios
- ✅ Console output
- ✅ Multiple reporters
- ✅ TypeScript support

### Advanced Features
- ✅ Error classification demo
- ✅ Security features (redaction)
- ✅ Performance monitoring
- ✅ Error batching
- ✅ Rate limiting demo

### Learning Resources
- ✅ Inline comments
- ✅ Step-by-step examples
- ✅ Common patterns
- ✅ Best practices
- ✅ Links to documentation

## 🎯 Example Scenarios

### 1. Basic Error Handling
```typescript
import { debugg } from 'debugg';

try {
  throw new Error('Something went wrong!');
} catch (error) {
  await debugg.handle(error, {
    userId: '123',
    action: 'test_action',
  });
}
```

### 2. Custom Reporter
```typescript
import { ErrorReporter } from 'debugg';

const customReporter: ErrorReporter = async (error) => {
  console.log('Custom reporter:', error.message);
  // Send to your service
};

debugg.addReporter(customReporter);
```

### 3. Security Features
```typescript
const debugg = new EnhancedErrorHandler({
  security: {
    redactFields: ['password', 'token'],
    enableRateLimiting: true,
  },
});
```

## 📖 How to Use

1. **Click any playground link above**
2. **Wait for dependencies to install**
3. **Run the example code**
4. **Modify and experiment**
5. **See errors in console**

## 🎓 Learning Path

### Beginner
1. Start with Vanilla TypeScript Playground
2. Try basic error handling
3. Explore different severity levels
4. Add custom context

### Intermediate
1. Move to React or Express playground
2. Implement Error Boundaries
3. Add multiple reporters
4. Configure security features

### Advanced
1. Create custom reporters
2. Implement error batching
3. Set up rate limiting
4. Monitor performance metrics

## 🔗 Quick Links

- [Documentation](../docs/)
- [Quick Start](../docs/QUICKSTART.md)
- [API Reference](../docs/api/)
- [Integration Guides](../docs/integrations/)

## 💡 Tips

- **Fork playgrounds** to save your experiments
- **Share links** with your team
- **Report issues** you find
- **Suggest new** playground scenarios

## 🤝 Contributing

Want to add a new playground? 

1. Create a CodeSandbox/StackBlitz template
2. Add it to this list
3. Submit a PR

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

**Happy Experimenting! 🧪**
