import { describe, it, expect } from 'vitest';
import { assertExecAllowed, isUpgradeAllowed, requireBridgeToken, safeFilePart, validateNavigableUrl } from '../src/browser/security.js';

describe('security defaults', () => {
  it('requires a bridge token outside localhost', () => {
    expect(() => requireBridgeToken({
      bindHost: '0.0.0.0',
      bridgeToken: '',
      adminToken: '',
      allowedOrigins: [],
      allowFileUrls: false,
      allowedFileRoots: [],
      allowExecScript: false,
    })).toThrow(/BRIDGE_TOKEN/);
  });

  it('allows empty bridge token on localhost', () => {
    expect(requireBridgeToken({
      bindHost: '127.0.0.1',
      bridgeToken: '',
      adminToken: '',
      allowedOrigins: [],
      allowFileUrls: false,
      allowedFileRoots: [],
      allowExecScript: false,
    })).toBe('');
  });

  it('allows file urls only inside configured roots', () => {
    const sec = {
      bindHost: '127.0.0.1',
      bridgeToken: '',
      adminToken: '',
      allowedOrigins: [],
      allowFileUrls: true,
      allowedFileRoots: [process.cwd()],
      allowExecScript: false,
    };
    const url = new URL(`file:///${process.cwd().replace(/\\/g, '/')}/README.md`).toString();
    expect(validateNavigableUrl(url, 'test', sec)).toMatch(/^file:/);
  });

  it('requires explicit exec enablement and token', () => {
    expect(() => assertExecAllowed('x', {
      bindHost: '127.0.0.1',
      bridgeToken: '',
      adminToken: 'x',
      allowedOrigins: [],
      allowFileUrls: false,
      allowedFileRoots: [],
      allowExecScript: false,
    })).toThrow(/disabled/);
  });
});

describe('websocket upgrade checks', () => {
  const local = { bindHost: '127.0.0.1', allowedOrigins: [] as string[] };

  it('accepts non-browser clients without an Origin', () => {
    expect(isUpgradeAllowed(undefined, 'localhost:8080', local)).toBe(true);
  });

  it('accepts the same-origin viewer', () => {
    expect(isUpgradeAllowed('http://localhost:8080', 'localhost:8080', local)).toBe(true);
    expect(isUpgradeAllowed('http://[::1]:8080', '[::1]:8080', local)).toBe(true);
  });

  it('rejects cross-site pages when no origin allowlist is set', () => {
    expect(isUpgradeAllowed('https://evil.example', 'localhost:8080', local)).toBe(false);
  });

  it('rejects DNS-rebinding hosts when bound to localhost', () => {
    expect(isUpgradeAllowed('http://evil.example:8080', 'evil.example:8080', local)).toBe(false);
  });

  it('honours an explicit origin allowlist', () => {
    const sec = { bindHost: '0.0.0.0', allowedOrigins: ['https://app.example'] };
    expect(isUpgradeAllowed('https://app.example', 'bridge.internal:8080', sec)).toBe(true);
    expect(isUpgradeAllowed('https://other.example', 'bridge.internal:8080', sec)).toBe(false);
  });
});

describe('safeFilePart', () => {
  it('neutralises path traversal in session ids', () => {
    expect(safeFilePart('../../etc/passwd')).toBe('______etc_passwd');
    expect(safeFilePart(undefined)).toBe('default');
    expect(safeFilePart('client-1_a')).toBe('client-1_a');
  });
});
