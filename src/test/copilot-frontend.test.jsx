import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CopilotPage } from '../pages/CopilotPage';
import * as AuthHook from '../hooks/useAuth';

describe('Stage 11 — Frontend AI Copilot UI & Chat Experience', () => {
  const mockSuggestions = [
    { id: 's1', category: 'Eficiencia', query: '¿Hay sobreinversión en Meta Ads este mes?' },
    { id: 's2', category: 'Aging', query: '¿Cómo está el saldo de cobranzas y aging?' },
  ];

  const mockClients = [
    { _id: 'c1', name: 'Perfumería Marion', status: 'active' },
  ];

  const mockAnswer = {
    shortAnswer: 'El ROAS actual es de 4.2x ($12,000 cobrados vs $2,850 invertidos). No se observa sobreinversión.',
    period: 'Últimos 30 días',
    tenantName: 'Perfumería Marion',
    currency: 'USD',
    attributionLevel: 'last_touch',
    confidence: 'high',
    numericalEvidence: [
      { label: 'Inversión Publicitaria Meta', value: '$2,850' },
      { label: 'Ingresos Cobrados', value: '$12,000' },
      { label: 'ROAS Atribuido', value: '4.2x' },
    ],
    suggestedActions: [
      'Mantener presupuesto en campañas con ROAS superior a 3.5x.',
      'Monitorear la saturación de creativos.',
    ],
    dashboardLink: '/app/campaigns',
    limitations: 'Basado exclusivamente en datos autorizados de CRM.',
  };

  beforeEach(() => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: {
        _id: 'usr_admin',
        uid: 'usr_admin',
        email: 'admin@animamkt.com',
        role: 'super_admin',
      },
      authLoading: false,
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';
      if (urlStr.includes('/api/clients')) {
        const payload = { clients: mockClients };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }
      if (urlStr.includes('/api/copilot/suggestions')) {
        const payload = { ok: true, suggestions: mockSuggestions };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }
      if (urlStr.includes('/api/copilot/query')) {
        const payload = { ok: true, answer: mockAnswer };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }
      const payload = { ok: true };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      });
    });
  });

  it('1. CopilotPage renderiza el título, disclaimer de seguridad y chips sugeridos', async () => {
    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Copiloto de Revenue Intelligence/i);
      expect(screen.getByText(/Modo Seguro Activo/i)).toBeInTheDocument();
      expect(screen.getByText(/Preguntas Estratégicas Sugeridas/i)).toBeInTheDocument();
    });
  });

  it('2. CopilotPage envía una consulta y renderiza la respuesta estructurada con evidencia numérica', async () => {
    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Copiloto de Revenue Intelligence/i);
    });

    // Type question and submit form
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '¿Hay sobreinversión en Meta Ads este mes?' } });
    fireEvent.submit(textarea.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/El ROAS actual es de 4.2x/i)).toBeInTheDocument();
      expect(screen.getByText(/Inversión Publicitaria Meta/i)).toBeInTheDocument();
      expect(screen.getAllByText(/\$2,850/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Ver en Dashboard/i)).toBeInTheDocument();
    });
  });
});
