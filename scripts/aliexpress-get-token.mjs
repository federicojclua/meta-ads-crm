/**
 * @file aliexpress-get-token.mjs
 * @description Script de un solo uso - intercambia código OAuth por access_token.
 * USO: node scripts/aliexpress-get-token.mjs "CODIGO"
 */

import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.error('⚠️  No se pudo leer .env:', err.message);
  }
}

function signHmac(params, secret, prefix = '') {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null)
    .sort();
  let base = prefix;
  for (const key of keys) base += `${key}${params[key]}`;
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}

function signMd5(params, secret, prefix = '') {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null)
    .sort();
  let base = '';
  for (const key of keys) base += `${key}${params[key]}`;
  const md5Input = `${secret}${prefix}${base}${secret}`;
  return crypto.createHash('md5').update(md5Input, 'utf8').digest('hex').toUpperCase();
}

async function tryRequest(label, url, params, method = 'POST') {
  console.log(`\n🔄 [${label}]`);
  console.log(`   URL: ${url}`);

  try {
    let response;
    if (method === 'GET' || method === 'POST-QS') {
      const qs = new URLSearchParams(params).toString();
      const fullUrl = `${url}?${qs}`;
      response = await fetch(fullUrl, { method: method === 'GET' ? 'GET' : 'POST' });
    } else {
      const body = new URLSearchParams(params).toString();
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body,
      });
    }

    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('   ⚠️ Respuesta vacía');
      return null;
    }

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }

    console.log(`   Response:`, JSON.stringify(data, null, 2));

    // Check for success
    const tokenData = data.top_auth_token_create_response || data;
    if (tokenData.access_token) {
      console.log('\n✅✅✅ TOKEN OBTENIDO EXITOSAMENTE! ✅✅✅');
      console.log(`\n📌 ALIEXPRESS_ACCESS_TOKEN=${tokenData.access_token}`);
      if (tokenData.refresh_token) console.log(`🔄 ALIEXPRESS_REFRESH_TOKEN=${tokenData.refresh_token}`);
      if (tokenData.expire_time) console.log(`⏰ Expira: ${new Date(parseInt(tokenData.expire_time)).toISOString()}`);
      return data;
    }
    return data;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return null;
  }
}

async function main() {
  loadEnv();
  const authCode = process.argv[2];
  if (!authCode) { console.error('❌ Uso: node scripts/aliexpress-get-token.mjs "CODE"'); process.exit(1); }

  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  if (!appKey || !appSecret) { console.error('❌ Faltan credenciales en .env'); process.exit(1); }

  console.log(`🔑 App Key: ${appKey}`);
  console.log(`📋 Code: ${authCode}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  const apiPath = '/auth/token/create';

  // ─── Intento 1: IOP standard - HMAC con apiPath prefix, params en QS ───
  const ts1 = Date.now().toString();
  const p1 = { app_key: appKey, timestamp: ts1, sign_method: 'sha256', code: authCode };
  p1.sign = signHmac(p1, appSecret, apiPath);
  const r1 = await tryRequest('HMAC+apiPath prefix, QS', `https://api-sg.aliexpress.com/rest${apiPath}`, p1, 'POST-QS');
  if (r1?.access_token || r1?.top_auth_token_create_response?.access_token) return;

  // ─── Intento 2: HMAC sin apiPath prefix ───
  const ts2 = Date.now().toString();
  const p2 = { app_key: appKey, timestamp: ts2, sign_method: 'sha256', code: authCode };
  p2.sign = signHmac(p2, appSecret, '');
  const r2 = await tryRequest('HMAC sin prefix, QS', `https://api-sg.aliexpress.com/rest${apiPath}`, p2, 'POST-QS');
  if (r2?.access_token || r2?.top_auth_token_create_response?.access_token) return;

  // ─── Intento 3: HMAC con apiPath, POST body ───
  const ts3 = Date.now().toString();
  const p3 = { app_key: appKey, timestamp: ts3, sign_method: 'sha256', code: authCode };
  p3.sign = signHmac(p3, appSecret, apiPath);
  const r3 = await tryRequest('HMAC+apiPath, POST body', `https://api-sg.aliexpress.com/rest${apiPath}`, p3, 'POST');
  if (r3?.access_token || r3?.top_auth_token_create_response?.access_token) return;

  // ─── Intento 4: MD5 signing ───
  const ts4 = Date.now().toString();
  const p4 = { app_key: appKey, timestamp: ts4, sign_method: 'md5', code: authCode };
  p4.sign = signMd5(p4, appSecret, apiPath);
  const r4 = await tryRequest('MD5+apiPath, QS', `https://api-sg.aliexpress.com/rest${apiPath}`, p4, 'POST-QS');
  if (r4?.access_token || r4?.top_auth_token_create_response?.access_token) return;

  // ─── Intento 5: Con format y version ───
  const ts5 = Date.now().toString();
  const p5 = { app_key: appKey, timestamp: ts5, sign_method: 'sha256', format: 'json', v: '2.0', code: authCode };
  p5.sign = signHmac(p5, appSecret, apiPath);
  const r5 = await tryRequest('HMAC+apiPath+format+v, QS', `https://api-sg.aliexpress.com/rest${apiPath}`, p5, 'POST-QS');
  if (r5?.access_token || r5?.top_auth_token_create_response?.access_token) return;

  // ─── Intento 6: Endpoint /sync en lugar de /rest ───
  const ts6 = Date.now().toString();
  const p6 = { app_key: appKey, timestamp: ts6, sign_method: 'sha256', code: authCode };
  p6.sign = signHmac(p6, appSecret, apiPath);
  const r6 = await tryRequest('HMAC, /sync gateway', `https://api-sg.aliexpress.com/sync${apiPath}`, p6, 'POST-QS');
  if (r6?.access_token || r6?.top_auth_token_create_response?.access_token) return;

  console.log('\n═══════════════════════════════════════════');
  console.log('⚠️ Ningún intento devolvió un token válido.');
  console.log('Posibles causas:');
  console.log('  1. El código ya expiró (duran ~1-3 min)');
  console.log('  2. El código ya fue usado (son de un solo uso)');
  console.log('  3. La app no tiene los permisos necesarios activados');
  console.log('═══════════════════════════════════════════');
}

main();
