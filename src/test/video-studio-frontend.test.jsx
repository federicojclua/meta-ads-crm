import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoStudioPage } from '../pages/VideoStudioPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: {
      uid: 'user-123',
      email: 'admin@animamkt.com',
      role: 'admin',
      clientId: '65df11111111111111111111',
    },
    firebaseUser: { uid: 'user-123', email: 'admin@animamkt.com' },
  }),
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    t: (key) => key,
  }),
}));

describe('Stage 17 — Frontend Video Studio & Meta Launch Wizard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('/api/video-studio/projects')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            projects: [
              {
                id: 'proj_1',
                title: 'Video Ad Lead Gen — Lenovo ThinkPad',
                aspectRatio: '9:16',
                status: 'needs_review',
                scenes: [
                  {
                    sceneId: 'scene_01',
                    sequence: 1,
                    blockType: 'ai_avatar',
                    funnelRole: 'hook',
                    durationSec: 5,
                    script: { speechText: '¿Tu notebook se queda trabada?', onScreenText: 'NOTEBOOK LENTA' },
                    continuityPack: { lastFrameUrl: 'https://example.com/frame1.jpg' },
                  },
                  {
                    sceneId: 'scene_02',
                    sequence: 2,
                    blockType: 'organic_video',
                    funnelRole: 'problem',
                    durationSec: 6,
                    script: { speechText: 'Perdés horas de trabajo...', onScreenText: 'FRUSTRACIÓN' },
                    continuityPack: { lastFrameUrl: 'https://example.com/frame2.jpg' },
                  },
                ],
                storyboardSummary: {
                  hookAngle: 'Fricción de Rendimiento',
                  cplOptimizationTarget: '-35% Costo por Lead',
                },
              },
            ],
          }),
        });
      }

      if (urlStr.includes('/api/creative-profile')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            profile: {
              brandIdentity: { commercialName: 'Grupo Novati Tech' },
              avatarProfiles: [
                {
                  id: 'avatar_martina',
                  name: 'Martina (Asesora Comercial)',
                  role: 'Sales Presenter',
                  appearanceRules: 'Mujer profesional 28-35 años',
                  isDefault: true,
                },
              ],
              voiceProfiles: [
                { id: 'voice_martina_01', name: 'Martina (Comercial)', language: 'es-AR', speed: 1.0 },
              ],
            },
          }),
        });
      }

      if (urlStr.includes('/api/video-studio/winner-patterns')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            winnerPattern: {
              bestHookAngle: 'Fricción en primeros 2 segs',
              bestPresenter: 'Avatar Femenino (Martina)',
              bestPlacement: 'Instagram Reels (9:16)',
              cplReductionObserved: '-34.8% CPL',
            },
          }),
        });
      }

      if (urlStr.includes('/api/meta-launch/create-paused')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            ok: true,
            campaign: {
              id: 'launch_01',
              metaCampaignId: 'meta_camp_12345',
              name: 'Meta Lead Gen — Grupo Novati Tech',
              status: 'paused',
              dailyBudget: 25000,
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });
  });

  it('1. VideoStudioPage renderiza el título, las 4 pestañas y el timeline híbrido', async () => {
    render(
      <MemoryRouter>
        <VideoStudioPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Content & Lead Generation Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/Mixed Media Timeline & Editor/i)).toBeInTheDocument();
      expect(screen.getByText(/Avatares & Perfiles de Voz/i)).toBeInTheDocument();
      expect(screen.getByText(/Meta Ads Campaign Launch Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Lead Winner Mode & Control de Costos/i)).toBeInTheDocument();
      expect(screen.getAllByText(/notebook/i).length).toBeGreaterThan(0);
    });
  });

  it('2. VideoStudioPage navega a la pestaña de Meta Ads y crea la campaña en estado PAUSED', async () => {
    render(
      <MemoryRouter>
        <VideoStudioPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Meta Ads Campaign Launch Engine/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Meta Ads Campaign Launch Engine/i));

    await waitFor(() => {
      expect(screen.getByText(/Pre-Flight Check \(18\/18\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Crear Campaña Pausada/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Crear Campaña Pausada/i));

    await waitFor(() => {
      expect(screen.getByText(/meta_camp_12345/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirmar & Activar Campaña/i)).toBeInTheDocument();
    });
  });
});
