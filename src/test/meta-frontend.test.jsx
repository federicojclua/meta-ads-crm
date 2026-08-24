import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CampaignsPage } from '../pages/CampaignsPage';
import { ConflictBanner } from '../components/meta/ConflictBanner';
import { MetaAssetManagerModal } from '../components/meta/MetaAssetManagerModal';
import * as AuthHook from '../hooks/useAuth';
import * as ApiModule from '../lib/api';

describe('Stage 4 — Frontend Meta Ads UI & Components Tests', () => {
  const mockSuperAdmin = {
    _id: 'usr_1',
    email: 'superadmin@animamkt.com',
    role: 'super_admin',
    displayName: 'Super Admin',
  };

  const mockClients = [
    { id: 'client_1', name: 'Perfumería Marion', status: 'active' },
    { id: 'client_2', name: 'Ferretería del Sur', status: 'active' },
  ];

  const mockCampaignInsights = [
    {
      campaignId: 'camp_101',
      campaignName: 'Campaña Primavera 2026',
      status: 'ACTIVE',
      currency: 'ARS',
      metaSpend: 150000.0,
      metaClicks: 4500,
      metaCtr: 3.2,
      metaCpc: 33.33,
      metaLeadCount: 30,
      metaCostPerLead: 5000.0,
      hasAttributionData: true,
      crmAttributedLeads: 25,
      cplCrm: 6000.0,
      crmAttributedSales: 8,
      crmAttributedCollectedFormatted: '450.000,00',
      roasCollected: 3.0,
    },
    {
      campaignId: 'camp_102',
      campaignName: 'Campaña Sin Atribución CRM',
      status: 'PAUSED',
      currency: 'USD',
      metaSpend: 500.0,
      metaClicks: 800,
      metaLeadCount: 0,
      metaCostPerLead: null,
      hasAttributionData: false,
      crmAttributedLeads: null,
      cplCrm: null,
      crmAttributedSales: null,
      crmAttributedCollectedFormatted: null,
      roasCollected: null,
    },
  ];

  beforeEach(() => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: mockSuperAdmin,
      firebaseUser: { uid: 'fb_1', email: 'superadmin@animamkt.com' },
      loading: false,
    });

    vi.spyOn(ApiModule.apiClient, 'get').mockImplementation((url) => {
      if (url === '/api/clients') {
        return Promise.resolve({ ok: true, clients: mockClients });
      }
      if (url === '/api/meta/status') {
        return Promise.resolve({
          ok: true,
          configured: true,
          connectionStatus: 'connected',
          apiVersion: 'v26.0',
        });
      }
      if (url === '/api/meta/assets') {
        return Promise.resolve({
          ok: true,
          adAccounts: [{ adAccountId: 'act_123', name: 'Cuenta Principal', currency: 'ARS' }],
          dataSources: [{ metaDatasetId: 'ds_123', name: 'Píxel Web', type: 'dataset' }],
          conflicts: [],
        });
      }
      if (url.startsWith('/api/meta/insights')) {
        return Promise.resolve({
          ok: true,
          level: 'campaign',
          results: mockCampaignInsights,
          lastSyncedAt: new Date().toISOString(),
        });
      }
      return Promise.resolve({ ok: true });
    });

    vi.spyOn(ApiModule.apiClient, 'post').mockResolvedValue({ ok: true });
  });

  // =========================================================================
  // 1. RENDERIZADO Y MÉTRICAS DE CAMPAÑAS
  // =========================================================================
  it('1.1 CampaignsPage renderiza la tabla de campañas con métricas de inversión y ROAS atribuido', async () => {
    render(
      <MemoryRouter>
        <CampaignsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campañas & Meta Ads')).toBeInTheDocument();
      expect(screen.getByText('Campaña Primavera 2026')).toBeInTheDocument();
      expect(screen.getByText('$150.000,00')).toBeInTheDocument();
      expect(screen.getByText('3x')).toBeInTheDocument();
      expect(screen.getByText('Campaña Sin Atribución CRM')).toBeInTheDocument();
    });
  });

  it('1.2 CampaignsPage muestra Sin atribución cuando no existen leads CRM vinculados', async () => {
    render(
      <MemoryRouter>
        <CampaignsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const nonAttributedElements = screen.getAllByText('Sin atribución');
      expect(nonAttributedElements.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. CONFLICT BANNER
  // =========================================================================
  it('2.1 ConflictBanner muestra alertas ante campañas mixtas', () => {
    const conflicts = [
      {
        conflictCode: 'MIXED_TENANT_CAMPAIGN',
        entityType: 'campaign',
        entityId: 'camp_mixed_99',
        details: 'Campaña contiene AdSets de 2 empresas diferentes.',
      },
    ];

    render(<ConflictBanner conflicts={conflicts} onResolveClick={() => {}} />);
    expect(screen.getByText(/conflicto\(s\) de asignación publicitaria/i)).toBeInTheDocument();
    expect(screen.getByText(/camp_mixed_99/)).toBeInTheDocument();
  });

  // =========================================================================
  // 3. ASSET MANAGER MODAL
  // =========================================================================
  it('3.1 MetaAssetManagerModal renderiza pestañas de asignación y alta manual', () => {
    render(
      <MetaAssetManagerModal
        isOpen={true}
        onClose={() => {}}
        clients={mockClients}
        adAccounts={[{ adAccountId: 'act_123', name: 'Cuenta Principal', currency: 'ARS' }]}
        dataSources={[{ metaDatasetId: 'ds_123', name: 'Píxel Web', type: 'dataset' }]}
        onAssetUpdated={() => {}}
      />
    );

    expect(screen.getByText('Administrador de Activos Meta Ads')).toBeInTheDocument();
    expect(screen.getByText('Asignar a Empresa')).toBeInTheDocument();
    expect(screen.getByText('Carga Manual de IDs')).toBeInTheDocument();
  });
});
