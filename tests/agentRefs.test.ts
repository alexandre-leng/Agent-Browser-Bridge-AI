import { describe, it, expect } from 'vitest';
import { findByRef } from '../src/browser/agent.js';
import { searchUrl } from '../src/browser/handlers/navigation.js';

describe('findByRef', () => {
  it('returns null on an empty cache', () => {
    expect(findByRef(1, 'refs-test-empty')).toBeNull();
    expect(findByRef('3', 'refs-test-empty')).toBeNull();
  });
});

describe('searchUrl', () => {
  it('builds engine URLs', () => {
    expect(searchUrl('bing', 'a b')).toBe('https://www.bing.com/search?q=a%20b');
    expect(searchUrl(undefined, 'x')).toMatch(/^https:\/\/www\.google\.com\/search\?q=x$/);
  });

  it('rejects unknown engines and empty queries with a clear error', () => {
    expect(() => searchUrl('yahoo', 'x')).toThrow(/unsupported engine/);
    expect(() => searchUrl('constructor', 'x')).toThrow(/unsupported engine/);
    expect(() => searchUrl('google', '')).toThrow(/query is required/);
  });
});
