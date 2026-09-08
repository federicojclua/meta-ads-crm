import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AliExpressShopifySync } from '../components/ecommerce/AliExpressShopifySync';
import { apiClient } from '../lib/api';

vi.mock('../lib/api', () => ({
  apiClient: vi.fn(),
}));

describe('Frontend: AliExpress to Shopify Dropshipping Sync Component', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('1. Renderiza correctamente el formulario con los parámetros de AutoDS (2.5x y +20%)', () => {
    render(<AliExpressShopifySync />);

    expect(screen.getByText(/Sincronizador Directo AliExpress a Shopify/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiplicador de Venta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2.5x/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+20%/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Sincronizar Producto en Shopify/i })).toBeInTheDocument();
  });

  it('2. Detecta automáticamente el ID numérico al pegar un enlace completo de AliExpress', () => {
    render(<AliExpressShopifySync />);

    const input = screen.getByPlaceholderText(/1005006321458921/i);
    fireEvent.change(input, {
      target: { value: 'https://es.aliexpress.com/item/1005006321458921.html?spm=a2g0o.home' },
    });

    expect(screen.getByText(/ID: 1005006321458921/i)).toBeInTheDocument();
  });

  it('3. Ejecuta sincronización exitosa y renderiza la tarjeta de producto con métricas financieras', async () => {
    const mockSuccessResponse = {
      ok: true,
      message: 'Producto publicado en Shopify',
      data: {
        aliExpress: {
          productId: '1005006321458921',
          originalTitle: '[HOT] Smart Heated Eye Mask (Free Shipping)',
          costUsd: 20.0,
          shippingUsd: 0,
          inventory: 150,
          imagesCount: 3,
        },
        shopifyProduct: {
          id: 99887766,
          title: 'Smart Heated Eye Mask',
          adminUrl: 'https://cocoweb-shop-krn3huiz.myshopify.com/admin/products/99887766',
        },
        pricing: {
          originalPrice: 20.0,
          shippingCost: 0,
          sellingPrice: '50.00',
          compareAtPrice: '60.00',
          estimatedProfit: 30.0,
          profitMarginPct: 60.0,
        },
      },
    };

    apiClient.mockResolvedValueOnce(mockSuccessResponse);

    render(<AliExpressShopifySync />);

    // Click en cargar ID de ejemplo
    fireEvent.click(screen.getByText(/Cargar ID de Ejemplo/i));

    const syncBtn = screen.getByRole('button', { name: /Sincronizar Producto en Shopify/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(screen.getByText(/¡Producto Publicado Exitosamente en Shopify!/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 4, name: 'Smart Heated Eye Mask' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver en Shopify Admin/i })).toBeInTheDocument();
  });

  it('4. Muestra alerta de error descriptiva si la API falla o rechaza el producto', async () => {
    apiClient.mockRejectedValueOnce(
      new Error('El producto con ID 1005009999999999 no fue encontrado en AliExpress.')
    );

    render(<AliExpressShopifySync />);

    fireEvent.click(screen.getByText(/Cargar ID de Ejemplo/i));

    const syncBtn = screen.getByRole('button', { name: /Sincronizar Producto en Shopify/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(screen.getByText(/Fallo en la Sincronización de Dropshipping/i)).toBeInTheDocument();
      expect(screen.getByText(/no fue encontrado en AliExpress/i)).toBeInTheDocument();
    });
  });
});
