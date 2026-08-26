import { describe, it, expect } from 'vitest';
import {
  validateExchangeRate,
  findRateForDate,
  convertCurrencyHistorically
} from '../../models/ExchangeRate.js';

describe('Exchange Rate Validations & Calculations', () => {
  describe('validateExchangeRate', () => {
    it('debe rechazar divisas no soportadas', () => {
      const data = {
        baseCurrency: 'EUR',
        quoteCurrency: 'ARS',
        quotePerBase: 1000,
        rateType: 'official',
        validFrom: '2026-08-01',
      };
      const res = validateExchangeRate(data);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('Moneda base no soportada');
    });

    it('debe rechazar base y cotización iguales', () => {
      const data = {
        baseCurrency: 'ARS',
        quoteCurrency: 'ARS',
        quotePerBase: 1,
        rateType: 'official',
        validFrom: '2026-08-01',
      };
      const res = validateExchangeRate(data);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('no pueden ser la misma');
    });

    it('debe requerir cotizaciones USD a ARS en esta etapa', () => {
      const data = {
        baseCurrency: 'ARS',
        quoteCurrency: 'USD',
        quotePerBase: 0.001,
        rateType: 'official',
        validFrom: '2026-08-01',
      };
      const res = validateExchangeRate(data);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('solo admite USD como moneda base y ARS como moneda de cotización');
    });

    it('debe rechazar tasas de cambio negativas o cero', () => {
      const data = {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        quotePerBase: -50,
        rateType: 'official',
        validFrom: '2026-08-01',
      };
      const res = validateExchangeRate(data);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('debe ser un número positivo mayor a 0');
    });

    it('debe rechazar validTo menor o igual a validFrom', () => {
      const data = {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        quotePerBase: 1200,
        rateType: 'official',
        validFrom: '2026-08-10',
        validTo: '2026-08-05',
      };
      const res = validateExchangeRate(data);
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('debe ser posterior a la fecha de inicio');
    });

    it('debe aceptar documentos válidos con validTo null', () => {
      const data = {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        quotePerBase: 1200,
        rateType: 'official',
        validFrom: '2026-08-01',
        validTo: null,
      };
      const res = validateExchangeRate(data);
      expect(res.isValid).toBe(true);
    });
  });

  describe('findRateForDate', () => {
    const mockRates = [
      {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        quotePerBase: 1000,
        validFrom: new Date('2026-08-01T00:00:00Z'),
        validTo: new Date('2026-08-15T00:00:00Z'),
      },
      {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        quotePerBase: 1200,
        validFrom: new Date('2026-08-15T00:00:01Z'),
        validTo: null, // active rate
      }
    ];

    it('debe encontrar la tasa acotada correcta en un intervalo', () => {
      const rate = findRateForDate(mockRates, '2026-08-10T12:00:00Z');
      expect(rate).not.toBeNull();
      expect(rate.quotePerBase).toBe(1000);
    });

    it('debe encontrar la tasa activa actual', () => {
      const rate = findRateForDate(mockRates, '2026-08-20T12:00:00Z');
      expect(rate).not.toBeNull();
      expect(rate.quotePerBase).toBe(1200);
    });

    it('debe retornar null si la fecha es previa al primer intervalo de validez', () => {
      const rate = findRateForDate(mockRates, '2026-07-20T12:00:00Z');
      expect(rate).toBeNull();
    });
  });

  describe('convertCurrencyHistorically', () => {
    const mockRates = [
      {
        baseCurrency: 'USD',
        quoteCurrency: 'ARS',
        quotePerBase: 1000, // 1 USD = 1000 ARS
        validFrom: new Date('2026-08-01T00:00:00Z'),
        validTo: null,
      }
    ];

    it('debe retornar el mismo valor si el origen y destino son iguales', () => {
      const converted = convertCurrencyHistorically(500, 'USD', 'USD', '2026-08-05', mockRates);
      expect(converted).toBe(500);
    });

    it('debe convertir e integrar redondeando de USD a ARS', () => {
      // 10.55 USD = 1055 cents USD
      // 1055 * 1000 = 1055000 cents ARS
      const converted = convertCurrencyHistorically(1055, 'USD', 'ARS', '2026-08-05', mockRates);
      expect(converted).toBe(1055000);
    });

    it('debe convertir e integrar redondeando de ARS a USD', () => {
      // 123456 cents ARS / 1000 = 123.456 => Math.round(123.456) = 123 cents USD
      const converted = convertCurrencyHistorically(123456, 'ARS', 'USD', '2026-08-05', mockRates);
      expect(converted).toBe(123);
    });

    it('debe retornar null si no existe una tasa para la fecha solicitada', () => {
      const converted = convertCurrencyHistorically(1000, 'USD', 'ARS', '2026-07-20', mockRates);
      expect(converted).toBeNull();
    });
  });
});
