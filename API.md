# SwiftDrop API Reference

*Note: SwiftDrop is primarily a client-side application. This document covers the internal JavaScript API for programmatic access and any server-side endpoints if implemented.*

## Client-Side API

### SwiftDrop Object

The main application is exposed as `window.SwiftDrop` for programmatic access.

```javascript
const sw = window.SwiftDrop;
```

### State Object

```javascript
{
  peer: Peer,           // PeerJS instance
  connection: DataChannel, // Active connection
  mode: 'send' | 'receive',
  myCode: string,       // 6-char code
  sessionStartTime: number,
  isDisconnecting: boolean,
  transfers: Map<id, TransferState>,
  sessionExpiryTimer: number
}
```

### Configuration

```javascript
SwiftDrop.CONFIG = {
  CHUNK_SIZE: 262144,           // 256KB
  SESSION_EXPIRY_MS: 900000,    // 15 min
  MAX_CONCURRENT_FILES: 5,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  PROGRESS_UPDATE_INTERVAL: 500,
  METRICS_ENABLED: false,
  LOG_LEVEL: 'info'
};
```

### TransferState Class

```javascript
new TransferState(id, file, direction)
```

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique transfer ID |
| file | File | Browser File object |
| direction | 'send' | 'receive' |
| status | string | Current status |
| progress | number | 0-100 |
| bytesTransferred | number | Bytes sent/received |
| speed | number | Bytes per second |
| fileHash | string | SHA-256 hash |
| isPaused | boolean | Pause state |
| isCancelled | boolean | Cancel state |

### Methods

#### pauseTransfer(transferId)
```javascript
SwiftDrop.pauseTransfer('transfer-123');
```
Pauses an active transfer.

#### resumeTransfer(transferId)
```javascript
SwiftDrop.resumeTransfer('transfer-123');
```
Resumes a paused transfer.

#### cancelTransfer(transferId)
```javascript
SwiftDrop.cancelTransfer('transfer-123');
```
Cancels a transfer.

#### retryTransfer(transferId)
```javascript
SwiftDrop.retryTransfer('transfer-123');
```
Retries a failed or cancelled transfer.

#### disconnectSession()
```javascript
SwiftDrop.disconnectSession();
```
Closes the current session and resets the UI.

#### connectToSender()
```javascript
SwiftDrop.connectToSender();
```
Initiates connection to a sender (must have code in input field).

#### getMetrics()
```javascript
const metrics = SwiftDrop.getMetrics();
// Returns all current metrics
```

### Utility Functions

#### formatSize(bytes)
```javascript
SwiftDrop.formatSize(1024 * 1024); // "1 MB"
```
Formats bytes into human-readable string.

#### formatSpeed(bytesPerSecond)
```javascript
SwiftDrop.formatSpeed(1024 * 1024); // "1.0 MB/s"
```
Formats speed into human-readable string.

#### sanitizeFilename(name)
```javascript
SwiftDrop.sanitizeFilename('../../etc/passwd'); // "__etc_passwd"
```
Sanitizes filename for security.

#### escapeHtml(text)
```javascript
SwiftDrop.escapeHtml('<script>'); // "&lt;script&gt;"
```
Escapes HTML entities.

### Metrics API

```javascript
SwiftDrop.Metrics.increment('connectionsEstablished');
SwiftDrop.Metrics.add('bytesTransferred', 1024);
SwiftDrop.Metrics.trackError(error, 'context');
```

### Logging API

```javascript
SwiftDrop.Logger.setLevel('debug'); // debug, info, warn, error
SwiftDrop.Logger.info('Source', 'Message');
SwiftDrop.Logger.error('Source', 'Error message', { data });
```

## Internal Message Protocol

Messages sent over WebRTC DataChannel.

### Sender → Receiver

#### file-start
```javascript
{
  type: 'file-start',
  id: 'transfer-id',
  name: 'filename.jpg',
  size: 1048576,
  mimeType: 'image/jpeg',
  hash: 'sha256-hash'
}
```

#### file-chunk
```javascript
{
  type: 'file-chunk',
  id: 'transfer-id',
  chunk: 'base64-encoded-data',
  index: 0,
  total: 4,
  progress: 25
}
```

#### file-complete
```javascript
{
  type: 'file-complete',
  id: 'transfer-id',
  hash: 'sha256-hash',
  size: 1048576
}
```

#### transfer-cancelled
```javascript
{
  type: 'transfer-cancelled',
  id: 'transfer-id'
}
```

#### transfer-paused
```javascript
{
  type: 'transfer-paused',
  id: 'transfer-id'
}
```

#### transfer-resumed
```javascript
{
  type: 'transfer-resumed',
  id: 'transfer-id'
}
```

### Receiver → Sender

Uses same message types for acknowledgments.

### Control Messages

#### ping / pong
```javascript
{ type: 'ping' }  // Heartbeat
{ type: 'pong' }  // Response
```

## Environment Configuration

### TURN Server Configuration

```javascript
// Via window.ENV
window.ENV = {
  TURN_SERVER_URL: 'turn:server.com:3478',
  TURN_SERVER_USER: 'username',
  TURN_SERVER_CREDENTIAL: 'password'
};
```

### Monitoring Configuration

```javascript
CONFIG.METRICS_ENABLED = true;
CONFIG.LOG_LEVEL = 'debug';
```

## Events

SwiftDrop uses custom events for extensibility:

```javascript
// Listen for transfer events
document.addEventListener('swiftdrop:transfer-start', (e) => {
  console.log('Transfer started:', e.detail);
});

document.addEventListener('swiftdrop:transfer-progress', (e) => {
  console.log('Progress:', e.detail.progress);
});

document.addEventListener('swiftdrop:transfer-complete', (e) => {
  console.log('Transfer complete:', e.detail);
});

document.addEventListener('swiftdrop:transfer-error', (e) => {
  console.error('Transfer error:', e.detail);
});

document.addEventListener('swiftdrop:connection-open', () => {
  console.log('Connection established');
});

document.addEventListener('swiftdrop:connection-close', () => {
  console.log('Connection closed');
});
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| CONN_001 | Connection timeout | Peer connection timed out |
| CONN_002 | Peer unavailable | Target peer not found |
| CONN_003 | Browser incompatible | WebRTC not supported |
| XFR_001 | Transfer failed | File transfer error |
| XFR_002 | Hash mismatch | Integrity check failed |
| XFR_003 | Storage full | Cannot save file |
| AUTH_001 | Invalid code | Code format invalid |
| AUTH_002 | Session expired | Session timed out |

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | 80+ | 75+ | 14+ | 80+ |
| File.stream() | 76+ | 78+ | 15.2+ | 79+ |
| Web Crypto | 60+ | 55+ | 11+ | 79+ |
| Service Worker | 66+ | 68+ | 14+ | 79+ |

## TypeScript Definitions (Optional)

For TypeScript projects:

```typescript
interface TransferState {
  id: string;
  file: File;
  direction: 'send' | 'receive';
  status: TransferStatus;
  progress: number;
  bytesTransferred: number;
  speed: number;
  fileHash?: string;
  isPaused: boolean;
  isCancelled: boolean;
}

type TransferStatus = 
  | 'pending'
  | 'sending'
  | 'receiving'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

interface Metrics {
  connectionsEstablished: number;
  connectionsFailed: number;
  transfersStarted: number;
  transfersCompleted: number;
  transfersFailed: number;
  bytesTransferred: number;
  errors: number;
}
```