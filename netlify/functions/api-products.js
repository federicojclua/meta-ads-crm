import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  validateProduct,
  sanitizeProduct,
  SEED_SAMPLE_PRODUCTS,
} from '../../models/Product.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { db, clientScope, isGlobal } = auth;
  const path = event.path || '';
  const cleanPath = path
    .replace(/^\/?\.netlify\/functions\/api-products\/?/, '')
    .replace(/^\/?api\/products\/?/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const method = event.httpMethod;

  const targetClientId = isGlobal
    ? ((event.queryStringParameters || {}).clientId || clientScope)
    : clientScope;

  if (!targetClientId) {
    return errorResponse(400, 'clientId es requerido.', 'CLIENT_ID_REQUIRED');
  }

  const clientIdObj = ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId;
  const productsCollection = db.collection('products');

  try {
    // ----------------------------------------------------
    // 1. GET /api/products (List Catalog)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      let products = await productsCollection.find({ clientId: clientIdObj, active: { $ne: false } }).toArray();

      // Seed default demo products if collection is empty
      if (products.length === 0) {
        const seeded = SEED_SAMPLE_PRODUCTS.map((p) => ({
          ...p,
          clientId: clientIdObj,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await productsCollection.insertMany(seeded);
        products = await productsCollection.find({ clientId: clientIdObj, active: { $ne: false } }).toArray();
      }

      return jsonResponse(200, {
        ok: true,
        products: products.map(sanitizeProduct),
      });
    }

    // ----------------------------------------------------
    // 2. POST /api/products (Create Product)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const newProductData = {
        clientId: clientIdObj,
        name: (body.name || '').trim(),
        sku: (body.sku || '').trim(),
        category: (body.category || 'General').trim(),
        description: (body.description || '').trim(),
        price: Number(body.price) || 0,
        previousPrice: Number(body.previousPrice) || 0,
        discount: Number(body.discount) || 0,
        installments: body.installments || '12 cuotas fijas',
        imageUrl: (body.imageUrl || '').trim() || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=80',
        features: Array.isArray(body.features) ? body.features : [],
        tags: Array.isArray(body.tags) ? body.tags : [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = validateProduct(newProductData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const insertRes = await productsCollection.insertOne(newProductData);

      return jsonResponse(201, {
        ok: true,
        product: sanitizeProduct({ _id: insertRes.insertedId, ...newProductData }),
      });
    }

    // ----------------------------------------------------
    // 3. PUT /api/products/:id (Update Product)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'PUT') {
      const productId = segments[0];
      const prodQuery = {
        clientId: clientIdObj,
        ...(ObjectId.isValid(productId) ? { _id: new ObjectId(productId) } : { id: productId }),
      };

      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const updateData = {
        ...(body.name && { name: body.name.trim() }),
        ...(body.sku !== undefined && { sku: body.sku.trim() }),
        ...(body.category && { category: body.category.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.previousPrice !== undefined && { previousPrice: Number(body.previousPrice) }),
        ...(body.discount !== undefined && { discount: Number(body.discount) }),
        ...(body.installments && { installments: body.installments }),
        ...(body.imageUrl && { imageUrl: body.imageUrl }),
        ...(Array.isArray(body.features) && { features: body.features }),
        ...(Array.isArray(body.tags) && { tags: body.tags }),
        updatedAt: new Date(),
      };

      await productsCollection.updateOne(prodQuery, { $set: updateData });
      const updated = await productsCollection.findOne(prodQuery);

      if (!updated) {
        return errorResponse(404, 'Producto no encontrado.', 'PRODUCT_NOT_FOUND');
      }

      return jsonResponse(200, {
        ok: true,
        product: sanitizeProduct(updated),
      });
    }

    // ----------------------------------------------------
    // 4. DELETE /api/products/:id (Deactivate)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'DELETE') {
      const productId = segments[0];
      const prodQuery = {
        clientId: clientIdObj,
        ...(ObjectId.isValid(productId) ? { _id: new ObjectId(productId) } : { id: productId }),
      };

      await productsCollection.updateOne(prodQuery, { $set: { active: false, updatedAt: new Date() } });

      return jsonResponse(200, {
        ok: true,
        message: 'Producto desactivado exitosamente.',
      });
    }

    return errorResponse(404, 'Ruta de Productos no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_PRODUCTS_ERROR]', err);
    return errorResponse(500, 'Error interno procesando catálogo de productos.', 'INTERNAL_SERVER_ERROR');
  }
}
