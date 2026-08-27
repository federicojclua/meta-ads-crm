import { ObjectId } from 'mongodb';

export const AFFILIATE_STATUSES = ['active', 'inactive', 'paused'];

/**
 * Calculates the True Net Margin for E-Commerce / Dropshipping.
 * Net Margin = Gross Revenue - Ads Spend - Dropship COGS - Affiliate Commissions.
 * 
 * @param {Object} params
 * @param {number} params.grossRevenue
 * @param {number} params.metaSpend
 * @param {number} params.dropshipCogs
 * @param {number} params.affiliateCommissions
 * @returns {{ netProfit: number, netMarginPercent: number, roas: number, cogsRatio: number, affiliateRatio: number }}
 */
export function calculateTrueNetMargin({
  grossRevenue = 0,
  metaSpend = 0,
  dropshipCogs = 0,
  affiliateCommissions = 0,
}) {
  const gross = Math.max(0, Number(grossRevenue) || 0);
  const ads = Math.max(0, Number(metaSpend) || 0);
  const cogs = Math.max(0, Number(dropshipCogs) || 0);
  const comm = Math.max(0, Number(affiliateCommissions) || 0);

  const totalCosts = ads + cogs + comm;
  const netProfit = Number((gross - totalCosts).toFixed(2));
  const netMarginPercent = gross > 0 ? Number(((netProfit / gross) * 100).toFixed(2)) : 0;
  const roas = ads > 0 ? Number((gross / ads).toFixed(2)) : 0;
  const cogsRatio = gross > 0 ? Number(((cogs / gross) * 100).toFixed(1)) : 0;
  const affiliateRatio = gross > 0 ? Number(((comm / gross) * 100).toFixed(1)) : 0;

  return {
    grossRevenue: gross,
    metaSpend: ads,
    dropshipCogs: cogs,
    affiliateCommissions: comm,
    totalCosts,
    netProfit,
    netMarginPercent,
    roas,
    cogsRatio,
    affiliateRatio,
  };
}

/**
 * Validates an Affiliate / Partner document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateAffiliate(data = {}) {
  const errors = [];

  if (!data.clientId) {
    errors.push('clientId es obligatorio.');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre del afiliado es obligatorio.');
  }

  if (!data.promoCode || typeof data.promoCode !== 'string' || data.promoCode.trim().length === 0) {
    errors.push('El código promocional (promoCode) es obligatorio.');
  }

  const rate = Number(data.commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    errors.push('El porcentaje de comisión debe ser un número entre 0 y 100.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes an affiliate document for API output.
 */
export function sanitizeAffiliate(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    name: doc.name || '',
    email: doc.email || '',
    promoCode: (doc.promoCode || '').toUpperCase(),
    commissionRate: Number(doc.commissionRate) || 10,
    status: AFFILIATE_STATUSES.includes(doc.status) ? doc.status : 'active',
    salesAttributedCount: Number(doc.salesAttributedCount) || 0,
    totalRevenueGenerated: Number(doc.totalRevenueGenerated) || 0,
    totalCommissionsPaid: Number(doc.totalCommissionsPaid) || 0,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
