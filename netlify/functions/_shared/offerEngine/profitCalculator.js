/**
 * Pure arithmetic True Profit calculator for e-commerce products and campaigns.
 * Deterministic - No AI hallucinations.
 */
export function calculateUnitTrueProfit({
  price = 0,
  costStructure = {},
} = {}) {
  const sellingPrice = Number(price) || 0;
  const cogs = Number(costStructure.cogs) || 0;
  const gatewayFeePercent = Number(costStructure.gatewayFeePercent) || 3.5;
  const shippingCost = Number(costStructure.shippingCost) || 0;
  const estimatedCpa = Number(costStructure.estimatedCpa) || 0;
  const otherUnitCosts = Number(costStructure.otherUnitCosts) || 0;
  const targetMinMarginPercent = Number(costStructure.targetMinMarginPercent) || 15;

  const gatewayFeeAmount = Math.round(sellingPrice * (gatewayFeePercent / 100));
  const totalUnitCost = cogs + shippingCost + estimatedCpa + otherUnitCosts + gatewayFeeAmount;
  const trueProfitAmount = sellingPrice - totalUnitCost;

  const trueProfitMarginPct = sellingPrice > 0
    ? Number(((trueProfitAmount / sellingPrice) * 100).toFixed(2))
    : 0;

  const maxDiscountAllowedPct = Math.max(
    0,
    Number((trueProfitMarginPct - targetMinMarginPercent).toFixed(2))
  );
  const maxDiscountAmount = Math.round(sellingPrice * (maxDiscountAllowedPct / 100));
  const breakEvenPrice = totalUnitCost;

  let healthStatus = 'HEALTHY';
  if (trueProfitMarginPct < 15) {
    healthStatus = 'CRITICAL_RISK';
  } else if (trueProfitMarginPct < 25) {
    healthStatus = 'MODERATE';
  }

  return {
    sellingPrice,
    cogs,
    gatewayFeePercent,
    gatewayFeeAmount,
    shippingCost,
    estimatedCpa,
    otherUnitCosts,
    totalUnitCost,
    trueProfitAmount,
    trueProfitMarginPct,
    maxDiscountAllowedPct,
    maxDiscountAmount,
    breakEvenPrice,
    isProfitable: trueProfitAmount > 0,
    healthStatus,
    targetMinMarginPercent,
  };
}

/**
 * Calculates projected profits for a specific offer variant.
 */
export function calculateOfferVariantProfit({
  baseProductPrice = 0,
  discountPct = 0,
  addonsCost = 0,
  costStructure = {},
} = {}) {
  const discountedPrice = Math.round(baseProductPrice * (1 - (discountPct / 100)));
  const baseCost = {
    ...costStructure,
    cogs: (Number(costStructure.cogs) || 0) + (Number(addonsCost) || 0),
  };

  return calculateUnitTrueProfit({
    price: discountedPrice,
    costStructure: baseCost,
  });
}
