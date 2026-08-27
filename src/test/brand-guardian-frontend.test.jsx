import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreativeStudioPage } from '../pages/CreativeStudioPage';
import { LanguageProvider } from '../contexts/LanguageContext';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: { email: 'admin@animamkt.com', role: 'admin', client_id: 'client_123' },
  }),
}));

describe('Stages 16/17 Evolution — Frontend Brand Guardian UI Tests', () => {
  const mockCampaign = {
    id: 'camp_001',
    campaignName: 'Promo ThinkPad Pro',
    objective: 'vender',
    status: 'approved',
    version: 1,
    formats: ['1:1'],
    renderedAssets: [
      {
        id: 'asset_01',
        format: '1:1',
        brandComplianceScore: 94,
        complianceStatus: 'APPROVED',
        isGatekeeperPassed: true,
        svg: '<svg><text>ThinkPad Pro</text></svg>',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';

      if (urlStr.includes('/api/creative-studio/dna')) {
        const payload = {
          ok: true,
          profile: {
            brandName: 'Anima Store',
            logoUrl: 'https://example.com/logo.png',
            colorPalette: { primary: '#0F172A', secondary: '#3B82F6', accent: '#10B981', background: '#FFFFFF' },
            typography: { headingFont: 'Montserrat' },
            brandDna: { industry: 'tecnologia' },
            forbiddenElements: ['comic sans'],
          },
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      if (urlStr.includes('/api/creative-studio/products')) {
        const payload = { ok: true, products: [] };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      if (urlStr.includes('/api/creative-studio/campaigns')) {
        const payload = { ok: true, campaigns: [mockCampaign] };
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

  it('1. CreativeStudioPage renderiza el módulo y el catálogo correctamente con soporte de Brand Guardian', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <CreativeStudioPage />
        </LanguageProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Campaign Creative Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Catálogo de Productos/i)).toBeInTheDocument();
    });
  });
});
