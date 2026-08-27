import { describe, it, expect } from 'vitest';
import { evaluateAutonomousAgent } from '../../netlify/functions/_shared/agentEngine.js';
import { validateAiBrain, sanitizeAiBrain, DEFAULT_AI_BRAIN } from '../../models/AiBrain.js';

describe('Stage 14 — AI Agent Brain & Autonomous Qualification Engine Tests', () => {
  it('1. evaluateAutonomousAgent califica automáticamente cuando el lead indica presupuesto y objetivo', async () => {
    const decision = await evaluateAutonomousAgent({
      messageText: 'Hola, tenemos $250.000 de presupuesto mensual para pauta en Meta Ads y queremos captar más leads.',
      brain: DEFAULT_AI_BRAIN,
      channel: 'whatsapp',
    });

    expect(decision.shouldQualify).toBe(true);
    expect(decision.shouldHandOff).toBe(false);
    expect(decision.replyText).toContain('llamada de diagnóstico');
  });

  it('2. evaluateAutonomousAgent activa Hand-off a humano ante frustración o reclamo', async () => {
    const decision = await evaluateAutonomousAgent({
      messageText: 'Quiero hablar con una persona real urgente, esto parece una estafa y quiero quejarme.',
      brain: DEFAULT_AI_BRAIN,
      channel: 'instagram',
    });

    expect(decision.shouldHandOff).toBe(true);
    expect(decision.shouldQualify).toBe(false);
    expect(decision.replyText).toContain('ejecutivos de cuenta');
  });

  it('3. validateAiBrain exige clientId y valida tipos de datos', () => {
    const invalid = validateAiBrain({ clientId: null });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(1);

    const valid = validateAiBrain({
      clientId: '65df11111111111111111111',
      industryAndTone: 'Agencia Digital',
      knowledgeBase: 'Servicios de Meta Ads',
      qualificationRules: 'Extraer presupuesto',
    });
    expect(valid.isValid).toBe(true);
  });

  it('4. sanitizeAiBrain devuelve estructura canónica con defaults seguros', () => {
    const sanitized = sanitizeAiBrain({
      _id: 'brain_123',
      clientId: 'tenant_1',
      industryAndTone: 'Consultora',
    });

    expect(sanitized.id).toBe('brain_123');
    expect(sanitized.industryAndTone).toBe('Consultora');
    expect(sanitized.autoQualifyEnabled).toBe(true);
    expect(sanitized.autoSetterEnabled).toBe(true);
  });
});
