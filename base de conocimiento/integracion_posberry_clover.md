# Integración POSBerry ↔ Clover (cobranzas con tarjeta integradas)

> **Metadata**
> - source: posberry.tawk.help/article/como-realizar-las-cobranzas-de-tarjetas-integrando-un-dispositivo-clover-fiserv
> - country: AR · brand: POSBerry · platform: Clover
> - audience: comercio, soporte · allowed_for: support, installation
> - priority: 9
> - last_checked: 2026-05-07

## Qué hace esta integración

Permite que POSBerry envíe el monto de cobro al dispositivo Clover y reciba la confirmación de la transacción de tarjeta de forma automática. **Un dispositivo Clover puede usarse en un solo punto de venta a la vez.**

## Pasos de configuración

### 1. Instalar la app en Clover
En el dispositivo Clover, ir a **Más Herramientas** (o **App Market**), buscar e instalar la aplicación **Secure Network Pay Display**.

### 2. Abrir Ajustes de la app
Dentro de la app, entrar a **Ajustes**.

### 3. Configurar y reiniciar el servidor
Anotar el **DNS Name** (ejemplo: `Clover-C043LQ1102661.local`). También se puede usar la dirección IP, pero hay que tener en cuenta que la IP puede cambiar si se reinicia el router. Presionar **Configure and Restart Server**.

### 4. Salir del modo integrado
Para salir del modo integrado, en cualquier momento se presionan las **4 esquinas a la vez** del dispositivo. Tocar **"Me quedó claro"** para continuar.

### 5. Pantalla normal de cobro
La app debería mostrar la pantalla normal de cobro a la espera de comandos.

### 6. Configurar POSBerry
En POSBerry, ir a **OPCIONES → Integraciones → Clover**.
- Cargar el **DNS Name** (o IP) anotado en el paso 3.
- Marcar la casilla **Servidor** para activar la integración.

### 7. Vincular con código (validez 30 días)
En el primer intento de comunicación, POSBerry muestra un mensaje con un código.
- En el dispositivo Clover, ingresar el **código de acceso** (predeterminado: `1234` si no fue cambiado).
- Después aparece el código de vinculación que hay que ingresar en POSBerry.
- La vinculación tiene **validez de 30 días**.

> Si el mensaje con el código no aparece, salir y entrar nuevamente de POSBerry, o revisar la dirección del servidor (probar IP en lugar de hostname o viceversa).

## Notas importantes

- **Un Clover por punto de venta**: no se puede compartir un dispositivo Clover entre dos puntos de venta simultáneamente.
- **DNS Name vs IP**: preferir DNS Name por estabilidad. Usar IP solo si la red no resuelve nombres locales.
- **Validez 30 días**: si la integración deja de funcionar, puede ser que haya expirado el token de vinculación. Re-vincular siguiendo el paso 7.
- **Conectividad**: tanto Clover como la PC/dispositivo donde corre POSBerry deben estar en la misma red local.

## Solución de problemas comunes

| Síntoma | Causa probable | Acción |
|---|---|---|
| POSBerry no encuentra Clover | DNS Name incorrecto o red distinta | Verificar misma LAN, probar con IP |
| El código de vinculación no aparece | App Secure Network Pay Display no inicializada | Reiniciar la app desde Clover (Configure and Restart Server) |
| Cobro no se confirma en POSBerry | Vinculación expirada (30 días) | Re-vincular ingresando nuevo código |
| Error de cifrado | Versión vieja de la app | Actualizar **Secure Network Pay Display** desde App Market |
