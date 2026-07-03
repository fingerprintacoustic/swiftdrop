# SwiftDrop Troubleshooting Guide

## Common Issues

### Connection Problems

#### "Connection failed" or "Code not found"

**Symptoms:**
- Entered code but connection fails
- Error message: "Code not found"

**Solutions:**

1. **Check the code**
   - Ensure 6-character code is correct
   - Codes are case-insensitive but should be uppercase

2. **Both parties need fresh sessions**
   - Sender must have app open and show code
   - Refresh page if code is more than 15 minutes old

3. **Firewall/NAT issues**
   - Both users need stable internet
   - Corporate firewalls may block WebRTC
   - Try using TURN servers

4. **Try direct link**
   - Click "Copy Link" instead of sharing code
   - Open link on receiver's device

#### "Connecting..." forever

**Symptoms:**
- Status shows "Connecting..." but never connects

**Solutions:**

1. **Wait 15 seconds**
   - Connection timeout is 15 seconds
   - If still stuck, refresh both pages

2. **Check internet connection**
   - Both devices need internet access
   - Try loading a website to confirm

3. **Disable VPN**
   - Some VPNs block WebRTC
   - Try without VPN

#### Connection drops mid-transfer

**Symptoms:**
- Transfer starts but connection is lost

**Solutions:**

1. **Reconnect automatically**
   - Keep both pages open
   - Connection should auto-recover

2. **Check network stability**
   - Unstable WiFi can cause drops
   - Try moving closer to router

3. **Sender resend the file**
   - Click Cancel on failed transfer
   - Click Retry to resend

### QR Code Issues

#### QR code not scanning

**Symptoms:**
- Camera doesn't open or can't scan QR

**Solutions:**

1. **Grant camera permission**
   - Browser needs camera access
   - Check browser settings

2. **Clean the camera lens**
   - Dirt can prevent scanning
   - Use a soft cloth

3. **Good lighting**
   - QR needs adequate light
   - Avoid glare on screen

4. **Try manual entry**
   - Use the 6-character code instead
   - Type it carefully

#### QR doesn't appear

**Symptoms:**
- Code shows but QR image is blank or broken

**Solutions:**

1. **Refresh the page**
   - QR regenerates on load

2. **Check internet**
   - QR generated from external API
   - Requires internet to load

### File Transfer Issues

#### File won't send

**Symptoms:**
- Drop file but nothing happens

**Solutions:**

1. **Need connection first**
   - Someone must be connected as receiver
   - Wait for "Connected" status

2. **Check file size**
   - Browser limits vary by device
   - Try a smaller file

3. **File name issues**
   - Very long names may fail
   - Special characters can cause issues

#### Transfer stuck at 99%

**Symptoms:**
- Progress stops near completion

**Solutions:**

1. **Wait 30 seconds**
   - Final verification takes time
   - Hash computation is normal

2. **Cancel and retry**
   - Click Cancel
   - Click Retry on sender side

#### File corrupted after transfer

**Symptoms:**
- File downloads but won't open

**Solutions:**

1. **Check hash warning**
   - Red error means hash mismatch
   - File was corrupted during transfer

2. **Retry the transfer**
   - Cancel and resend
   - Check network stability

3. **Try in different browser**
   - Some browsers have transfer issues
   - Chrome/Edge recommended

#### Download doesn't start

**Symptoms:**
- Transfer completes but no download prompt

**Solutions:**

1. **Check download folder**
   - File may have auto-downloaded
   - Check Downloads folder

2. **Browser blocking downloads**
   - Check for blocked download notification
   - Allow downloads for this site

3. **Refresh page**
   - Page state may be out of sync

### Browser Compatibility

#### "Browser not supported"

**Symptoms:**
- Error message on load

**Solutions:**

1. **Update your browser**
   - Chrome 80+
   - Firefox 75+
   - Safari 14+
   - Edge 80+

2. **Enable WebRTC**
   - Check browser settings
   - WebRTC must be enabled

#### Performance issues

**Symptoms:**
- Slow transfers or high memory usage

**Solutions:**

1. **Close other tabs**
   - Other tabs consume memory
   - Fewer tabs = better performance

2. **Update browser**
   - Newer versions are faster
   - Better WebRTC support

3. **Try incognito mode**
   - Extensions can interfere
   - Clean environment

### PWA Installation

#### "Install" button not visible

**Symptoms:**
- Can't find how to install app

**Solutions:**

1. **Desktop browsers**
   - Chrome: Look in menu (⋮)
   - Edge: Look in menu (...)
   - Look for "Install SwiftDrop"

2. **Mobile browsers**
   - iOS: Share menu → Add to Home Screen
   - Android Chrome: Banner at bottom or menu

3. **Not all browsers support PWA**
   - Use Chrome, Edge, or Safari
   - Firefox has limited PWA support

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Code not found" | Invalid code entered | Check and retry |
| "Connection failed" | Couldn't establish P2P | Refresh and retry |
| "Session expired" | 15-min timeout | Refresh page |
| "File corrupted" | Hash mismatch | Retry transfer |
| "Browser not supported" | Old browser | Update browser |
| "Network error" | Internet issue | Check connection |

## Diagnostic Information

### Enable Debug Mode

Add to browser console:

```javascript
SwiftDrop.Logger.setLevel('debug');
CONFIG.METRICS_ENABLED = true;
```

This enables detailed logging and shows metrics panel.

### Check Browser Support

```javascript
// Run in console
console.log('WebRTC supported:', !!window.RTCPeerConnection);
console.log('File API supported:', !!window.File);
console.log('Crypto supported:', !!window.crypto);
```

### Network Information

```javascript
// Check connection type
console.log(navigator.connection?.effectiveType);
console.log(navigator.connection?.downlink);
```

## Getting Help

### Before Reporting an Issue

1. Note the browser and version
2. Describe what happened
3. Note any error messages
4. Check if issue is reproducible

### Report an Issue

- GitHub Issues: Include browser info
- Include console logs if possible
- Screenshots help

### Known Limitations

1. **Can't transfer to self** - Two different browsers/devices required
2. **Same network sometimes fails** - Corporate networks may block P2P
3. **Mobile to mobile** - May require TURN for NAT
4. **Very large files** - Some browsers have memory limits

## Performance Tips

### Faster Transfers

1. **Use same network**
   - Local network = fastest speeds
   - No internet required

2. **Close other applications**
   - Free up bandwidth
   - Reduce memory usage

3. **Use Chrome or Edge**
   - Best WebRTC performance
   - Better memory management

### Reduce Memory Usage

1. **Close other tabs**
   - Each tab uses memory
   - Transfer tab needs headroom

2. **Refresh between large transfers**
   - Clear browser memory
   - Fresh session

## Emergency Fixes

### Clear Everything

```javascript
// Run in console on both devices
location.reload();
```

### Reset Network State

1. Toggle WiFi off/on
2. Restart browser
3. Try incognito mode

### Force Reconnection

1. Click "Disconnect"
2. Wait 5 seconds
3. Refresh sender page
4. New code will appear
5. Reconnect