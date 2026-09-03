import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateStoryboard,
  generateNextSceneWithContinuity,
} from '../../netlify/functions/_shared/creativeEngine/videoProviderRouter.js';
import { DEFAULT_CREATIVE_PROFILE } from '../../models/CreativeProfile.js';
import { estimateProjectCredits } from '../../models/AIUsage.js';

describe('Stage 17 — Video Continuity Engine & Storyboard Direct-Response Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. generateStoryboard genera un desglose de funnel estructurado (Hook, Problem, Solution, CTA)', async () => {
    const brandProfile = {
      ...DEFAULT_CREATIVE_PROFILE,
      brandIdentity: { commercialName: 'Grupo Novati Tech' },
    };

    const result = await generateStoryboard({
      brandProfile,
      products: [{ id: 'prod_1', name: 'Notebook Lenovo ThinkPad', price: 1299999, installments: '12 cuotas fijas' }],
      objective: 'leads',
      angle: 'problem_solution',
    });

    expect(result.success).toBe(true);
    expect(result.storyboard.scenes).toHaveLength(4);
    expect(result.storyboard.scenes[0].funnelRole).toBe('hook');
    expect(result.storyboard.scenes[1].funnelRole).toBe('problem');
    expect(result.storyboard.scenes[2].funnelRole).toBe('solution');
    expect(result.storyboard.scenes[3].funnelRole).toBe('cta');
    expect(result.storyboard.storyboardSummary.cplOptimizationTarget).toContain('Costo por Lead');
  });

  it('2. generateNextSceneWithContinuity inyecta el last_frame previo como first_frame para evitar saltos', async () => {
    const previousScene = {
      sequence: 1,
      continuityPack: {
        lastFrameUrl: 'https://example.com/last_frame_scene_1.jpg',
        lighting: 'studio_soft',
      },
    };

    const newSceneSpec = {
      sceneId: 'scene_02',
      blockType: 'ai_avatar',
      funnelRole: 'solution',
      durationSec: 6,
      avatarId: 'avatar_martina',
    };

    const result = await generateNextSceneWithContinuity({
      previousScene,
      newSceneSpec,
      brandProfile: DEFAULT_CREATIVE_PROFILE,
      modelTier: 'veo-3.1-lite',
    });

    expect(result.success).toBe(true);
    expect(result.scene.sequence).toBe(2);
    expect(result.scene.continuityPack.inputFirstFrameUrl).toBe('https://example.com/last_frame_scene_1.jpg');
    expect(result.scene.continuityPack.characterId).toBe('avatar_martina');
  });

  it('3. estimateProjectCredits calcula el consumo de créditos y enruta según el modelTier', () => {
    const sampleScenes = [
      { durationSec: 5 },
      { durationSec: 6 },
      { durationSec: 7 },
      { durationSec: 6 },
    ]; // Total: 24s

    const liteEstimate = estimateProjectCredits(sampleScenes, 'veo-3.1-lite');
    expect(liteEstimate.totalDurationSec).toBe(24);
    expect(liteEstimate.creditsEstimated).toBe(24);
    expect(liteEstimate.estimatedCostUsd).toBe(0.36);

    const proEstimate = estimateProjectCredits(sampleScenes, 'veo-3.1-pro');
    expect(proEstimate.creditsEstimated).toBe(120);
    expect(proEstimate.estimatedCostUsd).toBe(1.8);
  });

  it('4. generateStoryboard con brief de Grupo Novati, Fiserv y WhatsApp genera escenas con B-Roll y comparativa de costos', async () => {
    const brandProfile = {
      ...DEFAULT_CREATIVE_PROFILE,
      brandIdentity: { commercialName: 'Grupo Novati' },
    };

    const result = await generateStoryboard({
      brandProfile,
      clientName: 'Grupo Novati',
      objective: 'consultas',
      angle: 'fee_attack',
      customHook: '¿Tenés un e-commerce y seguís regalando hasta un 7% de cada venta en comisiones a Mercado Pago o Tienda Nube?',
      customPrompt: 'Quiero un video para e-commerce promocionando cobrar mas barato con el número de comercio de Fiserv y te hacemos la web.',
    });

    expect(result.success).toBe(true);
    expect(result.storyboard.scenes).toHaveLength(4);
    expect(result.storyboard.scenes[0].script.speechText).toContain('Mercado Pago o Tienda Nube');
    expect(result.storyboard.scenes[1].blockType).toBe('b_roll_fill');
    expect(result.storyboard.scenes[1].script.speechText).toContain('Fiserv');
    expect(result.storyboard.scenes[2].script.speechText).toContain('Grupo Novati');
    expect(result.storyboard.scenes[3].script.ctaText).toContain('WHATSAPP');
    expect(result.storyboard.scenes[0].continuityPack.environment).toBe('fintech_modern_office');
  });

  it('5. generateNextSceneWithContinuity propaga la transición, el ambiente y el tipo de bloque seleccionado', async () => {
    const previousScene = {
      sequence: 2,
      continuityPack: {
        lastFrameUrl: 'https://example.com/frame2.jpg',
        characterId: 'avatar_martina',
        environment: 'fintech_modern_office',
        lighting: 'studio_soft',
      },
    };

    const newSceneSpec = {
      sceneId: 'scene_03',
      blockType: 'b_roll_fill',
      transition: 'whip_pan',
      environment: 'fintech_modern_office',
      durationSec: 6,
      script: {
        speechText: 'Detalle de comisiones reales en terminal física.',
        visualPrompt: 'Plano macro de terminal Fiserv con tarjeta sin contacto.',
      },
    };

    const result = await generateNextSceneWithContinuity({
      previousScene,
      newSceneSpec,
      brandProfile: DEFAULT_CREATIVE_PROFILE,
    });

    expect(result.success).toBe(true);
    expect(result.scene.sequence).toBe(3);
    expect(result.scene.blockType).toBe('b_roll_fill');
    expect(result.scene.transition).toBe('whip_pan');
    expect(result.scene.continuityPack.environment).toBe('fintech_modern_office');
    expect(result.scene.continuityPack.inputFirstFrameUrl).toBe('https://example.com/frame2.jpg');
  });
});
