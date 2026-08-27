import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SocialAnalyzerPage } from '../pages/SocialAnalyzerPage';
import * as AuthHook from '../hooks/useAuth';
import * as ApiModule from '../lib/api';

describe('Stage 8 — Frontend Social Analyzer UI & Diagnostics Tests', () => {
  const mockSuperAdmin = {
    _id: 'usr_1',
    email: 'admin@animamkt.com',
    role: 'super_admin',
    displayName: 'Super Admin',
  };

  const mockClients = [
    { id: 'client_1', name: 'Perfumería Marion', status: 'active' },
  ];

  const mockSource = {
    id: 'src_101',
    _id: 'src_101',
    clientId: 'client_1',
    platform: 'instagram',
    sourceType: 'manual',
    accountUsername: 'marion_oficial',
    accountName: 'Perfumería Marion',
    biography: 'Perfumes importados y cosmética premium.',
    followersCount: 15400,
    followsCount: 320,
    mediaCount: 24,
    status: 'active',
    lastSyncedAt: new Date().toISOString(),
  };

  const mockAnalysis = {
    id: 'an_101',
    _id: 'an_101',
    clientId: 'client_1',
    sourceId: 'src_101',
    platform: 'instagram',
    accountUsername: 'marion_oficial',
    aiModel: 'gemini-2.0-flash',
    deterministicMetrics: {
      postsCount: 24,
      followersCount: 15400,
      followsCount: 320,
      cadence: {
        postsPerWeek: 3.2,
        postsPerMonth: 12.8,
        avgDaysBetweenPosts: 2.1,
        coverageDays: 60,
      },
      consistencyScore: 88,
      formatPercentages: { reel: 50, carousel: 30, image: 20 },
      totals: { likes: 3200, comments: 450, saves: 580, interactions: 4230, reach: 45000 },
      averages: { interactions: 176.3 },
      rates: { engagementRateOverReach: 9.4 },
    },
    aiReport: {
      executiveSummary: 'Perfil con excelente tasa de guardados y cadencia de publicación constante.',
      overallScore: 84,
      aiModel: 'gemini-2.0-flash',
      pillars: {
        presence: { score: 85, status: 'good', assessment: 'Perfil comercial optimizado.' },
        contentQuality: { score: 80, status: 'good', assessment: 'Predominio de video corto.' },
        cadenceAndConsistency: { score: 88, status: 'excellent', assessment: 'Frecuencia semanal constante.' },
        engagement: { score: 82, status: 'good', assessment: 'Comunidad altamente interactiva.' },
        growthOpportunities: { score: 85, status: 'good', assessment: 'Potencial de escalado comercial.' },
      },
      findings: [
        {
          type: 'strength',
          title: 'Alto Engagement en Reels',
          description: 'Los videos de demostración generan 60% más comentarios.',
          evidence: '9.4% ER sobre alcance.',
          priority: 'high',
        },
      ],
      actionPlan30Days: [
        {
          phase: 'Fase 1',
          timing: 'Días 1-10',
          action: 'Lanzar serie de Reels demostrativos',
          format: 'Reel',
          objective: 'Aumentar alcance',
          expectedImpact: '+30% alcance',
        },
      ],
      risksAndLimitations: ['Mantener la consistencia semanal para no perder el algoritmo.'],
    },
  };

  beforeEach(() => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: mockSuperAdmin,
      firebaseUser: { uid: 'fb_1', email: 'admin@animamkt.com' },
      loading: false,
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';
      if (urlStr.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (urlStr.includes('/api/social/sources')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, sources: [mockSource] }),
        });
      }
      if (urlStr.includes('/api/social/analyze/history')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, analyses: [mockAnalysis] }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });
  });

  it('1. SocialAnalyzerPage renderiza el perfil social, métricas deterministas y reporte IA', async () => {
    render(
      <MemoryRouter>
        <SocialAnalyzerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/marion_oficial/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Perfumería Marion/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Métricas Deterministas Verificadas/i)).toBeInTheDocument();
      expect(screen.getByText(/Diagnóstico Estratégico de Inteligencia Artificial/i)).toBeInTheDocument();
      expect(screen.getByText('84')).toBeInTheDocument();
      expect(screen.getByText(/Alto Engagement en Reels/i)).toBeInTheDocument();
      expect(screen.getByText(/Lanzar serie de Reels demostrativos/i)).toBeInTheDocument();
    });
  });

  it('2. SocialAnalyzerPage muestra EmptyState cuando no hay perfiles sociales conectados', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';
      if (urlStr.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (urlStr.includes('/api/social/sources')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, sources: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });

    render(
      <MemoryRouter>
        <SocialAnalyzerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sin Perfil Social Conectado')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
    });
  });

  it('3. SocialAnalyzerPage no ejecuta peticiones ni muestra errores mientras el perfil de autenticación está cargando', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: null,
      firebaseUser: null,
      loading: true,
    });

    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(
      <MemoryRouter>
        <SocialAnalyzerPage />
      </MemoryRouter>
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
