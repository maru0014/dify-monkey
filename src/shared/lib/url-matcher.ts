/**
 * Utility for matching URLs against Chrome match patterns
 * Ref: https://developer.chrome.com/docs/extensions/mv3/match_patterns/
 */

/**
 * Check if a URL matches a Chrome match pattern
 * @param url The URL to check
 * @param pattern The match pattern (e.g. "https://*.google.com/*")
 */
export function matchesPattern(url: string, pattern: string): boolean {
  if (pattern === '<all_urls>') return true;
  if (!url || !pattern) return false;

  try {
    const urlObj = new URL(url);

    // Parse pattern
    // Pattern format: scheme://host/path
    const schemeSeparatorIndex = pattern.indexOf('://');
    if (schemeSeparatorIndex === -1) return false;

    const schemePattern = pattern.substring(0, schemeSeparatorIndex);
    const hostAndPath = pattern.substring(schemeSeparatorIndex + 3);

    const pathSeparatorIndex = hostAndPath.indexOf('/');
    // If no path is specified, it matches everything after host (should not happen in valid patterns usually)
    const hostPattern = pathSeparatorIndex === -1 ? hostAndPath : hostAndPath.substring(0, pathSeparatorIndex);
    const pathPattern = pathSeparatorIndex === -1 ? '/*' : hostAndPath.substring(pathSeparatorIndex);

    // 1. Check Scheme
    if (schemePattern !== '*' && schemePattern !== urlObj.protocol.replace(':', '')) {
      return false;
    }

    // 2. Check Host
    if (hostPattern === '*') {
      // Matches any host
    } else if (hostPattern.startsWith('*.') && hostPattern.length > 2) {
      // Wildcard subdomain: *.example.com matches example.com and www.example.com
      const domain = hostPattern.substring(2);
      if (urlObj.hostname !== domain && !urlObj.hostname.endsWith('.' + domain)) {
        return false;
      }
    } else if (hostPattern !== urlObj.hostname) {
      // Exact match
      return false;
    }

    // 3. Check Path
    // Simple implementation for path matching
    // Replace * with .* for regex, escape other characters
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Split by * and escape other parts
    const pathParts = pathPattern.split('*');
    const regexString = '^' + pathParts.map(escapeRegex).join('.*') + '$';
    const pathRegex = new RegExp(regexString);

    return pathRegex.test(urlObj.pathname + urlObj.search + urlObj.hash);

  } catch (e) {
    console.error('Error matching URL pattern:', e);
    return false;
  }
}

/**
 * Check if a URL matches any of the given patterns
 */
export function matchesAny(url: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchesPattern(url, pattern));
}
