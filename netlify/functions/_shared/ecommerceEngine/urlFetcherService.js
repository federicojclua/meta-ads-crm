/**
 * URL Fetcher & Sanitizer Service with strict SSRF and timeout protections.
 */

// Private & Restricted IP ranges / Hostnames
const FORBIDDEN_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS / GCP metadata
  'metadata.google.internal',
  'instance-data',
];

/**
 * Validates whether a URL is safe to fetch (SSRF Protection).
 */
export function isSafeUrl(rawUrl = '') {
  try {
    const parsed = new URL(rawUrl);

    // 1. Protocol allowlist
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isSafe: false, reason: 'Protocolo no permitido. Solo se admite HTTP y HTTPS.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Forbidden hosts & metadata
    if (FORBIDDEN_HOSTS.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { isSafe: false, reason: 'Acceso a direcciones locales o metadatos bloqueado por seguridad (SSRF).' };
    }

    // 3. Private IP range checks
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (octet1 === 10) return { isSafe: false, reason: 'Rango de IP privada 10.x.x.x no permitido.' };
      // 172.16.0.0/12
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return { isSafe: false, reason: 'Rango de IP privada 172.16-31.x.x no permitido.' };
      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) return { isSafe: false, reason: 'Rango de IP privada 192.168.x.x no permitido.' };
      // 127.0.0.0/8
      if (octet1 === 127) return { isSafe: false, reason: 'Loopback 127.x.x.x no permitido.' };
      // 169.254.0.0/16 Link-Local
      if (octet1 === 169 && octet2 === 254) return { isSafe: false, reason: 'IP Link-Local 169.254.x.x no permitida.' };
    }

    return { isSafe: true, url: parsed.toString() };
  } catch (err) {
    return { isSafe: false, reason: 'Formato de URL inválido.' };
  }
}

/**
 * Fetches page content with timeout and extraction of title, meta description and headings.
 */
export async function fetchAndExtractPageContent(rawUrl = '', timeoutMs = 6000) {
  const safety = isSafeUrl(rawUrl);
  if (!safety.isSafe) {
    return {
      success: false,
      blocked: true,
      error: safety.reason,
      extracted: null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(safety.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AnimaMktAudit/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        blocked: false,
        error: `El servidor remoto respondió con estado HTTP ${response.status}.`,
        extracted: null,
      };
    }

    const html = await response.text();

    // Basic extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);

    // Headings
    const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map((m) => m[1].trim()).slice(0, 3);
    const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map((m) => m[1].trim()).slice(0, 6);

    return {
      success: true,
      blocked: false,
      extracted: {
        title: titleMatch ? titleMatch[1].trim() : (ogTitleMatch ? ogTitleMatch[1].trim() : ''),
        description: metaDescMatch ? metaDescMatch[1].trim() : '',
        ogImage: ogImageMatch ? ogImageMatch[1].trim() : '',
        headings: {
          h1: h1Matches,
          h2: h2Matches,
        },
        rawSnippet: html.slice(0, 4000), // First 4k chars of body
      },
    };
  } catch (err) {
    return {
      success: false,
      blocked: false,
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado al consultar la URL (Timeout 6s).' : err.message,
      extracted: null,
    };
  }
}
