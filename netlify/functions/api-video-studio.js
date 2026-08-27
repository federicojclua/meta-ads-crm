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
    const tenantFilter = isGlobal && !clientScope
      ? {}
      : { clientId: new ObjectId(clientScope) };

    // GET /api/video-studio/projects
    if (method === 'GET' && (subPath === 'projects' || subPath === '')) {
      const projects = await projectsCollection.find(tenantFilter).sort({ updatedAt: -1 }).toArray();

      if (projects.length === 0 && clientScope) {
        // Auto-seed an initial demo project
        const initialProject = {
          clientId: new ObjectId(clientScope),
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
      const body = JSON.parse(event.body || '{}');
      const targetClientId = clientScope || body.clientId;

      const profileDoc = await profilesCollection.findOne({ clientId: new ObjectId(targetClientId) });
      const brandProfile = profileDoc ? sanitizeCreativeProfile(profileDoc) : {};

      const products = await productsCollection.find({ clientId: new ObjectId(targetClientId) }).toArray();

      const result = await generateStoryboard({
        brandProfile,
        products,
        objective: body.objective || 'leads',
        angle: body.angle || 'problem_solution',
        durationSec: body.durationSec || 24,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/video-studio/generate-scene
    if (method === 'POST' && subPath === 'generate-scene') {
      const body = JSON.parse(event.body || '{}');
      const targetClientId = clientScope || body.clientId;

      const profileDoc = await profilesCollection.findOne({ clientId: new ObjectId(targetClientId) });
      const brandProfile = profileDoc ? sanitizeCreativeProfile(profileDoc) : {};

      const result = await generateNextSceneWithContinuity({
        previousScene: body.previousScene || null,
        newSceneSpec: body.newSceneSpec || {},
        brandProfile,
        modelTier: body.modelTier || 'veo-3.1-lite',
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/video-studio/continue-project
    if (method === 'POST' && subPath === 'continue-project') {
      const body = JSON.parse(event.body || '{}');
      const { projectId, prompt, durationSec } = body;

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

      const profileDoc = await profilesCollection.findOne({ clientId: projectDoc.clientId });
      const brandProfile = profileDoc ? sanitizeCreativeProfile(profileDoc) : {};

      const lastScene = projectDoc.scenes?.[projectDoc.scenes.length - 1] || null;

      const newSceneResult = await generateNextSceneWithContinuity({
        previousScene: lastScene,
        newSceneSpec: {
          blockType: 'ai_avatar',
          funnelRole: 'offer',
          durationSec: durationSec || 6,
          script: {
            speechText: prompt || 'Aprovechá la promoción disponible solo esta semana.',
            visualPrompt: 'Presenter details the financing offer with clear graphic alignment.',
            onScreenText: 'PROMO SEMANAL 🎁',
            ctaText: 'CONSULTAR AHORA',
          },
        },
        brandProfile,
      });

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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
