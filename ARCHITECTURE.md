# SwiftDrop Architecture

## Overview

SwiftDrop is a peer-to-peer file transfer application that uses WebRTC for direct browser-to-browser communication.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT A (Sender)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   UI Layer  │  │ Transfer    │  │   Crypto Module         │ │
│  │   (HTML/CSS)│  │ Controller  │  │   (SHA-256)            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   PeerJS Client                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  ││
│  │  │ Signaling   │  │ ICE Agent  │  │   DataChannel       │  ││
│  │  │ Client      │  │            │  │   (File Transfer)   │  ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │ │
                    ┌─────┘ └─────┐
                    │   Signaling  │
                    │   Server     │
                    │   (PeerJS)   │
                    └─────┐ ┌─────┘
                          │ │
┌─────────────────────────┘ └──────────────────────────────────────┐
│                        CLIENT B (Receiver)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. UI Layer
- **Responsibilities:** User interaction, state display
- **Technologies:** HTML5, CSS3, Vanilla JavaScript
- **No framework dependencies**

### 2. Transfer Controller
- **Responsibilities:** File chunking, progress tracking, transfer state
- **Features:**
  - Streaming file read (no full file in memory)
  - 256KB chunk size
  - Progress calculation
  - Pause/Resume/Cancel support

### 3. Crypto Module
- **Responsibilities:** File integrity verification
- **Algorithm:** SHA-256 (via Web Crypto API)
- **Strategy:** Hash first and last 1MB for large files

### 4. PeerJS Client
- **Responsibilities:** WebRTC abstraction, connection management
- **Features:**
  - Automatic ICE candidate gathering
  - STUN/TURN server configuration
  - Reliable DataChannel

## Data Flow

### Connection Establishment

```
1. Sender opens app → PeerJS creates peer with unique ID
2. Sender shares code/QR with receiver
3. Receiver enters code → PeerJS initiates connection
4. ICE negotiation begins
5. Direct P2P connection established (or TURN relay)
6. DataChannel ready for transfer
```

### File Transfer

```
1. Sender selects file
2. File metadata sent (name, size, hash)
3. File read in 256KB chunks
4. Each chunk → Base64 → DataChannel
5. Receiver accumulates chunks
6. File reassembled
7. Hash verification
8. File downloaded
```

## Network Architecture

### Signaling (PeerJS Cloud)
- **Purpose:** Initial connection setup only
- **Data:** Peer IDs, ICE candidates
- **NOT used for:** File transfer

### WebRTC DataChannel
- **Purpose:** Actual file transfer
- **Encryption:** DTLS
- **Reliability:** Ordered, reliable

### NAT Traversal
- **Primary:** Direct P2P (STUN)
- **Fallback:** TURN relay

## State Management

```
ApplicationState {
  peer: PeerInstance
  connection: DataChannel | null
  mode: 'send' | 'receive'
  myCode: string (6 chars)
  transfers: Map<TransferId, TransferState>
  sessionExpiry: Timestamp
}

TransferState {
  id: string
  file: File
  direction: 'send' | 'receive'
  status: 'pending' | 'sending' | 'receiving' | 'paused' | 'completed' | 'failed'
  progress: number (0-100)
  bytesTransferred: number
  speed: number (bytes/sec)
  hash: string
}
```

## Security Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Browser Sandbox                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              SwiftDrop Application               │  │
│  │                                                  │  │
│  │  ┌──────────────┐    ┌──────────────────────┐   │  │
│  │  │   UI/JS      │───►│   WebRTC Stack      │   │  │
│  │  │   Code       │    │   (Encrypted)        │   │  │
│  │  └──────────────┘    └──────────────────────┘   │  │
│  │         │                      │                 │  │
│  │         │                      ▼                 │  │
│  │         │           ┌──────────────────┐        │  │
│  │         │           │   DTLS/SRTP      │        │  │
│  │         │           │   Encryption     │        │  │
│  │         │           └──────────────────┘        │  │
│  │         │                      │                 │  │
│  └─────────┼──────────────────────┼─────────────────┘  │
│            │                      │                     │
└────────────┼──────────────────────┼─────────────────────┘
             │    Encrypted Stream  │
             ▼                      ▼
      ┌────────────┐         ┌────────────┐
      │  Signaling │         │  Peer B    │
      │  Server   │         │  Browser   │
      │ (Metadata)│         │            │
      └────────────┘         └────────────┘
```

## File Processing

### Sender Side
```
File.select()
    ↓
File.stream().getReader()  ← Streaming (low memory)
    ↓
Read 256KB chunks
    ↓
Base64 encode
    ↓
Send via DataChannel
    ↓
Repeat until complete
```

### Receiver Side
```
Receive chunk
    ↓
Base64 decode
    ↓
Store in ArrayBuffer
    ↓
Repeat until complete
    ↓
Reassemble Blob
    ↓
SHA-256 verify
    ↓
Trigger download
```

## Scalability Considerations

### Current Limitations
- PeerJS cloud free tier: ~1000 concurrent peers
- No dedicated signaling server
- No TURN infrastructure

### Required for Scale
1. **Dedicated PeerJS Server**
   - Deploy own PeerJS server
   - ~10-20 instances with load balancer

2. **TURN Infrastructure**
   - Coturn servers globally distributed
   - ~50 instances for global coverage

3. **Monitoring**
   - Prometheus + Grafana
   - Connection metrics
   - Bandwidth tracking

## Performance Characteristics

| Operation | Time | Memory |
|-----------|------|--------|
| Peer connection | 500ms - 3s | ~10MB |
| File read (streaming) | - | ~50MB constant |
| Chunk processing | ~1ms | - |
| Hash computation | ~100ms | ~2MB |
| File reassembly | ~500ms | ~file size |

## Browser APIs Used

- **WebRTC:** Peer connection and DataChannel
- **File API:** File reading and streaming
- **Web Crypto:** SHA-256 hashing
- **Clipboard API:** Copy functionality
- **Service Worker:** PWA offline support
- **Performance API:** Memory monitoring
