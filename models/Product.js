
/**
 * Validates a Product document.
 */
export function validateProduct(data = {}) {
  const errors = [];

  if (!data.clientId) {
    errors.push('clientId es obligatorio.');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre del producto es obligatorio.');
  }

  const price = Number(data.price);
  if (isNaN(price) || price < 0) {
    errors.push('El precio debe ser un número mayor o igual a 0.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a product document for output.
 */
export function sanitizeProduct(doc = {}) {
  const price = Number(doc.price) || 0;
  const previousPrice = Number(doc.previousPrice) || 0;

  const costStructure = doc.costStructure || {};
  const cogs = Number(costStructure.cogs) || 0;
  const gatewayFeePercent = Number(costStructure.gatewayFeePercent) || 3.5;
  const shippingCost = Number(costStructure.shippingCost) || 0;
  const estimatedCpa = Number(costStructure.estimatedCpa) || 0;
  const otherUnitCosts = Number(costStructure.otherUnitCosts) || 0;
  const targetMinMarginPercent = Number(costStructure.targetMinMarginPercent) || 15;

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    name: doc.name || 'Producto sin nombre',
    sku: doc.sku || '',
    category: doc.category || 'General',
    description: doc.description || '',
    price,
    previousPrice,
    discount: Number(doc.discount) || (previousPrice > price ? Math.round(((previousPrice - price) / previousPrice) * 100) : 0),
    installments: doc.installments || '12 cuotas fijas',
    imageUrl: doc.imageUrl || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=80',
    features: Array.isArray(doc.features) ? doc.features : [],
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    costStructure: {
      cogs,
      gatewayFeePercent,
      shippingCost,
      estimatedCpa,
      otherUnitCosts,
      targetMinMarginPercent,
    },
    activeOffer: doc.activeOffer || null,
    active: doc.active !== false,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

export const SEED_SAMPLE_PRODUCTS = [
  {
    name: 'Notebook Lenovo ThinkPad E14 Gen 4',
    sku: 'LEN-THINK-E14',
    category: 'Notebooks',
    description: 'Intel Core i7 12va Gen, 16GB RAM, 512GB SSD NVMe, Pantalla 14" FHD IPS.',
    price: 1299999,
    previousPrice: 1549999,
    discount: 16,
    installments: '12 cuotas sin interés',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    features: ['Intel Core i7 12va Gen', '16GB RAM DDR4', '512GB SSD NVMe', 'Garantía Oficial 1 Año'],
    tags: ['gamer', 'oficina', 'notebook', 'oferta'],
    active: true,
  },
  {
    name: 'Monitor Gamer Samsung Odyssey G3 24"',
    sku: 'SAM-ODYS-G3-24',
    category: 'Monitores',
    description: '144Hz, 1ms, FreeSync Premium, Panel VA FHD, Base con ajuste de altura.',
    price: 289999,
    previousPrice: 349999,
    discount: 17,
    installments: '6 cuotas fijas',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    features: ['144Hz de Tasa de Refresco', '1ms Tiempo de Respuesta', 'FHD 1080p', 'FreeSync Premium'],
    tags: ['gamer', 'monitor', 'samsung'],
    active: true,
  },
  {
    name: 'Mouse Inalámbrico Logitech MX Master 3S',
    sku: 'LOG-MX-M3S',
    category: 'Periféricos',
    description: 'Sensor 8000 DPI, Clics silenciosos, Desplazamiento MagSpeed, Bluetooth y USB.',
    price: 139999,
    previousPrice: 169999,
    discount: 18,
    installments: '3 cuotas sin interés',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
    features: ['Sensor 8000 DPI', 'Clics Silenciosos', 'Batería 70 días', 'Multi-dispositivo'],
    tags: ['mouse', 'logitech', 'ergonomico'],
    active: true,
  },
  {
    name: 'Teclado Mecánico Redragon Kumara K552 RGB',
    sku: 'RED-KUM-K552',
    category: 'Periféricos',
    description: 'Switches Outemu Red, Anti-Ghosting, Iluminación RGB Chroma, Formato TKL.',
    price: 74999,
    previousPrice: 89999,
    discount: 16,
    installments: '3 cuotas sin interés',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    features: ['Switches Outemu Red', 'RGB Chroma 18 modos', 'Estructura Metálica', 'TKL Compacto'],
    tags: ['teclado', 'mecanico', 'gamer'],
    active: true,
  },
];
