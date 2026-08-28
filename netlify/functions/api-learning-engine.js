import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import {
  extractPerformancePatternsService,
  generateCreativeStudioPreset,
} from './_shared/learningEngine/learningEngineService.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  const authResult = await verifyAuthorizedUser(event);
  if (!authResult.authorized) {
    return {
      statusCode: authResult.statusCode || 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: authResult.error }),
    };
  }

  const { db, clientScope, isGlobal } = authResult;
  const rawPath = event.path || '';
  const subPath = rawPath
    .replace(/^\/?\.netlify\/functions\/api-learning-engine\/?/, '')
    .replace(/^\/?api\/learning-engine\/?/, '');
  const method = event.httpMethod;

  try {
    // GET /api/learning-engine/insights OR POST /api/learning-engine/sync-patterns
    if ((method === 'GET' && subPath === 'insights') || (method === 'POST' && subPath === 'sync-patterns')) {
      const result = await extractPerformancePatternsService({
        clientId: clientScope,
        db,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/learning-engine/apply-to-creative-studio
    if (method === 'POST' && subPath === 'apply-to-creative-studio') {
      const body = JSON.parse(event.body || '{}');
      const { pattern } = body;

      const preset = generateCreativeStudioPreset({ pattern });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          preset,
          message: 'Preset generado exitosamente para el Creative Studio.',
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Learning Engine API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
