import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { sanitizeVideoProject, validateVideoProject, SAMPLE_INITIAL_SCENES } from '../../models/VideoProject.js';
import { sanitizeCreativeProfile } from '../../models/CreativeProfile.js';
import {
  generateStoryboard,
  generateNextSceneWithContinuity,
} from './_shared/creativeEngine/videoProviderRouter.js';
import { analyzeLeadWinnerPatterns } from './_shared/creativeEngine/metaAdsLaunchService.js';
import { estimateProjectCredits } from '../../models/AIUsage.js';

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

  const { db, clientScope, isGlobal, user } = authResult;
  const projectsCollection = db.collection('video_projects');
  const profilesCollection = db.collection('creative_profiles');
  const productsCollection = db.collection('products');

  const rawPath = event.path || '';
  const subPath = rawPath.replace(/^\/?\.netlify\/functions\/api-video-studio\/?/, '').replace(/^\/?api\/video-studio\/?/, '');
  const method = event.httpMethod;

  try {
    const validClientScope = clientScope && ObjectId.isValid(clientScope) ? new ObjectId(clientScope) : null;
    const tenantFilter = isGlobal && !validClientScope
      ? {}
      : (validClientScope ? { clientId: validClientScope } : { clientId: 'unassigned' });

    // GET /api/video-studio/projects
    if (method === 'GET' && (subPath === 'projects' || subPath === '')) {
      const projects = await projectsCollection.find(tenantFilter).sort({ updatedAt: -1 }).toArray();

      if (projects.length === 0) {
        // Auto-seed an initial demo project
        const seedClientId = validClientScope || (await db.collection('clients').findOne({ status: 'active' }))?._id || new ObjectId();
        const initialProject = {
          clientId: seedClientId,
          title: 'Video Ad Lead Gen — Lenovo ThinkPad',
          objective: 'leads',
          aspectRatio: '9:16',
          status: 'needs_review',
          version: 1,
          scenes: SAMPLE_INITIAL_SCENES,
          storyboardSummary: {
            totalDurationSec: 24,
            hookAngle: 'Problema & Fricción de Rendimiento',
            leadMagnetOffer: 'Financiación 12 Cuotas Fijas',
            cplOptimizationTarget: '-35% Costo por Lead con Hook de Fricción',
          },
          costEstimate: estimateProjectCredits(SAMPLE_INITIAL_SCENES, 'veo-3.1-lite'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const insertRes = await projectsCollection.insertOne(initialProject);
        initialProject._id = insertRes.insertedId;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, projects: [sanitizeVideoProject(initialProject)] }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          projects: projects.map(sanitizeVideoProject),
        }),
      };
    }

    // POST /api/video-studio/storyboard
    if (method === 'POST' && subPath === 'storyboard') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body || {};
      } catch {
        body = {};
      }

      const targetClientId = clientScope || body.clientId;
      const targetClientIdObj = targetClientId && ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : validClientScope;

      let brandProfile = {};
      let products = [];

      if (targetClientIdObj) {
        try {
          const profileDoc = await profilesCollection.findOne({ clientId: targetClientIdObj });
          if (profileDoc) {
            brandProfile = sanitizeCreativeProfile(profileDoc);
          }
        } catch (profErr) {
          console.warn('[VIDEO_STUDIO] Profile fetch fallback:', profErr.message);
        }

        try {
          products = await productsCollection.find({ clientId: targetClientIdObj }).toArray();
        } catch (prodErr) {
          console.warn('[VIDEO_STUDIO] Products fetch fallback:', prodErr.message);
        }
      }

      let result;
      try {
        result = await generateStoryboard({
          brandProfile,
          products,
          objective: body.objective || 'leads',
          angle: body.angle || 'problem_solution',
          durationSec: Number(body.durationSec) || 24,
        });
      } catch (genErr) {
        console.error('[VIDEO_STUDIO_STORYBOARD_ERROR]', genErr.message);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: `Error generando storyboard: ${genErr.message}` }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/video-studio/generate-scene
    if (method === 'POST' && subPath === 'generate-scene') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body || {};
      } catch {
        body = {};
      }

      const targetClientId = clientScope || body.clientId;
      const targetClientIdObj = targetClientId && ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : validClientScope;

      let brandProfile = {};
      if (targetClientIdObj) {
        try {
          const profileDoc = await profilesCollection.findOne({ clientId: targetClientIdObj });
          if (profileDoc) {
            brandProfile = sanitizeCreativeProfile(profileDoc);
          }
        } catch (profErr) {
          console.warn('[VIDEO_STUDIO] Profile fetch fallback:', profErr.message);
        }
      }

      let result;
      try {
        result = await generateNextSceneWithContinuity({
          previousScene: body.previousScene || null,
          newSceneSpec: body.newSceneSpec || {},
          brandProfile,
          modelTier: body.modelTier || 'veo-3.1-lite',
        });
      } catch (sceneErr) {
        console.error('[VIDEO_STUDIO_SCENE_ERROR]', sceneErr.message);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: `Error generando escena: ${sceneErr.message}` }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/video-studio/continue-project
    if (method === 'POST' && subPath === 'continue-project') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body || {};
      } catch {
        body = {};
      }
      const { projectId, prompt, durationSec } = body;

      if (!projectId || !ObjectId.isValid(projectId)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'ID de proyecto inválido o no proporcionado.' }),
        };
      }

      const projectDoc = await projectsCollection.findOne({
        _id: new ObjectId(projectId),
        ...tenantFilter,
      });

      if (!projectDoc) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Proyecto no encontrado.' }),
        };
      }

      let brandProfile = {};
      if (projectDoc.clientId && ObjectId.isValid(projectDoc.clientId)) {
        try {
          const profileDoc = await profilesCollection.findOne({ clientId: new ObjectId(projectDoc.clientId) });
          if (profileDoc) {
            brandProfile = sanitizeCreativeProfile(profileDoc);
          }
        } catch (profErr) {
          console.warn('[VIDEO_STUDIO] Profile fetch fallback:', profErr.message);
        }
      }

      const lastScene = projectDoc.scenes?.[projectDoc.scenes.length - 1] || null;

      let newSceneResult;
      try {
        newSceneResult = await generateNextSceneWithContinuity({
          previousScene: lastScene,
          newSceneSpec: {
            blockType: 'ai_avatar',
            funnelRole: 'offer',
            durationSec: Number(durationSec) || 6,
            script: {
              speechText: prompt || 'Aprovechá la promoción disponible solo esta semana.',
              visualPrompt: 'Presenter details the financing offer with clear graphic alignment.',
              onScreenText: 'PROMO SEMANAL 🎁',
              ctaText: 'CONSULTAR AHORA',
            },
          },
          brandProfile,
        });
      } catch (contErr) {
        console.error('[VIDEO_STUDIO_CONTINUE_ERROR]', contErr.message);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: `Error continuando proyecto: ${contErr.message}` }),
        };
      }

      const updatedScenes = [...(projectDoc.scenes || []), newSceneResult.scene];
      await projectsCollection.updateOne(
        { _id: projectDoc._id },
        {
          $set: {
            scenes: updatedScenes,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Escena agregada con continuidad garantizada.',
          scene: newSceneResult.scene,
          totalScenes: updatedScenes.length,
        }),
      };
    }

    // GET /api/video-studio/winner-patterns
    if (method === 'GET' && subPath === 'winner-patterns') {
      const patterns = analyzeLeadWinnerPatterns({});
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...patterns }),
      };
    }

    // GET /api/video-studio/cost-estimate
    if (method === 'GET' && subPath === 'cost-estimate') {
      const estimate = estimateProjectCredits(SAMPLE_INITIAL_SCENES, 'veo-3.1-lite');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, estimate }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Video Studio API.' }),
    };
  } catch (err) {
    console.error('[API_VIDEO_STUDIO_ERROR]', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message || 'Error interno en Video Studio.' }),
    };
  }
}
