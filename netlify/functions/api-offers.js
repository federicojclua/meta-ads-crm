import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { calculateUnitTrueProfit } from './_shared/offerEngine/profitCalculator.js';
import { generateProductOffersService } from './_shared/offerEngine/offerService.js';
import { sanitizeOfferArchitecture } from '../../models/OfferArchitecture.js';

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
  const productsCollection = db.collection('products');
  const offersCollection = db.collection('offer_architectures');

  const rawPath = event.path || '';
  const subPath = rawPath
    .replace(/^\/?\.netlify\/functions\/api-offers\/?/, '')
    .replace(/^\/?api\/offers\/?/, '');
  const method = event.httpMethod;

  try {
    const tenantFilter = isGlobal && !clientScope
      ? {}
      : { clientId: new ObjectId(clientScope) };

    // POST /api/offers/calculate-profit
    if (method === 'POST' && subPath === 'calculate-profit') {
      const body = JSON.parse(event.body || '{}');
      const profitResult = calculateUnitTrueProfit({
        price: body.price,
        costStructure: body.costStructure || {},
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, profit: profitResult }),
      };
    }

    // POST /api/offers/generate
    if (method === 'POST' && subPath === 'generate') {
      const body = JSON.parse(event.body || '{}');
      let product = body.product;

      if (!product && body.productId) {
        product = await productsCollection.findOne({
          _id: new ObjectId(body.productId),
          ...tenantFilter,
        });
      }

      if (!product) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Producto no especificado o no encontrado.' }),
        };
      }

      const generatedArchitecture = await generateProductOffersService({
        product,
        costStructure: body.costStructure || product.costStructure,
        clientId: clientScope,
        db,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, architecture: generatedArchitecture }),
      };
    }

    // GET /api/offers/product/:productId
    if (method === 'GET' && subPath.startsWith('product/')) {
      const productId = subPath.split('/')[1];
      if (!productId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'productId es requerido.' }),
        };
      }

      const doc = await offersCollection.findOne({
        productId: new ObjectId(productId),
        ...tenantFilter,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          architecture: doc ? sanitizeOfferArchitecture(doc) : null,
        }),
      };
    }

    // POST /api/offers/activate
    if (method === 'POST' && subPath === 'activate') {
      const body = JSON.parse(event.body || '{}');
      const { productId, offerId } = body;

      if (!productId || !offerId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'productId y offerId son obligatorios.' }),
        };
      }

      await offersCollection.updateOne(
        { productId: new ObjectId(productId), ...tenantFilter },
        { $set: { activeOfferId: offerId, updatedAt: new Date().toISOString() } }
      );

      await productsCollection.updateOne(
        { _id: new ObjectId(productId), ...tenantFilter },
        { $set: { 'activeOffer.offerId': offerId, updatedAt: new Date().toISOString() } }
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Oferta activada exitosamente e inyectada al Creative Profile.',
          activeOfferId: offerId,
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Offer Engine API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
