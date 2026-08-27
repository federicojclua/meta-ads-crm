import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { auditCreativeAsset } from './_shared/creativeEngine/brandGuardianService.js';
import { sanitizeCreativeAsset, BRAND_GUARDIAN_GATEKEEPER_THRESHOLD } from '../../models/CreativeAsset.js';

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
    .replace(/^\/?\.netlify\/functions\/api-brand-guardian\/?/, '')
    .replace(/^\/?api\/brand-guardian\/?/, '');
  const method = event.httpMethod;

  try {
    const tenantFilter = isGlobal && !clientScope
      ? {}
      : { clientId: new ObjectId(clientScope) };

    // POST /api/brand-guardian/audit-asset
    if (method === 'POST' && subPath === 'audit-asset') {
      const body = JSON.parse(event.body || '{}');
      const { asset, creativeProfile, activeOffer } = body;

      const auditResult = auditCreativeAsset({
        asset: asset || {},
        creativeProfile,
        activeOffer,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          audit: auditResult,
          threshold: BRAND_GUARDIAN_GATEKEEPER_THRESHOLD,
        }),
      };
    }

    // POST /api/brand-guardian/gatekeeper-check
    if (method === 'POST' && subPath === 'gatekeeper-check') {
      const body = JSON.parse(event.body || '{}');
      const { assetIds = [] } = body;

      const assetsCollection = db.collection('creative_assets');
      const foundAssets = await assetsCollection
        .find({
          _id: { $in: assetIds.map((id) => new ObjectId(id)) },
          ...tenantFilter,
        })
        .toArray();

      const failedAssets = foundAssets.filter(
        (a) => (Number(a.brandComplianceScore) || 0) < BRAND_GUARDIAN_GATEKEEPER_THRESHOLD || a.complianceStatus === 'REJECTED'
      );

      const isLaunchAllowed = failedAssets.length === 0;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          isLaunchAllowed,
          totalChecked: foundAssets.length,
          failedCount: failedAssets.length,
          failedAssets: failedAssets.map((a) => ({
            id: a._id.toString(),
            score: a.brandComplianceScore,
            status: a.complianceStatus,
            violations: a.violations || [],
          })),
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Brand Guardian API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
