import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  HelpCircle,
  FileQuestion,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Tag,
  Check,
  ChevronRight,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
  Layers,
  Package,
  ShieldAlert,
  ShoppingBag,
  BookOpen,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { apiClient } from '../lib/api';
import { formatDate } from '../lib/utils';
import { DEFAULT_AI_BRAIN, BUSINESS_PRESETS } from '../../models/AiBrain.js';
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS } from '../../models/KnowledgeFaq.js';

const FRONTEND_MASTER_DOC_TEMPLATE = `# [Nombre del Producto o Negocio] — Argumentario Comercial y Guía de Venta

> **Metadata**
> - source: Documento Oficial de Ventas
> - country: AR · industry: General
> - audience: comprador, comercial · allowed_for: sales, support
> - priority: 10
> - last_checked: 2026-10-08

## 1. Pitch Comercial Corto
[Explica en 2 oraciones qué resuelve el producto o servicio y cuál es su mayor valor diferencial para despertar interés de inmediato.]

## 2. Beneficios Concretos a Comunicar
- **Beneficio Principal 1**: [Ahorro directo, tiempo, velocidad o conveniencia]
- **Beneficio Principal 2**: [Garantía, respaldo de marca, calidad o soporte postventa]
- **Condiciones y Facilidades**: [Planes de cuotas sin interés, promociones activas, envíos gratis o bonificaciones]

## 3. Objeciones Frecuentes y Cómo Responder
### "¿Por qué debería elegir esto y no a la competencia?"
- **Estrategia**: Resaltar la calidad integral, garantía oficial y atención personalizada.
- **Respuesta**: [Argumento contundente destacando la durabilidad, servicio postventa y facilidades de pago].

### "¿Tienen financiación o cuotas?"
- **Estrategia**: Ofrecer inmediatamente el plan de cuotas y facilidades de pago.
- **Respuesta**: [Detalle de las opciones de pago en cuotas fijas o medios de pago disponibles].

### "Me parece caro / Estoy evaluando otras opciones"
- **Estrategia**: Reencuadrar la inversión respecto al ahorro o rendimiento.
- **Respuesta**: [Comparación costo-beneficio y propuesta de asesoramiento a medida].

## 4. Flujo de Calificación e Indagación Previa
Antes de dar precio final o cerrar:
1. Indagar la necesidad puntual del cliente (ej. para qué uso lo requiere, tamaño de familia o negocio).
2. Preguntar su medio de pago preferido para aplicar la mejor promoción disponible.
3. Proponer el cierre o la derivación inmediata a un asesor humano si requiere atención personalizada.
`;

function auditDocumentFormat(content = '') {
  const hasH1 = /^#\s+[^\n]+/m.test(content);
  const hasMetadata = /Metadata/i.test(content) && /allowed_for/i.test(content);
  const hasBenefits = /beneficio|ventaja|propuesta de valor|característica|pitch/i.test(content);
  const hasObjections = /objeci[oó]n|cómo responder|dudas|pregunta|competencia|caro/i.test(content);
  const hasIndagacion = /indagaci[oó]n|calificaci[oó]n|flujo|antes de|cerrar/i.test(content);

  let score = 100;
  if (!hasH1) score -= 20;
  if (!hasMetadata) score -= 25;
  if (!hasBenefits) score -= 25;
  if (!hasObjections) score -= 20;
  if (!hasIndagacion) score -= 10;
  score = Math.max(0, score);

  return {
    score,
    hasH1,
    hasMetadata,
    hasBenefits,
    hasObjections,
    hasIndagacion,
    statusText: score >= 90 ? 'Formato Comercial Óptimo' : score >= 60 ? 'Formato Aceptable' : 'Incompleto',
  };
}

export function AssistantConfigPage() {
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') || '';

  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const isGlobal = userProfile && ['super_admin', 'admin'].includes(userProfile.role);

  // Tenant state
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const activeClientId = isGlobal ? selectedClientId : userProfile?.clientId;

  // Active view tab
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'faqs' | 'unanswered'

  // Loading & feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Brain Configuration State
  const [brainConfig, setBrainConfig] = useState({ ...DEFAULT_AI_BRAIN });

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [newFaqForm, setNewFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
  });

  // Unanswered Queries State ("Lo que no supo")
  const [unansweredQueries, setUnansweredQueries] = useState([]);
  const [isLoadingUnanswered, setIsLoadingUnanswered] = useState(false);
  const [teachingQuery, setTeachingQuery] = useState(null);
  const [teachAnswer, setTeachAnswer] = useState('');
  const [teachCategory, setTeachCategory] = useState('general');

  // Knowledge Documents State (Universal Model)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFormData, setDocFormData] = useState({
    id: '',
    title: '',
    filename: '',
    category: 'ventas',
    priority: 10,
    content: '',
  });
  const [docFilterSearch, setDocFilterSearch] = useState('');

  // Simulator State
  const [simulatorMessages, setSimulatorMessages] = useState([
    {
      role: 'model',
      text: '¡Hola! Soy el asistente virtual de Grupo Novati en Tucumán. ¿En qué te puedo asesorar hoy?',
    },
  ]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [isSimulatorSending, setIsSimulatorSending] = useState(false);
  const simulatorEndRef = useRef(null);

  // 1. Fetch Clients (for super admin)
  const fetchClients = useCallback(async () => {
    if (authLoading || !firebaseUser || !isGlobal) return;
    try {
      const data = await apiClient.get('/api/clients');
      const clientsList = data.clients || [];
      setClients(clientsList);
      if (clientsList.length > 0 && !selectedClientId) {
        if (initialClientId && clientsList.some((c) => (c.id || c._id) === initialClientId)) {
          setSelectedClientId(initialClientId);
        } else {
          setSelectedClientId(clientsList[0].id || clientsList[0]._id);
        }
      }
    } catch (err) {
      console.warn('[ASSISTANT] Error fetching clients:', err.message);
    }
  }, [authLoading, firebaseUser, isGlobal, initialClientId, selectedClientId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // 2. Fetch Assistant Config & FAQs
  const fetchAssistantData = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const q = activeClientId ? `?clientId=${encodeURIComponent(activeClientId)}` : '';
      const data = await apiClient.get(`/api/assistant${q}`);
      if (data?.brain) {
        setBrainConfig(data.brain);
      }
      if (data?.faqs) {
        setFaqs(data.faqs);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al cargar la configuración del asistente.' });
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, firebaseUser, activeClientId]);

  // 3. Fetch Unanswered Queries ("Lo que no supo")
  const fetchUnansweredQueries = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    setIsLoadingUnanswered(true);
    try {
      const q = activeClientId ? `?clientId=${encodeURIComponent(activeClientId)}` : '';
      const data = await apiClient.get(`/api/assistant/unanswered${q}`);
      setUnansweredQueries(data.queries || []);
    } catch (err) {
      console.warn('[ASSISTANT] Error fetching unanswered queries:', err.message);
    } finally {
      setIsLoadingUnanswered(false);
    }
  }, [authLoading, firebaseUser, activeClientId]);

  useEffect(() => {
    fetchAssistantData();
    fetchUnansweredQueries();
  }, [fetchAssistantData, fetchUnansweredQueries]);

  // 4. Save Brain Configuration
  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const q = activeClientId ? `?clientId=${encodeURIComponent(activeClientId)}` : '';
      const res = await apiClient.put(`/api/assistant${q}`, brainConfig);
      if (res?.brain) {
        setBrainConfig(res.brain);
        setFeedback({
          type: 'success',
          message: 'Configuración del asistente guardada y aplicada inmediatamente en el bot de WhatsApp.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al guardar la configuración.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Toggle Commercial Plan Offer
  const handleToggleOffer = (offerId) => {
    setBrainConfig((prev) => {
      const updatedPlan = (prev.commercialPlan || []).map((o) =>
        o.id === offerId ? { ...o, isActive: !o.isActive } : o
      );
      return { ...prev, commercialPlan: updatedPlan };
    });
  };

  // 6. Add Behavioral Rule
  const handleAddRule = () => {
    const newRuleText = window.prompt('Ingresá una nueva regla de comportamiento para el asistente:');
    if (newRuleText && newRuleText.trim()) {
      setBrainConfig((prev) => ({
        ...prev,
        rules: [...(prev.rules || []), newRuleText.trim()],
      }));
    }
  };

  // 7. Remove Behavioral Rule
  const handleRemoveRule = (indexToRemove) => {
    setBrainConfig((prev) => ({
      ...prev,
      rules: (prev.rules || []).filter((_, i) => i !== indexToRemove),
    }));
  };

  // 8. Create FAQ
  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!newFaqForm.question.trim() || !newFaqForm.answer.trim()) return;

    try {
      const payload = {
        ...newFaqForm,
        clientId: activeClientId,
      };
      const res = await apiClient.post('/api/assistant/teach', payload);
      if (res?.faq) {
        setFaqs((prev) => [res.faq, ...prev]);
        setIsFaqModalOpen(false);
        setNewFaqForm({ question: '', answer: '', category: 'general' });
        setFeedback({ type: 'success', message: 'Pregunta frecuente guardada en la base de conocimiento.' });
      }
    } catch (err) {
      alert(err.message || 'Error al guardar la FAQ.');
    }
  };

  // 9. Delete FAQ
  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm('¿Seguro que deseás eliminar esta pregunta frecuente?')) return;
    try {
      await apiClient.delete(`/api/assistant/faqs/${faqId}`);
      setFaqs((prev) => prev.filter((f) => f.id !== faqId));
    } catch (err) {
      alert(err.message || 'Error al eliminar la FAQ.');
    }
  };

  // 9B. Apply Business Preset (Universal Model 1-Click Template)
  const handleApplyPreset = (presetKey) => {
    const preset = BUSINESS_PRESETS[presetKey];
    if (!preset) return;

    setBrainConfig((prev) => ({
      ...prev,
      businessName: preset.businessName,
      businessDescription: preset.businessDescription,
      tone: preset.tone,
      industryAndTone: preset.industryAndTone,
      coverageZone: preset.coverageZone,
      contactInfo: preset.contactInfo || prev.contactInfo,
      productsCatalog: preset.productsCatalog || [],
      commercialPlan: preset.commercialPlan || [],
      objectionPlaybook: preset.objectionPlaybook || [],
      rules: preset.rules || prev.rules,
      activePreset: presetKey,
    }));

    setSimulatorMessages([
      {
        role: 'model',
        text:
          presetKey === 'electro_lavarropas'
            ? '¡Hola! Soy el asesor de ElectroHogar. Tenemos modelos automáticos de carga frontal y superior con hasta 12 cuotas sin interés y flete bonificado. ¿Cuántas personas son en tu familia y qué tipo de carga buscás?'
            : '¡Hola! Soy el asistente virtual de Grupo Novati en Tucumán. ¿En qué te puedo asesorar hoy?',
      },
    ]);

    setFeedback({
      type: 'success',
      message: `Plantilla comercial "${preset.name}" cargada. Podés probar el modelo en el simulador o guardar los cambios.`,
    });
  };

  const handleAddProduct = () => {
    const newProd = {
      id: `prod_${Date.now()}`,
      name: 'Nuevo Producto / Modelo',
      category: 'General',
      price: '$0 (o cuotas fijas)',
      highlights: 'Descripción y beneficios clave',
      bestFor: 'Público objetivo',
    };
    setBrainConfig((prev) => ({
      ...prev,
      productsCatalog: [...(prev.productsCatalog || []), newProd],
    }));
  };

  const handleUpdateProduct = (index, field, value) => {
    setBrainConfig((prev) => {
      const list = [...(prev.productsCatalog || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, productsCatalog: list };
    });
  };

  const handleRemoveProduct = (index) => {
    setBrainConfig((prev) => {
      const list = [...(prev.productsCatalog || [])];
      list.splice(index, 1);
      return { ...prev, productsCatalog: list };
    });
  };

  const handleAddObjection = () => {
    const newObj = {
      id: `obj_${Date.now()}`,
      trigger: 'objecion_comun',
      objection: 'Objeción frecuente del cliente (ej. precio o competencia)',
      strategy: 'Estrategia comercial para rebatir',
      recommendedResponse: 'Respuesta sugerida con astucia comercial',
    };
    setBrainConfig((prev) => ({
      ...prev,
      objectionPlaybook: [...(prev.objectionPlaybook || []), newObj],
    }));
  };

  const handleUpdateObjection = (index, field, value) => {
    setBrainConfig((prev) => {
      const list = [...(prev.objectionPlaybook || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, objectionPlaybook: list };
    });
  };

  const handleRemoveObjection = (index) => {
    setBrainConfig((prev) => {
      const list = [...(prev.objectionPlaybook || [])];
      list.splice(index, 1);
      return { ...prev, objectionPlaybook: list };
    });
  };

  // 10. Teach Response to Unanswered Query ("Lo que no supo")
  const handleTeachResponse = async (e) => {
    e.preventDefault();
    if (!teachingQuery || !teachAnswer.trim()) return;

    try {
      const payload = {
        question: teachingQuery.question,
        answer: teachAnswer.trim(),
        category: teachCategory,
        unansweredQueryId: teachingQuery.id,
        clientId: activeClientId,
      };
      const res = await apiClient.post('/api/assistant/teach', payload);
      if (res?.faq) {
        setFaqs((prev) => [res.faq, ...prev]);
        setUnansweredQueries((prev) =>
          prev.map((q) => (q.id === teachingQuery.id ? { ...q, status: 'aprendido' } : q))
        );
        setTeachingQuery(null);
        setTeachAnswer('');
        setFeedback({
          type: 'success',
          message: `¡Aprendido! El asistente ahora responderá automáticamente a consultas similares.`,
        });
      }
    } catch (err) {
      alert(err.message || 'Error al enseñar la respuesta.');
    }
  };

  // 11. Simulator: Send Message
  const handleSimulatorSend = async (e) => {
    e.preventDefault();
    const text = simulatorInput.trim();
    if (!text || isSimulatorSending) return;

    const userMsg = { role: 'user', text };
    const updatedHistory = [...simulatorMessages, userMsg];
    setSimulatorMessages(updatedHistory);
    setSimulatorInput('');
    setIsSimulatorSending(true);

    try {
      const res = await apiClient.post('/api/assistant/test', {
        message: text,
        chatHistory: simulatorMessages,
        clientId: activeClientId,
        brainOverride: brainConfig,
      });

      if (res?.reply) {
        setSimulatorMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: res.reply,
            decision: res.decision,
          },
        ]);
      }
    } catch (err) {
      setSimulatorMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Error en el simulador: ' + (err.message || 'No se pudo generar respuesta.'),
          isError: true,
        },
      ]);
    } finally {
      setIsSimulatorSending(false);
    }
  };

  // Scroll simulator
  useEffect(() => {
    if (typeof simulatorEndRef.current?.scrollIntoView === 'function') {
      simulatorEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulatorMessages]);

  // Knowledge Documents Handlers (Universal Model)
  const handleOpenNewDoc = (useTemplate = false) => {
    setDocFormData({
      id: '',
      title: useTemplate ? 'Guía Comercial del Producto' : '',
      filename: useTemplate ? 'guia_comercial.md' : '',
      category: 'ventas',
      priority: 10,
      content: useTemplate ? FRONTEND_MASTER_DOC_TEMPLATE : '',
    });
    setIsDocModalOpen(true);
  };

  const handleEditDoc = (doc) => {
    setDocFormData({
      id: doc.id,
      title: doc.title || '',
      filename: doc.filename || '',
      category: doc.category || 'ventas',
      priority: typeof doc.priority === 'number' ? doc.priority : 10,
      content: doc.content || '',
    });
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = async (e) => {
    if (e) e.preventDefault();
    if (!docFormData.content.trim()) return;

    const audit = auditDocumentFormat(docFormData.content);
    const titleMatch = docFormData.content.match(/^#\s+(.+)$/m);
    const title = (docFormData.title || (titleMatch ? titleMatch[1].trim() : '') || 'Documento Comercial').trim();
    const docId = docFormData.id || `doc_${Date.now()}`;

    const newDoc = {
      id: docId,
      title,
      filename: docFormData.filename || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`,
      category: docFormData.category || 'ventas',
      audience: 'comprador',
      allowedFor: ['sales', 'support'],
      priority: Number(docFormData.priority) || 10,
      formatScore: audit.score,
      formatStatus: audit.statusText,
      content: docFormData.content,
      updatedAt: new Date().toISOString(),
    };

    const currentDocs = [...(brainConfig.knowledgeDocuments || [])];
    const existingIdx = currentDocs.findIndex((d) => d.id === docId);
    if (existingIdx >= 0) {
      currentDocs[existingIdx] = newDoc;
    } else {
      currentDocs.push(newDoc);
    }

    const updatedBrain = {
      ...brainConfig,
      knowledgeDocuments: currentDocs,
    };
    setBrainConfig(updatedBrain);
    setIsDocModalOpen(false);

    try {
      const q = activeClientId ? `?clientId=${encodeURIComponent(activeClientId)}` : '';
      await apiClient.post(`/api/assistant/documents${q}`, newDoc);
      setFeedback({
        type: 'success',
        message: `Documento "${title}" guardado con ${audit.statusText} (${audit.score}%).`,
      });
    } catch (err) {
      console.warn('[ASSISTANT] Error saving doc via API, saved in local brain state:', err.message);
    }
  };

  const handleDeleteDoc = async (docId) => {
    const currentDocs = (brainConfig.knowledgeDocuments || []).filter((d) => d.id !== docId);
    setBrainConfig({
      ...brainConfig,
      knowledgeDocuments: currentDocs,
    });

    try {
      const q = activeClientId ? `?clientId=${encodeURIComponent(activeClientId)}` : '';
      await apiClient.delete(`/api/assistant/documents/${docId}${q}`);
      setFeedback({
        type: 'success',
        message: 'Documento eliminado de la base de conocimiento.',
      });
    } catch (err) {
      console.warn('[ASSISTANT] Error deleting doc via API:', err.message);
    }
  };

  const filteredFaqs = faqs.filter((f) => {
    if (!faqSearch.trim()) return true;
    const q = faqSearch.toLowerCase();
    return (
      (f.question || '').toLowerCase().includes(q) ||
      (f.answer || '').toLowerCase().includes(q)
    );
  });

  const pendingUnansweredCount = unansweredQueries.filter((q) => q.status === 'pendiente').length;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <Alert
          variant={feedback.type === 'error' ? 'error' : 'success'}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-brand-text-primary tracking-tight">
              Configuración del Asistente IA
            </h1>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Definí qué sabe el bot, cómo habla, sus ofertas comerciales y enseñale respuestas a lo que no supo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGlobal && clients.length > 0 && (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs border border-brand-border rounded-lg bg-white px-2.5 py-1.5 font-medium text-brand-text-primary"
            >
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name || 'Empresa'}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssistantData}
            disabled={isLoading}
            className="h-8 px-2.5"
            title="Recargar"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </Button>
        </div>
      </div>

      {/* Main Container: 2 Columns (Tabs Form on Left + Live Simulator on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN (7 COLS): TABS CONFIG, FAQS & UNANSWERED                      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset Selector Banner (Universal Model 1-Click Templates) */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-3.5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-indigo-800/40">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modelo Comercial Universal (Plantillas de 1-Clic)</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Copiá la astucia vendedora para cualquier rubro (ej. Terminales Clover vs Electrodomésticos / Lavarropas).
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleApplyPreset('novati_posberry')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  brainConfig.businessName?.includes('Novati')
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs'
                    : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
                }`}
              >
                🟢 POSBerry / Clover
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('electro_lavarropas')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  brainConfig.businessName?.includes('Electro')
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                    : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
                }`}
              >
                🔵 Electro / Lavarropas
              </button>
            </div>
          </div>

          {/* Tabs Switcher */}
          <div className="flex border-b border-brand-border bg-white rounded-t-xl px-4 pt-2 shadow-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'config'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Personalidad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'products'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Catálogo ({(brainConfig.productsCatalog || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('objections')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'objections'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Objeciones ({(brainConfig.objectionPlaybook || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'knowledge'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Base de Conocimiento ({(brainConfig.knowledgeDocuments || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faqs')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'faqs'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Preguntas ({faqs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unanswered')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'unanswered'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <FileQuestion className="w-4 h-4 text-amber-600" />
              <span>Lo que no supo</span>
              {pendingUnansweredCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {pendingUnansweredCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: ASISTENTE CONFIG */}
          {activeTab === 'config' && (
            <div className="bg-white border border-brand-border rounded-b-xl p-5 shadow-xs space-y-6">
              {/* Identity & Voice */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-700" />
                  Identidad Comercial & Tono de Voz
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Nombre Comercial</label>
                    <Input
                      value={brainConfig.businessName || ''}
                      onChange={(e) => setBrainConfig({ ...brainConfig, businessName: e.target.value })}
                      placeholder="Ej: Grupo Novati"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-brand-text-primary mb-1">Zona de Cobertura</label>
                    <Input
                      value={brainConfig.coverageZone || ''}
                      onChange={(e) => setBrainConfig({ ...brainConfig, coverageZone: e.target.value })}
                      placeholder="Ej: Provincia de Tucumán, Argentina"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-brand-text-primary mb-1">
                    Descripción del Negocio & Actividad
                  </label>
                  <textarea
                    value={brainConfig.businessDescription || ''}
                    onChange={(e) => setBrainConfig({ ...brainConfig, businessDescription: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    placeholder="Representantes autorizados de Fiserv / Clover en Tucumán..."
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-brand-text-primary mb-1">Tono de Atención</label>
                  <select
                    value={brainConfig.tone || 'cercano_de_vos'}
                    onChange={(e) => setBrainConfig({ ...brainConfig, tone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="cercano_de_vos">Cercano y de vos (Recomendado para ventas en Tucumán)</option>
                    <option value="formal_usted">Formal y corporativo (de usted)</option>
                    <option value="tecnico_conciso">Técnico y conciso</option>
                  </select>
                </div>
              </div>

              {/* Commercial Plan / Active Offers Matrix */}
              <div className="space-y-3 border-t border-brand-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    Planes Comerciales & Promociones Activas
                  </h3>
                  <span className="text-[10px] text-brand-text-secondary">
                    {(brainConfig.commercialPlan || []).filter((o) => o.isActive).length} activas
                  </span>
                </div>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  El asistente evalúa a cada cliente según estas preguntas y condiciones antes de ofrecer precios o comisiones bonificadas.
                </p>

                <div className="space-y-3">
                  {(brainConfig.commercialPlan || []).map((offer) => (
                    <div
                      key={offer.id}
                      className={`p-3.5 border rounded-xl transition-all ${
                        offer.isActive
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-slate-200 bg-slate-50/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-brand-text-primary">
                            {offer.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              offer.isActive
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {offer.isActive ? 'Activa' : 'Pausada'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleOffer(offer.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border transition-colors ${
                            offer.isActive
                              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {offer.isActive ? 'Desactivar' : 'Activar Promo'}
                        </button>
                      </div>

                      <div className="text-[11px] space-y-1 text-slate-600">
                        <p>
                          <strong className="text-slate-800">¿Para quién es?:</strong> {offer.target}
                        </p>
                        <p>
                          <strong className="text-slate-800">Pregunta de filtro:</strong>{' '}
                          <span className="italic">{offer.qualificationQuestion}</span>
                        </p>
                        <p>
                          <strong className="text-slate-800">A quién NO ofrecer:</strong> {offer.exclusion}
                        </p>
                      </div>

                      {/* Benefits bullets */}
                      <div className="mt-2.5 pt-2 border-t border-brand-border/60">
                        <span className="text-[10px] font-bold uppercase text-brand-text-secondary block mb-1">
                          Beneficios incluidos:
                        </span>
                        <ul className="text-[11px] space-y-0.5 text-slate-700 list-disc list-inside">
                          {(offer.benefits || []).map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavioral Rules */}
              <div className="space-y-3 border-t border-brand-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Reglas de Oro & Seguridad
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRule}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Regla</span>
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {(brainConfig.rules || []).map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-brand-border rounded-lg text-xs"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="font-bold text-slate-400 text-[10px]">{idx + 1}.</span>
                        <span className="text-slate-700">{rule}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-brand-border">
                <Button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB: CATÁLOGO DE PRODUCTOS / SERVICIOS */}
          {activeTab === 'products' && (
            <div className="bg-white border border-brand-border rounded-b-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    Catálogo de Productos y Soluciones (Modelo Universal)
                  </h3>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Definí los productos, precios y facilidades de pago para que el bot los ofrezca con precisión y astucia.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddProduct}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Producto</span>
                </Button>
              </div>

              <div className="space-y-4">
                {(brainConfig.productsCatalog || []).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-brand-border rounded-xl text-brand-text-secondary space-y-2">
                    <Package className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-medium">No hay productos cargados en el catálogo.</p>
                    <p className="text-[11px] text-slate-400">Podés agregar productos manualmente o cargar una plantilla predefinida.</p>
                  </div>
                ) : (
                  (brainConfig.productsCatalog || []).map((product, pIdx) => (
                    <div
                      key={product.id || pIdx}
                      className="border border-brand-border rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-brand-border/60 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-extrabold text-indigo-700 text-xs">#{pIdx + 1}</span>
                          <input
                            type="text"
                            value={product.name || ''}
                            onChange={(e) => handleUpdateProduct(pIdx, 'name', e.target.value)}
                            placeholder="Nombre del producto (ej: Lavarropas 8kg Inverter)"
                            className="font-bold text-xs text-brand-text-primary bg-white border border-brand-border rounded-md px-2 py-1 flex-1 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(pIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Categoría / Rubro
                          </label>
                          <input
                            type="text"
                            value={product.category || ''}
                            onChange={(e) => handleUpdateProduct(pIdx, 'category', e.target.value)}
                            placeholder="ej: Carga Frontal / Terminales Móviles"
                            className="w-full bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Precio y Financiación / Cuotas
                          </label>
                          <input
                            type="text"
                            value={product.price || ''}
                            onChange={(e) => handleUpdateProduct(pIdx, 'price', e.target.value)}
                            placeholder="ej: $890.000 / 12 cuotas fijas / 15% OFF contado"
                            className="w-full bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-slate-700"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Características Clave y Diferenciales
                          </label>
                          <input
                            type="text"
                            value={product.highlights || ''}
                            onChange={(e) => handleUpdateProduct(pIdx, 'highlights', e.target.value)}
                            placeholder="ej: Motor Inverter 10 años garantía, ahorro A+++, flete bonificado"
                            className="w-full bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-slate-700"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Para quién es ideal (Perfil del cliente)
                          </label>
                          <input
                            type="text"
                            value={product.bestFor || ''}
                            onChange={(e) => handleUpdateProduct(pIdx, 'bestFor', e.target.value)}
                            placeholder="ej: Familias de 3 a 5 personas que buscan mínimo consumo"
                            className="w-full bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-brand-border">
                <Button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Catálogo'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB: PLAYBOOK DE MANEJO DE OBJECIONES */}
          {activeTab === 'objections' && (
            <div className="bg-white border border-brand-border rounded-b-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Playbook de Manejo de Objeciones (Astucia Comercial)
                  </h3>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Cómo reacciona el bot cuando el cliente dice que es caro, que prefiere la competencia o que lo tiene que pensar.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddObjection}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Objeción</span>
                </Button>
              </div>

              <div className="space-y-4">
                {(brainConfig.objectionPlaybook || []).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-brand-border rounded-xl text-brand-text-secondary space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-medium">No hay objeciones configuradas en el playbook.</p>
                  </div>
                ) : (
                  (brainConfig.objectionPlaybook || []).map((obj, oIdx) => (
                    <div
                      key={obj.id || oIdx}
                      className="border border-brand-border rounded-xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-brand-border/60 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-extrabold text-purple-700 text-xs">#{oIdx + 1}</span>
                          <input
                            type="text"
                            value={obj.objection || ''}
                            onChange={(e) => handleUpdateObjection(oIdx, 'objection', e.target.value)}
                            placeholder="Objeción del cliente (ej: Es muy caro / Me parece caro)"
                            className="font-bold text-xs text-brand-text-primary bg-white border border-brand-border rounded-md px-2 py-1 flex-1 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveObjection(oIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Eliminar objeción"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Estrategia de Venta (El ángulo de persuasión)
                          </label>
                          <input
                            type="text"
                            value={obj.strategy || ''}
                            onChange={(e) => handleUpdateObjection(oIdx, 'strategy', e.target.value)}
                            placeholder="ej: Destacar las 12 cuotas fijas y el ahorro en luz y agua"
                            className="w-full bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Respuesta Astuta Sugerida al Cliente
                          </label>
                          <textarea
                            rows={3}
                            value={obj.recommendedResponse || ''}
                            onChange={(e) => handleUpdateObjection(oIdx, 'recommendedResponse', e.target.value)}
                            placeholder="Texto o argumento que el bot utilizará para rebatir con empatía y cerrar..."
                            className="w-full bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-brand-border">
                <Button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Objeciones'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB: BASE DE CONOCIMIENTO DINÁMICA (UNIVERSAL SALES ENGINE) */}
          {activeTab === 'knowledge' && (
            <div className="bg-white border border-brand-border rounded-b-xl p-5 shadow-xs space-y-5">
              {/* Educational Banner: The Proven Format */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-800" />
                    <h4 className="text-xs font-bold text-emerald-950">
                      Base de Conocimiento Comercial — Formato de Alta Conversión
                    </h4>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                    RAG Multi-Tenant Activo
                  </span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Cualquier producto o servicio que cargues aquí (ej. lavarropas, seguros, servicios profesionales o posberry) será aprendido por el asistente manteniendo la misma coherencia y astucia vendedora. Respetá las 4 secciones recomendadas (Pitch, Beneficios, Objeciones y Flujo de Calificación).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenNewDoc(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Crear desde Plantilla Maestra de Venta</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenNewDoc(false)}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Documento en Blanco</span>
                  </Button>
                </div>
              </div>

              {/* Document Search / Filter */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={docFilterSearch}
                  onChange={(e) => setDocFilterSearch(e.target.value)}
                  placeholder="Buscar en documentos por título o contenido..."
                  className="w-full h-8 px-3 text-xs bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Documents List */}
              <div className="space-y-3">
                {(brainConfig.knowledgeDocuments || []).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-brand-border rounded-xl text-brand-text-secondary space-y-2">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-medium">No hay documentos cargados en la base de conocimiento.</p>
                    <p className="text-[11px] text-slate-500">Usá el botón de Plantilla Maestra para arrancar con el formato probado.</p>
                  </div>
                ) : (
                  (brainConfig.knowledgeDocuments || [])
                    .filter((d) => {
                      if (!docFilterSearch.trim()) return true;
                      const q = docFilterSearch.toLowerCase();
                      return (
                        (d.title || '').toLowerCase().includes(q) ||
                        (d.content || '').toLowerCase().includes(q)
                      );
                    })
                    .map((doc, dIdx) => {
                      const audit = auditDocumentFormat(doc.content);
                      return (
                        <div
                          key={doc.id || dIdx}
                          className="border border-brand-border rounded-xl p-4 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-700" />
                                <h4 className="font-bold text-xs text-brand-text-primary">
                                  {doc.title || 'Documento sin título'}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({doc.filename || 'documento.md'})
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold uppercase">
                                  {doc.category || 'ventas'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                                  Prioridad {doc.priority || 10}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 ${
                                    audit.score >= 90
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : audit.score >= 60
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{audit.statusText} ({audit.score}%)</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditDoc(doc)}
                                className="h-7 px-2.5 text-xs font-semibold"
                              >
                                Editar / Ver
                              </Button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                                title="Eliminar documento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Quick preview snippets */}
                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-white/80 p-2 rounded-md border border-slate-200/60 font-mono">
                            {doc.content?.slice(0, 200)}...
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PREGUNTAS FRECUENTES (FAQS) */}
          {activeTab === 'faqs' && (
            <div className="bg-white border border-brand-border rounded-b-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Input
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Buscar preguntas o respuestas en la base..."
                    className="text-xs"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsFaqModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva FAQ</span>
                </Button>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-brand-border rounded-xl text-brand-text-secondary space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs">No hay preguntas frecuentes que coincidan con la búsqueda.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFaqModalOpen(true)}
                    className="text-xs"
                  >
                    Crear Primer Pregunta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-3.5 border border-brand-border rounded-xl bg-slate-50/50 hover:bg-white transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-brand-text-primary text-xs">
                            {faq.question}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {faq.categoryLabel || FAQ_CATEGORY_LABELS[faq.category] || faq.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Eliminar FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {faq.answer}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-brand-border/60 text-[10px] text-slate-400">
                        <span>Consultada {faq.timesQueried || 0} veces</span>
                        <span>Actualizada {formatDate(faq.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LO QUE NO SUPO */}
          {activeTab === 'unanswered' && (
            <div className="bg-white border border-brand-border rounded-b-xl p-5 shadow-xs space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Acá quedan registradas las dudas o preguntas de clientes donde el bot no encontró información en la base o tuvo que derivar a un asesor. Al pulsar <strong>"Enseñar respuesta"</strong>, el bot la aprende y nunca más volverá a dudar.
                </p>
              </div>

              {isLoadingUnanswered ? (
                <div className="p-8 text-center text-xs text-brand-text-secondary">
                  <div className="w-6 h-6 border-2 border-brand-border border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Cargando consultas no resueltas...</span>
                </div>
              ) : unansweredQueries.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-brand-border rounded-xl text-brand-text-secondary space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-brand-text-primary">
                    ¡Excelente! El asistente respondió todas las consultas recibidas.
                  </p>
                  <p className="text-[11px]">No hay dudas pendientes registradas en este período.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {unansweredQueries.map((uq) => (
                    <div
                      key={uq.id}
                      className={`p-3.5 border rounded-xl transition-all space-y-2 text-xs ${
                        uq.status === 'aprendido'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-amber-200 bg-amber-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-brand-text-primary">
                          "{uq.question}"
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            uq.status === 'aprendido'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {uq.status === 'aprendido' ? 'Aprendido' : 'Sin respuesta'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cliente: {uq.customerName || uq.customerPhone || 'Anónimo'}</span>
                        <span>{formatDate(uq.createdAt)}</span>
                      </div>

                      {uq.status !== 'aprendido' && (
                        <div className="pt-2 border-t border-brand-border/60 flex justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setTeachingQuery(uq);
                              setTeachAnswer('');
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-7 gap-1"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Enseñar respuesta</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (5 COLS): SIMULADOR EN VIVO (LIVE TESTER)                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white border border-brand-border rounded-xl shadow-xs overflow-hidden flex flex-col h-[700px]">
          {/* Simulator Header */}
          <div className="p-3.5 bg-slate-50 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <h3 className="text-xs font-extrabold text-brand-text-primary">
                  Simulador del Asistente en Vivo
                </h3>
                <span className="text-[10px] text-brand-text-secondary block">
                  Prueba respuestas con la base de conocimiento y promos activas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSimulatorMessages([
                  {
                    role: 'model',
                    text: '¡Hola! Soy el asistente virtual de Grupo Novati en Tucumán. ¿En qué te puedo asesorar hoy?',
                  },
                ])
              }
              className="text-xs text-brand-text-secondary hover:text-brand-text-primary font-semibold"
              title="Reiniciar chat"
            >
              Reiniciar
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FBFBFA]/60 text-xs">
            {simulatorMessages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : msg.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-bl-xs'
                        : 'bg-white border border-brand-border text-brand-text-primary rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Metadata badge if model emitted decisions */}
                    {msg.decision && (
                      <div className="mt-2 pt-1.5 border-t border-brand-border/40 text-[10px] space-y-0.5 text-slate-500">
                        {msg.decision.shouldRegisterLead && (
                          <div className="text-emerald-700 font-bold flex items-center gap-1">
                            ✓ Lead calificado ({msg.decision.extractedData?.leadSize || 'registrado'})
                          </div>
                        )}
                        {msg.decision.shouldEscalate && (
                          <div className="text-amber-700 font-bold flex items-center gap-1">
                            ⚠ Escalar a humano ({msg.decision.escalationReason || 'solicitado'})
                          </div>
                        )}
                        {msg.decision.activeOffer && (
                          <div className="text-indigo-700 font-bold">
                            ★ Promo aplicada: {msg.decision.activeOffer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={simulatorEndRef} />
          </div>

          {/* Simulator Input Box */}
          <div className="p-3 border-t border-brand-border bg-white">
            <form onSubmit={handleSimulatorSend} className="flex items-center gap-2">
              <input
                type="text"
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                placeholder="Escribí una pregunta para probar..."
                disabled={isSimulatorSending}
                className="flex-1 text-xs bg-slate-50 border border-brand-border rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
              <Button
                type="submit"
                disabled={isSimulatorSending || !simulatorInput.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white h-8 px-3 rounded-lg text-xs font-semibold shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NUEVA FAQ                                                         */}
      {/* ========================================================================= */}
      {isFaqModalOpen && (
        <Modal
          isOpen={isFaqModalOpen}
          onClose={() => setIsFaqModalOpen(false)}
          title="Agregar Nueva Pregunta Frecuente (FAQ)"
          description="Esta información será consultada inmediatamente por el bot de WhatsApp para responder a clientes."
        >
          <form onSubmit={handleCreateFaq} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Pregunta habitual del cliente *
              </label>
              <Input
                value={newFaqForm.question}
                onChange={(e) => setNewFaqForm({ ...newFaqForm, question: e.target.value })}
                placeholder="Ej: ¿Qué incluye la bonificación de la terminal PosNet?"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Categoría</label>
              <select
                value={newFaqForm.category}
                onChange={(e) => setNewFaqForm({ ...newFaqForm, category: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {FAQ_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Respuesta exacta que debe dar el bot *
              </label>
              <textarea
                value={newFaqForm.answer}
                onChange={(e) => setNewFaqForm({ ...newFaqForm, answer: e.target.value })}
                placeholder="Ingresá la explicación clara y concisa..."
                rows={4}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setIsFaqModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
                Guardar Pregunta
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENSEÑAR RESPUESTA ("LO QUE NO SUPO")                              */}
      {/* ========================================================================= */}
      {teachingQuery && (
        <Modal
          isOpen={Boolean(teachingQuery)}
          onClose={() => setTeachingQuery(null)}
          title="Enseñar Respuesta al Asistente"
          description="Escribí la respuesta correcta para que el asistente la guarde en sus conocimientos y la responda automáticamente en el futuro."
        >
          <form onSubmit={handleTeachResponse} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-brand-border rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">
                Pregunta del Cliente
              </span>
              <p className="font-bold text-brand-text-primary">"{teachingQuery.question}"</p>
              <span className="text-[10px] text-slate-400 block">
                Origen: {teachingQuery.customerName || teachingQuery.customerPhone || 'Cliente'} · {formatDate(teachingQuery.createdAt)}
              </span>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Categoría</label>
              <select
                value={teachCategory}
                onChange={(e) => setTeachCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {FAQ_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Respuesta que el bot aprenderá *
              </label>
              <textarea
                value={teachAnswer}
                onChange={(e) => setTeachAnswer(e.target.value)}
                placeholder="Ingresá la respuesta correcta..."
                rows={4}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setTeachingQuery(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!teachAnswer.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Guardar y Enseñar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITOR DE DOCUMENTO DE CONOCIMIENTO (FORMATO MAESTRO)             */}
      {/* ========================================================================= */}
      {isDocModalOpen && (
        <Modal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          title={docFormData.id ? 'Editar Documento de Conocimiento' : 'Nuevo Documento de Conocimiento'}
          description="Estructurá la información siguiendo el formato probado para que el bot responda con astucia comercial en cualquier rubro."
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-brand-text-primary mb-1">Título del Documento *</label>
                <Input
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  placeholder="Ej: Lavarropas Automáticos Inverter / Guía Comercial"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Nombre de Archivo (.md)</label>
                <Input
                  value={docFormData.filename}
                  onChange={(e) => setDocFormData({ ...docFormData, filename: e.target.value })}
                  placeholder="ej: lavarropas_inverter.md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">Categoría</label>
                <select
                  value={docFormData.category}
                  onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ventas">Ventas / Catálogo</option>
                  <option value="servicios">Servicios & Soporte</option>
                  <option value="objeciones">Objeciones & Financiación</option>
                  <option value="general">Información General</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Prioridad en Búsquedas (RAG)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={docFormData.priority}
                  onChange={(e) => setDocFormData({ ...docFormData, priority: parseInt(e.target.value, 10) || 10 })}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Audit panel */}
            {(() => {
              const audit = auditDocumentFormat(docFormData.content);
              return (
                <div className="p-3 bg-slate-50 border border-brand-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-brand-text-primary">Auditoría Comercial del Formato:</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                        audit.score >= 90
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : audit.score >= 60
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {audit.statusText} ({audit.score}/100 pts)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                    <div className={`p-1.5 rounded border ${audit.hasH1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      {audit.hasH1 ? '✓' : '✗'} Título (#)
                    </div>
                    <div className={`p-1.5 rounded border ${audit.hasMetadata ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      {audit.hasMetadata ? '✓' : '✗'} Metadatos
                    </div>
                    <div className={`p-1.5 rounded border ${audit.hasBenefits ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      {audit.hasBenefits ? '✓' : '✗'} Beneficios
                    </div>
                    <div className={`p-1.5 rounded border ${audit.hasObjections ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      {audit.hasObjections ? '✓' : '✗'} Objeciones
                    </div>
                    <div className={`p-1.5 rounded border ${audit.hasIndagacion ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      {audit.hasIndagacion ? '✓' : '✗'} Indagación
                    </div>
                  </div>
                </div>
              );
            })()}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-brand-text-primary">
                  Contenido Markdown del Documento *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDocFormData((prev) => ({
                      ...prev,
                      content: FRONTEND_MASTER_DOC_TEMPLATE,
                      title: prev.title || 'Guía Comercial del Negocio',
                    }))
                  }
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Cargar Plantilla Maestra
                </button>
              </div>
              <textarea
                value={docFormData.content}
                onChange={(e) => setDocFormData({ ...docFormData, content: e.target.value })}
                placeholder="Pegá o escribí la información del producto siguiendo la estructura..."
                rows={14}
                required
                className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setIsDocModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!docFormData.content.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Guardar Documento en Base de Conocimiento
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AssistantConfigPage;
