# SwiftDrop Deployment Guide

## Overview

This guide covers deployment options for SwiftDrop from development to production.

## Environments

### Development
- **Purpose:** Local testing
- **Signaling:** PeerJS cloud (free tier)
- **TURN:** None (direct connections only)
- **URL:** `http://localhost:8080/swiftdrop-enterprise.html`

### Staging
- **Purpose:** Pre-production testing
- **Signaling:** Dedicated PeerJS server
- **TURN:** Single Coturn instance
- **URL:** `https://staging.swiftdrop.example.com`

### Production
- **Purpose:** Live users
- **Signaling:** Clustered PeerJS servers (HA)
- **TURN:** Distributed Coturn globally
- **CDN:** CloudFlare/CloudFront
- **URL:** `https://swiftdrop.example.com`

## Deployment Options

### Option 1: Static Hosting (Simplest)

Deploy as static files to any static host.

**Providers:**
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront

**Steps:**
```bash
# Build (if needed)
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=.

# Or GitHub Pages
git push origin main
```

### Option 2: Self-Hosted

Host on your own infrastructure.

**Requirements:**
- Web server (nginx/Apache)
- SSL certificate (Let's Encrypt)
- 1GB RAM minimum
- Node.js (for PeerJS server)

### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80 443
```

```yaml
# docker-compose.yml
version: '3'
services:
  web:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    restart: unless-stopped
```

## Server Configuration

### Nginx

```nginx
server {
    listen 80;
    server_name swiftdrop.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name swiftdrop.example.com;

    ssl_certificate /etc/ssl/certs/swiftdrop.crt;
    ssl_certificate_key /etc/ssl/private/swiftdrop.key;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP (adjust as needed)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' wss://0.peerjs.com wss://peer-demo.fly.dev; img-src 'self' data: https://api.qrserver.com;" always;
    
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Enable CORS for API
    location /api/ {
        add_header Access-Control-Allow-Origin *;
    }
}
```

## TURN Server Setup

### Coturn Installation

```bash
# Ubuntu/Debian
apt install coturn

# Configuration
cat > /etc/turnserver.conf << EOF
listening-port=3478
tls-listening-port=443
fingerprint
lt-cred-mech
realm=swiftdrop
use-auth-secret
static-auth-secret=YOUR-SECRET-HERE
total-quota=100
bps-capacity=1000000000
# Enable if behind NAT
# external-ip=YOUR-EXTERNAL-IP
EOF

# Start
systemctl enable coturn
systemctl start coturn
```

### TURN Credentials

**Option 1: Static (Development)**
```javascript
window.ENV = {
  TURN_SERVER_URL: 'turn:your-server.com:3478',
  TURN_SERVER_USER: 'user',
  TURN_SERVER_CREDENTIAL: 'password'
};
```

**Option 2: Dynamic (Production)**
Implement a credential endpoint:

```javascript
// Fetch credentials from your server
async function getTurnCredentials() {
  const response = await fetch('/api/turn-credentials');
  const data = await response.json();
  return {
    urls: data.urls,
    username: data.username,
    credential: data.credential
  };
}
```

## Environment Configuration

### Configuration Object

```javascript
const CONFIG = {
  // Development
  METRICS_ENABLED: true,
  LOG_LEVEL: 'debug',
  
  // Production
  METRICS_ENABLED: false,
  LOG_LEVEL: 'error',
  
  // Shared
  CHUNK_SIZE: 256 * 1024,
  SESSION_EXPIRY_MS: 15 * 60 * 1000
};
```

### Environment Variables

```javascript
// From window.ENV or sessionStorage
window.ENV = {
  API_URL: 'https://api.example.com',
  TURN_SERVER_URL: 'turn:turn.example.com:3478',
  TURN_SERVER_USER: 'app-user',
  TURN_SERVER_CREDENTIAL: 'secure-credential',
  ANALYTICS_ID: 'UA-XXXXXXXX-X'
};
```

## Monitoring Setup

### Metrics Collection

```javascript
// Example: Send to Prometheus Pushgateway
async function sendMetrics(metrics) {
  const payload = JSON.stringify(metrics);
  await fetch('https://pushgateway:9091/metrics/job/swiftdrop', {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Key Metrics to Track

| Metric | Type | Description |
|--------|------|-------------|
| connections_established | Counter | Total connections |
| connections_failed | Counter | Failed connections |
| transfers_started | Counter | Transfers initiated |
| transfers_completed | Counter | Successful transfers |
| transfers_failed | Counter | Failed transfers |
| bytes_transferred | Counter | Total bytes sent |
| active_connections | Gauge | Current connections |

## Load Balancing

### PeerJS Server Clustering

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peerjs-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: peerjs-server
  template:
    spec:
      containers:
      - name: peerjs
        image: your-peerjs-server:latest
        ports:
        - containerPort: 9000
---
apiVersion: v1
kind: Service
metadata:
  name: peerjs-service
spec:
  selector:
    app: peerjs-server
  ports:
  - port: 9000
  type: LoadBalancer
```

### DNS Configuration

```
# A record
swiftdrop.example.com -> ALB DNS

# SRV record for TURN
_stun._udp.swiftdrop.example.com -> stun.swiftdrop.example.com:3478
_turn._udp.swiftdrop.example.com -> turn.swiftdrop.example.com:3478
```

## SSL/TLS

### Let's Encrypt (Certbot)

```bash
# Install
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d swiftdrop.example.com

# Auto-renewal
crontab -e
# Add: 0 0 * * * certbot renew
```

## Backup & Recovery

### Backup Strategy
- Configuration files
- SSL certificates
- User data (if any)

```bash
# Backup script
tar czf swiftdrop-backup-$(date +%Y%m%d).tar.gz \
  /etc/nginx/sites-available/swiftdrop \
  /etc/ssl/swiftdrop \
  /etc/turnserver.conf
```

## Health Checks

### Endpoint
```javascript
// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

### Kubernetes Probe
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 30
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

## Troubleshooting

### Common Issues

1. **Connection fails**
   - Check firewall rules
   - Verify STUN/TURN servers
   - Check WebSocket connectivity

2. **Slow transfer**
   - Check network bandwidth
   - Verify TURN server location
   - Monitor CPU usage

3. **Memory issues**
   - Enable streaming mode
   - Check for memory leaks
   - Increase browser memory limit

## CI/CD Pipeline

See `.github/workflows/deploy.yml` for automated deployment.

```yaml
# Trigger: Push to main
# Steps:
# 1. Lint
# 2. Test
# 3. Build
# 4. Deploy to staging
# 5. Run smoke tests
# 6. Deploy to production
```
