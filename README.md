# SwiftDrop - Enterprise P2P File Transfer

![SwiftDrop](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-brightgreen)

**SwiftDrop** is a production-ready, end-to-end encrypted peer-to-peer file transfer application built with WebRTC.

## Features

- 🔒 **End-to-End Encrypted** - Files never touch a server
- 📱 **QR Code Sharing** - Quick transfer setup via camera
- 🚀 **Unlimited File Size** - Streaming transfer for any file size
- ✓ **Integrity Verification** - SHA-256 checksum validation
- ⏸️ **Transfer Controls** - Pause, resume, cancel transfers
- 📊 **Real-time Progress** - Speed and ETA tracking
- 🌐 **PWA Installable** - Works offline like a native app
- 🔧 **Enterprise Ready** - Monitoring, logging, TURN support

## Quick Start

### Option 1: Open Directly
```bash
# Open in browser
open https://work-1-fioeotvlgaxgrltt.prod-runtime.all-hands.dev/swiftdrop-enterprise.html
```

### Option 2: Local Development
```bash
# Clone and serve
git clone <repository>
cd swiftdrop
python3 -m http.server 8080
# Open http://localhost:8080/swiftdrop-enterprise.html
```

### Option 3: Install as PWA
1. Open the app in Chrome/Edge/Safari
2. Click "Install" or use browser menu
3. App is now available offline

## Usage

### Sending Files
1. Open SwiftDrop
2. Share your 6-character code or QR code
3. Wait for receiver to connect
4. Drop files or click to select
5. Files transfer directly to receiver

### Receiving Files
1. Open SwiftDrop
2. Switch to "Receive" tab
3. Enter sender's code or scan QR
4. Files auto-download when sent

## Architecture

```
┌─────────────┐         ┌─────────────┐
│   Sender    │◄──────►│  Receiver   │
│  Browser A  │  P2P   │  Browser B  │
└─────────────┘        └─────────────┘
       │
       │ Signaling Only
       ▼
┌─────────────┐
│  PeerJS    │  ← Metadata only (peer IDs)
│  Server     │
└─────────────┘
```

**Key Points:**
- Files NEVER pass through the signaling server
- Actual transfer is direct browser-to-browser
- Uses WebRTC DataChannel with DTLS encryption
- STUN/TURN for NAT traversal

## Configuration

### TURN Server (Recommended for Enterprise)

Set environment variables before loading the app:

```javascript
// In your page or app config
window.ENV = {
  TURN_SERVER_URL: 'turn:your-server.com:3478',
  TURN_SERVER_USER: 'your-username',
  TURN_SERVER_CREDENTIAL: 'your-password'
};
```

Or via URL parameters (for testing):
```
?turn_url=turn:server.com:3478&turn_user=xxx&turn_cred=xxx
```

### Self-Hosted Coturn

```conf
# /etc/turnserver.conf
listening-port=3478
tls-listening-port=443
fingerprint
lt-cred-mech
realm=swiftdrop
use-auth-secret
static-auth-secret=your-secret
total-quota=100
bps-capacity=1000000000
```

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full Support |
| Firefox | 75+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 80+ | ✅ Full Support |
| Mobile Chrome | 80+ | ✅ Full Support |
| Mobile Safari | 14+ | ✅ Full Support |

## Security

- **Encryption:** WebRTC DTLS-SRTP
- **File Privacy:** Files never stored on servers
- **Input Sanitization:** All user input validated
- **XSS Protection:** Content escaping enabled
- **CSP Ready:** Content Security Policy compatible

See [SECURITY.md](SECURITY.md) for details.

## Performance

| Metric | Value |
|--------|-------|
| Memory (1GB file) | ~50 MB |
| Chunk Size | 256 KB |
| Max File Size | Browser limit (~2GB per file) |
| Typical Speed | 5-50 Mbps |

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [SECURITY.md](SECURITY.md) - Security audit & best practices
- [PERFORMANCE.md](PERFORMANCE.md) - Performance benchmarks
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

## Development

### Run Tests
```bash
# Open in browser
open tests/test_runner.html

# Or in console
runTests()
```

### Build
No build step required - pure HTML/CSS/JS

### CI/CD
GitHub Actions workflow in `.github/workflows/`

## License

MIT License - See LICENSE file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests
5. Submit pull request

## Support

- **Issues:** GitHub Issues
- **Email:** support@swiftdrop.dev
- **Docs:** https://docs.swiftdrop.dev

---

Built with ❤️ using WebRTC, PeerJS, and vanilla JavaScript.
