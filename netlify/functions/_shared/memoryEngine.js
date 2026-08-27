import { DEFAULT_BUSINESS_MEMORY } from '../../../models/BusinessMemory.js';
import { DEFAULT_BUSINESS_GOALS } from '../../../models/BusinessGoals.js';

/**
 * Deterministic Algorithm for ANIMA Business Health Score (0 - 100).
 * Evaluates 6 core dimensions of tenant performance.
 */
export function computeAnimaHealthScore({
  metrics = {},
  historicalMemory = DEFAULT_BUSINESS_MEMORY,
} = {}) {
  // 1. Acquisition Score (Weight: 15%)
  const benchmarkCpl = historicalMemory?.campaignMemory?.historicalBenchmarkCpl || 1650;
  const currentCpl = Math.max(1, Number(metrics.currentCpl) || 1482);
  const acqRatio = benchmarkCpl / currentCpl;
  const acquisitionScore = Math.min(100, Math.max(0, Math.round(acqRatio * 100)));

  // 2. Creative Score (Weight: 15%)
  const avgCtr = Number(metrics.avgCtr) || 3.82;
  const baseCtrScore = Math.min(100, Math.round((avgCtr / 3.0) * 85));
  const fatiguePenalty = metrics.creativeFatigueDetected ? 20 : 0;
  const creativeScore = Math.max(0, Math.min(100, baseCtrScore - fatiguePenalty));

  // 3. Sales Conversion Score (Weight: 20%)
  const closeRate = Number(metrics.closeRatePct) || 16.6;
  const targetCloseRate = Number(historicalMemory?.salesMemory?.historicalCloseRatePct) || 15.0;
  const salesScore = Math.min(100, Math.max(0, Math.round((closeRate / targetCloseRate) * 100)));

  // 4. Response Time & SLA Score (Weight: 15%)
  const slaCompliance = Number(metrics.slaCompliancePct) || 94.5;
  const responseScore = Math.min(100, Math.max(0, Math.round(slaCompliance)));

  // 5. Revenue Volume Score (Weight: 20%)
  const actualRevenue = Number(metrics.actualRevenue) || 18199986;
  const revenueTarget = Math.max(1, Number(metrics.revenueTarget) || 20000000);
  const revRatio = actualRevenue / revenueTarget;
  const revenueScore = Math.min(100, Math.max(0, Math.round(revRatio * 100)));

  // 6. Profitability Margin Score (Weight: 15%)
  const netMargin = Number(metrics.netMarginPct) || 28.4;
  const profitabilityScore = Math.min(100, Math.max(0, Math.round(netMargin * 3.2)));

  // Weighted Sum
  const totalScore = Math.round(
    acquisitionScore * 0.15 +
    creativeScore * 0.15 +
    salesScore * 0.20 +
    responseScore * 0.15 +
    revenueScore * 0.20 +
    profitabilityScore * 0.15
  );

  let status = 'SALUDABLE';
  let badgeVariant = 'blue';
  let summary = 'Rendimiento sólido y equilibrado en todas las áreas de negocio.';

  if (totalScore >= 85) {
    status = 'EXCELENTE';
    badgeVariant = 'green';
    summary = 'Desempeño sobresaliente con alta rentabilidad, adquisición eficiente y respuesta comercial veloz.';
  } else if (totalScore >= 70) {
    status = 'SALUDABLE';
    badgeVariant = 'blue';
    summary = 'Operación saludable con oportunidades de optimización en CTR o volumen.';
  } else if (totalScore >= 50) {
    status = 'ATENCION_REQUERIDA';
    badgeVariant = 'yellow';
    summary = 'Alerta temprana: CPL elevado o retrasos en tiempos de respuesta de WhatsApp.';
  } else {
    status = 'CRITICO';
    badgeVariant = 'red';
    summary = 'Riesgo operativo alto: se requiere intervención urgente en cierre de ventas o fatiga creativa.';
  }

  return {
    animaScore: totalScore,
    status,
    badgeVariant,
    summary,
    dimensions: {
      acquisition: {
        score: acquisitionScore,
        weightPct: 15,
        currentValue: `$${currentCpl.toLocaleString()} CPL`,
        benchmark: `$${benchmarkCpl.toLocaleString()}`,
        status: acquisitionScore >= 80 ? 'Eficiente' : 'Requiere optimización',
      },
      creative: {
        score: creativeScore,
        weightPct: 15,
        currentValue: `${avgCtr}% CTR`,
        fatigueDetected: Boolean(metrics.creativeFatigueDetected),
        status: creativeScore >= 80 ? 'Fresco' : 'Fatiga detectada',
      },
      sales: {
        score: salesScore,
        weightPct: 20,
        currentValue: `${closeRate}% Cierre`,
        benchmark: `${targetCloseRate}%`,
        status: salesScore >= 80 ? 'Óptimo' : 'Baja conversión',
      },
      response: {
        score: responseScore,
        weightPct: 15,
        currentValue: `${slaCompliance}% SLA`,
        benchmark: '90% SLA',
        status: responseScore >= 85 ? 'Rápido' : 'Retrasos en chat',
      },
      revenue: {
        score: revenueScore,
        weightPct: 20,
        currentValue: `$${actualRevenue.toLocaleString()}`,
        target: `$${revenueTarget.toLocaleString()}`,
        status: revenueScore >= 85 ? 'En meta' : 'Por debajo de meta',
      },
      profitability: {
        score: profitabilityScore,
        weightPct: 15,
        currentValue: `${netMargin}% Margen Neto`,
        benchmark: '25%',
        status: profitabilityScore >= 80 ? 'Alta rentabilidad' : 'Margen comprimido',
      },
    },
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Goals & Forecast Engine.
 * Computes Month-to-Date (MTD) actuals, daily run rates, end-of-month forecasts, gaps, and required pace.
 */
export function computeGoalsAndForecast({
  actuals = {},
  goals = DEFAULT_BUSINESS_GOALS,
  currentDate = new Date(),
} = {}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dayOfMonth = Math.max(1, currentDate.getDate());
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - dayOfMonth);

  function projectMetric(actual, target, isLowerBetter = false) {
    const act = Number(actual) || 0;
    const tgt = Number(target) || 1;
    const dailyRunRate = act / dayOfMonth;
    const projectedForecast = Math.round(act + (dailyRunRate * remainingDays));
    const gap = isLowerBetter ? act - tgt : tgt - projectedForecast;
    const requiredPace = isLowerBetter
      ? tgt
      : Math.round(Math.max(0, tgt - act) / remainingDays);

    let status = 'ON_TRACK';
    if (!isLowerBetter) {
      if (projectedForecast >= tgt * 0.95) {
        status = 'ON_TRACK';
      } else if (projectedForecast >= tgt * 0.80) {
        status = 'AT_RISK';
      } else {
        status = 'BEHIND';
      }
    } else {
      status = act <= tgt ? 'ON_TRACK' : 'AT_RISK';
    }

    return {
      actual: act,
      target: tgt,
      dailyRunRate: Math.round(dailyRunRate * 100) / 100,
      projectedForecast,
      gap,
      requiredDailyPace: requiredPace,
      progressPct: Math.min(100, Math.round((act / tgt) * 100)),
      status,
    };
  }

  return {
    period: `${year}-${String(month + 1).padStart(2, '0')}`,
    progressDays: {
      elapsed: dayOfMonth,
      remaining: remainingDays,
      total: totalDaysInMonth,
      progressPct: Math.round((dayOfMonth / totalDaysInMonth) * 100),
    },
    metrics: {
      revenue: projectMetric(actuals.revenue || 18199986, goals.revenueTarget || 20000000),
      sales: projectMetric(actuals.sales || 14, goals.salesTarget || 16),
      leads: projectMetric(actuals.leads || 84, goals.leadTarget || 100),
      cpa: projectMetric(actuals.cpa || 8892, goals.cpaTarget || 9500, true),
      roas: projectMetric(actuals.roas || 146.18, goals.roasTarget || 120),
      profit: projectMetric(actuals.profit || 5168796, goals.profitTarget || 5500000),
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates Agency Profitability (The True Margin).
 * Deducts Meta spend, AI API cost (usage_events), payment gateway fees, infra, and human ops cost.
 */
export function computeAgencyProfitability({
  clientRevenue = 18199986,
  metaSpend = 124500,
  aiUsageCostUsd = 12.50,
  usdExchangeRate = 1350,
  paymentGatewayRate = 0.035, // 3.5%
  infrastructureCostArs = 25000,
  humanOpsCostArs = 85000,
} = {}) {
  const aiCostArs = Math.round(aiUsageCostUsd * usdExchangeRate);
  const paymentGatewayFees = Math.round(clientRevenue * paymentGatewayRate);
  const totalDirectCosts = metaSpend + aiCostArs + paymentGatewayFees + infrastructureCostArs + humanOpsCostArs;
  const trueAgencyMarginArs = clientRevenue - totalDirectCosts;
  const trueAgencyMarginPct = Number(((trueAgencyMarginArs / clientRevenue) * 100).toFixed(2));

  return {
    clientRevenue,
    costBreakdown: {
      metaSpend,
      aiCostUsd: aiUsageCostUsd,
      aiCostArs,
      paymentGatewayFees,
      infrastructureCostArs,
      humanOpsCostArs,
      totalDirectCosts,
    },
    trueAgencyMarginArs,
    trueAgencyMarginPct,
    isProfitable: trueAgencyMarginArs > 0,
    calculatedAt: new Date().toISOString(),
  };
}
