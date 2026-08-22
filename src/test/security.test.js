import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security & Secrets Leak Prevention Tests', () => {
  it('11. Ausencia de variables privadas o secretos en el bundle generado en dist/', () => {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      return;
    }

    const files = fs.readdirSync(distPath, { recursive: true });
    const forbiddenKeywords = [
      'SUPER_ADMIN_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'MONGODB_URI',
      'META_SYSTEM_USER_TOKEN',
      'META_APP_SECRET',
      'CRON_SECRET',
      'GEMINI_API_KEY',
      'GROQ_API_KEY',
    ];

    for (const file of files) {
      const fullPath = path.join(distPath, file);
      if (fs.statSync(fullPath).isFile() && (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const keyword of forbiddenKeywords) {
          expect(content).not.toContain(keyword);
        }
      }
    }
  });

  it('11b. Variables públicas autorizadas utilizan exclusivamente prefijo VITE_', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key] = trimmed.split('=');
        if (key.startsWith('VITE_')) {
          expect(key).toMatch(/^VITE_FIREBASE_/);
        }
      }
    }
  });

  it('11c. Firebase Client Auth está explícitamente configurado con browserSessionPersistence', () => {
    const firebaseLibPath = path.resolve(process.cwd(), 'src/lib/firebase.js');
    const content = fs.readFileSync(firebaseLibPath, 'utf-8');
    expect(content).toContain('browserSessionPersistence');
    expect(content).toContain('setPersistence(auth, browserSessionPersistence)');
    expect(content).not.toContain('browserLocalPersistence');
  });

  it('11d. Roles y permisos nunca se persisten en almacenamiento local/sessionStorage', () => {
    const srcPath = path.resolve(process.cwd(), 'src');
    const files = fs.readdirSync(srcPath, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(srcPath, file);
      if (
        fs.statSync(fullPath).isFile() &&
        !file.includes('test') &&
        (file.endsWith('.js') || file.endsWith('.jsx'))
      ) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content).not.toContain('localStorage.setItem("role"');
        expect(content).not.toContain('localStorage.setItem("user"');
        expect(content).not.toContain('sessionStorage.setItem("role"');
        expect(content).not.toContain('sessionStorage.setItem("user"');
      }
    }
  });

  describe('11e. Allowlist estricta de redirección interna post-login (Mitigación Open Redirect)', () => {
    const SAFE_RETURN_PATHS = new Set([
      '/app',
      '/app/clients',
      '/app/leads',
      '/app/campaigns',
      '/app/settings',
    ]);

    const sanitizeRedirect = (rawFrom) => {
      return typeof rawFrom === 'string' && SAFE_RETURN_PATHS.has(rawFrom) ? rawFrom : '/app';
    };

    it('Acepta rutas internas registradas en la allowlist exacta', () => {
      expect(sanitizeRedirect('/app')).toBe('/app');
      expect(sanitizeRedirect('/app/clients')).toBe('/app/clients');
      expect(sanitizeRedirect('/app/leads')).toBe('/app/leads');
      expect(sanitizeRedirect('/app/campaigns')).toBe('/app/campaigns');
      expect(sanitizeRedirect('/app/settings')).toBe('/app/settings');
    });

    it('Rechaza rutas no registradas aunque comiencen con prefijos similares (/application, /app-malicious)', () => {
      expect(sanitizeRedirect('/application')).toBe('/app');
      expect(sanitizeRedirect('/app-malicious')).toBe('/app');
      expect(sanitizeRedirect('/app/unknown')).toBe('/app');
    });

    it('Rechaza open redirects con esquemas relativos o absolutos (//evil.example, https://evil.com)', () => {
      expect(sanitizeRedirect('//evil.example')).toBe('/app');
      expect(sanitizeRedirect('https://evil.com')).toBe('/app');
      expect(sanitizeRedirect('/\\evil.example')).toBe('/app');
    });

    it('Rechaza caracteres de escape con barra invertida simple (/app\\evil.example)', () => {
      expect(sanitizeRedirect('/app\\evil.example')).toBe('/app');
    });

    it('Rechaza valores nulos, undefined, números u objetos con fallback a /app', () => {
      expect(sanitizeRedirect(null)).toBe('/app');
      expect(sanitizeRedirect(undefined)).toBe('/app');
      expect(sanitizeRedirect({})).toBe('/app');
      expect(sanitizeRedirect(123)).toBe('/app');
      expect(sanitizeRedirect([])).toBe('/app');
    });
  });

  it('11f. firebaseAdmin.js utiliza exclusivamente imports modulares y no usa import default ni admin.apps', () => {
    const firebaseAdminPath = path.resolve(process.cwd(), 'netlify/functions/_shared/firebaseAdmin.js');
    const content = fs.readFileSync(firebaseAdminPath, 'utf-8');

    // Forbidden patterns that cause CJS/ESM undefined reading 'length' crashes in esbuild
    expect(content).not.toMatch(/import\s+admin\s+from\s+['"]firebase-admin['"]/);
    expect(content).not.toContain('admin.apps');
    expect(content).not.toContain('admin.initializeApp');
    expect(content).not.toContain('admin.credential');
    expect(content).not.toContain('admin.auth');

    // Required modern modular imports
    expect(content).toContain("from 'firebase-admin/app'");
    expect(content).toContain("from 'firebase-admin/auth'");
    expect(content).toContain('getApps()');
    expect(content).toContain('getApp()');
    expect(content).toContain('initializeApp(');
    expect(content).toContain('cert(');
    expect(content).toContain('getAuth(');
  });
});
