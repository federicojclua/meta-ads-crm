import { ObjectId } from 'mongodb';
import { calculateUnitTrueProfit, calculateOfferVariantProfit } from './profitCalculator.js';
import { sanitizeOfferArchitecture } from '../../../../models/OfferArchitecture.js';

/**
 * Generates 3 strategic offer variations (A/B/C) based on verified True Profit arithmetic.
 */
export async function generateProductOffersService({
  product = {},
  costStructure = null,
  clientId = null,
  db = null,
} = {}) {
  const currentCosts = costStructure || product.costStructure || {
    cogs: Math.round(product.price * 0.58),
    gatewayFeePercent: 3.5,
    shippingCost: 8500,
    estimatedCpa: 32000,
    targetMinMarginPercent: 15,
  };

  const baseProfit = calculateUnitTrueProfit({
    price: product.price,
    costStructure: currentCosts,
  });

  // Calculate safe discount for Offer A
  const safeDiscountPct = Math.min(15, Math.floor(baseProfit.maxDiscountAllowedPct * 0.8));
  const offerAProfit = calculateOfferVariantProfit({
    baseProductPrice: product.price,
    discountPct: safeDiscountPct,
    addonsCost: 0,
    costStructure: currentCosts,
  });

  // Offer B: Value Bundle (Adds $6.500 in low cost bonuses, keeps full price)
  const offerBProfit = calculateOfferVariantProfit({
    baseProductPrice: product.price,
    discountPct: 0,
    addonsCost: 6500, // Cost of sleeve + digital guide
    costStructure: currentCosts,
  });

  // Offer C: Risk-Free Financing (Full price with 12 installments)
  const offerCProfit = calculateOfferVariantProfit({
    baseProductPrice: product.price,
    discountPct: 0,
    addonsCost: 3500,
    costStructure: currentCosts,
  });

  const offers = [
    {
      id: 'offer_a',
      name: 'Oferta A: Flash Sale Directo (Descuento Seguro)',
      type: 'direct_discount',
      headline: `Ahorrá un ${safeDiscountPct}% directo en tu ${product.name}`,
      coreProduct: product.name,
      valueAddons: ['Envío Express Bonificado'],
      urgencyScarcity: 'Válido solo por 48 horas o hasta agotar 10 unidades.',
      riskReversal: 'Garantía Oficial de Fábrica 1 Año.',
      paymentTerms: `${product.installments || '12 cuotas fijas'} con precio promocional.`,
      projectedPrice: offerAProfit.sellingPrice,
      projectedTrueProfit: offerAProfit.trueProfitAmount,
      projectedMarginPct: offerAProfit.trueProfitMarginPct,
      aiStrategyNotes: `Descuento optimizado del ${safeDiscountPct}% respetando el margen neto mínimo del ${currentCosts.targetMinMarginPercent}%. Ideal para campañas de retargeting rápido.`,
      isRecommended: false,
    },
    {
      id: 'offer_b',
      name: 'Oferta B: Master Bundle de Alto Valor (Recomendada)',
      type: 'value_bundle',
      headline: `Llevate el ${product.name} + Kit Ejecutivo de Regalo`,
      coreProduct: product.name,
      valueAddons: [
        'Funda Protectora Antigolpes de Neopreno (Valor $25.000)',
        'Garantía Extendida VIP 2 Años (Valor $45.000)',
        'Licencia de Productividad + Pack de Software Instalado',
      ],
      urgencyScarcity: 'Cupos limitados: Solo los primeros 15 pedidos de la semana.',
      riskReversal: '30 días de prueba sin riesgo con devolución garantizada.',
      paymentTerms: `${product.installments || '12 cuotas fijas'} al precio de lista.`,
      projectedPrice: offerBProfit.sellingPrice,
      projectedTrueProfit: offerBProfit.trueProfitAmount,
      projectedMarginPct: offerBProfit.trueProfitMarginPct,
      aiStrategyNotes: `Maximiza el True Profit ($${offerBProfit.trueProfitAmount.toLocaleString()}) agregando $70.000 en valor percibido con solo $6.500 de costo real. Convierte sin desgastar precio.`,
      isRecommended: true,
    },
    {
      id: 'offer_c',
      name: 'Oferta C: Plan Cero Riesgo & Financiación Flexible',
      type: 'risk_free_financing',
      headline: `Equipate hoy y empezá a pagar en cuotas fijas`,
      coreProduct: product.name,
      valueAddons: [
        'Asistencia y Setup Inicial Personalizado por WhatsApp',
        'Seguro Bonificado contra Accidentes por 6 Meses',
      ],
      urgencyScarcity: 'Promoción bancaria sujeta a cupo de cuotas.',
      riskReversal: 'Garantía Total de Satisfacción: Si no supera tus expectativas, te reintegramos el 100%.',
      paymentTerms: `12 cuotas fijas de $${Math.round(product.price / 12).toLocaleString()} con entrega inmediata.`,
      projectedPrice: offerCProfit.sellingPrice,
      projectedTrueProfit: offerCProfit.trueProfitAmount,
      projectedMarginPct: offerCProfit.trueProfitMarginPct,
      aiStrategyNotes: 'Elimina la fricción de desembolso inicial utilizando la psicología de cuota baja y garantía incondicional.',
      isRecommended: false,
    },
  ];

  const offerDoc = {
    clientId: clientId ? new ObjectId(clientId) : null,
    productId: product.id ? new ObjectId(product.id) : (product._id || null),
    productName: product.name,
    offers,
    activeOfferId: 'offer_b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (db && clientId && product.id) {
    const coll = db.collection('offer_architectures');
    await coll.updateOne(
      { productId: new ObjectId(product.id) },
      { $set: offerDoc },
      { upsert: true }
    );
  }

  return sanitizeOfferArchitecture(offerDoc);
}
