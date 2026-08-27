import { describe, it, expect } from 'vitest';
import {
  validateWaLine,
  validateWaChat,
  validateWaMessage,
  normalizePhoneNumber,
  sanitizeWaLine,
  sanitizeWaChat,
  sanitizeWaMessage,
} from '../../models/WhatsApp.js';

describe('Stage 13 — WhatsApp Security & Model Validation Tests', () => {
  it('1. normalizePhoneNumber formatea correctamente números con y sin código de país', () => {
    expect(normalizePhoneNumber('+54 9 11 5829-4400')).toBe('+5491158294400');
    expect(normalizePhoneNumber('5491144556677')).toBe('+5491144556677');
    expect(normalizePhoneNumber('(011) 15-3344-5566')).toBe('+0111533445566');
    expect(normalizePhoneNumber('')).toBe('');
  });

  it('2. validateWaLine exige clientId, phoneNumberId y displayPhoneNumber válidos', () => {
    const invalid = validateWaLine({
      clientId: null,
      phoneNumberId: '',
      displayPhoneNumber: '',
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(3);

    const valid = validateWaLine({
      clientId: '65df11111111111111111111',
      phoneNumberId: '105938472910394',
      displayPhoneNumber: '+54 9 11 5829-4400',
      status: 'active',
    });
    expect(valid.isValid).toBe(true);
  });

  it('3. validateWaChat exige clientId y teléfono de contacto', () => {
    const invalid = validateWaChat({ clientId: 'c1', contactPhone: '' });
    expect(invalid.isValid).toBe(false);

    const valid = validateWaChat({
      clientId: 'c1',
      contactPhone: '+5491144556677',
      status: 'active',
    });
    expect(valid.isValid).toBe(true);
  });

  it('4. validateWaMessage valida la dirección obligatoria (inbound/outbound) y contenido', () => {
    const invalid = validateWaMessage({
      clientId: 'c1',
      chatId: 'ch1',
      direction: 'invalid_direction',
    });
    expect(invalid.isValid).toBe(false);

    const valid = validateWaMessage({
      clientId: 'c1',
      chatId: 'ch1',
      direction: 'outbound',
      type: 'text',
      text: '¡Hola! Te contactamos de Anima MKT.',
    });
    expect(valid.isValid).toBe(true);
  });

  it('5. sanitizeWaChat y sanitizeWaMessage garantizan el correcto formato de IDs y objetos anidados', () => {
    const sanitizedChat = sanitizeWaChat({
      _id: 'chat_123',
      clientId: 'tenant_1',
      contactPhone: '+5491144556677',
      contactName: 'Lucía Fernández',
      unreadCount: 2,
      lastMessage: { text: 'Hola!', direction: 'inbound' },
    });

    expect(sanitizedChat.id).toBe('chat_123');
    expect(sanitizedChat.unreadCount).toBe(2);
    expect(sanitizedChat.lastMessage.text).toBe('Hola!');

    const sanitizedMsg = sanitizeWaMessage({
      _id: 'msg_999',
      clientId: 'tenant_1',
      chatId: 'chat_123',
      direction: 'outbound',
      text: 'Respuesta enviada',
      status: 'sent',
    });

    expect(sanitizedMsg.id).toBe('msg_999');
    expect(sanitizedMsg.direction).toBe('outbound');
  });
});
