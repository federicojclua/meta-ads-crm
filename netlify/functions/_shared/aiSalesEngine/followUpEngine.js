import { executeControlledTool } from './controlPlaneService.js';

export const FOLLOW_UP_TEMPLATES = {
  step1_24h: {
    step: 1,
    delayHours: 24,
    title: 'Recordatorio Cordial (+24h)',
    message: '¡Hola! Quería saber si tuviste oportunidad de revisar la propuesta de financiación que te enviamos.',
  },
  step2_48h: {
    step: 2,
    delayHours: 48,
    title: 'Prueba Social & Casos de Éxito (+48h)',
    message: 'Te comparto un breve caso de cómo una empresa de la zona equipó a todo su equipo con nuestras notebooks en 12 cuotas fijas.',
  },
  step3_72h: {
    step: 3,
    delayHours: 72,
    title: 'Aviso de Cierre de Consulta (+72h)',
    message: 'Para no ser invasivo, dejamos en pausa tu consulta por aquí. Si reactivás tu búsqueda, avisanos y te asesoramos con gusto.',
  },
};

/**
 * Evaluates and executes follow-up sequences on unresponsive leads.
 */
export async function executeFollowUpCadenceService({
  leads = [],
  clientId = null,
  user = {},
  db = null,
  simulatedNow = new Date(),
} = {}) {
  const processedLeads = [];

  for (const lead of leads) {
    const lastActivity = new Date(lead.lastActivityAt || lead.createdAt || simulatedNow);
    const diffHours = (simulatedNow.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    const currentFollowUpStep = Number(lead.followUpStep) || 0;
    let nextStep = null;

    if (currentFollowUpStep === 0 && diffHours >= 24) {
      nextStep = FOLLOW_UP_TEMPLATES.step1_24h;
    } else if (currentFollowUpStep === 1 && diffHours >= 48) {
      nextStep = FOLLOW_UP_TEMPLATES.step2_48h;
    } else if (currentFollowUpStep === 2 && diffHours >= 72) {
      nextStep = FOLLOW_UP_TEMPLATES.step3_72h;
    } else if (currentFollowUpStep === 3 && diffHours >= 96) {
      // Move to Reactivation queue
      nextStep = {
        step: 4,
        isReactivation: true,
        title: 'Movido a Cola de Reactivación',
      };
    }

    if (nextStep) {
      if (nextStep.isReactivation) {
        processedLeads.push({
          leadId: lead.id || lead._id,
          leadName: lead.name,
          stepExecuted: 4,
          action: 'MOVED_TO_REACTIVATION_QUEUE',
          newStage: 'lost',
        });
      } else {
        const toolRes = await executeControlledTool({
          agentRole: 'followup',
          toolName: 'send_whatsapp',
          inputData: {
            phone: lead.phone,
            message: nextStep.message,
            confidenceScore: 0.92,
          },
          reasoning: `Lead '${lead.name}' sin respuesta por ${Math.round(diffHours)}h. Ejecutando ${nextStep.title}.`,
          clientId,
          userId: user.id,
          db,
        });

        processedLeads.push({
          leadId: lead.id || lead._id,
          leadName: lead.name,
          stepExecuted: nextStep.step,
          messageSent: nextStep.message,
          toolStatus: toolRes.success ? 'sent' : 'pending_approval',
        });
      }
    }
  }

  return {
    success: true,
    totalEvaluated: leads.length,
    totalActioned: processedLeads.length,
    processedLeads,
  };
}
