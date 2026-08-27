export const ECOMMERCE_STEPS = [
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase',
];

export const STEP_LABELS = {
  view_item: 'Vista de Producto (view_item)',
  add_to_cart: 'Añadido al Carrito (add_to_cart)',
  begin_checkout: 'Inicio de Checkout (begin_checkout)',
  add_payment_info: 'Datos de Pago (add_payment_info)',
  purchase: 'Compra Finalizada (purchase)',
};

/**
 * Calculates step-by-step conversion and drop-off percentages for a funnel dataset.
 * 
 * @param {Array<{ step: string, count: number }>} steps
 * @returns {Array<{ step: string, label: string, count: number, conversionFromInitial: number, conversionFromPrevious: number, dropoffFromPrevious: number }>}
 */
export function calculateFunnelDropoff(steps = []) {
  const stepMap = new Map((steps || []).map((s) => [s.step, Math.max(0, Number(s.count) || 0)]));
  const initialCount = stepMap.get('view_item') || 1000;

  let prevCount = initialCount;

  return ECOMMERCE_STEPS.map((stepKey, idx) => {
    const count = stepMap.has(stepKey)
      ? stepMap.get(stepKey)
      : Math.round(initialCount * Math.pow(0.45, idx)); // fallback realistic cascade

    const conversionFromInitial = initialCount > 0
      ? Number(((count / initialCount) * 100).toFixed(1))
      : 0;

    const conversionFromPrevious = prevCount > 0
      ? Number(((count / prevCount) * 100).toFixed(1))
      : 0;

    const dropoffFromPrevious = idx === 0
      ? 0
      : Number((100 - conversionFromPrevious).toFixed(1));

    prevCount = count;

    return {
      step: stepKey,
      label: STEP_LABELS[stepKey] || stepKey,
      count,
      conversionFromInitial,
      conversionFromPrevious,
      dropoffFromPrevious,
    };
  });
}

/**
 * Calculates the UI/UX Friction Score (0 to 100).
 * Lower is better (less friction). Higher indicates high user friction and drop-off.
 * 
 * @param {Object} params
 * @param {number} params.bounceRate - e.g. 55.4 (55.4%)
 * @param {number} params.avgTimeOnPageSec - e.g. 45
 * @param {number} params.formAbandonRate - e.g. 40.2 (40.2%)
 * @param {number} params.mobileDropoffRatio - e.g. 1.35 (Mobile dropoff is 35% higher than Desktop)
 * @returns {{ score: number, severity: 'BAJA' | 'MODERADA' | 'CRÍTICA', topBottleneck: string }}
 */
export function calculateFrictionScore({
  bounceRate = 50,
  avgTimeOnPageSec = 60,
  formAbandonRate = 35,
  mobileDropoffRatio = 1.2,
}) {
  // Weights: Bounce Rate (30%), Form Abandon (35%), Low Time On Page penalty (15%), Mobile Disparity (20%)
  const bounceComponent = Math.min(100, Math.max(0, bounceRate)) * 0.30;
  const formComponent = Math.min(100, Math.max(0, formAbandonRate)) * 0.35;
  const timePenalty = avgTimeOnPageSec < 30 ? 15 : avgTimeOnPageSec < 60 ? 8 : 2;
  const mobilePenalty = Math.min(20, Math.max(0, (mobileDropoffRatio - 1.0) * 40));

  const rawScore = Math.round(bounceComponent + formComponent + timePenalty + mobilePenalty);
  const score = Math.min(100, Math.max(0, rawScore));

  let severity = 'BAJA';
  if (score >= 65) severity = 'CRÍTICA';
  else if (score >= 40) severity = 'MODERADA';

  let topBottleneck = 'Fricción general controlada';
  if (formAbandonRate > 50) {
    topBottleneck = 'Abandono masivo en campos de formulario y checkout';
  } else if (mobileDropoffRatio > 1.3) {
    topBottleneck = 'Disparidad de experiencia móvil frente a escritorio';
  } else if (bounceRate > 65) {
    topBottleneck = 'Tasa de rebote inicial elevada en páginas de producto';
  }

  return {
    score,
    severity,
    topBottleneck,
  };
}

export const DEFAULT_ECOMMERCE_FUNNEL = [
  { step: 'view_item', count: 12450 },
  { step: 'add_to_cart', count: 3860 },
  { step: 'begin_checkout', count: 1940 },
  { step: 'add_payment_info', count: 820 },
  { step: 'purchase', count: 540 },
];
