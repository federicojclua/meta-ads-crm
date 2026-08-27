import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  Target,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const DEFAULT_SUGGESTIONS = [
  {
    id: 'overspend',
    category: 'Eficiencia de Inversión',
    query: '¿Hay sobreinversión en Meta Ads este mes?',
  },
  {
    id: 'campaigns',
    category: 'Rendimiento Publicitario',
    query: '¿Cuáles son las campañas con mejor y peor ROAS atribuido?',
  },
  {
    id: 'funnel',
    category: 'Conversión de Leads',
    query: '¿Cuál es el CPL promedio y la tasa de cierre a ventas ganadas?',
  },
  {
    id: 'aging',
    category: 'Cobranzas y Aging',
    query: '¿Cómo está el saldo pendiente de cobro y las facturas vencidas a más de 30 días?',
  },
  {
    id: 'diagnostics',
    category: 'Diagnóstico Integral',
    query: '¿Qué acciones prioritarias tenemos según las reseñas de Google y presencia en redes?',
  },
];

export function CopilotPage() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const isGlobal = userProfile && ['super_admin', 'admin'].includes(userProfile.role);
  const clientScope = userProfile?.clientId || null;

  // Context Selectors
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [attributionModel, setAttributionModel] = useState('last_touch');

  // Chat State
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [errorBanner, setErrorBanner] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Initial Load: Clients and Suggestions
  useEffect(() => {
    if (isGlobal) {
      apiClient('/api/clients')
        .then((res) => {
          if (res?.clients) {
            const active = res.clients.filter((c) => c.status === 'active' || !c.status);
            setClients(active);
            if (active.length > 0) {
              setSelectedClientId(active[0]._id || active[0].id);
            }
          }
        })
        .catch((err) => console.warn('[COPILOT] Error loading clients:', err.message));
    } else if (clientScope) {
      setSelectedClientId(clientScope);
    }

    // Load suggested questions
    apiClient('/api/copilot/suggestions')
      .then((res) => {
        if (res?.ok && Array.isArray(res.suggestions)) {
          setSuggestions(res.suggestions);
        }
      })
      .catch((err) => console.warn('[COPILOT] Error loading suggestions:', err.message));
  }, [isGlobal, clientScope]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isQuerying]);

  // Handle Query Submission
  const handleSendQuery = async (queryToSend = null) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || isQuerying) return;

    const userMessage = {
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsQuerying(true);
    setErrorBanner(null);

    try {
      const payload = {
        query: q,
        clientId: isGlobal ? selectedClientId : clientScope,
        period: selectedPeriod === 'last_30_days' ? 'Últimos 30 días' : selectedPeriod === 'this_month' ? 'Este Mes' : 'Todo el Histórico',
        currency: selectedCurrency,
        attributionModel,
      };

      const res = await apiClient('/api/copilot/query', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.ok && res.answer) {
        const assistantMessage = {
          role: 'assistant',
          data: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(res?.error || t('copilot.errorQuery'));
      }
    } catch (err) {
      setErrorBanner(err.message || t('copilot.errorQuery'));
      const errorMsg = {
        role: 'assistant',
        data: {
          shortAnswer: 'Ocurrió un error al procesar la consulta con las herramientas analíticas del backend.',
          confidence: 'abstain',
          limitations: err.message,
          numericalEvidence: [],
          suggestedActions: ['Verificar la conexión con el servidor e intentar nuevamente.'],
          dashboardLink: '/app',
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopyAnalysis = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleFeedback = (idx, type) => {
    setFeedbackState((prev) => ({ ...prev, [idx]: type }));
  };

  const formatConfidenceVariant = (confidence) => {
    if (confidence === 'high') return 'success';
    if (confidence === 'medium') return 'primary';
    if (confidence === 'low') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Bot className="w-7 h-7 text-brand-primary" />
            {t('copilot.title')}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            {t('copilot.subtitle')}
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isGlobal && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase text-brand-text-secondary">
                {t('copilot.company')}:
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
              >
                {clients.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase text-brand-text-secondary">
              {t('copilot.period')}:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            >
              <option value="last_30_days">Últimos 30 días</option>
              <option value="this_month">Este Mes</option>
              <option value="all_time">Histórico Total</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase text-brand-text-secondary">
              {t('copilot.currency')}:
            </span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            >
              <option value="USD">USD ($)</option>
              <option value="ARS">ARS ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Safety & Read-Only Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t('copilot.readOnlyDisclaimer')}</span>
        </div>
        <Badge variant="warning" className="text-[10px] uppercase font-bold shrink-0">
          Modo Seguro Activo
        </Badge>
      </div>

      {/* Error Banner if any */}
      {errorBanner && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-xs font-bold hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Quick Suggested Questions Bar */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text-secondary block">
            {t('copilot.suggestedQuestions')}
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSendQuery(s.query)}
                disabled={isQuerying}
                className="text-xs bg-white hover:bg-brand-primary/5 hover:border-brand-primary border border-brand-border px-3 py-1.5 rounded-lg text-brand-text-primary transition-all font-medium flex items-center gap-1.5 shadow-2xs text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span>{s.query}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white border border-brand-border rounded-xl shadow-2xs flex flex-col min-h-[500px] h-[65vh]">
        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-brand-text-primary mb-1">
                Copiloto de Revenue Intelligence Listo
              </h3>
              <p className="text-xs text-brand-text-secondary mb-6 leading-relaxed">
                {t('copilot.emptyChat')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border">
                  <span className="text-xs font-bold text-brand-text-primary block mb-0.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    ROI & Finanzas
                  </span>
                  <span className="text-[11px] text-brand-text-secondary">
                    ROAS atribuido, cobros y aging de cuentas por cobrar.
                  </span>
                </div>
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border">
                  <span className="text-xs font-bold text-brand-text-primary block mb-0.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    Meta Ads & Leads
                  </span>
                  <span className="text-[11px] text-brand-text-secondary">
                    CPL, campañas más eficientes y tasas de conversión.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              if (msg.role === 'user') {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="bg-brand-primary text-white p-3.5 rounded-2xl rounded-tr-none max-w-xl shadow-2xs">
                      <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                      <span className="text-[10px] text-white/70 block mt-1 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              }

              const data = msg.data || {};
              const isCopied = copiedIndex === idx;
              const feedback = feedbackState[idx];

              return (
                <div key={idx} className="flex justify-start">
                  <div className="bg-[#FBFBFA] border border-brand-border p-5 rounded-2xl rounded-tl-none max-w-3xl w-full shadow-2xs space-y-4">
                    {/* Header metadata pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-brand-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-brand-text-primary">
                          {data.tenantName || 'Empresa'}
                        </span>
                        <Badge variant={formatConfidenceVariant(data.confidence)}>
                          {data.confidence === 'high'
                            ? t('copilot.confidenceHigh')
                            : data.confidence === 'medium'
                            ? t('copilot.confidenceMedium')
                            : data.confidence === 'low'
                            ? t('copilot.confidenceLow')
                            : t('copilot.confidenceAbstain')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-brand-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {data.period}
                        </span>
                        <span>•</span>
                        <span>{data.currency}</span>
                      </div>
                    </div>

                    {/* Short Executive Answer */}
                    <div className="text-xs text-brand-text-primary leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-brand-border/60">
                      {data.shortAnswer}
                    </div>

                    {/* Numerical Evidence Grid */}
                    {data.numericalEvidence && data.numericalEvidence.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                          {t('copilot.evidenceTitle')}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {data.numericalEvidence.map((ev, evIdx) => (
                            <div
                              key={evIdx}
                              className="bg-white p-2.5 rounded-lg border border-brand-border text-center shadow-2xs"
                            >
                              <span className="text-[10px] text-brand-text-secondary block truncate mb-0.5" title={ev.label}>
                                {ev.label}
                              </span>
                              <span className="text-sm font-extrabold text-brand-text-primary block">
                                {ev.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Actions Checklist */}
                    {data.suggestedActions && data.suggestedActions.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                          {t('copilot.actionsTitle')}
                        </span>
                        <ul className="space-y-1.5 text-xs text-brand-text-primary bg-white p-3 rounded-xl border border-brand-border/60">
                          {data.suggestedActions.map((act, actIdx) => (
                            <li key={actIdx} className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {actIdx + 1}
                              </span>
                              <span className="leading-snug">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer & Navigation Link */}
                    <div className="pt-2 border-t border-brand-border flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {data.dashboardLink && (
                          <Link
                            to={data.dashboardLink}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline bg-brand-primary/5 px-2.5 py-1 rounded-md border border-brand-primary/20"
                          >
                            {t('copilot.goToDashboard')}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <span className="text-[10px] text-brand-text-secondary">
                          {data.limitations}
                        </span>
                      </div>

                      {/* Feedback Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyAnalysis(data.shortAnswer, idx)}
                          className="p-1 text-brand-text-secondary hover:text-brand-text-primary rounded"
                          title={t('copilot.copied')}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleFeedback(idx, 'up')}
                          className={`p-1 rounded transition-colors ${
                            feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-brand-text-secondary hover:text-brand-text-primary'
                          }`}
                          title={t('copilot.helpful')}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(idx, 'down')}
                          className={`p-1 rounded transition-colors ${
                            feedback === 'down' ? 'text-red-600 bg-red-50' : 'text-brand-text-secondary hover:text-brand-text-primary'
                          }`}
                          title={t('copilot.notHelpful')}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking spinner */}
          {isQuerying && (
            <div className="flex justify-start">
              <div className="bg-[#FBFBFA] border border-brand-border p-4 rounded-2xl rounded-tl-none max-w-md flex items-center gap-2.5 text-xs text-brand-text-secondary">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
                <span>{t('copilot.thinking')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-brand-border bg-white rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={t('copilot.askPlaceholder')}
              disabled={isQuerying}
              className="flex-1 text-xs p-2.5 rounded-lg border border-brand-border bg-brand-bg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isQuerying || !inputQuery.trim()}
              className="flex items-center gap-1.5 text-xs px-4 py-2.5 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              {t('copilot.send')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
