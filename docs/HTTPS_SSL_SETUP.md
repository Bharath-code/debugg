# 🔒 HTTPS/SSL Setup Guide

Complete guide for securing your Debugg Dashboard with HTTPS.

---

## 🎯 **Options for HTTPS**

### **Option 1: Let's Encrypt (Recommended for Production)**
- ✅ Free SSL certificates
- ✅ Auto-renewal
- ✅ Industry standard
- ⏱️ Setup: 30 minutes

### **Option 2: Self-Signed (Development Only)**
- ✅ Free
- ✅ Quick setup
- ❌ Browser warnings
- ⏱️ Setup: 10 minutes

### **Option 3: Cloud Provider SSL**
- ✅ Managed (Vercel, Railway, etc.)
- ✅ Auto-renewal
- ⏱️ Setup: Automatic

---

## 🚀 **Option 1: Let's Encrypt with Nginx**

### **Prerequisites:**
- Domain name pointing to your server
- Server with Nginx installed
- Root access

### **Step 1: Install Certbot**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### **Step 2: Configure Nginx**

Create `/etc/nginx/sites-available/debugg-dashboard`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Step 3: Enable Site**

```bash
sudo ln -s /etc/nginx/sites-available/debugg-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 4: Get SSL Certificate**

```bash
sudo certbot --nginx -d your-domain.com
```

### **Step 5: Auto-Renewal**

Certbot automatically sets up renewal. Verify:

```bash
sudo certbot renew --dry-run
```

### **Step 6: Force HTTPS**

Update Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 **Option 2: Self-Signed Certificate (Development)**

### **Step 1: Generate Certificate**

```bash
mkdir -p dashboard/ssl
cd dashboard/ssl

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### **Step 2: Update Server to Use HTTPS**

Create `dashboard/server-https.ts`:

```typescript
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
};

// ... your existing Express app code ...

// Create HTTPS server instead of HTTP
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443');

https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
});
```

### **Step 3: Update package.json**

```json
{
  "scripts": {
    "dev:http": "bun run dashboard/server.ts",
    "dev:https": "bun run dashboard/server-https.ts",
    "start:http": "bun run dashboard/server.ts",
    "start:https": "bun run dashboard/server-https.ts"
  }
}
```

### **Step 4: Run HTTPS Server**

```bash
# Development
bun run dev:https

# Production
bun run start:https
```

### **Step 5: Accept Certificate in Browser**

1. Open `https://localhost:3443`
2. Click "Advanced"
3. Click "Proceed to localhost (unsafe)"
4. Certificate is now trusted for development

---

## ☁️ **Option 3: Cloud Platform (Easiest)**

### **Vercel Deployment**

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dashboard/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dashboard/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy:**
```bash
vercel login
vercel
```

**HTTPS is automatic and free!**

---

### **Railway Deployment**

1. **Install Railway CLI:**
```bash
npm i -g @railway/cli
```

2. **Deploy:**
```bash
railway login
railway init
railway up
```

**HTTPS is automatic and free!**

---

### **Render Deployment**

1. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: debugg-dashboard
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: node dashboard/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: debugg-db
          property: connectionString

databases:
  - name: debugg-db
```

2. **Deploy to Render:**
- Push to GitHub
- Connect repository in Render
- Auto-deploys with HTTPS

**HTTPS is automatic and free!**

---

## 🔐 **Update Dashboard for HTTPS**

### **Add Security Headers**

Update `server.ts`:

```typescript
import helmet from 'helmet';

// Add security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Force HTTPS in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### **Install Helmet**

```bash
cd dashboard
bun install helmet
```

---

## 📊 **HTTPS Configuration Comparison**

| Method | Cost | Setup Time | Auto-Renewal | Best For |
|--------|------|------------|--------------|----------|
| **Let's Encrypt** | FREE | 30 min | ✅ Yes | Production |
| **Self-Signed** | FREE | 10 min | ❌ No | Development |
| **Vercel** | FREE | 5 min | ✅ Yes | Quick deploy |
| **Railway** | $5/mo | 5 min | ✅ Yes | Production |
| **Render** | FREE/$7 | 10 min | ✅ Yes | Production |

---

## ✅ **Post-Setup Checklist**

After enabling HTTPS:

- [ ] Update all hardcoded `http://` to `https://`
- [ ] Update CORS origins to use `https://`
- [ ] Update cookie settings to `secure: true`
- [ ] Test all features work over HTTPS
- [ ] Set up certificate renewal reminders
- [ ] Update documentation with HTTPS URLs
- [ ] Update monitoring to check HTTPS endpoints

---

## 🔍 **Verify HTTPS Setup**

### **Check Certificate:**

```bash
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### **Check SSL Labs Rating:**

Visit: https://www.ssllabs.com/ssltest/

### **Test Redirect:**

```bash
curl -I http://your-domain.com
# Should return 301 redirect to https://
```

---

## 🎯 **Recommendation**

**For Production:**
- Use **Let's Encrypt** with Nginx
- Or deploy to **Vercel/Railway/Render** (automatic HTTPS)

**For Development:**
- Use **self-signed certificate**
- Or run on HTTP locally

---

## 📞 **Troubleshooting**

### **Certificate Not Trusted:**
```bash
# Renew certificate
sudo certbot renew --force-renewal
```

### **Mixed Content Errors:**
- Update all resources to use `https://`
- Check CDN links in HTML

### **Redirect Loop:**
- Check Nginx config
- Verify `X-Forwarded-Proto` header

---

**Your dashboard is now secure with HTTPS!** 🔒
