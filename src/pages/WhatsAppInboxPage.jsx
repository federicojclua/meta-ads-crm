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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LEAD_STAGES } from '../../models/Lead';

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

  // Initial Load
  useEffect(() => {
    fetchLines();
  }, [clientScope]);

  useEffect(() => {
    fetchChats();
  }, [selectedLineId, statusFilter, channelFilter, searchQuery, sellerFilter, tagFilter]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const currentChat = chats.find((c) => c.id === activeChatId);
      if (currentChat?.lead) {
        setLeadNotes(currentChat.lead.notes || '');
      }
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  // Real-time Polling Sync (every 4 seconds)
  useEffect(() => {
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
  }, [activeChatId, selectedLineId, statusFilter, channelFilter]);

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

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeChatId || isSending) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      chatId: activeChatId,
      direction: 'outbound',
      type: 'text',
      text,
      status: 'sent',
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
          type: 'text',
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

            {/* Secondary Filters: Channel, Tags & Sellers */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-white border border-brand-border rounded-md px-1.5 py-1 text-brand-text-secondary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Canal: Todos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Messenger</option>
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

                const isInstagram = chat.channel === 'instagram';
                const isFacebook = chat.channel === 'facebook';

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
                    <div
                      className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shrink-0 border ${
                        isInstagram
                          ? 'bg-pink-100 text-pink-700 border-pink-200'
                          : isFacebook
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-emerald-600/10 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {initials}
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
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isInstagram
                              ? 'bg-pink-100 text-pink-700'
                              : isFacebook
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {chat.channel || 'WA'}
                        </span>

                        {chat.lineDisplayNumber && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-medium truncate max-w-[110px]">
                            {chat.lineDisplayNumber}
                          </span>
                        )}
                        {chat.lead?.stage && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                            {chat.lead.stage}
                          </span>
                        )}
                        {chat.isBotMuted && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-semibold">
                            Humano
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
                    className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                      activeChat.channel === 'instagram'
                        ? 'bg-pink-100 text-pink-700'
                        : activeChat.channel === 'facebook'
                        ? 'bg-blue-100 text-blue-700'
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
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 text-slate-700">
                        {activeChat.channel || 'whatsapp'}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-text-secondary font-mono mt-0.5">
                      {activeChat.contactPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Bot Takeover / Hand-off Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleBot}
                    disabled={isTogglingBot}
                    className={`text-xs h-8 px-2.5 ${
                      activeChat.isBotMuted
                        ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                        : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>{activeChat.isBotMuted ? 'Bot Silenciado (Pase Humano)' : 'Bot Calificador Activo'}</span>
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
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
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

              {/* Message Input Box */}
              <div className="p-3 bg-white border-t border-brand-border">
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
                      placeholder="Escribí un mensaje (Presioná Enter para enviar)..."
                      rows={1}
                      className="w-full resize-none py-2 px-3 text-xs bg-slate-50 border border-brand-border rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white min-h-[38px] max-h-32"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSending || !messageInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-[38px] px-3.5 rounded-xl shrink-0 font-medium text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
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
        {/* PANEL 3 (RIGHT): CRM Context, Kanban Pipeline & Lead Notes               */}
        {/* ========================================================================= */}
        {activeChat && (
          <div className="hidden xl:flex w-80 flex-col bg-white overflow-y-auto p-4 space-y-5 shrink-0">
            {/* Header */}
            <div className="border-b border-brand-border pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Contexto Comercial (CRM)
              </h3>
            </div>

            {/* Contact Details Card */}
            <div className="space-y-2.5 text-xs">
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
            <div className="space-y-2 border-t border-brand-border pt-4">
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
            <div className="space-y-2 border-t border-brand-border pt-4">
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
            <div className="space-y-2 border-t border-brand-border pt-4">
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
              <div className="pt-2">
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
    </div>
  );
}
