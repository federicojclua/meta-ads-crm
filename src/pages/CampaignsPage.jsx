import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Megaphone,
  RefreshCw,
  Layers,
  Calendar,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { formatDate, formatCurrency, formatNumber } from '../lib/utils';
import { ConflictBanner } from '../components/meta/ConflictBanner';
import { MetaAssetManagerModal } from '../components/meta/MetaAssetManagerModal';

export function CampaignsPage() {
  const { userProfile } = useAuth();
  const { t, language } = useLanguage();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isAdmin = userProfile?.role === 'admin';
  const isGlobal = isSuperAdmin || isAdmin;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlClientId = searchParams.get('clientId') || '';

  const [selectedClientId, setSelectedClientId] = useState(urlClientId);
  const [selectedLevel, setSelectedLevel] = useState('campaign'); // 'summary', 'dataset', 'campaign', 'adset'
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateStop, setDateStop] = useState('');

  const [clients, setClients] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [insightsData, setInsightsData] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [metaStatus, setMetaStatus] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const activeRequestSeq = useRef(0);

  const activeClientId = isGlobal ? selectedClientId : userProfile?.clientId;
  const selectedClientDoc = clients.find(c => (c._id || c.id) === activeClientId);
  const tenantTimezone = selectedClientDoc?.timezone || 'America/Argentina/Buenos_Aires';

  // Sync state when URL params change
  useEffect(() => {
    if (urlClientId && urlClientId !== selectedClientId) {
      setSelectedClientId(urlClientId);
    }
  }, [urlClientId, selectedClientId]);

  // Load clients list for all roles (non-global gets their own client)
  useEffect(() => {
    apiClient.get('/api/clients')
      .then((res) => {
        const clientList = res.clients || [];
        setClients(clientList);
        if (isGlobal && !urlClientId && clientList.length > 0) {
          const defaultId = clientList[0].id || clientList[0]._id;
          setSelectedClientId(defaultId);
          setSearchParams({ clientId: defaultId });
        }
      })
      .catch((err) => {
        console.warn('[CAMPAIGNS] Error fetching clients:', err.message);
      });
  }, [isGlobal, urlClientId, setSearchParams]);

  // Check Meta connection status
  useEffect(() => {
    apiClient.get('/api/meta/status')
      .then((res) => {
        setMetaStatus(res);
      })
      .catch(() => {
        setMetaStatus({ configured: false });
      });
  }, []);

  // Fetch Meta assets and conflicts
  const fetchMetaAssets = useCallback(async () => {
    if (!isGlobal && userProfile?.role !== 'client') return;
    try {
      const res = await apiClient.get('/api/meta/assets');
      setAdAccounts(res.adAccounts || []);
      setDataSources(res.dataSources || []);
      setConflicts(res.conflicts || []);
    } catch (err) {
      console.warn('[CAMPAIGNS] Error fetching assets:', err.message);
    }
  }, [isGlobal, userProfile?.role]);

  useEffect(() => {
    fetchMetaAssets();
  }, [fetchMetaAssets]);

  // Fetch Insights data
  const fetchInsights = useCallback(async () => {
    const seq = ++activeRequestSeq.current;
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (isGlobal && selectedClientId) {
        queryParams.set('clientId', selectedClientId);
      }
      if (selectedLevel) {
        queryParams.set('level', selectedLevel);
      }
      if (selectedCurrency) {
        queryParams.set('currency', selectedCurrency);
      }
      if (dateStart) {
        queryParams.set('dateStart', dateStart);
      }
      if (dateStop) {
        queryParams.set('dateStop', dateStop);
      }

      const queryString = queryParams.toString();
      const endpoint = `/api/meta/insights${queryString ? `?${queryString}` : ''}`;
      const res = await apiClient.get(endpoint);

      if (seq === activeRequestSeq.current) {
        setInsightsData(res.results || []);
        setLastSyncedAt(res.lastSyncedAt || null);
        setIsLoading(false);
      }
    } catch (err) {
      if (seq === activeRequestSeq.current) {
        setError(err.message || 'Error al cargar métricas de Meta Ads.');
        setIsLoading(false);
      }
    }
  }, [isGlobal, selectedClientId, selectedLevel, selectedCurrency, dateStart, dateStop]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleClientChange = (e) => {
    const newId = e.target.value;
    setSelectedClientId(newId);
    if (newId) {
      setSearchParams({ clientId: newId });
    } else {
      setSearchParams({});
    }
  };

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await apiClient.post('/api/meta/sync', {
        lookbackDays: 7,
      });
      await fetchInsights();
      await fetchMetaAssets();
    } catch (err) {
      alert(`Error al sincronizar: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-brand-primary" />
            {t('campaigns.title')}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            {t('campaigns.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssetModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-brand-primary" />
              {t('campaigns.manageAssets')}
            </Button>
          )}

          {isSuperAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('campaigns.syncing') : t('campaigns.syncNow')}
            </Button>
          )}
        </div>
      </div>

      {/* Meta Config Status Banner */}
      {metaStatus && !metaStatus.configured && (
        <Alert variant="warning">
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              La integración con Meta Marketing API no se encuentra configurada en el servidor. El CRM opera normalmente en modo local/manual.
            </span>
          </div>
        </Alert>
      )}

      {/* Multi-Tenant Conflict Banner (if any) */}
      {isSuperAdmin && conflicts.length > 0 && (
        <ConflictBanner
          conflicts={conflicts}
          onResolveClick={() => setIsAssetModalOpen(true)}
        />
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Selector (for global users) */}
          {isGlobal && (
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                {t('campaigns.companyLabel')}
              </label>
              <select
                value={selectedClientId}
                onChange={handleClientChange}
                className="text-xs bg-gray-50 border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
              >
                <option value="" disabled>{t('campaigns.selectCompanyPlaceholder')}</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level Tabs */}
          <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-brand-border/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedLevel('summary')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedLevel === 'summary'
                  ? 'bg-white text-brand-primary font-bold shadow-subtle'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {t('campaigns.levelTabs.summary')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLevel('dataset')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedLevel === 'dataset'
                  ? 'bg-white text-brand-primary font-bold shadow-subtle'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {t('campaigns.levelTabs.dataset')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLevel('campaign')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedLevel === 'campaign'
                  ? 'bg-white text-brand-primary font-bold shadow-subtle'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {t('campaigns.levelTabs.campaign')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLevel('adset')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedLevel === 'adset'
                  ? 'bg-white text-brand-primary font-bold shadow-subtle'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {t('campaigns.levelTabs.adset')}
            </button>
          </div>

          {/* Currency Filter */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="text-xs bg-gray-50 border border-brand-border rounded-lg px-2 py-1.5 font-medium text-brand-text-primary"
          >
            <option value="">{t('campaigns.currencyAll')}</option>
            <option value="ARS">{t('campaigns.currencyArs')}</option>
            <option value="USD">{t('campaigns.currencyUsd')}</option>
          </select>

          {/* Date Range Filters */}
          <div className="flex items-center gap-1 text-xs text-brand-text-secondary">
            <span>{t('campaigns.from')}</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="text-xs bg-gray-50 border border-brand-border rounded-lg px-2 py-1 text-brand-text-primary"
            />
            <span>{t('campaigns.to')}</span>
            <input
              type="date"
              value={dateStop}
              onChange={(e) => setDateStop(e.target.value)}
              className="text-xs bg-gray-50 border border-brand-border rounded-lg px-2 py-1 text-brand-text-primary"
            />
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 text-[11px] text-brand-text-secondary">
          <Calendar className="w-3.5 h-3.5 text-brand-text-secondary" />
          <span>
            {lastSyncedAt
              ? `${t('campaigns.lastSync')} ${formatDate(lastSyncedAt, tenantTimezone, language === 'es' ? 'es-AR' : 'en-US')}`
              : t('campaigns.noSyncRecorded')}
          </span>
        </div>
      </div>

      {/* Content Area */}
      {error && (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={fetchInsights}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-brand-border">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-primary mx-auto mb-2" />
          <p className="text-xs font-bold text-brand-text-secondary">{t('campaigns.loading')}</p>
        </div>
      ) : insightsData.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t('campaigns.emptyTitle')}
          description={t('campaigns.emptyDesc')}
          actionLabel={isSuperAdmin ? t('campaigns.manageAssets') : undefined}
          onAction={isSuperAdmin ? () => setIsAssetModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-brand-border shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">
                    {selectedLevel === 'dataset' ? 'Píxel / Dataset' : selectedLevel === 'adset' ? 'Conjunto de Anuncios' : selectedLevel === 'summary' ? 'Divisa' : 'Campaña'}
                  </th>
                  {selectedLevel === 'campaign' && <th className="py-3 px-4">{t('campaigns.tableTh.status')}</th>}
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.metaSpend')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.metaClicks')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.metaLeads')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.metaCpl')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.crmLeads')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.crmCpl')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.crmSales')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.crmCollected')}</th>
                  <th className="py-3 px-4 text-right">{t('campaigns.tableTh.roasCollected')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {insightsData.map((row, idx) => {
                  const spend = row.metaSpend ?? (row.totalMetaSpend || 0);
                  const clicks = row.metaClicks ?? (row.totalMetaClicks || 0);
                  const metaLeads = row.metaLeadCount ?? 0;
                  const metaCpl = row.metaCostPerLead;
                  const crmLeads = row.crmAttributedLeads ?? (row.totalCrmLeads || null);
                  const crmCpl = row.cplCrm ?? (row.blendedCpl || null);
                  const crmSales = row.crmAttributedSales ?? (row.totalCrmWonSales || null);
                  const crmCollected = row.crmAttributedCollectedFormatted ?? (row.totalCrmCollectedFormatted || null);
                  const roas = row.roasCollected ?? (row.blendedRoas || null);

                  return (
                    <tr key={row.campaignId || row.datasetId || row.adsetId || idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-brand-text-primary">
                        {selectedLevel === 'dataset'
                          ? row.datasetName
                          : selectedLevel === 'adset'
                          ? row.adsetName
                          : selectedLevel === 'summary'
                          ? `Resumen General (${row.currency})`
                          : row.campaignName}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-brand-text-secondary">
                            {t('campaigns.badgeCurrency')} {row.currency}
                          </span>
                          {row.isBlended && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {t('campaigns.badgeBlended')}
                            </Badge>
                          )}
                          {row.dataRestricted && (
                            <Badge variant="warning" className="text-[9px] px-1.5 py-0 flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              {t('campaigns.badgeMixedCampaign')}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {selectedLevel === 'campaign' && (
                        <td className="py-3.5 px-4">
                          <Badge variant={row.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                            {row.status || 'PAUSED'}
                          </Badge>
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-brand-text-primary">
                        {formatCurrency(spend, selectedCurrency || 'ARS', language === 'es' ? 'es-AR' : 'en-US')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-brand-text-primary">
                        {formatNumber(clicks, language === 'es' ? 'es-AR' : 'en-US')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-brand-text-primary">
                        {metaLeads > 0 ? formatNumber(metaLeads, language === 'es' ? 'es-AR' : 'en-US') : <span className="text-gray-400 font-normal">—</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-brand-text-secondary">
                        {metaCpl ? formatCurrency(metaCpl, selectedCurrency || 'ARS', language === 'es' ? 'es-AR' : 'en-US') : <span className="text-gray-400 font-normal">—</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-brand-primary">
                        {crmLeads !== null ? formatNumber(crmLeads, language === 'es' ? 'es-AR' : 'en-US') : <span className="text-gray-400 font-normal text-[10px]">{t('campaigns.noAttribution')}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        {crmCpl !== null ? formatCurrency(crmCpl, selectedCurrency || 'ARS', language === 'es' ? 'es-AR' : 'en-US') : <span className="text-gray-400 font-normal text-[10px]">{t('campaigns.noAttribution')}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        {crmSales !== null ? formatNumber(crmSales, language === 'es' ? 'es-AR' : 'en-US') : <span className="text-gray-400 font-normal text-[10px]">{t('campaigns.noAttribution')}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                        {crmCollected !== null ? formatCurrency(crmCollected, selectedCurrency || 'ARS', language === 'es' ? 'es-AR' : 'en-US') : <span className="text-gray-400 font-normal text-[10px]">{t('campaigns.noAttribution')}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700">
                        {roas !== null ? `${roas}x` : <span className="text-gray-400 font-normal text-[10px]">{t('campaigns.noAttribution')}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Super Admin Asset Manager Modal */}
      {isSuperAdmin && (
        <MetaAssetManagerModal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          clients={clients}
          adAccounts={adAccounts}
          dataSources={dataSources}
          onAssetUpdated={() => {
            fetchMetaAssets();
            fetchInsights();
          }}
        />
      )}
    </div>
  );
}
