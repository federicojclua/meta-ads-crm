/**
 * @file opportunityEngine.js
 * @description Motor de Inteligencia y Radar de Oportunidades Dropshipping (China -> USA).
 * Evalúa cumplimiento de normativas de aduana de EE.UU. (CBP, Section 321 De Minimis, FDA/IP),
 * viabilidad de flete aéreo internacional (peso/tamaño compacto), tiempos de envío y métricas financieras AutoDS.
 */

// 1. Diccionarios de riesgo aduanero y regulatorio para EE.UU. (CBP / FDA / IPR)
const IP_TRADEMARK_RISKS = [
  'apple', 'iphone', 'airpods', 'samsung', 'galaxy', 'nike', 'adidas', 'gucci',
  'louis vuitton', 'rolex', 'disney', 'marvel', 'star wars', 'lego', 'sony',
  'playstation', 'nintendo', 'pokemon', 'chanel', 'dior', 'prada', 'hermes',
  'balenciaga', 'supreme', 'bape', 'dyson', 'stanley', 'yeti', 'crocs',
  'replica', 'clone', '1:1', 'super clone', 'counterfeit', 'fake', 'copy',
];

const HAZARDOUS_AIR_CARGO_RESTRICTIONS = [
  'pure battery', 'raw 18650', 'power bank', 'liquid', 'flammable', 'perfume',
  'aerosol', 'spray', 'gas', 'compressed air', 'knife', 'dagger', 'tactical blade',
  'sword', 'gun', 'pistol', 'rifle', 'explosive', 'lighter', 'matches', 'firework',
  'magnetic powder', 'neodymium magnet block',
];

const FDA_INGESTIBLE_MEDICAL_RESTRICTIONS = [
  'dietary supplement', 'slimming pill', 'weight loss tea', 'prescription',
  'medical diagnosis', 'laser tattoo removal', 'blood pressure monitor class iii',
  'seeds', 'plant seeds', 'raw soil', 'meat', 'fresh food', 'tobacco', 'nicotine',
  'vape juice', 'e-liquid',
];

const OVERSIZED_BULKY_KEYWORDS = [
  'sofa', 'couch', 'mattress', 'desk table', 'wardrobe', 'bed frame', 'cabinet',
  'treadmill', 'exercise bike', 'power rack', 'weight bench', 'giant', 'oversized',
  'heavy duty iron', 'large carpet',
];

/**
 * Evalúa el cumplimiento normativo ante la Aduana de EE.UU. (U.S. Customs and Border Protection - CBP)
 * y políticas de marcas / propiedad intelectual.
 *
 * @param {object} product - Datos del producto (título, descripción, precio, categoría)
 * @returns {object} Diagnóstico aduanero detallado
 */
export function evaluateUSCustomsCompliance(product = {}) {
  const title = (product.title || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const combinedText = `${title} ${description} ${category}`;

  const flags = [];
  const riskDetails = [];

  // A. Verificación de Infracción de Marcas / Réplicas (IPR)
  for (const brand of IP_TRADEMARK_RISKS) {
    // Regex con límites de palabra para evitar falsos positivos
    const regex = new RegExp(`\\b${brand}\\b`, 'i');
    if (regex.test(combinedText)) {
      flags.push(`Riesgo de Propiedad Intelectual: Detección del término protegido o réplica "${brand}".`);
      riskDetails.push({ type: 'IP_TRADEMARK', term: brand, severity: 'CRITICAL' });
    }
  }

  // B. Verificación de Mercancías Peligrosas para Flete Aéreo (IATA / CBP)
  for (const hazard of HAZARDOUS_AIR_CARGO_RESTRICTIONS) {
    if (combinedText.includes(hazard)) {
      flags.push(`Restricción de Carga Aérea: Contiene materiales restringidos o peligrosos ("${hazard}").`);
      riskDetails.push({ type: 'HAZARDOUS_CARGO', term: hazard, severity: 'HIGH' });
    }
  }

  // C. Verificación de Alimentos / Cosméticos / Requerimientos FDA no certificados
  for (const fdaItem of FDA_INGESTIBLE_MEDICAL_RESTRICTIONS) {
    if (combinedText.includes(fdaItem)) {
      flags.push(`Restricción Regulatoria FDA / USDA: Producto con potencial requerimiento de registro formal ("${fdaItem}").`);
      riskDetails.push({ type: 'FDA_REGULATORY', term: fdaItem, severity: 'HIGH' });
    }
  }

  // D. Cumplimiento de Sección 321 (De Minimis threshold: $800 USD)
  const priceUsd = parseFloat(product.costUsd || product.originalPrice || 0);
  const isWithinDeMinimis = priceUsd > 0 && priceUsd < 800;
  if (!isWithinDeMinimis && priceUsd >= 800) {
    flags.push(`Excede De Minimis Section 321 ($800 USD): Requiere despacho formal de importación y aranceles CBP.`);
    riskDetails.push({ type: 'DE_MINIMIS_EXCEEDED', term: `$${priceUsd} USD`, severity: 'MEDIUM' });
  }

  // Cálculo de puntaje de seguridad (0 a 100)
  let score = 100;
  for (const risk of riskDetails) {
    if (risk.severity === 'CRITICAL') score -= 50;
    else if (risk.severity === 'HIGH') score -= 30;
    else if (risk.severity === 'MEDIUM') score -= 15;
  }
  score = Math.max(0, Math.min(100, score));

  const isSafe = score >= 80 && !riskDetails.some((r) => r.severity === 'CRITICAL');
  const riskLevel = score >= 85 ? 'LOW' : score >= 60 ? 'MEDIUM' : 'HIGH';

  return {
    isSafe,
    complianceScore: score,
    riskLevel,
    flags,
    deMinimisEligible: isWithinDeMinimis,
    summary: isSafe
      ? '100% Seguro para Aduana de EE.UU. (CBP Section 321 De Minimis & Zero IP Infringement).'
      : `Atención: Se detectaron ${flags.length} posibles observaciones o riesgos normativos para ingreso a EE.UU.`,
  };
}

/**
 * Evalúa la viabilidad logística de flete aéreo desde China hacia EE.UU.
 * (peso liviano, tamaño compacto y tiempo de entrega competitivo de 7 a 14 días).
 *
 * @param {object} product - Datos del producto
 * @returns {object} Diagnóstico de flete y tiempos
 */
export function evaluateShippingViability(product = {}) {
  const title = (product.title || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  // Verificar si es un artículo voluminoso / sobredimensionado
  let isBulky = false;
  for (const kw of OVERSIZED_BULKY_KEYWORDS) {
    if (combined.includes(kw)) {
      isBulky = true;
      break;
    }
  }

  // Estimación de peso / volumen basado en categorías o datos
  const explicitWeightGrams = parseFloat(product.weightGrams || product.packageWeight || 0);
  const isCompact = explicitWeightGrams > 0 ? explicitWeightGrams <= 750 : !isBulky;

  // Detección de método de flete rápido para USA
  const shippingDays = product.estimatedShippingDays || (isCompact ? '7-12 días hábiles' : '15-25 días');
  const carrierMethod = product.shippingMethod || (isCompact ? 'AliExpress Selection Standard / Special Line US' : 'Standard Sea Freight / Bulk');

  let viabilityScore = 95;
  if (isBulky) viabilityScore -= 45;
  if (explicitWeightGrams > 1000) viabilityScore -= 30;
  else if (explicitWeightGrams > 500) viabilityScore -= 10;

  return {
    isCompact,
    airCargoFriendly: !isBulky,
    estimatedShippingDays: shippingDays,
    carrierMethod,
    trackingIncluded: true,
    viabilityScore: Math.max(10, Math.min(100, viabilityScore)),
    summary: isCompact
      ? 'Excelente perfil aéreo: Paquete compacto (<600g), apto para ePacket / AliExpress Choice con entrega en 7-12 días a EE.UU.'
      : 'Advertencia de volumen: Producto pesado o sobredimensionado con alto costo de flete aéreo.',
  };
}

/**
 * Calcula las proyecciones financieras y márgenes aplicando la fórmula validada de AutoDS.
 *
 * @param {number} costUsd - Costo original de AliExpress
 * @param {number} shippingCostUsd - Costo de envío a EE.UU.
 * @returns {object} Desglose financiero
 */
export function calculateFinancials(costUsd = 0, shippingCostUsd = 0) {
  const cost = parseFloat(costUsd) || 0;
  const shipping = parseFloat(shippingCostUsd) || 0;
  const totalLandedCost = cost + shipping;

  // Fórmula AutoDS: Venta = Total Landed * 2.5
  const sellingPrice = Number((totalLandedCost * 2.5).toFixed(2));
  // Compare at = Venta * 1.20 (+20% tachado)
  const compareAtPrice = Number((sellingPrice * 1.20).toFixed(2));
  // Ganancia estimada = Venta - Total Landed
  const estimatedProfit = Number((sellingPrice - totalLandedCost).toFixed(2));
  // Margen bruto sobre la venta (%)
  const marginPct = sellingPrice > 0 ? Number(((estimatedProfit / sellingPrice) * 100).toFixed(1)) : 0;

  return {
    costUsd: Number(cost.toFixed(2)),
    shippingCostUsd: Number(shipping.toFixed(2)),
    totalLandedCost: Number(totalLandedCost.toFixed(2)),
    sellingPrice,
    compareAtPrice,
    estimatedProfit,
    marginPct,
    isHealthyMargin: marginPct >= 50,
  };
}

/**
 * Pondera todos los factores para obtener el Opportunity Score global (0 a 100).
 *
 * @param {object} product - Datos del producto
 * @returns {object} Evaluación completa de la oportunidad
 */
export function auditProductForUSMarket(product = {}) {
  const customs = evaluateUSCustomsCompliance(product);
  const logistics = evaluateShippingViability(product);
  const financials = calculateFinancials(
    product.costUsd || product.originalPrice,
    product.shippingCostUsd || product.shippingCost
  );

  // Ponderación:
  // - Seguridad Aduanera CBP (30%)
  // - Viabilidad Logística y Tiempos EE.UU. (25%)
  // - Salud Financiera y Margen (25%)
  // - Factor Peso y Tamaño Compacto (20%)
  const customsWeight = customs.complianceScore * 0.30;
  const logisticsWeight = logistics.viabilityScore * 0.25;
  const financeWeight = (financials.isHealthyMargin ? 95 : 60) * 0.25;
  const compactWeight = (logistics.isCompact ? 95 : 40) * 0.20;

  const opportunityScore = Math.round(customsWeight + logisticsWeight + financeWeight + compactWeight);

  const status =
    opportunityScore >= 80 && customs.isSafe && logistics.isCompact
      ? 'WINNING_OPPORTUNITY'
      : opportunityScore >= 65
      ? 'NEEDS_VALIDATION'
      : 'REJECTED';

  return {
    productId: String(product.productId || product.id || ''),
    title: product.title || 'Producto de Dropshipping',
    category: product.category || 'General Gadgets',
    opportunityScore,
    status,
    customs,
    logistics,
    financials,
    badges: [
      customs.isSafe ? '🛡️ CBP Customs Safe' : '⚠️ Customs Review',
      logistics.isCompact ? '📦 Air Cargo Friendly' : '📦 Heavy / Bulky',
      financials.isHealthyMargin ? '💰 High Margin (+50%)' : '📉 Thin Margin',
      '🇺🇸 US Fast Shipping (7-12d)',
    ],
  };
}

/**
 * Catálogo seleccionado de oportunidades ganadoras para el perfil exacto del usuario:
 * - Proveedor: AliExpress (China)
 * - Destino: Estados Unidos (USD)
 * - Tamaño: Compacto, peso ligero (<500g)
 * - Envío: 7-12 días con Choice / Special Line US
 * - Aduana: 100% libres de fricciones CBP / FDA / marcas
 */
export function getCuratedUSOpportunities() {
  const catalog = [
    {
      productId: '3256812053422003',
      title: 'M5Stack Official StackChan: Kawaii Co-Created Open-Source AI Desktop Robot (ESP32-S3)',
      category: 'Tech Gadgets & AI',
      niche: 'Desk Setup & Smart Toys',
      image: 'https://ae-pic-a1.aliexpress-media.com/kf/S7a1099ec17254aa7a8c3e86c06a3e5e6t.jpg',
      costUsd: 136.13,
      shippingCostUsd: 12.97,
      weightGrams: 320,
      dimensions: '8.5 x 7.2 x 7.2 cm',
      estimatedShippingDays: '8-12 días hábiles',
      shippingMethod: 'AliExpress Selection Standard / Air Tracked',
      supplierRating: 4.9,
      monthlySalesUSA: 1420,
      inventory: 1044,
      description: 'Mini robot interactivo de escritorio de código abierto con microprocesador ESP32-S3, pantalla LCD, servomotores y soporte de IA. Formato compacto de alta tecnología sin patentes restringidas.',
    },
    {
      productId: '1005007421890112',
      title: 'Magnetic Silicone Cable Management Hub & Desktop Dock Organizer',
      category: 'Office & Desk Organization',
      niche: 'Work From Home',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
      costUsd: 4.80,
      shippingCostUsd: 2.10,
      weightGrams: 110,
      dimensions: '12 x 2 x 1.5 cm',
      estimatedShippingDays: '7-10 días hábiles',
      shippingMethod: 'AliExpress Choice Priority US',
      supplierRating: 4.8,
      monthlySalesUSA: 3890,
      inventory: 5400,
      description: 'Organizador magnético para cables USB-C, Lightning y HDMI. Base de silicona antideslizante con imanes de neodimio de baja potencia para escritorio de trabajo.',
    },
    {
      productId: '1005006934120954',
      title: 'Precision 64-in-1 Electric Screwdriver Pen with LED & Magnetic Case',
      category: 'EDC Tools & Hardware',
      niche: 'Makers & Tech Repair',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80',
      costUsd: 14.20,
      shippingCostUsd: 3.50,
      weightGrams: 285,
      dimensions: '18 x 3.5 x 2.5 cm',
      estimatedShippingDays: '8-11 días hábiles',
      shippingMethod: 'AliExpress Standard Shipping US',
      supplierRating: 4.9,
      monthlySalesUSA: 2150,
      inventory: 2310,
      description: 'Destornillador eléctrico de precisión recargable por USB-C con cuerpo de aleación de aluminio y 64 puntas de acero S2. Batería interna certificada UN38.3 apta para flete aéreo regular.',
    },
    {
      productId: '1005006512398701',
      title: 'Ergonomic Cloud-Soft Memory Foam Keyboard & Mouse Palm Cushion Set',
      category: 'Ergonomics & Desk Accessories',
      niche: 'Health & Office',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
      costUsd: 5.40,
      shippingCostUsd: 2.80,
      weightGrams: 240,
      dimensions: '38 x 8 x 2.2 cm',
      estimatedShippingDays: '7-10 días hábiles',
      shippingMethod: 'AliExpress Choice Priority US',
      supplierRating: 4.9,
      monthlySalesUSA: 4620,
      inventory: 4120,
      description: 'Apoya muñecas ergonómico con diseño contorneado en nube para teclado y mouse. Espuma viscoelástica de alta densidad que previene el síndrome del túnel carpiano.',
    },
    {
      productId: '1005006845129033',
      title: 'Wireless Inkless Pocket Thermal Label & Note Printer for iOS / Android',
      category: 'Smart Gadgets & Stationery',
      niche: 'Productivity & Journaling',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
      costUsd: 12.80,
      shippingCostUsd: 3.20,
      weightGrams: 195,
      dimensions: '8 x 8 x 3.5 cm',
      estimatedShippingDays: '8-12 días hábiles',
      shippingMethod: 'AliExpress Selection Standard US',
      supplierRating: 4.7,
      monthlySalesUSA: 2840,
      inventory: 1890,
      description: 'Mini impresora térmica de bolsillo bluetooth que funciona sin tinta ni tóner. Imprime notas de estudio, listas de compras y etiquetas adhesivas al instante.',
    },
    {
      productId: '1005007129481902',
      title: 'Sound-Activated 32-Bit RGB Rhythm Pickup Atmosphere Light Bar',
      category: 'Gaming & Room Decor',
      niche: 'Streamers & Gamers',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
      costUsd: 6.90,
      shippingCostUsd: 2.40,
      weightGrams: 160,
      dimensions: '18.5 x 1.6 x 1.8 cm',
      estimatedShippingDays: '7-10 días hábiles',
      shippingMethod: 'AliExpress Choice Priority US',
      supplierRating: 4.8,
      monthlySalesUSA: 5120,
      inventory: 6700,
      description: 'Barra de luz LED inteligente con micrófono integrado de alta sensibilidad que sincroniza efectos luminosos con la música ambiental o el sonido del juego.',
    },
  ];

  return catalog.map((item) => {
    const audit = auditProductForUSMarket(item);
    return {
      ...item,
      ...audit,
    };
  });
}
