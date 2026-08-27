import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GoogleIntelligencePage } from '../pages/GoogleIntelligencePage';
import * as AuthHook from '../hooks/useAuth';

describe('Stage 9 — Frontend Google Intelligence UI & Components Tests', () => {
  const mockClients = [
    { _id: 'client_1', name: 'Perfumería Marion', status: 'active' },
  ];

  const mockGoogleSource = {
    id: 'src_google_1',
    clientId: 'client_1',
    businessName: 'Perfumería Marion',
    category: 'Perfumería y Belleza',
    city: 'Córdoba',
    websiteUrl: 'https://marionperfumeria.com',
    googleBusinessProfile: {
      locationId: 'locations/12345',
      verified: true,
      rating: 4.8,
      userRatingsTotal: 38,
    },
    searchConsole: {
      siteUrl: 'https://marionperfumeria.com',
    },
    googleAnalytics4: {
      propertyId: 'ga4_999888',
    },
    googleAds: {
      customerId: '123-456-7890',
    },
  };

  const mockReviews = [
    {
      id: 'rev_1',
      reviewerName: 'Agustina Rossi',
      rating: 5,
      comment: 'Excelente atención y fragancias originales.',
      reviewDate: '2026-08-20T10:00:00Z',
      replyStatus: 'unanswered',
      replyText: '',
    },
  ];

  const mockCompetitors = [
    {
      id: 'comp_1',
      name: 'Perfumería Competidora',
      category: 'Perfumería',
      rating: 4.3,
      userRatingsTotal: 65,
    },
  ];

  beforeEach(() => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: {
        _id: 'user_admin',
        email: 'admin@animamkt.com',
        role: 'admin',
        clientId: 'client_1',
      },
      firebaseUser: { uid: 'user_admin' },
      loading: false,
    });
  });

  it('1. GoogleIntelligencePage renderiza métricas de presencia en Google, tabs y tarjetas de servicio', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';
      if (urlStr.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (urlStr.includes('/api/google/sources')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, sources: [mockGoogleSource] }),
        });
      }
      if (urlStr.includes('/api/google/reviews')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, reviews: mockReviews }),
        });
      }
      if (urlStr.includes('/api/google/competitors')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, competitors: mockCompetitors }),
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
        <GoogleIntelligencePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Google Intelligence/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Google Business Profile/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Search Console/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Google Analytics 4/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Google Ads/i).length).toBeGreaterThan(0);
    });
  });

  it('2. GoogleIntelligencePage navega a la pestaña de Reseñas y renderiza las calificaciones', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';
      if (urlStr.includes('/api/clients')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ clients: mockClients }) });
      if (urlStr.includes('/api/google/sources')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true, sources: [mockGoogleSource] }) });
      if (urlStr.includes('/api/google/reviews')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true, reviews: mockReviews }) });
      if (urlStr.includes('/api/google/competitors')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true, competitors: mockCompetitors }) });
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) });
    });

    render(
      <MemoryRouter>
        <GoogleIntelligencePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Ficha & Reseñas/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Ficha & Reseñas/i));

    await waitFor(() => {
      expect(screen.getByText(/Agustina Rossi/i)).toBeInTheDocument();
      expect(screen.getByText(/Excelente atención y fragancias originales/i)).toBeInTheDocument();
      expect(screen.getByText(/Sugerir Respuesta con IA/i)).toBeInTheDocument();
    });
  });

  it('3. GoogleIntelligencePage muestra EmptyState limpio sin alertas de error cuando no hay fuentes conectadas', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';
      if (urlStr.includes('/api/clients')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ clients: mockClients }) });
      if (urlStr.includes('/api/google/sources')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true, sources: [] }) });
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) });
    });

    render(
      <MemoryRouter>
        <GoogleIntelligencePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Sin Perfil de Google Conectado/i)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
