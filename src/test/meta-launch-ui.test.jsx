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

describe('Stage 18 — Frontend Meta Ads Launch Engine UI Tests', () => {
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
                title: 'Video Ad Lead Gen',
                aspectRatio: '9:16',
                status: 'needs_review',
                scenes: [
                  {
                    sceneId: 'scene_01',
                    sequence: 1,
                    blockType: 'ai_avatar',
                    funnelRole: 'hook',
                    durationSec: 5,
                    script: { speechText: '¿Tu notebook se queda trabada?' },
                    continuityPack: { lastFrameUrl: 'https://example.com/frame1.jpg' },
                  },
                ],
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
              avatarProfiles: [{ id: 'avatar_martina', name: 'Martina', isDefault: true }],
              voiceProfiles: [{ id: 'voice_martina_01', name: 'Martina', isDefault: true }],
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
              performanceMetrics: {
                spend: 124500,
                leads: 84,
                closedSales: 14,
                roas: 146.1,
              },
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

  it('1. Renderiza el panel de lanzamiento a Meta Ads y los 18 checks de pre-vuelo', async () => {
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
      expect(screen.getByText(/Presupuesto bajo límite de seguridad/i)).toBeInTheDocument();
      expect(screen.getByText(/Crear Campaña Pausada/i)).toBeInTheDocument();
    });
  });

  it('2. Ejecuta la creación en estado PAUSED y despliega el Dashboard de Atribución a Ciclo Cerrado', async () => {
    render(
      <MemoryRouter>
        <VideoStudioPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Meta Ads Campaign Launch Engine/i));

    await waitFor(() => {
      expect(screen.getByText(/Crear Campaña Pausada/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Crear Campaña Pausada/i));

    await waitFor(() => {
      expect(screen.getByText(/Atribución a Ciclo Cerrado/i)).toBeInTheDocument();
      expect(screen.getByText(/146.1x/i)).toBeInTheDocument();
      expect(screen.getByText(/14 ventas/i)).toBeInTheDocument();
    });
  });
});
