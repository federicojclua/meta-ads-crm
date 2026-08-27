/**
 * Sales Intelligence Benchmarking: Human Reps vs AI Agent Squad.
 */
export async function computeSalesIntelligenceService({
  clientId = null,
  db = null,
} = {}) {
  const humanReps = [
    {
      id: 'usr_agustin',
      name: 'Agustín Gómez (Vendedor Senior)',
      type: 'human',
      leadsAssigned: 38,
      avgResponseTimeSeconds: 420, // 7 min
      qualifiedLeadsCount: 22,
      appointmentsScheduled: 14,
      wonSalesCount: 8,
      revenueGenerated: 10399992,
      conversionRatePct: 21.05,
    },
    {
      id: 'usr_mariana',
      name: 'Mariana López (Ejecutiva Comercial)',
      type: 'human',
      leadsAssigned: 46,
      avgResponseTimeSeconds: 540, // 9 min
      qualifiedLeadsCount: 26,
      appointmentsScheduled: 12,
      wonSalesCount: 6,
      revenueGenerated: 7799994,
      conversionRatePct: 13.04,
    },
  ];

  const aiAgents = [
    {
      id: 'agent_qualifier_01',
      name: 'ANIMA Qualifier (IA)',
      type: 'ai_agent',
      leadsAssigned: 84,
      avgResponseTimeSeconds: 4, // 4 sec
      qualifiedLeadsCount: 48,
      appointmentsScheduled: 26,
      wonSalesCount: 14,
      revenueGenerated: 18199986,
      conversionRatePct: 16.67,
    },
    {
      id: 'agent_setter_01',
      name: 'ANIMA Setter (IA)',
      type: 'ai_agent',
      leadsAssigned: 32,
      avgResponseTimeSeconds: 8, // 8 sec
      qualifiedLeadsCount: 24,
      appointmentsScheduled: 20,
      wonSalesCount: 7,
      revenueGenerated: 9099993,
      conversionRatePct: 21.88,
    },
    {
      id: 'agent_followup_01',
      name: 'ANIMA Follow-up (IA)',
      type: 'ai_agent',
      leadsAssigned: 28,
      avgResponseTimeSeconds: 12,
      qualifiedLeadsCount: 10,
      appointmentsScheduled: 6,
      wonSalesCount: 3,
      revenueGenerated: 3899997,
      conversionRatePct: 10.71,
    },
  ];

  const aggregateSummary = {
    totalLeadsProcessed: 84,
    humanAvgTtfrSeconds: 480, // 8 min
    aiAvgTtfrSeconds: 6, // 6 sec (98.7% faster)
    totalWonSales: 14,
    totalRevenueGenerated: 18199986,
    aiContributionPct: 64.2,
  };

  return {
    success: true,
    humanReps,
    aiAgents,
    aggregateSummary,
  };
}

/**
 * WhatsApp Revenue Intelligence (End-to-End Meta to Sales Traceability).
 */
export async function computeWhatsAppAttributionService({
  clientId = null,
  db = null,
} = {}) {
  const attributionRecords = [
    {
      leadId: 'lead_novati_01',
      leadName: 'Carlos M. (Estudio Contable)',
      phone: '+5493815551234',
      metaCampaign: {
        id: 'meta_camp_12345',
        name: 'NOVATI | LEADS | NOTEBOOKS | AGO-2026',
      },
      metaAd: {
        id: 'meta_ad_555',
        name: 'Reel 9:16 — Avatar Martina + B-Roll Tienda',
      },
      whatsAppChat: {
        id: 'chat_01',
        totalMessages: 14,
        assignedAgent: 'ANIMA Qualifier -> Agustín Gómez',
      },
      sale: {
        id: 'sale_901',
        amount: 1299999,
        items: '1x Notebook ThinkPad E14',
        paymentMethod: '12 cuotas fijas',
        closedAt: new Date().toISOString(),
      },
      attributionStatus: 'CLOSED_WON',
    },
    {
      leadId: 'lead_novati_02',
      leadName: 'Esteban R. (Pyme Agro)',
      phone: '+5493815559876',
      metaCampaign: {
        id: 'meta_camp_12345',
        name: 'NOVATI | LEADS | NOTEBOOKS | AGO-2026',
      },
      metaAd: {
        id: 'meta_ad_556',
        name: 'Feed 1:1 — Oferta Directa 12 Cuotas',
      },
      whatsAppChat: {
        id: 'chat_02',
        totalMessages: 8,
        assignedAgent: 'ANIMA Setter -> Mariana López',
      },
      sale: {
        id: 'sale_902',
        amount: 2599998,
        items: '2x Notebook ThinkPad L15',
        paymentMethod: 'Transferencia bancaria',
        closedAt: new Date().toISOString(),
      },
      attributionStatus: 'CLOSED_WON',
    },
  ];

  return {
    success: true,
    totalAttributedRevenue: 3899997,
    records: attributionRecords,
  };
}
