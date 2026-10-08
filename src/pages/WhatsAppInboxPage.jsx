import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Phone,
  User,
  Tag,
  Archive,
  ArchiveRestore,
  ExternalLink,
  ChevronDown,
  Sparkles,
  FileText,
  Clock,
  Filter,
  AlertCircle,
  X,
  LifeBuoy,
  CheckCircle2,
  Lock,
  Image,
  Bell,
  UserCheck,
  Bot,
  Download,
  Share2,
  Globe,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LEAD_STAGES } from '../../models/Lead';
import {
  CASE_TYPES,
  CASE_TYPE_LABELS,
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  CASE_PRIORITIES,
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_COLORS,
  CONVERSATION_STATUSES,
  CONVERSATION_STATUS_LABELS,
  CONVERSATION_STATUS_COLORS,
} from '../lib/constants';

export function WhatsAppInboxPage() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const isGlobal = userProfile && ['super_admin', 'admin'].includes(userProfile.role);
  const clientScope = userProfile?.clientId || null;

  // Lines State
  const [lines, setLines] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState('all');
  const [isLineDropdownOpen, setIsLineDropdownOpen] = useState(false);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Add Line Form State
  const [newLineData, setNewLineData] = useState({
    phoneNumberId: '',
    wabaId: '',
    displayPhoneNumber: '',
    name: '',
  });
  const [isSavingLine, setIsSavingLine] = useState(false);

  // Chats & Filters State
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'unread', 'archived'
  const [channelFilter, setChannelFilter] = useState('all'); // 'all', 'whatsapp', 'instagram', 'facebook'
  const [sellerFilter, setSellerFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Active Chat & Messages State
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTogglingBot, setIsTogglingBot] = useState(false);

  // CRM Lead Context State
  const [leadNotes, setLeadNotes] = useState('');
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  // Post-sales & Support Cases State (Fase 2)
  const [rightPanelTab, setRightPanelTab] = useState('lead'); // 'lead' | 'cases'
  const [contactCases, setContactCases] = useState([]);
  const [isLoadingContactCases, setIsLoadingContactCases] = useState(false);
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState(false);
  const [isSubmittingChatCase, setIsSubmittingChatCase] = useState(false);
  const [newChatCaseForm, setNewChatCaseForm] = useState({
    title: '',
    type: 'soporte_tecnico',
    priority: 'media',
    description: '',
  });
  const [resolvingCaseModal, setResolvingCaseModal] = useState(null);
  const [chatCaseResolutionNotes, setChatCaseResolutionNotes] = useState('');

  // Fase 5: Estados de Conversación, Notas Internas, Adjuntos y Equipo
  const [conversationStatusFilter, setConversationStatusFilter] = useState('all');
  const [composerMode, setComposerMode] = useState('whatsapp'); // 'whatsapp' | 'note'
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachData, setAttachData] = useState({ type: 'image', url: '', name: '', caption: '' });
  const [isNotifyingTeam, setIsNotifyingTeam] = useState(false);

  // Fase 6: Hub Omnicanal (WhatsApp, Instagram, Telegram, Facebook, TikTok, Twitter)
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [omnichannelAccounts, setOmnichannelAccounts] = useState([]);

  const messagesEndRef = useRef(null);
  const lineDropdownRef = useRef(null);

  // 1. Fetch Lines
  const fetchLines = async () => {
    try {
      const res = await apiClient('/api/whatsapp/lines');
      if (res?.lines) {
        setLines(res.lines);
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error fetching lines:', err.message);
    }
  };

  // 1B. Fetch Omnichannel Accounts
  const fetchOmnichannelAccounts = async () => {
    try {
      const res = await apiClient('/api/whatsapp/channels');
      if (res?.channels) {
        setOmnichannelAccounts(res.channels);
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error fetching omnichannel channels:', err.message);
    }
  };

  // 2. Fetch Chats with Filters
  const fetchChats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLineId && selectedLineId !== 'all') {
        params.append('lineId', selectedLineId);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (channelFilter !== 'all') {
        params.append('channel', channelFilter);
      }
      if (conversationStatusFilter !== 'all') {
        params.append('conversationStatus', conversationStatusFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (sellerFilter !== 'all') {
        params.append('assignedToUserId', sellerFilter);
      }
      if (tagFilter !== 'all') {
        params.append('tag', tagFilter);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient(`/api/whatsapp/chats${queryString}`);
      if (res?.chats) {
        setChats(res.chats);
        // If no active chat selected, pick the first one
        if (!activeChatId && res.chats.length > 0) {
          setActiveChatId(res.chats[0].id);
        }
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error fetching chats:', err.message);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // 3. Fetch Messages for Active Chat
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    setIsLoadingMessages(true);
    try {
      const res = await apiClient(`/api/whatsapp/chats/${chatId}/messages`);
      if (res?.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error fetching messages:', err.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 4. Fetch Cases for Active Contact
  const fetchContactCases = async (chat) => {
    if (!chat || !chat.contactPhone) {
      setContactCases([]);
      return;
    }
    setIsLoadingContactCases(true);
    try {
      const q = new URLSearchParams();
      q.append('phone', chat.contactPhone);
      const res = await apiClient.get(`/api/cases?${q.toString()}`);
      if (res?.cases) {
        setContactCases(res.cases);
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error fetching contact cases:', err.message);
    } finally {
      setIsLoadingContactCases(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchLines();
    fetchOmnichannelAccounts();
  }, [clientScope]);

  // Load Team Members (Fase 5)
  useEffect(() => {
    apiClient('/api/users')
      .then((res) => {
        if (res?.users) setTeamMembers(res.users);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchChats();
  }, [selectedLineId, statusFilter, conversationStatusFilter, channelFilter, searchQuery, sellerFilter, tagFilter]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const currentChat = chats.find((c) => c.id === activeChatId);
      if (currentChat?.lead) {
        setLeadNotes(currentChat.lead.notes || '');
      }
      fetchContactCases(currentChat);
    } else {
      setMessages([]);
      setContactCases([]);
    }
  }, [activeChatId]);

  // Real-time Polling Sync (every 4 seconds)
  useEffect(() => {
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (isTestEnv) return;

    const interval = setInterval(() => {
      if (activeChatId) {
        apiClient(`/api/whatsapp/chats/${activeChatId}/messages`)
          .then((res) => {
            if (res?.messages) setMessages(res.messages);
          })
          .catch(() => {});
      }
      fetchChats();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeChatId, selectedLineId, statusFilter, conversationStatusFilter, channelFilter, searchQuery, sellerFilter, tagFilter]);

  // Scroll to bottom on messages update
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Close line dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (lineDropdownRef.current && !lineDropdownRef.current.contains(event.target)) {
        setIsLineDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Send Message or Internal Note
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeChatId || isSending) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const isNote = composerMode === 'note';

    const optimisticMessage = {
      id: tempId,
      chatId: activeChatId,
      direction: isNote ? 'internal' : 'outbound',
      type: isNote ? 'internal_note' : 'text',
      text,
      status: 'sent',
      senderName: userProfile?.displayName || userProfile?.email || 'Asesor',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput('');

    try {
      const res = await apiClient('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          chatId: activeChatId,
          text,
          type: isNote ? 'internal_note' : 'text',
        }),
      });

      if (res?.ok && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
        fetchChats();
      } else {
        throw new Error(res?.error || 'Error al enviar mensaje');
      }
    } catch (err) {
      setErrorBanner(err.message || 'No se pudo enviar el mensaje.');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  // Handle Send Photo / Document Attachment
  const handleSendAttachment = async (e) => {
    e.preventDefault();
    if (!attachData.url.trim() || !activeChatId || isSending) return;

    setIsSending(true);
    try {
      const res = await apiClient('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          chatId: activeChatId,
          type: attachData.type,
          mediaUrl: attachData.url.trim(),
          fileName: attachData.name.trim() || null,
          text: attachData.caption.trim() || null,
        }),
      });

      if (res?.ok && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setIsAttachModalOpen(false);
        setAttachData({ type: 'image', url: '', name: '', caption: '' });
        fetchChats();
      } else {
        throw new Error(res?.error || 'Error al enviar archivo');
      }
    } catch (err) {
      alert(err.message || 'Error al enviar archivo adjunto.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Takeover / Release of Bot
  const handleTakeover = async (chatId, action) => {
    if (!chatId) return;
    try {
      const res = await apiClient(`/api/whatsapp/chats/${chatId}/takeover`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (res?.ok && res.chat) {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...res.chat } : c)));
        fetchMessages(chatId);
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error during takeover:', err.message);
    }
  };

  // Handle Update Conversation Status
  const handleUpdateConversationStatus = async (chatId, newStatus) => {
    if (!chatId) return;
    try {
      const res = await apiClient(`/api/whatsapp/chats/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ conversationStatus: newStatus }),
      });
      if (res?.ok && res.chat) {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...res.chat } : c)));
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error updating conversation status:', err.message);
    }
  };

  // Handle Assign Chat to Team Member
  const handleAssignChat = async (chatId, userId) => {
    if (!chatId) return;
    try {
      const res = await apiClient(`/api/whatsapp/chats/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedToUserId: userId || null }),
      });
      if (res?.ok && res.chat) {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, ...res.chat } : c)));
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error assigning chat:', err.message);
    }
  };

  // Handle Notify Team on WhatsApp Group
  const handleNotifyTeam = async (chatId) => {
    if (!chatId || isNotifyingTeam) return;
    setIsNotifyingTeam(true);
    try {
      const res = await apiClient(`/api/whatsapp/chats/${chatId}/notify-takeover`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Asesor solicita atención de equipo desde el panel' }),
      });
      if (res?.ok) {
        alert('📢 Aviso enviado exitosamente al grupo de WhatsApp del equipo.');
      }
    } catch (err) {
      alert('Error enviando aviso: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsNotifyingTeam(false);
    }
  };

  // Handle Create Line
  const handleCreateLine = async (e) => {
    e.preventDefault();
    if (!newLineData.phoneNumberId || !newLineData.displayPhoneNumber) return;

    setIsSavingLine(true);
    try {
      const res = await apiClient('/api/whatsapp/lines', {
        method: 'POST',
        body: JSON.stringify(newLineData),
      });

      if (res?.ok && res.line) {
        setLines((prev) => [...prev, res.line]);
        setSelectedLineId(res.line.id);
        setIsAddLineModalOpen(false);
        setNewLineData({ phoneNumberId: '', wabaId: '', displayPhoneNumber: '', name: '' });
      }
    } catch (err) {
      setErrorBanner(err.message || 'Error al registrar la nueva línea.');
    } finally {
      setIsSavingLine(false);
    }
  };

  // Handle Update Lead Stage in Pipeline
  const handleUpdateStage = async (newStage) => {
    if (!activeChatId) return;
    setIsUpdatingLead(true);
    try {
      const res = await apiClient(`/api/whatsapp/chats/${activeChatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ leadStage: newStage }),
      });
      if (res?.ok && res.chat) {
        setChats((prev) => prev.map((c) => (c.id === activeChatId ? res.chat : c)));
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error updating lead stage:', err.message);
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // Handle Toggle Bot (Hand-Off)
  const handleToggleBot = async () => {
    if (!activeChatId || isTogglingBot) return;
    setIsTogglingBot(true);
    try {
      const res = await apiClient(`/api/whatsapp/chats/${activeChatId}/toggle-bot`, {
        method: 'POST',
      });
      if (res?.ok) {
        setChats((prev) =>
          prev.map((c) => (c.id === activeChatId ? { ...c, isBotMuted: res.isBotMuted } : c))
        );
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error toggling bot:', err.message);
    } finally {
      setIsTogglingBot(false);
    }
  };

  // Handle Archive / Unarchive Chat
  const handleToggleArchive = async () => {
    if (!activeChatId) return;
    const currentChat = chats.find((c) => c.id === activeChatId);
    const newStatus = currentChat?.status === 'archived' ? 'active' : 'archived';

    try {
      const res = await apiClient(`/api/whatsapp/chats/${activeChatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res?.ok && res.chat) {
        setChats((prev) => prev.map((c) => (c.id === activeChatId ? res.chat : c)));
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error toggling archive:', err.message);
    }
  };

  // Handle Create Case from Active Chat
  const handleCreateCaseFromChat = async (e) => {
    e.preventDefault();
    if (!newChatCaseForm.title.trim() || !activeChatId) return;
    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return;

    setIsSubmittingChatCase(true);
    try {
      const payload = {
        title: newChatCaseForm.title.trim(),
        type: newChatCaseForm.type,
        priority: newChatCaseForm.priority,
        description: newChatCaseForm.description.trim(),
        contactName: currentChat.contactName || '',
        contactPhone: currentChat.contactPhone || '',
        chatId: currentChat.id,
        leadId: currentChat.leadId || null,
        clientId: clientScope,
      };
      const res = await apiClient.post('/api/cases', payload);
      if (res?.case) {
        setContactCases((prev) => [res.case, ...prev]);
        setIsCreateCaseModalOpen(false);
        setNewChatCaseForm({
          title: '',
          type: 'soporte_tecnico',
          priority: 'media',
          description: '',
        });
        setRightPanelTab('cases');
      }
    } catch (err) {
      alert(err.message || 'Error al abrir el caso.');
    } finally {
      setIsSubmittingChatCase(false);
    }
  };

  // Handle Resolve Case from Chat Lateral Panel
  const handleResolveContactCase = async (e) => {
    e.preventDefault();
    if (!resolvingCaseModal || !chatCaseResolutionNotes.trim()) return;

    try {
      const res = await apiClient.patch(`/api/cases/${resolvingCaseModal.id}`, {
        status: 'resuelto',
        resolutionNotes: chatCaseResolutionNotes.trim(),
      });
      if (res?.case) {
        setContactCases((prev) =>
          prev.map((c) => (c.id === resolvingCaseModal.id ? res.case : c))
        );
        setResolvingCaseModal(null);
        setChatCaseResolutionNotes('');
      }
    } catch (err) {
      alert(err.message || 'Error al resolver el caso.');
    }
  };

  // Handle AI Suggest Response (Fase 3)
  const [isSuggesting, setIsSuggesting] = useState(false);
  const handleSuggestResponse = async () => {
    if (!activeChatId) return;
    setIsSuggesting(true);
    try {
      const res = await apiClient.post(`/api/whatsapp/chats/${activeChatId}/suggest`, {});
      if (res?.suggestion) {
        setMessageInput(res.suggestion);
      }
    } catch (err) {
      console.warn('[WA_INBOX] Error getting AI suggestion:', err.message);
    } finally {
      setIsSuggesting(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeLine = lines.find((l) => l.id === selectedLineId);

  // Available tags across chats
  const allTags = Array.from(new Set(chats.flatMap((c) => c.tags || [])));

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[1600px] mx-auto overflow-hidden bg-white border border-brand-border rounded-xl shadow-sm">
      {/* Error Alert Banner */}
      {errorBanner && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3-Panel Layout Container */}
      <div className="flex flex-1 overflow-hidden divide-x divide-brand-border">
        {/* ========================================================================= */}
        {/* PANEL 1 (LEFT): Chat List, Lines Selector & Filters ("MB Suite" Style)     */}
        {/* ========================================================================= */}
        <div className="w-full sm:w-80 lg:w-96 flex flex-col bg-slate-50/50 shrink-0">
          {/* Header & Line Selector Dropdown */}
          <div className="p-3 border-b border-brand-border bg-white space-y-2.5">
            <div className="relative" ref={lineDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLineDropdownOpen(!isLineDropdownOpen)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-2 rounded-lg flex items-center justify-between shadow-xs transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {selectedLineId === 'all'
                      ? 'Todas las líneas de WhatsApp'
                      : activeLine?.name || activeLine?.displayPhoneNumber || 'Línea de WhatsApp'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isLineDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isLineDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-brand-border rounded-lg shadow-lg p-1.5 space-y-1 text-xs text-brand-text-primary animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLineId('all');
                      setIsLineDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                      selectedLineId === 'all' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span>Todos los canales</span>
                    {selectedLineId === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <div className="border-t border-brand-border/60 my-1" />

                  {lines.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setSelectedLineId(l.id);
                        setIsLineDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                        selectedLineId === l.id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-medium truncate">{l.name}</p>
                        <p className="text-[10px] text-brand-text-secondary">{l.displayPhoneNumber}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" />
                    </button>
                  ))}

                  <div className="border-t border-brand-border/60 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsLineDropdownOpen(false);
                      setIsAddLineModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro número / canal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLineDropdownOpen(false);
                      fetchOmnichannelAccounts();
                      setIsChannelsModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-indigo-700 hover:bg-indigo-50 font-semibold flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Hub Omnicanal (6 Redes Sociales)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLineDropdownOpen(false);
                      setIsTemplatesModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Gestionar plantillas</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Quick Filter Tabs: Todos / No leídos / Archivados */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`flex-1 py-1 text-center rounded-md transition-all ${
                  statusFilter === 'active' ? 'bg-white text-brand-text-primary shadow-2xs font-bold' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unread')}
                className={`flex-1 py-1 text-center rounded-md transition-all flex items-center justify-center gap-1 ${
                  statusFilter === 'unread' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                <span>No leídos</span>
                {chats.filter((c) => c.unreadCount > 0).length > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[9px]">
                    {chats.filter((c) => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('archived')}
                className={`flex-1 py-1 text-center rounded-md transition-all ${
                  statusFilter === 'archived' ? 'bg-white text-brand-text-primary shadow-2xs font-bold' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                Archivados
              </button>
            </div>

            {/* Conversation Status Tabs (Fase 5: abierta, en_curso, esperando, resuelta) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-medium no-scrollbar">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'abierta', label: 'Abiertas' },
                { id: 'en_curso', label: 'En curso' },
                { id: 'esperando', label: 'Esperando' },
                { id: 'resuelta', label: 'Resueltas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setConversationStatusFilter(tab.id)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all ${
                    conversationStatusFilter === tab.id
                      ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Secondary Filters: Channel, Tags & Sellers */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-white border border-brand-border rounded-md px-1.5 py-1 text-brand-text-secondary focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">Canal: Todos (6)</option>
                <option value="whatsapp">🟢 WhatsApp</option>
                <option value="instagram">🟣 Instagram</option>
                <option value="telegram">🔵 Telegram</option>
                <option value="facebook">🔷 Messenger</option>
                <option value="tiktok">⚫ TikTok</option>
                <option value="twitter">⬛ X / Twitter</option>
              </select>

              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="bg-white border border-brand-border rounded-md px-1.5 py-1 text-brand-text-secondary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Etiquetas: Todas</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="bg-white border border-brand-border rounded-md px-1.5 py-1 text-brand-text-secondary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Vendedor: Todos</option>
                {isGlobal && <option value="me">Asignados a mí</option>}
              </select>
            </div>
          </div>

          {/* Contact Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-brand-border/60">
            {isLoadingChats ? (
              <div className="p-6 text-center text-xs text-brand-text-secondary">
                Cargando conversaciones...
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-text-secondary space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-brand-border" />
                <p className="font-medium">No se encontraron conversaciones</p>
                <p className="text-[11px] text-slate-400">Los mensajes de WhatsApp, Instagram y Facebook aparecerán aquí.</p>
              </div>
            ) : (
              chats.map((chat) => {
                const isSelected = chat.id === activeChatId;
                const initials = (chat.contactName || chat.contactPhone || 'W')
                  .substring(0, 2)
                  .toUpperCase();

                const channel = chat.channel || 'whatsapp';
                let avatarClass = 'bg-emerald-600/10 text-emerald-700 border-emerald-200';
                let channelBadgeLabel = 'WA';
                let channelBadgeClass = 'bg-emerald-100 text-emerald-800';

                if (channel === 'instagram') {
                  avatarClass = 'bg-pink-100 text-pink-700 border-pink-200';
                  channelBadgeLabel = 'IG';
                  channelBadgeClass = 'bg-pink-100 text-pink-800';
                } else if (channel === 'telegram') {
                  avatarClass = 'bg-sky-100 text-sky-700 border-sky-200';
                  channelBadgeLabel = 'TG';
                  channelBadgeClass = 'bg-sky-100 text-sky-800';
                } else if (channel === 'facebook') {
                  avatarClass = 'bg-blue-100 text-blue-700 border-blue-200';
                  channelBadgeLabel = 'FB';
                  channelBadgeClass = 'bg-blue-100 text-blue-800';
                } else if (channel === 'tiktok') {
                  avatarClass = 'bg-slate-900 text-white border-slate-700';
                  channelBadgeLabel = 'TT';
                  channelBadgeClass = 'bg-slate-900 text-white';
                } else if (channel === 'twitter') {
                  avatarClass = 'bg-neutral-800 text-white border-neutral-700';
                  channelBadgeLabel = 'X';
                  channelBadgeClass = 'bg-neutral-800 text-white';
                }

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left p-3 transition-colors flex items-start gap-3 relative ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-100/80 bg-white'
                    }`}
                  >
                    {/* Contact Avatar with Channel Accent */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs border ${avatarClass}`}>
                        {initials}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 px-1 rounded-full text-[8px] font-extrabold border border-white shadow-2xs ${channelBadgeClass}`}>
                        {channelBadgeLabel}
                      </span>
                    </div>

                    {/* Chat Content Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-brand-text-primary truncate">
                          {chat.contactName || chat.contactPhone}
                        </span>
                        <span className="text-[10px] text-brand-text-secondary shrink-0">
                          {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 font-mono truncate">{chat.contactPhone}</p>

                      <div className="flex items-center gap-1 mt-1">
                        {chat.lastMessage?.direction === 'outbound' && (
                          <span className="shrink-0">
                            {chat.lastMessage.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                        <p className="text-xs text-brand-text-secondary truncate flex-1">
                          {chat.lastMessage?.text || 'Nueva conversación'}
                        </p>
                      </div>

                      {/* Tag, Channel & Line Badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {/* Channel Badge */}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            chat.channel === 'instagram'
                              ? 'bg-pink-100 text-pink-700'
                              : chat.channel === 'facebook'
                              ? 'bg-blue-100 text-blue-700'
                              : chat.channel === 'telegram'
                              ? 'bg-sky-100 text-sky-700'
                              : chat.channel === 'tiktok'
                              ? 'bg-slate-900 text-white'
                              : chat.channel === 'twitter'
                              ? 'bg-zinc-800 text-zinc-100'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {chat.channel === 'whatsapp' || !chat.channel
                            ? 'WA'
                            : chat.channel === 'instagram'
                            ? 'IG'
                            : chat.channel === 'telegram'
                            ? 'TG'
                            : chat.channel === 'facebook'
                            ? 'FB'
                            : chat.channel === 'tiktok'
                            ? 'TT'
                            : 'X'}
                        </span>

                        {chat.lineDisplayNumber && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-medium truncate max-w-[110px]">
                            {chat.lineDisplayNumber}
                          </span>
                        )}
                        {/* Conversation Status Badge (Fase 5) */}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            CONVERSATION_STATUS_COLORS[chat.conversationStatus || 'abierta']?.badge || 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {CONVERSATION_STATUS_LABELS[chat.conversationStatus || 'abierta'] || 'Abierta'}
                        </span>

                        {chat.isBotMuted && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                            Humano
                          </span>
                        )}
                        {chat.assignedToUser?.displayName && (
                          <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium truncate max-w-[90px]">
                            👤 {chat.assignedToUser.displayName.split(' ')[0]}
                          </span>
                        )}
                        {chat.internalNotesCount > 0 && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-bold">
                            🔒 {chat.internalNotesCount}
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="ml-auto bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL 2 (CENTER): Active Chat Window & Real-Time Messages                 */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-slate-100/50">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-4 bg-white border-b border-brand-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                      activeChat.channel === 'instagram'
                        ? 'bg-pink-100 text-pink-700'
                        : activeChat.channel === 'telegram'
                        ? 'bg-sky-100 text-sky-700'
                        : activeChat.channel === 'facebook'
                        ? 'bg-blue-100 text-blue-700'
                        : activeChat.channel === 'tiktok'
                        ? 'bg-slate-900 text-white'
                        : activeChat.channel === 'twitter'
                        ? 'bg-neutral-800 text-white'
                        : 'bg-emerald-600/10 text-emerald-700'
                    }`}
                  >
                    {(activeChat.contactName || activeChat.contactPhone).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-brand-text-primary leading-none">
                        {activeChat.contactName}
                      </h2>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        activeChat.channel === 'instagram'
                          ? 'bg-pink-100 text-pink-800'
                          : activeChat.channel === 'telegram'
                          ? 'bg-sky-100 text-sky-800'
                          : activeChat.channel === 'facebook'
                          ? 'bg-blue-100 text-blue-800'
                          : activeChat.channel === 'tiktok'
                          ? 'bg-slate-900 text-white'
                          : activeChat.channel === 'twitter'
                          ? 'bg-neutral-800 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {activeChat.channel === 'instagram' ? 'Instagram Direct' :
                         activeChat.channel === 'telegram' ? 'Telegram' :
                         activeChat.channel === 'facebook' ? 'Messenger' :
                         activeChat.channel === 'tiktok' ? 'TikTok DM' :
                         activeChat.channel === 'twitter' ? 'X Direct' : 'WhatsApp'}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-text-secondary font-mono mt-0.5">
                      {activeChat.contactPhone}
                    </p>
                  </div>
                </div>

                {/* Hub Omnicanal Status Button */}
                <button
                  type="button"
                  onClick={() => {
                    fetchOmnichannelAccounts();
                    setIsChannelsModalOpen(true);
                  }}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] text-indigo-900 font-semibold hover:bg-indigo-100 transition-colors"
                  title="Ver estado de las 6 redes sociales conectadas"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hub 6 Redes</span>
                </button>

                {/* Meta Ads Attribution Badge */}
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-900">
                  <span className="font-bold">🎯 Meta Ads:</span>
                  <span>Campaña Leads Novati | Ad: Video Reel 9:16</span>
                </div>

                {/* Right controls: Status selector, Assignee, Bot takeover & Notify */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Selector de Estado de la Conversación */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 hidden xl:inline">Estado:</span>
                    <select
                      value={activeChat.conversationStatus || 'abierta'}
                      onChange={(e) => handleUpdateConversationStatus(activeChat.id, e.target.value)}
                      className={`text-xs font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                        CONVERSATION_STATUS_COLORS[activeChat.conversationStatus || 'abierta']?.badge || 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {CONVERSATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {CONVERSATION_STATUS_LABELS[st] || st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Asignación de Asesor */}
                  <div className="hidden sm:flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={activeChat.assignedToUserId || ''}
                      onChange={(e) => handleAssignChat(activeChat.id, e.target.value)}
                      className="text-xs bg-slate-50 border border-brand-border rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden"
                    >
                      <option value="">Sin asignar</option>
                      {teamMembers.map((m) => (
                        <option key={m._id || m.id} value={m._id || m.id}>
                          {m.displayName || m.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Takeover / Release Control */}
                  {activeChat.isBotMuted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTakeover(activeChat.id, 'release')}
                      className="text-xs h-8 px-2.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                      title="Devuelve la conversación al Asistente IA 24/7"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                      <span>Devolver al Asistente</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTakeover(activeChat.id, 'take')}
                      className="text-xs h-8 px-2.5 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold"
                      title="Tomar el control manual y silenciar al bot"
                    >
                      <User className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      <span>Tomar Conversación</span>
                    </Button>
                  )}

                  {/* Botón de Aviso al Grupo de WhatsApp */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNotifyTeam(activeChat.id)}
                    disabled={isNotifyingTeam}
                    className="text-xs h-8 px-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                    title="Manda un aviso garantizado al grupo de WhatsApp del equipo"
                  >
                    <Bell className={`w-3.5 h-3.5 mr-1 ${isNotifyingTeam ? 'animate-spin' : 'text-slate-600'}`} />
                    <span className="hidden xl:inline">Avisar por WhatsApp</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleArchive}
                    className="text-xs h-8 px-2.5 text-brand-text-secondary"
                  >
                    {activeChat.status === 'archived' ? (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
                        Desarchivar
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        Archivar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Messages History List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                {isLoadingMessages ? (
                  <div className="text-center text-xs text-brand-text-secondary py-12">
                    Cargando historial de mensajes...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-brand-text-secondary py-12">
                    No hay mensajes en este chat aún. Enviá un mensaje para iniciar la conversación.
                  </div>
                ) : (
                  messages.map((msg) => {
                    // 1. Render Internal Private Team Notes (Fase 5)
                    if (msg.type === 'internal_note' || msg.direction === 'internal') {
                      return (
                        <div key={msg.id || msg._id} className="flex flex-col items-center my-2 w-full">
                          <div className="w-full max-w-lg bg-amber-50 border border-amber-200/90 rounded-xl p-3 shadow-2xs text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold border-b border-amber-200/60 pb-1">
                              <span className="flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Nota Interna ({msg.senderName || 'Asesor'})</span>
                              </span>
                              <span className="text-[10px] font-normal text-amber-700/80">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-amber-950 whitespace-pre-wrap break-words text-xs pt-0.5">{msg.text}</p>
                            <span className="text-[9px] text-amber-600 block italic">🔒 Solo visible para el equipo, no enviada al cliente.</span>
                          </div>
                        </div>
                      );
                    }

                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id || msg._id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isOutbound
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white text-brand-text-primary border border-brand-border/70 rounded-bl-none'
                          }`}
                        >
                          {/* Photo / Image rendering */}
                          {msg.type === 'image' && msg.mediaUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                              <img
                                src={msg.mediaUrl}
                                alt={msg.fileName || 'Foto adjunta'}
                                className="max-h-60 w-auto object-cover rounded-lg cursor-pointer hover:opacity-95"
                                onClick={() => window.open(msg.mediaUrl, '_blank')}
                              />
                            </div>
                          )}

                          {/* Document rendering */}
                          {msg.type === 'document' && msg.mediaUrl && (
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg mb-2 border transition-all ${
                                isOutbound
                                  ? 'bg-emerald-700/50 border-emerald-500/50 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <FileText className="w-5 h-5 shrink-0" />
                              <div className="truncate flex-1">
                                <p className="text-xs font-semibold truncate">{msg.fileName || 'Documento adjunto'}</p>
                                {msg.fileSize && <p className="text-[10px] opacity-80">{msg.fileSize}</p>}
                              </div>
                              <Download className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          )}

                          {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isOutbound ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {msg.timestamp
                                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                            {isOutbound && (
                              <span>
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-3 h-3 text-sky-200" />
                                ) : (
                                  <Check className="w-3 h-3 text-emerald-200" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer & Mode Switcher */}
              <div className="p-3 bg-white border-t border-brand-border space-y-2">
                {/* Switcher: Responder WhatsApp vs Nota Interna */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setComposerMode('whatsapp')}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        composerMode === 'whatsapp' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>
                        Mensaje{' '}
                        {activeChat?.channel === 'instagram'
                          ? 'Instagram'
                          : activeChat?.channel === 'telegram'
                          ? 'Telegram'
                          : activeChat?.channel === 'facebook'
                          ? 'Messenger'
                          : activeChat?.channel === 'tiktok'
                          ? 'TikTok'
                          : activeChat?.channel === 'twitter'
                          ? 'X Direct'
                          : 'WhatsApp'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerMode('note')}
                      className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        composerMode === 'note' ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Lock className="w-3 h-3 text-amber-700" />
                      <span>🔒 Nota Interna</span>
                    </button>
                  </div>

                  {composerMode === 'whatsapp' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAttachModalOpen(true)}
                        className="text-xs text-brand-text-secondary hover:text-emerald-700 px-2 py-1 rounded-md hover:bg-slate-100 flex items-center gap-1 font-medium transition-colors"
                        title="Adjuntar foto o documento"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Adjuntar</span>
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        composerMode === 'note'
                          ? 'Escribí una nota interna (solo visible para el equipo, no se despacha al cliente)...'
                          : `Escribí un mensaje para responder por ${activeChat?.channel || 'WhatsApp'} (Presioná Enter)...`
                      }
                      rows={1}
                      className={`w-full resize-none py-2 px-3 text-xs border rounded-xl focus:outline-hidden min-h-[38px] max-h-32 transition-colors ${
                        composerMode === 'note'
                          ? 'bg-amber-50/50 border-amber-300 focus:ring-1 focus:ring-amber-500 focus:bg-white text-amber-950 placeholder-amber-700/60'
                          : 'bg-slate-50 border-brand-border focus:ring-1 focus:ring-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>

                  {composerMode === 'whatsapp' && (
                    <Button
                      type="button"
                      onClick={handleSuggestResponse}
                      disabled={isSuggesting || !activeChatId}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 h-[38px] px-3 rounded-xl shrink-0 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      title="El asistente analiza la conversación y la base de conocimiento para redactar una respuesta sugerida"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isSuggesting ? 'animate-spin' : 'text-indigo-600'}`} />
                      <span className="hidden sm:inline">{isSuggesting ? 'Pensando...' : 'Sugerir'}</span>
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={isSending || !messageInput.trim()}
                    className={`h-[38px] px-3.5 rounded-xl shrink-0 font-medium text-xs flex items-center gap-1.5 text-white ${
                      composerMode === 'note'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {composerMode === 'note' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Guardar Nota</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-text-secondary">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">Bandeja de Entrada de WhatsApp</h3>
              <p className="text-xs text-brand-text-secondary max-w-sm mt-1">
                Seleccioná una conversación del panel izquierdo para ver los mensajes y gestionar el prospecto.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PANEL 3 (RIGHT): CRM Context & Post-sales Cases Tab Switcher            */}
        {/* ========================================================================= */}
        {activeChat && (
          <div className="hidden xl:flex w-80 flex-col bg-white overflow-y-auto p-4 space-y-4 shrink-0">
            <div className="text-[10px] uppercase font-extrabold text-brand-text-secondary tracking-wider">
              Contexto Comercial (CRM)
            </div>
            {/* Tab Switcher: Lead vs Casos */}
            <div className="flex border-b border-brand-border gap-1">
              <button
                type="button"
                onClick={() => setRightPanelTab('lead')}
                className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'lead'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Lead / Prospecto</span>
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('cases')}
                className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'cases'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Casos ({contactCases.length})</span>
              </button>
            </div>

            {/* TAB 1: Lead Context */}
            {rightPanelTab === 'lead' ? (
              <div className="space-y-4">
                {/* Contact Details Card */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Contacto</span>
                    <p className="font-semibold text-brand-text-primary">{activeChat.contactName}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Teléfono</span>
                    <p className="font-mono text-slate-600">{activeChat.contactPhone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Línea Receptora</span>
                    <p className="text-slate-600">{activeChat.lineDisplayNumber || 'Línea Principal'}</p>
                  </div>
                </div>

                {/* Pipeline Kanban Stage Selector */}
                <div className="space-y-2 border-t border-brand-border pt-3">
                  <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">
                    Etapa en el Pipeline (Kanban)
                  </span>
                  <select
                    value={activeChat.lead?.stage || 'new'}
                    onChange={(e) => handleUpdateStage(e.target.value)}
                    disabled={isUpdatingLead}
                    className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-1.5 font-bold text-emerald-800 uppercase focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {LEAD_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Section */}
                <div className="space-y-2 border-t border-brand-border pt-3">
                  <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Etiquetas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeChat.tags || []).map((tag, i) => (
                      <Badge key={i} variant="primary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Internal Notes Section */}
                <div className="space-y-2 border-t border-brand-border pt-3">
                  <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">
                    Notas Internas del Prospecto
                  </span>
                  <textarea
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Añadir observaciones sobre el lead..."
                    rows={4}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Direct Link to CRM Lead Record */}
                {activeChat.leadId && (
                  <div className="pt-1">
                    <a
                      href="/app/leads"
                      className="w-full text-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Ficha Completa en CRM</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: Casos (Post-sales & Support) */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">
                    Casos de Posventa / Soporte
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateCaseModalOpen(true)}
                    className="h-7 px-2 text-[11px] gap-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Abrir Caso</span>
                  </Button>
                </div>

                {isLoadingContactCases ? (
                  <div className="p-6 text-center text-brand-text-secondary text-xs">
                    <div className="w-5 h-5 border-2 border-brand-border border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Cargando casos...</span>
                  </div>
                ) : contactCases.length === 0 ? (
                  <div className="p-4 border border-dashed border-brand-border rounded-lg text-center space-y-2 bg-slate-50/50">
                    <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs text-brand-text-secondary">
                      No hay tickets ni casos registrados para este cliente.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateCaseModalOpen(true)}
                      className="text-xs h-7"
                    >
                      Crear Ticket de Soporte
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {contactCases.map((cs) => (
                      <div
                        key={cs.id}
                        className="p-3 border border-brand-border rounded-lg bg-slate-50/60 hover:bg-white transition-all space-y-1.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-extrabold text-brand-text-primary">
                            {cs.caseCode}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              CASE_PRIORITY_COLORS[cs.priority] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {CASE_PRIORITY_LABELS[cs.priority] || cs.priority}
                          </span>
                        </div>

                        <h4 className="font-semibold text-brand-text-primary line-clamp-2">
                          {cs.title}
                        </h4>

                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className="text-slate-500">
                            {cs.typeLabel || CASE_TYPE_LABELS[cs.type] || cs.type}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold border ${
                              CASE_STATUS_COLORS[cs.status]?.badge || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {CASE_STATUS_LABELS[cs.status] || cs.status}
                          </span>
                        </div>

                        {cs.resolutionNotes && (
                          <div className="mt-1 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800">
                            <span className="font-bold block">Resolución:</span>
                            <span>{cs.resolutionNotes}</span>
                          </div>
                        )}

                        {cs.status !== 'resuelto' && (
                          <div className="pt-1.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingCaseModal(cs);
                                setChatCaseResolutionNotes('');
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            >
                              Resolver Caso
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-brand-border">
                  <a
                    href="/app/cases"
                    className="w-full text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Todos los Casos</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Connect New WhatsApp Number (Line)                               */}
      {/* ========================================================================= */}
      {isAddLineModalOpen && (
        <Modal
          isOpen={isAddLineModalOpen}
          onClose={() => setIsAddLineModalOpen(false)}
          title="Vincular Nueva Línea de WhatsApp Cloud API"
        >
          <form onSubmit={handleCreateLine} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Nombre o Alias de la Línea</label>
              <Input
                value={newLineData.name}
                onChange={(e) => setNewLineData({ ...newLineData, name: e.target.value })}
                placeholder="Ej: Línea Ventas Buenos Aires"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Número de Teléfono Visible</label>
              <Input
                value={newLineData.displayPhoneNumber}
                onChange={(e) => setNewLineData({ ...newLineData, displayPhoneNumber: e.target.value })}
                placeholder="Ej: +54 9 11 5829-4400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Phone Number ID (Meta Cloud API)</label>
              <Input
                value={newLineData.phoneNumberId}
                onChange={(e) => setNewLineData({ ...newLineData, phoneNumberId: e.target.value })}
                placeholder="Ej: 105938472910394"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">WhatsApp Business Account ID (WABA ID)</label>
              <Input
                value={newLineData.wabaId}
                onChange={(e) => setNewLineData({ ...newLineData, wabaId: e.target.value })}
                placeholder="Ej: 204958192837465"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddLineModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingLine} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSavingLine ? 'Guardando...' : 'Conectar Línea'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Manage WhatsApp Message Templates                                */}
      {/* ========================================================================= */}
      {isTemplatesModalOpen && (
        <Modal
          isOpen={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          title="Gestor de Plantillas de Mensajes (Meta WhatsApp)"
        >
          <div className="space-y-4 text-xs">
            <p className="text-brand-text-secondary leading-relaxed">
              Las plantillas aprobadas por Meta te permiten iniciar conversaciones con prospectos que no hayan enviado un mensaje en las últimas 24 horas.
            </p>

            <div className="space-y-2 border border-brand-border rounded-lg p-3 bg-slate-50">
              <div className="flex items-center justify-between font-bold text-brand-text-primary">
                <span>bienvenida_prospecto_v1</span>
                <Badge variant="success">Aprobada</Badge>
              </div>
              <p className="text-slate-600 text-[11px]">
                "¡Hola &#123;&#123;1&#125;&#125;! Gracias por contactarte con Anima MKT. ¿En qué podemos ayudarte hoy?"
              </p>
            </div>

            <div className="space-y-2 border border-brand-border rounded-lg p-3 bg-slate-50">
              <div className="flex items-center justify-between font-bold text-brand-text-primary">
                <span>recordatorio_presupuesto_v2</span>
                <Badge variant="success">Aprobada</Badge>
              </div>
              <p className="text-slate-600 text-[11px]">
                "Hola &#123;&#123;1&#125;&#125;, te enviamos la propuesta solicitada. Quedamos a disposición para resolver cualquier duda."
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setIsTemplatesModalOpen(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Abrir Caso desde Chat (Fase 2)                                   */}
      {/* ========================================================================= */}
      {isCreateCaseModalOpen && (
        <Modal
          isOpen={isCreateCaseModalOpen}
          onClose={() => setIsCreateCaseModalOpen(false)}
          title="Abrir Caso de Soporte / Posventa"
          description={`Asociado al contacto: ${activeChat?.contactName || activeChat?.contactPhone || 'Cliente'}`}
        >
          <form onSubmit={handleCreateCaseFromChat} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Motivo / Asunto del Caso *
              </label>
              <Input
                value={newChatCaseForm.title}
                onChange={(e) => setNewChatCaseForm({ ...newChatCaseForm, title: e.target.value })}
                placeholder="Ej: Terminal no enciende / Pedido de 10 rollos térmicos"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Tipo de Caso *
                </label>
                <select
                  value={newChatCaseForm.type}
                  onChange={(e) => setNewChatCaseForm({ ...newChatCaseForm, type: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {CASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CASE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Prioridad *
                </label>
                <select
                  value={newChatCaseForm.priority}
                  onChange={(e) => setNewChatCaseForm({ ...newChatCaseForm, priority: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {CASE_PRIORITIES.map((pri) => (
                    <option key={pri} value={pri}>
                      {CASE_PRIORITY_LABELS[pri]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Detalles del Reclamo / Insumos
              </label>
              <textarea
                value={newChatCaseForm.description}
                onChange={(e) => setNewChatCaseForm({ ...newChatCaseForm, description: e.target.value })}
                placeholder="Ingresá los detalles del equipo, serie o motivo..."
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setIsCreateCaseModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingChatCase || !newChatCaseForm.title.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                {isSubmittingChatCase ? 'Creando...' : 'Crear y Notificar Caso'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Resolver Caso desde Chat (Notas Obligatorias)                   */}
      {/* ========================================================================= */}
      {resolvingCaseModal && (
        <Modal
          isOpen={Boolean(resolvingCaseModal)}
          onClose={() => setResolvingCaseModal(null)}
          title={`Resolver Caso ${resolvingCaseModal.caseCode}`}
          description="Documentá la solución técnica o administrativa antes de cerrar el ticket."
        >
          <form onSubmit={handleResolveContactCase} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="font-bold text-emerald-900 block">{resolvingCaseModal.title}</span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                Cliente: {resolvingCaseModal.contactName || resolvingCaseModal.contactPhone || 'Cliente'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Notas de Resolución * (Obligatorio)
              </label>
              <textarea
                value={chatCaseResolutionNotes}
                onChange={(e) => setChatCaseResolutionNotes(e.target.value)}
                placeholder="Ej: Se entregaron 10 rollos en el local / Se reinició terminal y recuperó señal..."
                rows={4}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setResolvingCaseModal(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!chatCaseResolutionNotes.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                Confirmar Resolución
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: Adjuntar Foto o Documento (Fase 5)                              */}
      {/* ========================================================================= */}
      {isAttachModalOpen && (
        <Modal
          isOpen={isAttachModalOpen}
          onClose={() => setIsAttachModalOpen(false)}
          title="Adjuntar Foto o Documento"
          description="Enviá archivos multimedia o documentos en la conversación de WhatsApp."
        >
          <form onSubmit={handleSendAttachment} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Tipo de Archivo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAttachData((prev) => ({ ...prev, type: 'image' }))}
                  className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 font-semibold ${
                    attachData.type === 'image' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <Image className="w-4 h-4" /> Foto / Imagen
                </button>
                <button
                  type="button"
                  onClick={() => setAttachData((prev) => ({ ...prev, type: 'document' }))}
                  className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 font-semibold ${
                    attachData.type === 'document' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Documento / PDF
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">URL del Archivo (enlace público o CDN) *</label>
              <Input
                value={attachData.url}
                onChange={(e) => setAttachData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://ejemplo.com/catalogo.pdf o foto.jpg"
                required
              />
            </div>

            {attachData.type === 'document' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nombre del Documento</label>
                <Input
                  value={attachData.name}
                  onChange={(e) => setAttachData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="ej: Catalogo_Clover_Flex.pdf"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Texto / Epígrafe (opcional)</label>
              <Input
                value={attachData.caption}
                onChange={(e) => setAttachData((prev) => ({ ...prev, caption: e.target.value }))}
                placeholder="Te comparto la información solicitada..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setIsAttachModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!attachData.url.trim() || isSending}>
                {isSending ? 'Enviando...' : 'Enviar Archivo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Hub Omnicanal — 6 Redes Conectadas (Fase 6)                      */}
      {/* ========================================================================= */}
      {isChannelsModalOpen && (
        <Modal
          isOpen={isChannelsModalOpen}
          onClose={() => setIsChannelsModalOpen(false)}
          title="Hub Omnicanal — Redes Sociales Conectadas"
          description="Atendé y respondé todas tus conversaciones de 6 plataformas desde una sola bandeja unificada."
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 flex items-start gap-2.5">
              <Share2 className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bandeja Unificada de Atención y Ventas</p>
                <p className="text-[11px] text-indigo-800/90 mt-0.5">
                  Los prospectos que te escriban por WhatsApp, Instagram, Telegram, Messenger, TikTok o X ingresan automáticamente al CRM,
                  son atendidos por el Asistente IA y tu equipo responde desde el mismo panel sin cambiar de aplicación.
                </p>
              </div>
            </div>

            <div className="divide-y divide-brand-border/60 border border-brand-border rounded-xl overflow-hidden bg-white">
              {(omnichannelAccounts.length > 0 ? omnichannelAccounts : [
                { id: 'whatsapp', name: 'WhatsApp Cloud API', channel: 'whatsapp', status: 'connected', identifier: '+54 9 11 5829-4400' },
                { id: 'instagram', name: 'Instagram Direct', channel: 'instagram', status: 'connected', identifier: '@novati.oficial' },
                { id: 'telegram', name: 'Telegram Bot', channel: 'telegram', status: 'connected', identifier: '@NovatiSalesBot' },
                { id: 'facebook', name: 'Facebook Messenger', channel: 'facebook', status: 'connected', identifier: 'Novati Soluciones' },
                { id: 'tiktok', name: 'TikTok Direct Messages', channel: 'tiktok', status: 'connected', identifier: '@novati_oficial' },
                { id: 'twitter', name: 'X / Twitter Direct Messages', channel: 'twitter', status: 'connected', identifier: '@NovatiMkt' },
              ]).map((account) => {
                const isConn = account.status === 'connected';
                return (
                  <div key={account.id || account.channel} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          account.channel === 'instagram'
                            ? 'bg-pink-100 text-pink-700'
                            : account.channel === 'telegram'
                            ? 'bg-sky-100 text-sky-700'
                            : account.channel === 'facebook'
                            ? 'bg-blue-100 text-blue-700'
                            : account.channel === 'tiktok'
                            ? 'bg-slate-900 text-white'
                            : account.channel === 'twitter'
                            ? 'bg-neutral-800 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {account.channel === 'instagram'
                          ? 'IG'
                          : account.channel === 'telegram'
                          ? 'TG'
                          : account.channel === 'facebook'
                          ? 'FB'
                          : account.channel === 'tiktok'
                          ? 'TT'
                          : account.channel === 'twitter'
                          ? 'X'
                          : 'WA'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-brand-text-primary">{account.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{account.identifier || 'Cuenta vinculada'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isConn
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {isConn ? '🟢 Conectado' : '⚪ Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setIsChannelsModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
