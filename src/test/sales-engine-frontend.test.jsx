import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WhatsAppInboxPage } from '../pages/WhatsAppInboxPage';
import * as AuthHook from '../hooks/useAuth';

describe('Stage 14 — Frontend WhatsApp Sales Engine & Closed-Loop Attribution Tests', () => {
  const mockLines = [
    {
      id: 'line_1',
      name: 'Línea Ventas Principal',
      displayPhoneNumber: '+54 9 11 5829-4400',
      status: 'active',
    },
  ];

  const mockChats = [
    {
      id: 'chat_1',
      contactPhone: '+5491144556677',
      contactName: 'Lucía Fernández',
      unreadCount: 0,
      lineDisplayNumber: '+54 9 11 5829-4400',
      lastMessage: {
        text: 'Hola! Quiero solicitar presupuesto para pauta.',
        direction: 'inbound',
        status: 'received',
      },
      lastMessageAt: new Date().toISOString(),
      lead: {
        id: 'lead_1',
        name: 'Lucía Fernández',
        stage: 'qualified',
      },
      channel: 'whatsapp',
      status: 'active',
    },
  ];

  const mockMessages = [
    {
      id: 'msg_1',
      chatId: 'chat_1',
      direction: 'inbound',
      text: 'Hola! Quiero solicitar presupuesto para pauta.',
      status: 'received',
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: {
        _id: 'admin-uid',
        email: 'admin@animamkt.com',
        role: 'super_admin',
      },
      authLoading: false,
    });

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';

      if (urlStr.includes('/api/whatsapp/lines')) {
        const payload = { ok: true, lines: mockLines };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      if (urlStr.includes('/api/whatsapp/chats/') && urlStr.includes('/messages')) {
        const payload = { ok: true, messages: mockMessages };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      if (urlStr.includes('/api/whatsapp/chats')) {
        const payload = { ok: true, chats: mockChats };
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

  it('1. WhatsAppInboxPage renderiza el badge de atribución de Meta Ads y el selector de canal', async () => {
    render(
      <MemoryRouter>
        <WhatsAppInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Lucía Fernández/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/🎯 Meta Ads:/i)).toBeInTheDocument();
      expect(screen.getByText(/Campaña Leads Novati \| Ad: Video Reel 9:16/i)).toBeInTheDocument();
    });
  });
});
