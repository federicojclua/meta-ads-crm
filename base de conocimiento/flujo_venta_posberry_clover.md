# Flujo de venta con POSBerry sobre Clover

> **Metadata**
> - source: documentación interna POSBerry
> - country: AR · brand: POSBerry · platform: Clover
> - audience: comercio, soporte · allowed_for: support, sales, operations
> - priority: 9
> - last_checked: 2026-05-07

## Flujo estándar de cobro integrado

```
1. Cajero abre POSBerry en el dispositivo Clover (o PC con integración).
2. Selecciona productos: por código de barras, búsqueda, listado o pesable.
3. POSBerry calcula totales: descuentos, impuestos, promociones.
4. Cajero confirma la venta y elige el medio de pago.
5. Si el medio de pago es tarjeta o QR (Fiserv):
     - POSBerry envía el monto a Clover (Secure Network Pay Display).
     - Clover muestra al cliente la pantalla de pago: tarjeta / QR / Pix / propina.
     - El cliente paga (chip / contactless / QR / NFC).
     - Clover devuelve la confirmación a POSBerry.
6. POSBerry registra la venta con el medio de pago utilizado.
7. Se emite el comprobante (factura electrónica AFIP, ticket, comprobante A4).
8. La venta queda registrada para reportes, caja, control y conciliación.
```

## Pasos del flujo de cierre de caja

1. Cajero ingresa al cierre de caja en POSBerry.
2. POSBerry muestra totales por medio de pago (efectivo, tarjeta, QR, Pix, otros).
3. Cajero confirma efectivo en caja (cierre ciego o no, según configuración).
4. POSBerry registra el cierre y genera el reporte.
5. Sincroniza con la web para reportes consolidados de la casa central.

## Comprobantes electrónicos

- POSBerry está integrado con AFIP para emisión de facturas electrónicas (A, B, C según condición fiscal del comercio).
- El certificado digital se renueva periódicamente (ver guía de **Renovación del certificado digital de factura electrónica** en la KB de POSBerry).
- Para casos de contingencia, POSBerry soporta **CAEA**.

## Multi-sucursal

POSBerry soporta múltiples puntos de venta del mismo comercio:
- Sincronización entre puntos de venta y la web.
- Transferencias de stock entre sucursales.
- Reportes consolidados.
- Productos, precios y promociones gestionados desde la web central.
