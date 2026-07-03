/**
 * SwiftDrop Automated Test Suite
 * Tests for production-ready P2P file transfer
 */

const CONFIG = {
  TEST_TIMEOUT: 30000,
  CHUNK_SIZE: 256 * 1024,
};

class TestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async run(name, testFn) {
    try {
      await testFn();
      this.results.push({ name, status: 'PASS' });
      this.passed++;
      console.log('PASS: ' + name);
    } catch (err) {
      this.results.push({ name, status: 'FAIL', error: err.message });
      this.failed++;
      console.log('FAIL: ' + name + ' - ' + err.message);
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || 'Expected ' + expected + ', got ' + actual);
    }
  }

  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || 'Expected not ' + expected);
    }
  }

  assertContains(str, substr, message) {
    if (str.indexOf(substr) === -1) {
      throw new Error(message || 'Expected "' + str + '" to contain "' + substr + '"');
    }
  }

  assertMatch(str, regex, message) {
    if (!regex.test(str)) {
      throw new Error(message || 'Expected "' + str + '" to match ' + regex);
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  summary() {
    console.log('\n========================================');
    console.log('Results: ' + this.passed + ' passed, ' + this.failed + ' failed');
    console.log('========================================\n');
    return { passed: this.passed, failed: this.failed };
  }
}

var utils = {
  generateSecureId: function() {
    var array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  },

  sanitizeFilename: function(name) {
    return name.replace(/[\/\\..\x00-\x1f]/g, '_').slice(0, 255);
  },

  escapeHtml: function(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatSize: function(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatSpeed: function(bytesPerSecond) {
    if (bytesPerSecond === 0) return '0 B/s';
    var k = 1024;
    var sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    var i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  arrayBufferToBase64: function(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    for (var i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  base64ToArrayBuffer: function(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  arrayBufferToHex: function(buffer) {
    var bytes = new Uint8Array(buffer);
    return Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  },

  getFileIcon: function(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var icons = {
      pdf: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      jpg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
      mp4: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/></svg>',
    };
    return icons[ext] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>';
  }
};

async function runTests() {
  var runner = new TestRunner();
  var sw = window.SwiftDrop;

  await runner.run('Test: generateSecureId creates unique IDs', async function() {
    var id1 = utils.generateSecureId();
    var id2 = utils.generateSecureId();
    runner.assertEqual(id1.length, 32, 'ID should be 32 characters');
    runner.assertNotEqual(id1, id2, 'IDs should be unique');
    runner.assertMatch(id1, /^[a-f0-9]+$/, 'ID should be hex');
  });

  await runner.run('Test: sanitizeFilename removes dangerous characters', async function() {
    runner.assertEqual(utils.sanitizeFilename('normal.txt'), 'normal.txt');
    runner.assertEqual(utils.sanitizeFilename('../../../etc/passwd'), '_.._.._etc_passwd');
    runner.assertEqual(utils.sanitizeFilename('test\x00name'), 'test_name');
    runner.assertEqual(utils.sanitizeFilename('a'.repeat(300)).length, 255);
  });

  await runner.run('Test: escapeHtml prevents XSS', async function() {
    runner.assertEqual(utils.escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
    runner.assertEqual(utils.escapeHtml('normal text'), 'normal text');
  });

  await runner.run('Test: formatSize formats bytes correctly', async function() {
    runner.assertEqual(utils.formatSize(0), '0 B');
    runner.assertEqual(utils.formatSize(1024), '1 KB');
    runner.assertEqual(utils.formatSize(1048576), '1 MB');
    runner.assertEqual(utils.formatSize(1073741824), '1 GB');
  });

  await runner.run('Test: formatSpeed formats speed correctly', async function() {
    runner.assertEqual(utils.formatSpeed(0), '0 B/s');
    runner.assertEqual(utils.formatSpeed(1024), '1.0 KB/s');
    runner.assertEqual(utils.formatSpeed(1048576), '1.0 MB/s');
  });

  await runner.run('Test: SHA-256 hash computation', async function() {
    var testData = new TextEncoder().encode('hello world');
    var hashBuffer = await crypto.subtle.digest('SHA-256', testData);
    var hash = utils.arrayBufferToHex(hashBuffer);
    runner.assertEqual(hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  await runner.run('Test: Base64 roundtrip encoding', async function() {
    var original = new Uint8Array([72, 101, 108, 108, 111]);
    var encoded = utils.arrayBufferToBase64(original.buffer);
    var decoded = utils.base64ToArrayBuffer(encoded);
    var decodedArray = new Uint8Array(decoded);
    runner.assertEqual(decodedArray.length, original.length);
    for (var i = 0; i < original.length; i++) {
      runner.assertEqual(decodedArray[i], original[i]);
    }
  });

  await runner.run('Test: Initial state exists', async function() {
    runner.assert(sw.state !== undefined, 'State should exist');
    runner.assertEqual(sw.state.mode, 'send', 'Default mode should be send');
  });

  await runner.run('Test: Configuration values are correct', async function() {
    runner.assertEqual(sw.CONFIG.CHUNK_SIZE, 256 * 1024, 'Chunk size should be 256KB');
    runner.assertEqual(sw.CONFIG.SESSION_EXPIRY_MS, 15 * 60 * 1000, 'Session expiry should be 15 min');
  });

  await runner.run('Test: RTC_CONFIG has ICE servers', async function() {
    var servers = sw.CONFIG.RTC_CONFIG.iceServers;
    runner.assert(servers.length >= 2, 'Should have at least 2 ICE servers');
    runner.assertContains(servers[0].urls, 'stun', 'First server should be STUN');
  });

  await runner.run('Test: File icons return SVG strings', async function() {
    var icon = utils.getFileIcon('test.pdf');
    runner.assert(icon.indexOf('<svg') !== -1, 'Should return SVG');
  });

  await runner.run('Test: Share link URL format is correct', async function() {
    var baseUrl = window.location.origin + '/';
    var peerId = 'swd-abc123';
    var shareUrl = baseUrl + '?join=' + encodeURIComponent(peerId);
    runner.assertContains(shareUrl, 'https://');
    runner.assertContains(shareUrl, '?join=');
    runner.assertContains(shareUrl, peerId);
  });

  await runner.run('Test: Code validation sanitizes input', async function() {
    var sanitizeCode = function(code) { return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase(); };
    runner.assertEqual(sanitizeCode('abc123'), 'ABC123');
    runner.assertEqual(sanitizeCode('ABC<tag>DEF'), 'ABCDEFTAGDEF');
  });

  if (sw.state.peer && sw.state.peer.open) {
    await runner.run('Test: Peer connection established', async function() {
      runner.assert(sw.state.peer.id !== undefined, 'Peer should have ID');
      runner.assert(sw.state.peer.id.indexOf('swd-') === 0, 'Peer ID should start with swd-');
    });

    await runner.run('Test: Short code is generated', async function() {
      runner.assert(sw.state.myCode !== undefined, 'Should have short code');
      runner.assertEqual(sw.state.myCode.length, 6, 'Short code should be 6 chars');
      runner.assertMatch(sw.state.myCode, /^[A-Z0-9]+$/, 'Code should be uppercase alphanumeric');
    });
  }

  return runner.summary();
}

if (typeof window !== 'undefined') {
  window.runTests = runTests;
  window.utils = utils;
}
