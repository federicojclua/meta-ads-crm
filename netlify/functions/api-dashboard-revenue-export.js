import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { convertCurrencyHistorically } from '../../models/ExchangeRate.js';

/**
 * Sanitizes a cell value for CSV formatting, escaping any potential formula triggers
 * (e.g. =, +, -, @) to prevent CSV Injection attacks in Excel/LibreOffice.
 * @param {any} val
 * @returns {string}
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Escape existing double quotes by doubling them
  str = str.replace(/"/g, '""');
  // If the string starts with a potential formula char, prefix with a single quote
  if (/^[=+\-@\s]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

export const handler = async (event) => {
  try {
    const auth = await verifyAuthorizedUser(event);
    if (!auth.authorized) {
      return errorResponse(auth.status, auth.error, auth.code);
    }

    const { user, clientScope, isGlobal } = auth;
    const db = auth.db || (await getDb());
    const method = event.httpMethod;

    if (method !== 'GET' && method !== 'POST') {
      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    const params = event.queryStringParameters || {};

    // 1. Tenant security scoping
    let targetClientId = null;
    if (!isGlobal) {
      if (!clientScope || !ObjectId.isValid(clientScope)) {
        return errorResponse(403, 'Usuario sin empresa asignada.', 'FORBIDDEN');
      }
      targetClientId = new ObjectId(clientScope);
    } else {
      if (params.clientId && ObjectId.isValid(params.clientId)) {
        targetClientId = new ObjectId(params.clientId);
      } else {
        return errorResponse(400, 'El parámetro clientId es obligatorio para exportar datos.', 'CLIENT_ID_REQUIRED');
      }
    }

    // Verify active client
    const clientDoc = await db.collection('clients').findOne({ _id: targetClientId, status: 'active' });
    if (!clientDoc) {
      return errorResponse(404, 'La empresa seleccionada no existe o está inactiva.', 'CLIENT_NOT_FOUND');
    }

    // Salesperson constraint
    const isSalesperson = user.role === 'salesperson';
    let salespersonId = null;
    if (isSalesperson) {
      salespersonId = user._id;
    } else if (params.salespersonId && ObjectId.isValid(params.salespersonId)) {
      salespersonId = new ObjectId(params.salespersonId);
    }

    // Range parameters
    const startDateStr = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDateStr = params.endDate || new Date().toISOString().split('T')[0];

    const rangeStart = new Date(`${startDateStr}T00:00:00.000Z`);
    const rangeEnd = new Date(`${endDateStr}T23:59:59.999Z`);

    const campaignId = params.campaignId || null;
    const targetCurrency = params.currency || 'USD'; // default to USD for conversion if not set
    const format = params.format || 'csv'; // 'csv' | 'pdf_json'

    // Load exchange rates
    const exchangeRates = await db.collection('exchange_rates').find({}).toArray();

    // Fetch leads, sales, and Meta insights
    const leadsCollection = db.collection('leads');
    const salesCollection = db.collection('sales');
    const metaInsightsCollection = db.collection('meta_insights_daily');

    const leadFilter = {
      clientId: targetClientId,
      status: { $ne: 'deleted' },
      acquiredAt: { $gte: rangeStart, $lte: rangeEnd },
    };
    if (salespersonId) {
      leadFilter.assignedToUserId = salespersonId;
    }
    if (campaignId) {
      leadFilter.metaCampaignId = campaignId;
    }

    const leads = await leadsCollection.find(leadFilter).toArray();
    const leadIds = leads.map(l => l._id);

    const salesFilter = {
      clientId: targetClientId,
      status: { $ne: 'cancelled' },
      leadId: { $in: leadIds },
    };
    if (campaignId) {
      salesFilter.metaCampaignId = campaignId;
    }

    const sales = await salesCollection.find(salesFilter).toArray();

    const payments = [];
    sales.forEach(sale => {
      const salePayments = Array.isArray(sale.payments) ? sale.payments : [];
      salePayments.forEach(p => {
        const payDate = new Date(p.collectedAt || p.createdAt);
        if (payDate >= rangeStart && payDate <= rangeEnd) {
          payments.push({
            ...p,
            saleId: sale._id,
            saleCurrency: sale.currency,
            leadId: sale.leadId,
          });
        }
      });
    });

    const metaFilter = {
      clientId: targetClientId,
      date: { $gte: startDateStr, $lte: endDateStr },
    };
    if (campaignId) {
      metaFilter.campaignId = campaignId;
    }

    const insights = await metaInsightsCollection.find(metaFilter).toArray();

    // Audit the export action
    await db.collection('audit_logs').insertOne({
      action: 'EXPORT_REVENUE_REPORT',
      performedByUserId: user._id,
      performedAt: new Date(),
      details: {
        clientId: targetClientId.toString(),
        format,
        startDate: startDateStr,
        endDate: endDateStr,
        campaignId,
        salespersonId: salespersonId ? salespersonId.toString() : null,
      },
    });

    // Format: CSV
    if (format === 'csv') {
      const csvLines = [];

      // CSV Header
      csvLines.push([
        'Fecha / Segmento',
        'Empresa',
        'Prospectos Registrados',
        'Ventas Cerradas',
        `Inversión Meta (${targetCurrency})`,
        `Ingresos Cobrados (${targetCurrency})`,
      ].map(sanitizeCsvCell).join(','));

      // Generate daily bins
      const bins = {};
      let ptr = new Date(rangeStart);
      while (ptr <= rangeEnd) {
        const dateStr = ptr.toISOString().split('T')[0];
        bins[dateStr] = { date: dateStr, leads: 0, sales: 0, spendMinor: 0, revenueMinor: 0 };
        ptr.setUTCDate(ptr.getUTCDate() + 1);
      }

      // Populate bins
      leads.forEach(l => {
        const dateStr = l.acquiredAt.toISOString().split('T')[0];
        if (bins[dateStr]) bins[dateStr].leads += 1;
      });

      sales.forEach(s => {
        const dateStr = new Date(s.soldAt || s.createdAt).toISOString().split('T')[0];
        if (bins[dateStr]) bins[dateStr].sales += 1;
      });

      insights.forEach(ins => {
        const dateStr = ins.date;
        if (bins[dateStr]) {
          const conv = convertCurrencyHistorically(ins.spendMinor || 0, ins.currency || 'ARS', targetCurrency, ins.date, exchangeRates) || 0;
          bins[dateStr].spendMinor += conv;
        }
      });

      payments.forEach(p => {
        const dateStr = new Date(p.collectedAt || p.createdAt).toISOString().split('T')[0];
        if (bins[dateStr]) {
          const conv = convertCurrencyHistorically(p.amountMinor || 0, p.saleCurrency || 'ARS', targetCurrency, p.collectedAt || p.createdAt, exchangeRates) || 0;
          bins[dateStr].revenueMinor += conv;
        }
      });

      // Format CSV body lines
      const sortedBins = Object.values(bins).sort((a, b) => a.date.localeCompare(b.date));
      sortedBins.forEach(b => {
        csvLines.push([
          b.date,
          clientDoc.name,
          b.leads,
          b.sales,
          (b.spendMinor / 100).toFixed(2),
          (b.revenueMinor / 100).toFixed(2),
        ].map(sanitizeCsvCell).join(','));
      });

      const csvContent = csvLines.join('\n');

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reporte-revenue-${clientDoc.slug || 'export'}-${startDateStr}-al-${endDateStr}.csv"`,
          'Cache-Control': 'no-cache',
        },
        body: csvContent,
      };
    }

    // Format: PDF JSON payload (verified data payload for generating PDF on client side)
    if (format === 'pdf_json') {
      let totalSpendMinor = 0;
      let totalRevenueMinor = 0;

      insights.forEach(ins => {
        const conv = convertCurrencyHistorically(ins.spendMinor || 0, ins.currency || 'ARS', targetCurrency, ins.date, exchangeRates) || 0;
        totalSpendMinor += conv;
      });

      payments.forEach(p => {
        const conv = convertCurrencyHistorically(p.amountMinor || 0, p.saleCurrency || 'ARS', targetCurrency, p.collectedAt || p.createdAt, exchangeRates) || 0;
        totalRevenueMinor += conv;
      });

      const cpl = leads.length > 0 ? (totalSpendMinor / 100) / leads.length : 0;
      const cpa = sales.length > 0 ? (totalSpendMinor / 100) / sales.length : 0;
      const roas = totalSpendMinor > 0 ? totalRevenueMinor / totalSpendMinor : 0;

      return jsonResponse(200, {
        ok: true,
        reportMetadata: {
          title: `Informe de Performance y Retorno de Inversión (Revenue)`,
          clientName: clientDoc.name,
          clientId: targetClientId.toString(),
          generatedAt: new Date().toISOString(),
          generatedByUserId: user._id.toString(),
          generatedByUserName: user.displayName || user.email,
          filters: {
            startDate: startDateStr,
            endDate: endDateStr,
            campaignId,
            salespersonId: salespersonId ? salespersonId.toString() : null,
            targetCurrency,
          },
          attributionNote: 'Nota de atribución: Reporte financiero de coincidencia exacta por campaña de leads. La inversión y cobros históricos son convertidos según tasas históricas por transacción.',
        },
        summaryKpis: {
          leadsCount: leads.length,
          salesCount: sales.length,
          spend: totalSpendMinor / 100,
          revenue: totalRevenueMinor / 100,
          spendFormatted: (totalSpendMinor / 100).toLocaleString('es-AR', { style: 'currency', currency: targetCurrency }),
          revenueFormatted: (totalRevenueMinor / 100).toLocaleString('es-AR', { style: 'currency', currency: targetCurrency }),
          cpl: cpl.toLocaleString('es-AR', { style: 'currency', currency: targetCurrency }),
          cpa: cpa.toLocaleString('es-AR', { style: 'currency', currency: targetCurrency }),
          roas: `${roas.toFixed(2)}x`,
        },
        definitions: {
          spend: 'Inversión publicitaria total registrada en campañas de Meta Ads.',
          revenue: 'Ingresos cobrados reales procedentes de pagos registrados en ventas asociadas.',
          cpl: 'Costo por Prospecto (Lead): Inversión Meta / Prospectos totales.',
          cpa: 'Costo por Venta (CPA): Inversión Meta / Ventas cerradas.',
          roas: 'Retorno de Inversión (ROAS): Ingresos cobrados / Inversión publicitaria.',
        },
      });
    }

    return errorResponse(400, 'Formato de exportación no soportado.', 'UNSUPPORTED_FORMAT');
  } catch (err) {
    console.error('[API_DASHBOARD_REVENUE_EXPORT_ERROR]', err.message);
    return errorResponse(500, 'Error interno al procesar la exportación.', 'INTERNAL_SERVER_ERROR');
  }
};
