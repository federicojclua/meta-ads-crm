/**
 * Anti-Prompt Injection and Input Sanitization Utility
 * Sanitizes user-generated social content (bios, captions, comments) before passing to LLMs.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /system\s*:/gi,
  /<system>/gi,
  /<\/system>/gi,
  /\[system_prompt\]/gi,
  /you\s+are\s+now\s+a/gi,
  /jailbreak/gi,
  /assistant\s*:/gi,
  /developer\s*mode/gi,
  /prompt\s*injection/gi,
  /act\s+as\s+an\s+unrestricted/gi,
];

/**
 * Sanitizes a single text string (caption, bio, comment)
 * @param {string} text - Raw input text
 * @param {number} maxLength - Maximum allowable length (default: 500)
 * @returns {string} Sanitized string
 */
export function sanitizeSocialText(text, maxLength = 500) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text
    // 1. Remove dangerous control characters & non-printable bytes
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    // 2. Remove markdown code block fences and delimiter injection attempts
    .replace(/```[a-z]*/gi, '')
    .replace(/---+/g, ' ')
    // 3. Remove prompt injection pattern keywords
    .replace(new RegExp(INJECTION_PATTERNS.map(p => p.source).join('|'), 'gi'), '[FILTRADO]');

  // 4. Truncate to maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + '...';
  }

  return sanitized.trim();
}

/**
 * Sanitizes an array of post items for inclusion in an AI prompt
 * @param {Array<Object>} posts - Array of normalized post objects
 * @param {number} maxPosts - Maximum number of posts to pass to AI context (default: 15)
 * @returns {Array<Object>} Sanitized posts subset
 */
export function sanitizePostsForAi(posts = [], maxPosts = 15) {
  if (!Array.isArray(posts)) return [];

  return posts.slice(0, maxPosts).map((post, idx) => ({
    index: idx + 1,
    format: String(post.format || 'image').slice(0, 20),
    timestamp: String(post.timestamp || '').slice(0, 20),
    caption: sanitizeSocialText(post.caption, 280),
    likes: Number(post.likes) || 0,
    comments: Number(post.comments) || 0,
    shares: Number(post.shares) || 0,
    saves: Number(post.saves) || 0,
    reach: Number(post.reach) || null,
    impressions: Number(post.impressions) || null,
  }));
}
