import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WhatsAppInboxPage } from '../pages/WhatsAppInboxPage';
import * as AuthHook from '../hooks/useAuth';

describe('Stage 13 — Frontend WhatsApp Inbox UI & Real-Time Chat Experience', () => {
  const mockLines = [
    {
      id: 'line_1',
      name: 'Línea Ventas Principal',
      displayPhoneNumber: '+54 9 11 5829-4400',
      status: 'active',
    },
    {
      id: 'line_2',
      name: 'Soporte y Post-Venta',
      displayPhoneNumber: '+54 9 11 3322-1100',
      status: 'active',
    },
  ];

  const mockChats = [
    {
      id: 'chat_1',
      contactPhone: '+5491144556677',
      contactName: 'Lucía Fernández',
      unreadCount: 2,
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
        stage: 'new',
        phone: '+5491144556677',
        notes: 'Cliente interesada en campaña para el Día de la Madre.',
      },
      tags: ['Meta Ads', 'Perfumería'],
      status: 'active',
    },
    {
      id: 'chat_2',
      contactPhone: '+5491199887766',
      contactName: 'Martín Gómez',
      unreadCount: 0,
      lineDisplayNumber: '+54 9 11 5829-4400',
      lastMessage: {
        text: 'Muchas gracias por la atención.',
        direction: 'outbound',
        status: 'read',
      },
      lastMessageAt: new Date().toISOString(),
      tags: ['Venta Cerrada'],
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
      const method = opts?.method || 'GET';

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

      if (urlStr.includes('/api/whatsapp/send') && method === 'POST') {
        const bodyObj = typeof opts?.body === 'string' ? JSON.parse(opts.body) : opts?.body;
        const payload = {
          ok: true,
          message: {
            id: 'msg_out_new',
            chatId: 'chat_1',
            direction: 'outbound',
            text: bodyObj?.text || 'Respuesta',
            status: 'sent',
            timestamp: new Date().toISOString(),
          },
        };
        return Promise.resolve({
          ok: true,
          status: 201,
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

  it('1. WhatsAppInboxPage renderiza el dropdown de líneas, lista de chats y badges', async () => {
    render(
      <MemoryRouter>
        <WhatsAppInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Lucía Fernández/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\+5491144556677/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Martín Gómez/i)).toBeInTheDocument();
      expect(screen.getByText(/Todas las líneas de WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/Contexto Comercial \(CRM\)/i)).toBeInTheDocument();
    });
  });

  it('2. WhatsAppInboxPage envía un mensaje saliente y lo renderiza en la conversación activa', async () => {
    render(
      <MemoryRouter>
        <WhatsAppInboxPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Lucía Fernández/i).length).toBeGreaterThanOrEqual(1);
    });

    const textarea = screen.getByPlaceholderText(/Escribí un mensaje/i);
    fireEvent.change(textarea, { target: { value: '¡Hola Lucía! Con gusto te preparamos la propuesta.' } });

    const sendBtn = screen.getByRole('button', { name: /Enviar/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Con gusto te preparamos la propuesta/i)).toBeInTheDocument();
    });
  });
});
