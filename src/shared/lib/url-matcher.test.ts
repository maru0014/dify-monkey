import { describe, it, expect } from 'vitest';
import { matchesPattern, matchesAny } from './url-matcher';

describe('url-matcher', () => {
  describe('matchesPattern', () => {
    it('matches exact URLs', () => {
      expect(matchesPattern('https://example.com/', 'https://example.com/')).toBe(true);
      expect(matchesPattern('https://example.com/', 'https://other.com/')).toBe(false);
    });

    it('matches <all_urls>', () => {
      expect(matchesPattern('https://example.com/', '<all_urls>')).toBe(true);
      expect(matchesPattern('http://insecure.com/path', '<all_urls>')).toBe(true);
      expect(matchesPattern('file:///local/file', '<all_urls>')).toBe(true);
    });

    it('matches host wildcards', () => {
      expect(matchesPattern('https://example.com/', 'https://*.example.com/')).toBe(true); // *.example.com matches example.com too
      expect(matchesPattern('https://www.example.com/', 'https://*.example.com/')).toBe(true);
      expect(matchesPattern('https://a.b.example.com/', 'https://*.example.com/')).toBe(true);
      expect(matchesPattern('https://example.com/', 'https://*/*')).toBe(true); // Any host
    });

    it('matches path wildcards', () => {
      expect(matchesPattern('https://example.com/foo', 'https://example.com/*')).toBe(true);
      expect(matchesPattern('https://example.com/foo/bar', 'https://example.com/*')).toBe(true);
      expect(matchesPattern('https://example.com/', 'https://example.com/*')).toBe(true);

      expect(matchesPattern('https://example.com/foo', 'https://example.com/foo*')).toBe(true);
      expect(matchesPattern('https://example.com/foobar', 'https://example.com/foo*')).toBe(true);
      expect(matchesPattern('https://example.com/bar', 'https://example.com/foo*')).toBe(false);
    });

    it('matches scheme wildcards', () => {
      expect(matchesPattern('https://example.com/', '*://example.com/')).toBe(true);
      expect(matchesPattern('http://example.com/', '*://example.com/')).toBe(true);
      expect(matchesPattern('ftp://example.com/', '*://example.com/')).toBe(false); // only http/https/ws/wss/ftp etc usually, but implementation checks strict equality if not *
    });

    it('handles query parameters and hash', () => {
      expect(matchesPattern('https://example.com/foo?q=bar', 'https://example.com/*')).toBe(true);
      expect(matchesPattern('https://example.com/foo#hash', 'https://example.com/*')).toBe(true);
    });
  });

  describe('matchesAny', () => {
    it('returns true if any pattern matches', () => {
      const patterns = ['https://google.com/*', 'https://yahoo.com/*'];
      expect(matchesAny('https://google.com/search', patterns)).toBe(true);
      expect(matchesAny('https://yahoo.com/news', patterns)).toBe(true);
      expect(matchesAny('https://bing.com/map', patterns)).toBe(false);
    });
  });
});
