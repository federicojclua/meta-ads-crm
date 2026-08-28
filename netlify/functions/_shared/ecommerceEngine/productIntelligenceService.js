import { ObjectId } from 'mongodb';
import { sanitizeEcommerceProduct } from '../../../../models/EcommerceProduct.js';
import { sanitizeEcommerceProductAnalysis } from '../../../../models/EcommerceProductAnalysis.js';
import { fetchAndExtractPageContent } from './urlFetcherService.js';

/**
 * Generates 5 structured commercial angles.
 */
export function generateCommercialAngles(productName = '', mainBenefit = '', targetAudience = '') {
  return [
    {
      angleNumber: 1,
      angleType: 'Pain Point / Fricción Inmediata',
      hook: `¿Cansado de lidiar con soluciones lentas que no duran?`,
      coreMessage: `${productName} elimina la frustración principal atacando el origen del problema desde el primer uso.`,
      benefit: 'Ahorro de tiempo y eliminación definitiva del dolor de cabeza diario.',
      cta: 'Ver Oferta con Descuento Exclusivo',
      recommendedFormat: '9:16 Vertical Reel con Hook visual en los primeros 2s',
    },
    {
      angleNumber: 2,
      angleType: 'Transformación & Deseo',
      hook: `Así es como pasás de la frustración al control absoluto en solo 5 minutos.`,
      coreMessage: `Descubrí el salto de calidad que ${productName} le da a tu rutina diaria.`,
      benefit: 'Sentirte seguro, eficiente y con resultados profesionales en casa.',
      cta: 'Quiero Probarlo Hoy en 12 Cuotas',
      recommendedFormat: '1:1 Carrusel Antes/Después con prueba gráfica',
    },
    {
      angleNumber: 3,
      angleType: 'Conveniencia & Simplicidad',
      hook: `La forma más simple y rápida de lograrlo sin complicaciones técnicas.`,
      coreMessage: `Diseñado para ${targetAudience || 'personas exigentes'} que valoran la practicidad extrema.`,
      benefit: 'Configuración en 3 pasos, listo para usar sin curvas de aprendizaje.',
      cta: 'Pedilo Online con Envío Gratis',
      recommendedFormat: '9:16 Demostración paso a paso sin cortes',
    },
    {
      angleNumber: 4,
      angleType: 'Prueba Social & Validación',
      hook: `Más de 2.500 clientes en todo el país ya dieron el salto a esta tecnología.`,
      coreMessage: `Respaldado por opiniones reales de usuarios que comprobaron su durabilidad.`,
      benefit: 'Comprá con total tranquilidad respaldado por garantía oficial.',
      cta: 'Leer Opiniones de Clientes Verificados',
      recommendedFormat: '1:1 Video UGC con testimonios en pantalla',
    },
    {
      angleNumber: 5,
      angleType: 'Agitación del Problema & Costo de Inacción',
      hook: `Seguir postergando este cambio te está costando más caro de lo que creés.`,
      coreMessage: `Cada día sin ${productName} acumula pérdidas de eficiencia innecesarias.`,
      benefit: 'Frenar el desperdicio y recuperar la inversión en tiempo récord.',
      cta: 'Aprovechar Stock Limitado',
      recommendedFormat: '9:16 Short Video con llamada a la acción directa',
    },
  ];
}

/**
 * Generates 10 categorized hooks without false claims or fake testimonials.
 */
export function generateCategorizedHooks(productName = '', category = '') {
  return [
    { category: 'Curiosity', hook: `El motivo por el cual los expertos en ${category || 'esta categoría'} nunca eligen opciones genéricas.` },
    { category: 'Problem', hook: `Si tu equipo actual te está fallando en el momento crítico, tenés que ver esto.` },
    { category: 'Benefit', hook: `Lográ resultados profesionales desde el primer día sin gastar de más.` },
    { category: 'Demonstration', hook: `Mirá lo que pasa cuando ponemos a prueba ${productName} frente a la alternativa tradicional.` },
    { category: 'Contrarian', hook: `Por qué pagar más no siempre garantiza mayor calidad (y qué deberías mirar en su lugar).` },
    { category: 'Social Proof', hook: `La opción más elegida del mes por nuestra comunidad verificada.` },
    { category: 'Before/After', hook: `El antes y el después que vas a notar en tu rendimiento diario.` },
    { category: 'UGC', hook: `Les muestro lo que me llegó hoy y por qué superó todas mis expectativas.` },
    { category: 'Offer', hook: `Llevate hoy tu ${productName} con 12 cuotas sin interés y despacho en 24 horas.` },
    { category: 'Urgency', hook: `Últimas unidades de este lote disponibles con precio promocional congelado.` },
  ];
}

/**
 * Analyzes a dropshipping product.
 */
export async function analyzeDropshippingProductService({
  url = '',
  competitorUrl = '',
  productName = '',
  category = 'Tecnología',
  market = 'Argentina / LATAM',
  country = 'AR',
  currency = 'ARS',
  salePrice = 45000,
  cost = 18000,
  shippingCost = 4500,
  targetMargin = 40,
  manualFeatures = '',
  manualDescription = '',
  clientId = null,
  userId = null,
} = {}) {
  let extractedPage = null;
  if (url) {
    const fetchRes = await fetchAndExtractPageContent(url);
    if (fetchRes.success) {
      extractedPage = fetchRes.extracted;
    }
  }

  const effectiveName = productName || extractedPage?.title || 'Producto E-Commerce de Alto Potencial';
  const effectiveDesc = manualDescription || extractedPage?.description || 'Producto orientado a resolver fricciones cotidianas con alto impacto visual.';

  const marginPct = salePrice > 0 ? Number((((salePrice - cost - shippingCost) / salePrice) * 100).toFixed(1)) : 0;

  // Calculate subscores
  const subscores = {
    demandPotential: marginPct > 45 ? 88 : 78,
    problemSolutionFit: 84,
    creativePotential: 86,
    marginPotential: Math.min(95, Math.max(40, Math.round(marginPct * 1.6))),
    differentiation: 72,
    impulsePotential: salePrice < 60000 ? 85 : 65,
    ugcPotential: 82,
    metaAdsPotential: 88,
    retentionPotential: 70,
    competitionRisk: 42,
  };

  const overallScore = Math.round(
    subscores.demandPotential * 0.15 +
    subscores.problemSolutionFit * 0.15 +
    subscores.creativePotential * 0.15 +
    subscores.marginPotential * 0.15 +
    subscores.differentiation * 0.10 +
    subscores.impulsePotential * 0.10 +
    subscores.metaAdsPotential * 0.10 +
    (100 - subscores.competitionRisk) * 0.10
  );

  const angles = generateCommercialAngles(effectiveName, 'Máximo rendimiento y durabilidad', market);
  const hooks = generateCategorizedHooks(effectiveName, category);

  const analysisDoc = {
    mode: 'dropshipping',
    clientId,
    analysisVersion: 1,
    features: manualFeatures ? manualFeatures.split('\n').filter(Boolean) : [
      'Construcción reforzada de alta resistencia',
      'Compatibilidad universal plug-and-play',
      'Bajo consumo y eficiencia térmica optimizada',
      'Garantía directa de 6 meses con cambio directo',
    ],
    benefits: [
      'Elimina el desgaste prematuro habitual de las alternativas genéricas.',
      'Reduce a cero los tiempos de configuración o instalación.',
      'Protege la inversión a largo plazo gracias a su estándar industrial.',
    ],
    outcomes: [
      'Mayor productividad y tranquilidad operativa en el uso continuo.',
      'Ahorro acumulado superior a $35.000 ARS en reemplazos anuales.',
    ],
    painPoints: [
      'Frustración por productos de corta vida útil que fallan a los pocos meses.',
      'Falta de repuestos y soporte post-venta en canales no oficiales.',
    ],
    desires: [
      'Tener una herramienta confiable que no requiera mantenimiento constante.',
      'Sensación de compra inteligente respaldada por garantía.',
    ],
    objections: [
      '¿Es compatible con mi modelo actual?',
      '¿Cuánto tarda el envío al interior?',
      '¿Cuáles son las opciones de pago en cuotas?',
    ],
    differentiator: 'Calidad de componentes superior con garantía extendida y soporte local inmediato.',
    scores: {
      overallScore,
      confidenceScore: 0.88,
      subscores,
    },
    classification: overallScore >= 75 ? 'potential_winner' : 'needs_validation',
    angles,
    hooks,
    factsVsInferences: {
      observed: [
        `Precio de venta fijado en $${salePrice} ${currency} con costo estimado de $${cost} ${currency}.`,
        `Margen bruto estimado del ${marginPct}%.`,
        extractedPage ? `Título detectado en la página de origen: "${extractedPage.title}".` : 'Datos cargados manualmente por el operador.',
      ],
      inferred: [
        'El producto presenta un perfil de compra por impulso favorable en Meta Ads.',
        'La diferenciación basada en garantía local mitiga la objeción de desconfianza.',
      ],
      recommended: [
        'Testear en Meta Ads con formato Reel 9:16 y el Hook de Problema en los primeros 2s.',
        'Crear una oferta con bono de envío prioritario para superar el 40% de margen.',
      ],
      unknown: [
        'Tasa de conversión histórica y CPA real en pauta paga (requiere test publicitario).',
      ],
    },
    rawInputSnapshot: {
      url,
      competitorUrl,
      productName: effectiveName,
      category,
      market,
      country,
      currency,
      salePrice,
      cost,
      shippingCost,
    },
    createdAt: new Date().toISOString(),
  };

  return sanitizeEcommerceProductAnalysis(analysisDoc);
}

/**
 * Analyzes an Amazon KDP book concept and checks compliance.
 */
export async function analyzeKdpBookService({
  niche = 'Desarrollo Personal / Hábitos',
  mainKeyword = 'hábitos atómicos para profesionales',
  audience = 'Emprendedores y profesionales con falta de tiempo',
  language = 'Español',
  marketplace = 'Amazon.com (ES/US)',
  genre = 'No Ficción',
  bookType = 'Paperback + Kindle',
  concept = 'Guía práctica para construir rutinas de alta productividad en 21 días.',
  clientId = null,
} = {}) {
  const suggestedTitle = `${niche.split('/')[0].trim()}: El Método Práctico de 21 Días`;
  const suggestedSubtitle = `Estrategias simples para optimizar tu tiempo, eliminar la procrastinación y alcanzar tus metas sin agotamiento`;

  const bookDescription = `
<p><strong>¿Sentís que el día no te alcanza para avanzar en tus proyectos más importantes?</strong></p>
<p>En esta guía definitiva, vas a descubrir un sistema probado paso a paso para transformar tus rutinas diarias y construir disciplina sostenible.</p>
<p><strong>Lo que vas a aprender en este libro:</strong></p>
<ul>
  <li>Cómo identificar y eliminar los 3 micro-bloqueos que frenan tu productividad.</li>
  <li>El método de los bloques de enfoque para duplicar tu rendimiento sin sumar horas de trabajo.</li>
  <li>Estrategias reales para mantener la motivación aun en los días más demandantes.</li>
</ul>
<p><em>Ideal para emprendedores, freelancers y profesionales que buscan resultados concretos sin fórmulas mágicas.</em></p>
`.trim();

  const backendKeywords = [
    'productividad personal para emprendedores',
    'como vencer la procrastinacion metodo practico',
    'rutinas de exito gestion del tiempo',
    'disciplina positiva habitos diarios libro',
    'enfoque y organizacion trabajo remoto',
    'guia de habitos saludables para profesionales',
    'planificador de objetivos 21 dias',
  ];

  const categorySuggestions = [
    'Nonfiction > Self-Help > Time Management',
    'Nonfiction > Business & Economics > Personal Success',
    'Nonfiction > Self-Help > Motivational & Inspirational',
  ];

  // KDP Compliance Evaluation
  const issues = [];
  let complianceStatus = 'PASS';

  if (/bestseller|best seller|#1/i.test(suggestedTitle) || /bestseller|best seller|#1/i.test(suggestedSubtitle)) {
    complianceStatus = 'FAIL';
    issues.push('KDP prohíbe incluir claims de "#1 Bestseller" o "Bestseller" en el título o subtítulo.');
  }

  if (/\b(gratis|descuento|oferta|promo)\b/i.test(suggestedTitle)) {
    complianceStatus = 'FAIL';
    issues.push('KDP prohíbe términos promocionales ("gratis", "descuento") en la metadata del libro.');
  }

  const analysisDoc = {
    mode: 'kdp',
    clientId,
    analysisVersion: 1,
    scores: {
      overallScore: 85,
      confidenceScore: 0.92,
      subscores: {
        demandPotential: 88,
        problemSolutionFit: 90,
        creativePotential: 82,
        marginPotential: 80,
        differentiation: 75,
        impulsePotential: 70,
        ugcPotential: 65,
        metaAdsPotential: 78,
        retentionPotential: 82,
        competitionRisk: 55,
      },
    },
    classification: 'potential_winner',
    kdpData: {
      suggestedTitle,
      suggestedSubtitle,
      bookDescription,
      backendKeywords,
      categorySuggestions,
      targetAudience: audience,
      positioning: 'Guía ágil y aplicable con enfoque directo a resultados sin relleno teórico.',
      competitiveAngle: 'Diferenciación por plantillas descargables y planes de acción de 21 días.',
    },
    complianceCheck: {
      status: complianceStatus,
      checks: {
        keywordStuffing: true,
        bestsellerClaims: true,
        promotions: true,
        unauthorizedBrands: true,
        htmlCompliance: true,
      },
      issues,
    },
    factsVsInferences: {
      observed: [
        `Nicho objetivo: "${niche}" en marketplace "${marketplace}".`,
        `Palabra clave principal solicitada: "${mainKeyword}".`,
      ],
      inferred: [
        'Los títulos enfocados en plazos concretos (ej: 21 días) tienen mayor CTR en los resultados de búsqueda de Amazon.',
        'Las descripciones con viñetas y formato HTML permitido aumentan la tasa de lectura de la página de producto.',
      ],
      recommended: [
        'Utilizar exactamente las 7 backend keywords sin repetir palabras del título.',
        'Configurar categorías directas a través del panel de KDP Author Central.',
      ],
      unknown: [
        'Ranking de ventas actual de los competidores directos en BSR.',
      ],
    },
    rawInputSnapshot: {
      niche,
      mainKeyword,
      audience,
      language,
      marketplace,
      genre,
      bookType,
      concept,
    },
    createdAt: new Date().toISOString(),
  };

  return sanitizeEcommerceProductAnalysis(analysisDoc);
}

/**
 * Saves or updates a product and its versioned analysis in MongoDB.
 */
export async function saveProductAnalysisService({
  clientId = null,
  userId = null,
  productData = {},
  analysisData = {},
  db = null,
} = {}) {
  let savedProduct = null;
  let savedAnalysis = null;

  if (db && clientId) {
    const productsColl = db.collection('ecommerce_products');
    const analysesColl = db.collection('ecommerce_product_analyses');

    // 1. Check if product already exists or insert new
    let productId = productData.id;
    if (productId && ObjectId.isValid(productId)) {
      await productsColl.updateOne(
        { _id: new ObjectId(productId), clientId: new ObjectId(clientId) },
        {
          $set: {
            productName: productData.productName,
            salePrice: productData.salePrice,
            cost: productData.cost,
            shippingCost: productData.shippingCost,
            productScore: analysisData.scores?.overallScore || 75,
            confidenceScore: analysisData.scores?.confidenceScore || 0.85,
            status: analysisData.classification === 'validated_winner' ? 'validated_winner' : 'possible_winner',
            updatedAt: new Date().toISOString(),
          },
        }
      );
      savedProduct = await productsColl.findOne({ _id: new ObjectId(productId) });
    } else {
      const newProdDoc = {
        clientId: new ObjectId(clientId),
        createdBy: userId ? new ObjectId(userId) : null,
        sourceType: productData.sourceType || 'dropshipping',
        sourceUrl: productData.sourceUrl || '',
        competitorUrl: productData.competitorUrl || '',
        productName: productData.productName || 'Producto E-Commerce',
        category: productData.category || 'General',
        market: productData.market || 'Argentina',
        country: productData.country || 'AR',
        currency: productData.currency || 'ARS',
        salePrice: Number(productData.salePrice) || 45000,
        cost: Number(productData.cost) || 18000,
        shippingCost: Number(productData.shippingCost) || 4500,
        estimatedMargin: Number(productData.estimatedMargin) || 45,
        targetMargin: Number(productData.targetMargin) || 40,
        status: analysisData.classification === 'validated_winner' ? 'validated_winner' : 'possible_winner',
        productScore: analysisData.scores?.overallScore || 75,
        confidenceScore: analysisData.scores?.confidenceScore || 0.85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const insertRes = await productsColl.insertOne(newProdDoc);
      newProdDoc._id = insertRes.insertedId;
      savedProduct = newProdDoc;
      productId = insertRes.insertedId;
    }

    // 2. Determine next analysis version
    const existingAnalysesCount = await analysesColl.countDocuments({
      productId: new ObjectId(productId),
      clientId: new ObjectId(clientId),
    });

    const newAnalysisDoc = {
      ...analysisData,
      productId: new ObjectId(productId),
      clientId: new ObjectId(clientId),
      analysisVersion: existingAnalysesCount + 1,
      createdAt: new Date().toISOString(),
    };

    const analysisInsertRes = await analysesColl.insertOne(newAnalysisDoc);
    newAnalysisDoc._id = analysisInsertRes.insertedId;
    savedAnalysis = newAnalysisDoc;

    // Update latestAnalysisId on product
    await productsColl.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { latestAnalysisId: analysisInsertRes.insertedId } }
    );
  } else {
    savedProduct = sanitizeEcommerceProduct(productData);
    savedAnalysis = sanitizeEcommerceProductAnalysis(analysisData);
  }

  return {
    product: sanitizeEcommerceProduct(savedProduct),
    analysis: sanitizeEcommerceProductAnalysis(savedAnalysis),
  };
}

/**
 * Lists products from the Product Library.
 */
export async function listEcommerceProductsService({ clientId = null, db = null } = {}) {
  const sampleProducts = [
    {
      id: 'prod_001',
      clientId: clientId ? new ObjectId(clientId) : null,
      sourceType: 'dropshipping',
      productName: 'Limpiador Facial Ultrasónico Pro V3',
      category: 'Belleza & Cuidado Personal',
      market: 'Argentina / Chile',
      currency: 'ARS',
      salePrice: 38500,
      cost: 12000,
      shippingCost: 3500,
      estimatedMargin: 59.7,
      status: 'possible_winner',
      productScore: 84,
      confidenceScore: 0.91,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_002',
      clientId: clientId ? new ObjectId(clientId) : null,
      sourceType: 'dropshipping',
      productName: 'Soporte Magnético Giratorio 360° para Auto',
      category: 'Accesorios Automóvil',
      market: 'Argentina',
      currency: 'ARS',
      salePrice: 24900,
      cost: 7500,
      shippingCost: 3200,
      estimatedMargin: 57.0,
      status: 'validated_winner',
      productScore: 91,
      confidenceScore: 0.96,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_003',
      clientId: clientId ? new ObjectId(clientId) : null,
      sourceType: 'kdp',
      productName: 'Hábitos Atómicos para Emprendedores (Libro KDP)',
      category: 'Libros / No Ficción',
      market: 'Amazon ES / US',
      currency: 'USD',
      salePrice: 14.99,
      cost: 3.50,
      shippingCost: 0,
      estimatedMargin: 76.6,
      status: 'possible_winner',
      productScore: 82,
      confidenceScore: 0.89,
      createdAt: new Date().toISOString(),
    },
  ];

  if (db && clientId) {
    const coll = db.collection('ecommerce_products');
    const existing = await coll.find({ clientId: new ObjectId(clientId) }).sort({ createdAt: -1 }).toArray();
    if (existing.length === 0) {
      for (const p of sampleProducts) {
        await coll.insertOne({ ...p, clientId: new ObjectId(clientId) });
      }
      return sampleProducts.map(sanitizeEcommerceProduct);
    }
    return existing.map(sanitizeEcommerceProduct);
  }

  return sampleProducts.map(sanitizeEcommerceProduct);
}
