import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { handler as apiAuthMeHandler } from '../../netlify/functions/api-auth-me.js';

describe('Netlify Configuration & Routing Smoke Tests', () => {
  it('1. netlify.toml define el redirect exacto de /api/auth/me hacia /.netlify/functions/api-auth-me con force = true', () => {
    const netlifyTomlPath = path.resolve(process.cwd(), 'netlify.toml');
    expect(fs.existsSync(netlifyTomlPath)).toBe(true);

    const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf-8');

    // Verify exact redirect block
    expect(tomlContent).toContain('from = "/api/auth/me"');
    expect(tomlContent).toContain('to = "/.netlify/functions/api-auth-me"');
    expect(tomlContent).toContain('force = true');

    // Verify security headers block
    expect(tomlContent).toContain('X-Content-Type-Options = "nosniff"');
    expect(tomlContent).toContain('X-Frame-Options = "DENY"');
    expect(tomlContent).toContain('Cross-Origin-Opener-Policy = "same-origin-allow-popups"');
    expect(tomlContent).toContain('NODE_VERSION = "24"');
  });

  it('2. Smoke test: /api/auth/me alcanza directamente el handler real y responde JSON 401 sin token (no HTML ni 404)', async () => {
    const simulatedNetlifyEvent = {
      path: '/api/auth/me',
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: null,
      body: null,
    };

    const response = await apiAuthMeHandler(simulatedNetlifyEvent);

    expect(response.statusCode).toBe(401);
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Cache-Control']).toContain('no-store');

    const body = JSON.parse(response.body);
    expect(body.code).toBe('AUTH_TOKEN_MISSING');
    expect(body.error).toBeDefined();
  });
});
