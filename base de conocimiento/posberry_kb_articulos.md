# Base de Conocimiento POSBerry
Exportado el: 2025-11-30 20:38:05
Total de artículos: 371

---

---
title: Carga de Saldo en NFC Wallet
url: https://posberry.tawk.help/article/carga-de-saldo-en-nfc-wallet
---

# Carga de Saldo en NFC Wallet

*Carga de saldo en su NFC Wallet desde POSBerry GO*

En este instructivo aprenderemos a cargar saldo en una NFC Wallet, una tarjeta utilizada principalmente en eventos, ferias o espacios donde se busca agilizar los cobros.

## Instructivo paso a paso

**1. Acceda al Menú de POSBerry GO** Deslice desde el margen izquierdo hacia la derecha. Si prefiere, también puede tocar el ícono de las tres rayitas ubicado arriba a la izquierda. **2. Ingrese a la sección “NFC Wallet”.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0N5o1ZILuJ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JBP8ta8o58.png)

**3.** Dentro de la sección, seleccione la opción **“Cargar”.** **4.** Ingrese el monto que desea cargar utilizando el **teclado numérico.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/K6gn6YKbf8.png)

**5.** Seleccione el **medio de pago** , en este caso **“Efectivo”** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b3Hxvhw8Y3.png)

**6.** **Acerque la tarjeta NFC** al lector del dispositivo. En pantalla verá la leyenda con el **monto a cargar** antes de confirmar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NHR6fZ5pNR.png)

7. Una vez procesada la carga, el sistema mostrará un **tag en color verde** indicando que la operación fue **exitosa.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Fx54_kJ5BO.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/n9xe85LZOY.png)


---

---
title: Configurar Factura Electrónica
url: https://posberry.tawk.help/article/configurar-factura-electronica
---

# Configurar Factura Electrónica

*Guía paso a paso para habilitar la facturación electrónica y vincular su punto de venta de AFIP con POSBerry.*

POSBerry permite emitir **facturas electrónicas** directamente integradas con AFIP. En este instructivo se detallan los pasos para dar de alta el punto de venta en AFIP, generar los certificados digitales y vincular correctamente el servicio con su sistema POSBerry.

## Instructivo Paso a Paso

✅ 1. Alta del Punto de Venta en AFIP **1) ** Ingrese a la web de [ARCA](https://auth.afip.gob.ar/contribuyente_/login.xhtml) con la Clave Fiscal del contribuyente. **2)** En el panel principal, seleccione **“Administración de puntos de venta y domicilio”.3) ** Ingrese a **“A/B/M de puntos de venta”** y presione **“Agregar”.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6wQeV_h90X.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3l0zGKZ6dy.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dyb8LLAzWr.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hnhgQGTJUW.png)

**4)** Complete los datos solicitados: **Número:** el próximo disponible. **Nombre de fantasía** : opcional. **Sistema:** seleccione RECE para aplicativo y web services. **Nuevo domicilio:** el que corresponda.

**5) ** Si el contribuyente es **monotributista** , seleccione **Factura Electrónica - Monotributo - Web Services.6) ** Presione ** “Aceptar”** y verifique que el punto de venta se haya creado correctamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/t7lpWF9XEq.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8JFsaYj78L.png)

✅ 2. Alta del Punto de Venta en POSBerry

Si ya tiene un punto de venta creado y coincide con el número configurado en AFIP, puede omitir este paso.

**1) ** Ingrese a **Configuración** (ícono de rueda dentada ⚙️). **2) ** En el menú lateral, seleccione **Punto de Venta.3) ** Haga clic en **“Nuevo Punto de Venta”.4) ** Complete todos los campos requeridos.

El número de punto de venta debe coincidir exactamente con el creado en AFIP.

**5) ** Haga clic en **Guardar** , confirme en la ventana emergente y guarde nuevamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/x3gTUxdD5b.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7MdMj10Xup.png)

✅ 3. Generar el Archivo “Key” **1) ** En el menú de **Configuración → Punto de Venta** , seleccione el punto de venta correspondiente. **2) ** En el campo **Tipo de Facturación** , elija **Factura Electrónica.3) ** Haga clic en [Generar Archivo Key]. **4) ** Luego, presione **Guardar** para finalizar la generación del archivo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Wkt8i9vzh4.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xYDeJ0GrnG.png)

## 4 - Descargar "Certificate Request"

Haga clic en el botón [Configuración] ("forma de rueda dentada"). Luego en el menú de la izquierda haga clic en el botón [Punto de Venta]. Luego seleccione el punto de venta y haga clic en [Descargar Archivo CSR (Certificate Request)].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BonH_fZs8v.png)

## 5 - Active el servicio "Administrador de Certificados Digitales" en AFIP

Nota: Si ya tiene activado el servicio “Administrador de Certificados Digitales” omita estos pasos.

Ingrese a la página web de la AFIP con la clave fiscal del contribuyente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/w8zEkjIEKs.png)

Ingrese al "Administrador de Relaciones de Clave Fiscal".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/U6HlhNmOKQ.png)

Presione en el botón "ADHERIR SERVICIO".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YpXlmLrvVd.png)

Expanda la sección "AFIP > Servicios Interactivos".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wLGAI31faG.png)

Busque el servicio "Administrador de Certificados Digitales".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7R1HYtE1QN.png)

Confirme la nueva relación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BnVqVs3_DY.png)

Cierre la sesión en la página de AFIP y vuelva a ingresar con su clave fiscal.

## 6 - Genere el certificado digital en AFIP

Ingrese al servicio de "Administración de Certificados Digitales".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/w7hSFm2r7l.png)

Presione el botón "Agregar alias".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MmMKJBRsP7.png)

Ingrese el nombre del alias que desee utilizar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MkDbZNj69b.png)

Presione el botón para subir el archivo de "Certificate Request" y explore hasta el archivo "certificate_request_posberry.crt" generado desde la configuración web.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EX5Eaecw7r.png)

Confirme presionando el botón "Agregar alias".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9qR35BJNuY.png)

Si la operación fue exitosa tiene que visualizar el certificado agregado recientemente, presione en "Ver" a la derecha del mismo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5AB0YWrOcK.png)

Presione en "Descargar" para descargar el archivo certificado a su equipo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4sN6VAvlmg.png)

Cierre la sesión en la página de AFIP.

## 7 - Vincule el certificado digital con el servicio de Facturación Electrónica en AFIP(Autorizar el Computador)

Ingrese al "Administrador de Relaciones de Clave Fiscal".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Zsk2qx_GVa.png)

Presione el botón "Nueva relación".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jAmSr269lp.png)

Presione el botón "BUSCAR".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CrlLzNzyby.png)

Expanda la sección "AFIP" > "Webservices".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QLlC3cJkhF.png)

Presione sobre el servicio "Facturación Electrónica".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_S22VukdmL.png)

Presione el botón "BUSCAR" en la sección del "Representante".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/l4Ezt4u01H.png)

En "Computador Fiscal" seleccione el alias que usted creo luego presione en "CONFIRMAR".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ejvnnwh2Yd.png)

## 8 - Instale el certificado digital en POSBerry

Haga clic en el botón [Configuración] ("forma de rueda dentada"). Luego en el menú de la izquierda haga clic en el botón [Punto de Venta]. Seleccione el punto de venta deseado. Donde dice **Factura Electrónica - Archivo .crt** , haga clic a subir archivo. Tiene que seleccionar el Certificado descargado desde la web AFIP. Importante: no confundirse de archivo, **es el que se bajo de AFIP** . No el que se bajo de la web de configuración de POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8_uIK-hOH1.png)

Después ir al botón [Guardar] y hagale clic para guardar la configuración.

## 9 - CUIT

Verifique que el numero de CUIT de su empresa este correctamente configurado en la ventana principal de configuración y que coincida con el CUIT utilizado en AFIP para dar de alta el punto de venta.


---

---
title: Ajustes de Inventario desde la web 2
url: https://posberry.tawk.help/article/ajustes-de-inventario-desde-la-web-2
---

# Ajustes de Inventario desde la web 2

*Como realizar ajustes de stock desde la web de administracion 2*


---

---
title: Carga de Productos desde Excel de Productos ( Web )
url: https://posberry.tawk.help/article/carga-de-productos-desde-excel-de-productos
---

# Carga de Productos desde Excel de Productos ( Web )

*aprenda a manipular el Excel de Productos , cargar nuevos Productos , asignacion de datos*

**Instructivo Inicial : ** Como cargar productos en su listado Excel , Importarlos y subirlos + Tips . **Cosas que no debe contener el Excel a la hora de Importarlo :** El Excel no debe contener Formulas , colores, Filtros Activos, Simbolos como ( $ , % , etc ) , y si los va a ocupar asegurese de una vez terminados los cambios , pegar los datos como Valores dentro de Excel, vease " el instructivo Errores en Excel "

## Instructivo Paso a Paso

**1) ** Ingrese al modulo Ventas desde la web y descargue el Excel de Productos : Vease Instructivo [" como Exportar Excel de Productos desde la web " ](https://posberry.tawk.help/article/descargar-lista-de-productos-web) **2) ** Una Vez descargado el Excel de Productos , va a visulizar todo el contenido , que van a ser los datos del Producto.


---

---
title: Crear Una Nueva Condición de Pago en la Web
url: https://posberry.tawk.help/article/nuevo-tipo-de-condición-de-pago-web
---

# Crear Una Nueva Condición de Pago en la Web

*Paso a paso para agregar un nuevo tipo de condición de pago en POSBerry desde la web.*

**1. ** Haz clic en **[Ventas]** ![💲] y luego selecciona **[Tipos de Condición de Pago].** **** **2. ** Haz clic en **[Nuevo Tipo de Condición]** para crear una nueva opción de pago. **** **3. ** Completa los siguientes campos: **Nombre: ** Escribe un nombre descriptivo para la condición de pago (por ejemplo, "MASTERCARD (CRÉDITO)"). **Código: ** Ingresa un código único, como una letra y dos números (ejemplo: "T01"). Nota: El código no se puede modificar una vez guardado. **** **4. ** En el menú desplegable, selecciona si la condición de pago es **efectivo** o **tarjeta.** **** **5. ** Haz clic en **[Guardar]** para finalizar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/138zrHPY_K.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Ver Tipos de Movimiento de Stock (Web)
url: https://posberry.tawk.help/article/ver-tipos-de-movimiento-de-stock-web
---

# Ver Tipos de Movimiento de Stock (Web)

*Guía para consultar y filtrar los tipos de movimientos de stock registrados en la web*

**1. ** Haga clic en **[Stock]** y luego en **[Tipos de Movimiento de Stock].** **** **2. ** Puede usar el filtro de búsqueda para encontrar un tipo específico de movimiento. **** **3. ** Para ver los detalles, haga clic en el nombre del ítem en la lista de la izquierda.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TF1fVOh8qg.png)

Si desea conocer más sobre Stock, visite este manual: [Manual sobre Stock.](https://posberry.tawk.help/category/stock)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Crear Impuestos de Compras desde la web
url: https://posberry.tawk.help/article/crear-impuestos-de-compras
---

# Crear Impuestos de Compras desde la web

*Guía para agregar y personalizar impuestos en compras desde la web*

**1. Acceso a Impuestos de Compras:** Ingresa a la plataforma POSBerry y selecciona **🛍️ [** **Compras ]** (ícono de bolsa de compras). Dirígete a la pestaña **Impuestos** y haz clic en **[Nuevo Impuesto].** **2.Configurar el Impuesto:** Ingresa el **nombre del impuesto** y el **porcentaje** (de 0 a 100). Selecciona el **tipo de aplicación ** del impuesto: IVA, Impuestos Provinciales, Impuestos Internos u Otros. **3.Guardar el Impuesto:** Para finalizar, haz clic en **[Guardar]** para registrar el nuevo impuesto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/P7ytlCs9VL.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Editar Totales e Impuestos en Compras (Web)
url: https://posberry.tawk.help/article/editar-impuestos-totales-web
---

# Editar Totales e Impuestos en Compras (Web)

*Guía para modificar totales e impuestos en la sección de compras desde la web*

**1. ** Ingrese a la sección 🛍️ **[Compras] (ícono de "bolsa de supermercado").** **** **2. ** Seleccione la fecha de inicio, la fecha final y la sucursal. Luego, haga clic en el botón 🔄 **[Recargar] (ícono de "flechas").**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kq88NDa0Ey.png)

**3.** Para ver los detalles de impuestos y totales, haga clic en el botón **[ i ] ** situado a la derecha de la compra que desea revisar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/H3l3GflX71.png)

**4.** Seleccione el impuesto o total que desea editar. Aparecerá un editor en el mismo lugar. Realice los cambios necesarios y luego haga clic en el botón **[✓] ** para guardar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-ZIqgVFO92.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Cambio De Precio Masivo Desde La Web
url: https://posberry.tawk.help/article/cambio-de-precios-masivo-web
---

# Cambio De Precio Masivo Desde La Web

*Ajuste fácilmente los precios de múltiples productos desde la versión web del sistema.*

**IMPORTANTE: ** Antes de realizar cambios masivos en los precios de los productos, es fundamental realizar un **respaldo** de los precios actuales. Esto puede hacerse descargando el listado de productos en formato Excel. lea el siguiente instructivo para garantizar la seguridad de su información: [ImportarListadoProductos](https://posberry.tawk.help/article/ver-los-productos-web)

**1. Acceder a la sección de precios:** En la barra de navegación, haz clic en el botón Productos **(ícono de "carrito de compras")** y luego selecciona **[Precios].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8STSPExlBS.png)

A continuación están los pasos a seguir (cada uno tiene un color diferente en la imagen). **1. Seleccionar productos para cambiar precios (en Naranja):** Usa el buscador para localizar los productos que necesitas ajustar. Puedes buscar por nombre, marca, o familia, o filtrar según los criterios disponibles en pantalla. **2. Aplicar nuevo margen de ganancia (en Verde):** Activa el interruptor **"Cambiar margen de ganancia"** e ingresa el porcentaje (del 1 al 100). **3. Revisar los cambios (en azul) :** Asegúrate de que el interruptor **[Previsualizar]** esté activado (viene activado por defecto; haz clic si fue desactivado previamente). 4. **Excluir productos específicos del cambio (en violeta):** Para omitir algún producto, desmarca la casilla **[v]** a la izquierda de ese producto. Solo los productos marcados en pantalla serán modificados. **Nota:** Los cambios se aplicarán únicamente a los productos visibles y seleccionados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pYmLQlP4_f.png)

**5. Confirmar y aplicar cambios:** Si estás conforme, haz clic en **[CAMBIAR].** Confirma seleccionando **[Sí]** ; un cuadro de información te mostrará la cantidad de productos actualizados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Jbn3aFBock.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bQpN9NTrbe.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como cargar pagos de cuentas corrientes (Web)
url: https://posberry.tawk.help/article/como-cargar-pagos-de-cuentas-corrientes-web
---

# Como cargar pagos de cuentas corrientes (Web)

*Pasos para registrar pagos en cuentas corrientes de clientes desde la web*

**1. Acceso a Cuentas Corrientes:** En la versión web de POSBerry, haga clic en la pestaña **Clientes** y seleccione **Cuentas Corrientes de Clientes** . **2. Selección de Cuenta:** En la lista de cuentas corrientes, busque y haga clic en el botón **Detalle ** de la cuenta a la que desea registrar el pago.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Qw1BvTmu1i.png)

**3. Registro del Pago:** En la parte inferior de la página de detalles, verá un campo para cargar el pago. Ingrese el **monto a pagar.** En la tabla debajo, se mostrará cómo se aplica el monto a las ventas pendientes. Haga clic en **Pagar** y, en el cuadro de confirmación, seleccione **Sí** para finalizar el registro.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/m-qAswv2QP.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lLBODA2k6O.png)

**4. Actualización Automática:** Una vez registrado el pago, la página se recargará automáticamente y los pagos quedarán aplicados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PIOX_h_SEa.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Como Configurar y Utilizar la Fidelizacion en la Web
url: https://posberry.tawk.help/article/fidelización-de-clientes
---

# Como Configurar y Utilizar la Fidelizacion en la Web

*Permita a sus clientes acumular puntos y canjear beneficios al comprar productos.*

Si tiene habilitada la función de Fidelización, puede configurar productos que sumen puntos para sus clientes, los cuales pueden ser canjeados por beneficios, como GiftCards.

**1. Configurar Puntos en los Productos:** Desde la **versión web o el programa de escritorio (PC)** , edite los productos para asignarles puntos que sus clientes acumularán por cada unidad vendida. **2. Asignación de Puntos:** En la **web** , haga clic en el icono de **Carrito de Compras.** Seleccione el producto a editar y haga clic en el cuadro azul junto al nombre del producto. En la ficha del producto, localice el campo **Puntos de Fidelización** e ingrese la cantidad de puntos a acumular por cada venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WOBQ6RTNDb.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/B7GE3yNhjd.png)

**3. Guardado de Cambios:** Para finalizar, desplácese al inicio de la ficha del producto y haga clic en **Guardar** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IlG57G1yGH.png)

Nota: Para que los puntos se registren correctamente, es necesaria una conexión a Internet en la PC al momento de la venta. Si no hay conexión, los puntos no se acumularán.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Ver Reportes De Caja Desde La Web
url: https://posberry.tawk.help/article/ver-reportes-de-caja
---

# Ver Reportes De Caja Desde La Web

*Consulte y descargue sus reportes de caja para obtener un resumen detallado de las transacciones diarias o en períodos específicos.*

**1. Acceder al reporte de caja:** Haz clic en el botón **[Caja]** y luego selecciona **[Reporte de Caja].** **** **2. Configurar el reporte:** Ingresa la **fecha inicial, fecha final** y selecciona la **sucursal.** Luego, haz clic en el botón **[Recargar] ♻️** para actualizar el reporte.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0T7Ga7Lfwf.png)

**3. Ver resumen de caja:** La sección "Caja" mostrará las fechas de inicio y cierre, los totales, y más detalles de las transacciones dentro del rango de fechas especificado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DwirA_WuOr.png)

**4. Consultar y agrupar detalles:** Haz clic en un elemento de la lista para ver los detalles desglosados en la parte inferior de la pantalla. Los detalles se organizan en categorías como **"Venta Contado", "Sobrante de Caja", "Faltante de Caja"** , entre otros.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/R_ZAc0VI2Y.png)

**5. Descargar el reporte:** Puedes exportar el reporte completo haciendo clic en el botón **[En Excel]** **📥.**

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Ver Compras Desde La Web
url: https://posberry.tawk.help/article/ver-compras-web
---

# Como Ver Compras Desde La Web

*Guía para visualizar y gestionar compras desde la web*

**1. ** Haga clic en el botón **[Compras] (icono de "bolsa" 🛍️).** **** **2. ** Ingrese la **fecha de inicio** y la **fecha final.** **** **3. ** Seleccione la sucursal correspondiente y haga clic en el botón **[Recargar] (icono de "flechas circulares" 🔄).**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/q-lcXE_rSw.png)

## Ver el listado de compras

Puede ver el listado de compras y descargarlo. Haga clic en el botón **[En Excel].** Para ver la información de los **totales de impuestos** y los **totales de la compra** , haga clic en el botón **[ i ] ℹ️** situado a la derecha de cada compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lZ9RbRxUy4.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Realizar ventas en la Web
url: https://posberry.tawk.help/article/realizar-ventas-en-la-web
---

# Realizar ventas en la Web

*Como realizar una venta a través de la pagina web de POSBerry*

## NOTA IMPORTANTE: ESTE APARTADO ESTA REALIZADO PARA CONTROL DE ALTAS DE PROMOCIONES, NO SE DEBE USAR PARA UNA VENTA REAL!!! (la web no tiene asignada ninguna caja, las ventas se realizan solamente desde los puntos de venta habilitados).

tenemos que ir a la la pagina web de POSBerry, ir al apartado ventas (moneda con signo $), seleccionar el boton con signo + y este nos abrirá una nueva ventana en donde debemos poner nuestro codigo de vendedor y estaremos en una pagina en donde podremos hacer nuestra venta

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9_j0pQHdaP.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZHWCJ3FlU_.jpeg)

en esta pagina debemos elegir en que sucursal y en que punto de venta se registrará la venta, luego al finalizar la carga de productos damos en cobrar y se nos darán opciones de pago

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Kz17PDVA6X.jpeg)

en esta el primer renglon de números corresponde al efectivo, y el segundo corresponde a las tarjetas, debemos dar click en una de estas para elegir el metodo de pago, luego cargamos el pago del cliente, le damos en el boton "OK" y se realizará la venta

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nJjxplcZQb.jpeg)


---

---
title: Crear Nueva Promocion (Web)
url: https://posberry.tawk.help/article/nueva-promoción-web
---

# Crear Nueva Promocion (Web)

*Cómo agregar una nueva promoción en la plataforma web de POSBerry*

**1. ** Haga clic en el botón **[Productos] (ícono de "carrito de compras")** en el menú de navegación. **** **2. ** Seleccione la opción **[Promociones].** **3. ** Haga clic en el botón **[+]** para crear una nueva promoción.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7Q5Af6c5Yp.png)

4. Complete el campo **"Descripción"** con un nombre que le ayude a identificar fácilmente la promoción. 5. Defina la **vigencia** , es decir, el período de tiempo durante el cual la promoción será válida (puede seleccionar cualquier rango de fechas). 6. Configure los **días de vigencia** , que son los días de la semana en los que la promoción estará activa. Por defecto, la promoción aplica todos los días. 7. En el campo **Leyenda Ticket** , ingrese cómo desea que aparezca la promoción en el ticket de compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IpT7mJ80EA.png)

**8.** Seleccione el **Tipo de Promoción** que desea aplicar de entre los 8 tipos disponibles. **9.** Al elegir el tipo de promoción, los campos específicos de esa promoción se mostrarán automáticamente en la parte inferior del formulario. **10.** Rellene los campos adicionales según el tipo de promoción seleccionado. **11.** Para finalizar, haga clic en **[Guardar]** . para saber mas sobre tipos de promociones visite este instructivo: [https://posberry.tawk.help/article/tipos-de-promociones](https://posberry.tawk.help/article/tipos-de-promociones)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fqOMrQFZ_j.png)

**IMPORTANTE:** Las promociones pueden ser editadas en cualquier momento, excepto el **Tipo de Promoción** , que no puede modificarse una vez creada.

Gracias por leer el instructivo. Para más información, vea nuestros vídeos tutoriales en YouTube aquí: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Realizar una Nueva Compra Desde La Web
url: https://posberry.tawk.help/article/nueva-compra-web
---

# Realizar una Nueva Compra Desde La Web

*Pasos para registrar una compra desde la plataforma web de POSBerry*

**1. Acceder a la Sección de Compras:** Haga clic en el botón 🛍️ **[Compras]** (ícono de bolsa). Seleccione el botón **[+]** (nueva compra).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yWLq7fbRHX.png)

**2. Detalles de la Compra:** En el editor de compras, elija el **proveedor** . Dependiendo del proveedor seleccionado, la compra incluirá **productos o servicios.** Los tipos de comprobantes o facturas disponibles también variarán según el proveedor. El **tipo de documento** seleccionado afectará cómo se aplican los impuestos. **3. Opciones de Stock:** Si desea que la compra afecte el stock, marque la casilla **"Afectar Stock"** y elija el depósito correspondiente. **4. Agregar Productos:** Utilice el buscador para seleccionar productos. Ingrese la **cantidad** y el **precio neto** . El precio final se mostrará para facilitar la revisión. Haga clic en **[Guardar]** para añadir el producto. **5. Revisión y Edición de Impuestos:** Los impuestos y totales se calculan automáticamente. Puede editarlos antes de guardar la compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AeOuHrvFX6.png)

**6. Finalizar la Compra:** Haga clic en **[GUARDAR COMPRA].** Confirme la acción en el mensaje emergente seleccionando ** [Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Nu-6PBK2SS.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Como Dar De Alta Una  Receta Desde La web v2
url: https://posberry.tawk.help/article/como-dar-de-alta-su-receta-desde-la-web
---

# Como Dar De Alta Una  Receta Desde La web v2

*Estos son los pasos para dar de alta un producto de tipo Receta desde la web*

## Productos de Tipo Receta

Los productos de tipo Receta están compuestos por otros productos llamados Insumos. **👉 Importante:** Antes de crear una Receta, primero debe cargar en el sistema los productos que van a llevar el stock real (por ejemplo: Pan Pebete y Salchicha). Luego, al configurar la receta, se definen los insumos y las cantidades que la componen. De esta manera, cada vez que se realice una venta del producto tipo receta, el sistema descontará automáticamente del stock las cantidades configuradas de cada insumo. **📌 Ejemplo:** Producto tipo Receta: Pancho Insumos que lo componen: **Unidad de "Salchicha"** **Unidad de Pancho** Al vender un Pancho, el sistema descuenta del stock 1 salchicha y 1 pan pebete. Usted puede configurar libremente los insumos y las cantidades necesarias para cada producto de tipo Receta según su negocio.

## Instructivo Paso a Paso

primero debemos de crear nuestros productos que van a constituir nuestra Receta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xbXqSdffpM.png)

En mi caso mis 2 productos van a ser "Salchicha" y "Pan Pebete"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qm89wmM2-m.png)

el siguiente paso es crear la Receta. Agregamos un nuevo Producto. En el campo " Tipo" Elegimos " Receta". Guardamos el nuevo Producto de Tipo " Receta " haciendo Clic en el botón " Guardar "

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jEtLS_kovt.png)

Lo siguiente va a ser configurar nuestro Producto de tipo Receta. hacemos clic en el icono " Rueda dentada " ubicada a la derecha de la tabla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9cGEz_T3k9.png)

Vamos a agregar los productos de tipo Insumo. hacemos clic en el Campo " Producto ". Luego hacemos clic en el boton " Agregar y Guardar "

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/feX7RbmJul.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uHxoMW8uCx.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/X51aLJFhgg.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b-sGIcmIYO.png)

Podemos Editar sus cantidades a descontar Haciendo Clic en el Icono " Lapiz". Colocamos las Cantidades y Guardamos haciendo Clic en el Boton " Guardar "

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cIN-tuqac4.png)

Desde aqui tambien puede configurar sus Opcionales y Adicionales. para saber mas sobre opcionales y Adicionales: [Opcionales y Adicionales](https://posberry.tawk.help/article/opcionales-y-adicionales)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qd-2xkT6Ya.png)


---

---
title: Transferencias de Stock Desde la web v2
url: https://posberry.tawk.help/article/transferencias-de-stock-entre-sucursales
---

# Transferencias de Stock Desde la web v2

*Aprenda a realizar transferencias de stock entre sucursales desde la web de POSBerry*

## Instructivo paso a paso

Ingrese a la ** web V2** y diríjase al módulo **“Stock” → “Movimientos de Stock”.** Haga clic en el botón **“Nuevo Envio de Mercaderia”** para ingresar al apartado de transferencias.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HahSM9C1EQ.png)

Configure la Transferencia: Seleccione la **Sucursal de Origen.** Seleccione la **Sucursal de Destino.** En el campo **Tipo de Movimiento** , elija la opción **“Transferencia”.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OhR0UKHWo1.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/i_1gCKyl_m.png)

Agregue los productos: Seleccione los productos que desea transferir. Indique las **cantidades** correspondientes. Haga clic en **“Guardar”** para que los productos queden cargados en la transferencia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ywC-qGSFUG.png)

Una vez listos todos los productos, haga clic en el botón **“Guardar” ** ubicado debajo de la tabla para **enviar la transferencia a la sucursal de destino.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HIK83gRzoX.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_StVlx5pRg.png)


---

---
title: Ver Ventas desde la web 2.0
url: https://posberry.tawk.help/article/ver-ventas-desde-la-web
---

# Ver Ventas desde la web 2.0

*Vea y Gestione la información de Ventas de su Caja desde la web.*

Con este Instructivo podrá revisar el Movimientos de Ventas de su Negocio desde la web, También Podrá filtrar por **"Sucursal"** y **"Rango de Fecha"** .

## Instructivo Paso a Paso

**1) ** Ingresamos a la web: [Web Administrativa](https://app.posberry.com/sessions/signin) . **2) ** Nos dirigimos al Modulo **" Ventas " (Signo Pesos )** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Pa4fabKIOv.png)

**3)** Una vez dentro del Modulo " ** Ventas " ** nos dirigimos a **" Por Documento" , ** aquí vamos a visualizar el listado de todas nuestras Ventas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JuDKZ2eXXL.png)

**4) ** Para visualizarlo primero deberemos Filtrarlo por un **" rango de fecha especifica " ** y **" sucursal Especifica ".** **5) ** Una vez filtrados estos datos , Hacemos Clic en el Botón **" Mostrar "** para Cargar listado de Ventas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/R6h9q1neBo.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kFkFO8XtnH.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bAyUNMImbc.png)

**6)** Una vez que haga Clic en **" Mostrar " ** se cargaran todas sus Ventas en el listado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TPnAkYQieV.png)

**7) ** También Podrá Los ** Detalles de las Ventas** haciendo Clic en el Icono de Exclamación " **¡ ** " **. **

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/c4MamjFLTq.png)

**8) ** Debajo de la Tabla podrá visualizar los **" Totales "** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/d40ZFjX2aP.png)


---

---
title: Filtrar Ventas Por Condicion De Pago Web 2.0
url: https://posberry.tawk.help/article/filtrar-ventas-por-medio-de-pago
---

# Filtrar Ventas Por Condicion De Pago Web 2.0

*Filtre sus Ventas por Condicion de Pago , desde la web y desde Excel.*

En este instructivos aprenderemos como Filtrar Ventas por **"Condicion de Pago"** , de este manera va a poder ver totales y cantidad de ventas ya sea en **Efectivo, Tarjetas, Mercado Pago, Clover, Etc** .

## Instructivo Paso a Paso

**1) ** Ingresamos al Modulo de Ventas desde la web: Instructivo [" Ver Ventas"](https://posberry.tawk.help/article/ver-ventas-desde-la-web) **2) ** Una Vez ingresemos al Modulo de Ventas y ya filtradas.

**7) ** Deslice hacia abajo para encontrar el **segundo Listado** , En este LIstado podrá ver todos los Movimientos , y filtrar desde la columna **" Cond. Pago"8) ** En el Campo Editable de esta columna puede filtrar por una Cond. de Pago en especifica por ejemplo en **" EFECTIVO "** , podra ver todas las ventas cobradas con Efectivo y sus Totales. **9) ** La Ultima Fila de la Tabla , va a Corresponder a la sumatoria de todos las **Cond. De Pago.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1ktjv417-o.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TznYd8R3aL.png)


---

---
title: Como Instalar la App ControlAr
url: https://posberry.tawk.help/article/como-instalar-la-app-controlar
---

# Como Instalar la App ControlAr

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_zFEvKj6LS.png)

Ingrese a su teléfono o tablet y luego en internet a [www.posberry.com](http://www.posberry.com) y haga clic en el menú hamburguesa y luego en Descargas. Haga clic en "ControlAr" y se descargará ControlAr.apk. Permita la instalación desde Chrome o el navegador de su elección e instale el apk.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PiAw3p4UYB.png)

A continuación en su cuenta de POSBerry en la web, vaya a configuración, puntos de venta y active la casilla "Usar venta y preventa remota" y haga clic en guardar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/x6GilNut0Q.png)

A continuación abra POSBerry y sincronice para que se bajen las configuraciones. Luego puede abrir en su telefono o tablet la app ControlAr, haga clic en Conectar para que el programa detecte la IP automáticamente o ingrese el numero de IP que está en POSBerry en el Menú (Ctrl + O) > Acerca de > Servicios > Preventa y venta remota. Una IP tiene este formato 192.168.1.42 por ejemplo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HthojIAJXd.png)

Por último seleccione un operador e ingrese la contraseña para continuar. Una vez logueado podrá ver las opciones Controlar Stock, Controlar Precios y Controlar Etiquetas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ie93uGOcQU.png)


---

---
title: Reimprimir Comprobantes Desde la Web 2.0
url: https://posberry.tawk.help/article/reimprimir-comprobantes-desde-la-web-20
---

# Reimprimir Comprobantes Desde la Web 2.0

*Aprenda a reimprimir sus comprobantes desde la web 2.0*

En este Instructivo vamos a aprender a **reimprimir sus Comprobantes** y Guardarlos en **Formato .pdf** .

## Instructivo Paso a Paso

**1)** Véase el siguiente Instructivo para Filtrar y cargar su listado de Ventas: [Ver Ventas](https://posberry.tawk.help/article/ver-ventas-desde-la-web) . **2) ** Una vez **filtradas y cargado su listado de Ventas** , elija la venta que desea reimprimir su comprobante.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8OGDH5s9gk.png)

**3) ** Luego hagamos clic en el **" Icono de Impresora "** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DHkL2bX-3O.png)

**4) ** Luego de esto podremos ver nuestra **" Factura Digital "** , con sus diferentes datos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/54iTLse5uY.png)

**5) ** Una vez verifiquemos los Datos , Podemos Imprimir nuestra Factura , Haciendo Clic en el Botón **" Imprimir "**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bZotrpKTaA.png)

**6) ** Puede Guardar su Comprobante en **Formato a4 o directamente imprimirlo** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PG5ymWF2wt.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qUNJN2H4Im.png)


---

---
title: Ajuste de Inventario Desde la Web
url: https://posberry.tawk.help/article/ajuste-de-inventario-web
---

# Ajuste de Inventario Desde la Web

*Cómo Actualizar el Inventario de Productos de Forma Fácil y Rápida*

1. Haga clic en el botón **Stock** (icono de "caja de madera") y luego seleccione **[Inventario].** **** 2. ** ** Elija el **depósito** con el que quiere trabajar y haga clic en las flechas que se encuentran justo al lado a la derecha de deposito **.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/k3q6K_zCIV.png)

3. Use el campo **Buscar** para encontrar el producto cuyo stock necesita ajustar. 4. Para modificar el **stock físico** , haga clic en el valor actual, ingrese el nuevo número y presione **Enter** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/c6vvBI7wDB.png)

5. Puede ocultar los productos inactivos activando el interruptor **"Solo Activos".** 6. Si desea filtrar por una familia de productos, active el interruptor **"Solo esta Familia" ** y elija la familia desde el menú desplegable.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YLBIqHV4OK.png)

7. Una vez que haya hecho todos los ajustes, haga clic en el botón azul **[Revisar]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/T8MCksS6jt.png)

8. Aparecerá un cuadro de diálogo informativo. Confirme haciendo clic en el botón blanco **[Revisar]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BD2XRIFNlx.png)

9. Si está conforme con los cambios, haga clic en **[Grabar]** para guardarlos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/q-7omCtmE5.png)

10. Confirme la operación haciendo clic en **[Sí]** . La página se recargará y mostrará los datos de stock actualizados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LtYRqvPtrP.jpg)

11. También puede actualizar el inventario descargando un archivo de Excel, editándolo, y subiéndolo con los nuevos valores de stock. Primero, debe cargar el stock actual y luego hacer clic en el botón **[Descargar]** para obtener el archivo con los datos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/05xCBabUQP.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/avBr1jNAW7.png)

12. Una vez que haya subido el archivo con los cambios, haga clic en **[Revisar]** y luego en **[Grabar]** para finalizar el proceso.


---

---
title: Instalar Balanza Systel Cuora Neo en Windows
url: https://posberry.tawk.help/article/instalar-balanza-neo-en-windows
---

# Instalar Balanza Systel Cuora Neo en Windows

El paso 1 es [descargar libpq](https://github.com/Arandusoft/POSBerry/releases/download/descargas/libpq.zip) y descomprimir los archivos en la carpeta de POSBerry. Para eso hacer clic derecho en el icono de POSBerry > Abrir la ubicación del archivo. En esa carpeta copiar libpq.zip y luego clic derecho en este archivo > Extraer todo. Asegurese que lo extrae en la misma carpeta y no en un subdirectorio.

El paso 2 es [descargar vcredist](https://github.com/Arandusoft/POSBerry/releases/download/descargas/vcredist.zip) , descomprimir los archivos e instalar cada uno de los programas que vienen dentro de este archivo zip.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SW6fCI-neN.jpg)

Ingrese al menú de Conectividad DB e ingrese en Clave: 1234

Nota Final: Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, le recomendamos que se comunique directamente con el soporte técnico de Systel para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry. Para cualquier problema que pueda surgir después de la importación de datos a Qendra, por favor, póngase en contacto con el equipo de soporte de Systel, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Informar CAEA
url: https://posberry.tawk.help/article/informar-caea
---

# Informar CAEA

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ymVvPX6Zgq.png)

Para informar el CAEA debe hacer clic en Opciones->Ventas->Facturación de pendientes. Nota: las facturas electrónicas se informan automáticamente excepto cuando no hay conexión.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uw4hnDKGU3.png)

Para realizar el informe de las facturas electrónicas seleccione la factura y haga clic en Facturar uno o haga clic Facturar Todo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wu-IV4Dzvh.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZhFj8Xwqjj.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oepSw5T13p.png)


---

---
title: Como Imprimir Precios de Manera Local para Góndolas
url: https://posberry.tawk.help/article/imprimir-precios
---

# Como Imprimir Precios de Manera Local para Góndolas

*Genere e imprima etiquetas de precios en formatos A4, 80 mm y 57 mm desde el sistema POSBerry.*

POSBerry le permite **imprimir etiquetas de precios para góndolas o exhibidores** de manera local, utilizando distintos formatos según el tipo de impresora. Podrá filtrar, seleccionar y generar etiquetas en papel A4 o en rollos de 80 mm y 57 mm, de forma rápida y precisa.

## Instructivo Paso a Paso

✅ Acceso a la impresión de precios **1)** Desde la **pantalla principal** , haga clic en el botón **[Opciones]** . **2)** En el menú desplegable, seleccione **[Stock]** . **3) ** Dentro del módulo **Stock** , elija la opción **[Listado de Productos].4) ** En la ventana de **Listado de Productos** , busque la Solapa **[ Precios]** en la esquina superior derecha y haga clic en ella.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4bu_Xe0-ES.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WiyCprY2P3.png)

✅ Filtrar y seleccionar los productos **1)** Utilice el **panel izquierdo** para aplicar filtros según sus necesidades. Puede filtrar por: **Familia** **Proveedor** **Productos activos o inactivos** **Otras categorías disponibles**

Al marcar un filtro, solo se mostrarán los productos que cumplan con ese criterio.

**2) ** Si necesita buscar un producto específico, utilice la **barra de búsqueda** ubicada sobre el listado. Puede buscar por: **Nombre del producto** **Código interno** **Código de barras** **Cualquier otro campo visible en la lista**

✅ Configuración de impresión **1) ** En el panel derecho, seleccione su impresora en el menú desplegable. **2) ** Elija el formato de impresión deseado. POSBerry ofrece múltiples opciones, entre ellas: **Altura personalizada** (por ejemplo: 35 mm) **Hojas A4** con diferentes cantidades de etiquetas (16, 30, 40, 64, 80) Formatos especiales, como **“Hoja A4 Oferta”** **Formatos de rollo térmico: 80 mm y 57 mm**

**3) ** Una vez configurada la impresora y el formato, haga clic en el botón **[Imprimir]** para generar las etiquetas de precios.

**✅ Recomendación:** Antes de imprimir, verifique los precios y filtros aplicados para evitar generar etiquetas incorrectas o duplicadas.


---

---
title: Como Saber la Ultima Modificacion de Mis Productos
url: https://posberry.tawk.help/article/como-ver-ultimas-modificacion-en-sus-poductos-desde-la-web
---

# Como Saber la Ultima Modificacion de Mis Productos

*Revise los cambios recientes realizados en sus productos y el usuario que efectuó cada modificación.*

**POSBerry le permite consultar el historial de modificaciones** realizadas sobre cada producto, incluyendo el usuario que efectuó el cambio, la fecha y la variación de precios. Esta función le brinda mayor control y trazabilidad sobre las actualizaciones en su catálogo de productos.

## Instructivo paso a paso

**1)** Ingrese a la **web de administración** y diríjase al módulo **“Productos”** . **2)** En el **listado de productos** , ubique el producto que desea revisar. **3)** Haga clic en el **ícono de usuario 👤** para visualizar los detalles de las últimas modificaciones realizadas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/u42P9axtwf.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iYgdkfYwOs.png)

**4) ** En esta ventana podrá ver: **Precio anterior y precio vigente.** **Variación en el precio.** **Fecha y hora de la modificación.** **Usuario (operador) que realizó el cambio.** **Lista de precios en la que se efectuó la modificación.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7-SjZ1icqJ.png)

## Desde su Punto de Venta

Tambien lo podra hacer desde su Punto de Venta , dirigiendose a la edicion del Producto

**1)** Diríjase al **Punto de Venta** e ingrese al apartado de **edición de producto.** **2)** Busque el producto desde la **barra de búsqueda** y colóquese sobre él. **3)** Cuando el producto se muestre **coloreado en azul** , significa que está seleccionado. **4) ** Haga clic en el ** ícono del lápiz ✏️** para ingresar a la edición.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J8QEjWR4Yg.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YVoiAVLrEH.png)

**5) ** Finalmente, haga clic en el **ícono del usuario 👤** para visualizar la información de la última modificación, quién la realizó y quién creó el producto originalmente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/H87-x3mila.png)


---

---
title: ¿Como funciona el pago mensual?
url: https://posberry.tawk.help/article/¿como-funciona-el-pago-mensual
---

# ¿Como funciona el pago mensual?

este es por mes adelantado, por lo tanto si en su sistema de pagos este dice que debe pagar el 31/6 (junio), en realidad se esta pagando el mes de julio, si no se concreta el pago usted tiene 14 dias para usar el sistema con todas sus funciones, el dia 15 se le corta unicamente la funcion web, luego el dia 20 sin pagar se corta todo servicio de POSBerry, la unica manera de volver a utilizar el sistema es pagar el mes.


---

---
title: Excel de precios: como realizar cambios de precios
url: https://posberry.tawk.help/article/excel-de-precios-como-realizar-cambios-de-precios
---

# Excel de precios: como realizar cambios de precios

*Cambios de precio tanto individual como Masivos*

Antes de cambiar los precios de los productos en POSBerry, es importante que descargue y guarde como respaldo el archivo Excel de productos, en caso de que los cambios no sean correctos. Para descargar el archivo de solo precios, vaya a la sección de Productos en la web de POSBerry. Una vez descargado el archivo, ábralo en su computadora para hacer los cambios correspondientes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/glB3YwBs5w.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/by9m1QG2K4.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZEliy_yRbs.jpeg)

## Modificar individualmente:

debemos modificar la celda del producto correspondiente, reemplazando el precio antiguo con el precio nuevo, se pueden aplicar formulas en caso de ser necesarias

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0eNF7Fknbk.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kIt2qSGD9f.jpeg)

una vez modificado los precios individuales deseados, guardamos los cambios, vamos a la web, buscamos en la seccion "productos" hacemos click donde dice seleccionar archivo y elegimos nuestro excel de precios.

## Modificar masivamente:

**1.** Abra un archivo de Excel vacío y el archivo de precios que desea modificar. **2.** Copie la columna de precios que desea modificar y péguela en la hoja de Excel vacía. **3. ** En la columna junto a la columna de precios copiados, escriba el porcentaje que desea aumentar en cada precio. **4.** Aplique una fórmula de multiplicación en la tercera columna multiplicando la columna de precios por el porcentaje a aumentar. **5.** Arrastre la esquina inferior derecha de la celda con la fórmula de multiplicación hacia abajo para llenar todas las celdas. **6.** Copie la columna con los nuevos precios y péguela en la columna de precios antiguos en el archivo de precios original. **7.** Guarde los cambios en el archivo de precios y súbalo a la web de POSBerry. **8.** Confirme que los cambios se hayan realizado correctamente en la web de POSBerry revisando la columna modificada. IMPORTANTE: Descargue el archivo de productos como respaldo antes de hacer cambios de precios. Al pegar la columna con los nuevos precios, elija "Pegar como valores" y asegúrese de que los cambios se hayan realizado correctamente en la web de POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mX2T075bsw.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LnGxkQxnhw.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/34kohTFSfW.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2gI2nRJ5Ye.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4Z-ZvOR_cX.jpeg)

al tener todos los valores con el porcentaje agregado, debemos copiar la columna y reemplazar la columna de precios antigua con la columna de precios nueva en el excel de precios pegando la nueva encima de la antigua (exactamente en el mismo lugar), guardamos los cambios en el excel de precios y vamos a la web, buscamos donde dice subir listado de productos, hacemos click donde dice seleccionar archivo, elegimos el excel de precios modificados y lo suben (para confirmar que les toma bien los cambios en la web, pulsen en mostrar detalles y vean la columna modificada, debe tener los mismos valores que el excel de precios).


---

---
title: Como Crear y Asignar Familias a sus Productos
url: https://posberry.tawk.help/article/crear-y-asignar-familias-a-sus-productos
---

# Como Crear y Asignar Familias a sus Productos

*Organice sus productos por familias para mejorar la búsqueda, el control y la gestión desde la web de POSBerry.*

Las **familias de productos** permiten agrupar artículos por rubro, área, marca o tipo de producto. Esta organización facilita la búsqueda y clasificación en módulos como ventas, compras, movimientos de stock o cambio de precios, optimizando la gestión diaria.

## Instructivo Paso a Paso

**1) ** Ingrese a la [web de administración](https://app.posberry.com/sessions/signin) . **2) ** Diríjase al módulo **“Productos”** . **** **3) ** Dentro del módulo, seleccione la opción **“Familias”** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wLVQDUSKuZ.png)

**4) ** Haga clic en “Agregar Familia”. **5) ** Asigne un **nombre descriptivo** que identifique el grupo de productos (por ejemplo: Almacén, Bebidas, Limpieza, etc.).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pVTmovBi4_.png)

**6) ** Desde esta pantalla también podrá configurar: **Impresora de comandas** , si desea asociar la familia a una impresora específica. **Favoritos** , para que aparezca en el panel principal. **Orden** , para definir la posición en modo kiosco.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZuxKMWQOmW.png)

**7) ** Una vez completada la información, haga clic en **“Guardar”** para crear la nueva familia.

## Asignar Familias desde el Excel de Productos

**1) ** Descargue el archivo Excel de productos. Consulte el Instructivo: Excel de [Productos Web V2.0](https://posberry.tawk.help/article/ver-los-productos-web) para mas Informacio **2)** Dentro del Excel en el Campo **" Familia "** Vamos asignando la familias en el ejemplo **" ALMACEN "** a los productos

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DTqZGpKOwG.png)

**3)** Guarde los cambios realizados en el archivo. **4) ** Importe nuevamente el Excel actualizado desde la web de POSBerry para aplicar las modificaciones.

**✅ Recomendación:** Mantenga una estructura clara en las familias y evite duplicar nombres. Esto facilitará los filtros y reportes dentro del sistema.

**Importante:** Las familias deben escribirse **exactamente igual** a como fueron creadas en el sistema. Esto es fundamental para que el sistema reconozca correctamente la familia y la vincule al producto. Si la familia se creó como **“ALMACÉN”** (todo en mayúsculas), debe escribirse **“ALMACÉN”** en el Excel. Si se creó como **“Almacén”** (solo la primera letra en mayúscula), debe escribirse **“Almacén** ” en el Excel.


---

---
title: Como Configurar el Cierre de Caja Ciego
url: https://posberry.tawk.help/article/configure-cierre-de-caja-ciego
---

# Como Configurar el Cierre de Caja Ciego

*Desactive la visualización de totales y ventas para sus operadores y mejore el control de caja.*

El **Cierre de Caja Ciego** permite restringir la información visible a los cajeros, evitando que vean totales, sobrantes o ventas durante el cierre de caja.

## Instructivo Paso a Paso

**1)** Ingrese a la sección **Roles** del sistema y seleccione el rol correspondiente al operador (por ejemplo: ** Cajero** ). **2) ** Si necesita más información sobre cómo acceder a los roles, consulte el instructivo: [ Configuración de Roles](https://posberry.tawk.help/article/configure-cierre-de-caja-ciego) . **3) ** Una Vez elegido el Rol , desactivamos las opciones de **Ver Cajas , Ver Sobrante de Caja , Ver Ventas** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vlOzvafQKJ.png)

**4) ** Después de realizar los cambios, **sincronice el Punto de Venta** para aplicar las modificaciones. Verifique desde un usuario con rol de cajero (por ejemplo: cajero@metropizza) que el cierre de caja ciego esté activo correctamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/P0j8VwdKZO.png)

## Más configuraciones de seguridad en las ventas (desde el Punto de Venta)

De forma predeterminada, el sistema muestra las **últimas ventas** realizadas. El mínimo es **1** y el máximo **10** ventas visibles. Usted puede ajustar este valor desde las configuraciones.

**1)** Ingrese con un **usuario administrador** o con permisos de configuración. **2) ** Diríjase al menú utilizando el comando **Ctrl + O.** **3) ** En el apartado ** Configuración** , desplácese hacia el final hasta encontrar la opción: **" Cantidad de Ventas a Mostrar sin permiso de ver ventas "** . **4) ** Indique la cantidad deseada de ventas a mostrar y guarde los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MrmFV29mfQ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FwGF6QZk0X.png)


---

---
title: Actualizar precio de costo Y precio de venta con las compras
url: https://posberry.tawk.help/article/actualizar-precio-de-costo-y-precio-de-venta-con-las-compras
---

# Actualizar precio de costo Y precio de venta con las compras

*Como activar y utilizar estas funciones*

Para actualizar los precios de venta y costo con las compras en POSBerry, sigue estos pasos: 1. Ingresa a la página web de POSBerry y accede a la sección de configuraciones. 2. Haz clic en "Empresa" y activa la opción "Actualizar precio de venta en la compra". 3. Ten en cuenta que esta opción solo se aplica a la lista 1. ¡Listo! Con esta configuración, los precios de venta y costo se actualizarán automáticamente cuando hagas una compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/z1R9Ro-m9G.jpeg)

Una vez hecho esto, cada vez que carguemos una compra, se deberá tildar la opción: "actualizar costo" , de esta manera, al cargar nuevos precios de costo, estos se configurarán en los productos cargados en la compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NT4ag6X0JI.jpeg)

IMPORTANTE: Estas funciones solo se pueden utilizar desde el punto de venta, no se aplican en las compras WEB.


---

---
title: Procedimiento Para la Correccion de Impuestos Provinciales en Mercado Pago
url: https://posberry.tawk.help/article/procedimiento-para-la-correccion-de-impuestos-provinciales-en-mercado-pago
---

# Procedimiento Para la Correccion de Impuestos Provinciales en Mercado Pago

*Instructivo para corregir la configuración de domicilio fiscal y evitar el cobro de impuestos provinciales incorrectos en tu cuenta de Mercado Pago.*

**Importante:** Esta configuración debe realizarse directamente en Mercado Pago. POSBerry no tiene la posibilidad de modificar domicilios fiscales o Store ID en tu cuenta.

Si en tu cuenta de Mercado Pago aparece un cobro de impuestos de la provincia de Mendoza y no corresponde, es posible que la dirección de tu dispositivo (store ID) esté configurada en esa provincia. **Te explicamos cómo corregirlo:**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/01KPjTwT8H.jpg)

**🛠️ 1. Cargar tu Certificado de Ingresos Brutos en Mercado Pago** Ingresá a tu cuenta de Mercado Pago. Accedé al siguiente enlace: [Cargar certificado de Ingresos Brutos](https://vendedores.mercadolibre.com.ar/nota/carga-el-certificado-de-ingresos-brutos-a-tu-cuenta-de-mercado-pago) . Seguí las instrucciones para subir tu certificado correspondiente a tu provincia.

**📍 2. Verificar y cambiar la ubicación del Store ID (domicilio fiscal)** **** Si el Store ID figura en Mendoza, tenés que corregirlo: Ingresá a Mercado Pago. Hacé clic en "Tu negocio" > ["Locales y cajas"](https://www.mercadopago.com.ar/stores#from-section=menu) . Ingresá usuario y contraseña. Seleccioná el local o dispositivo afectado. Modificá la dirección fiscal, eligiendo la provincia correcta donde operás. **🔔 Importante:** Este cambio solo puede hacerse desde una computadora o desde la app de Mercado Pago en iPhone. Todavía no está disponible en Android.

**🏢 3. Si tenés varias sucursales o puntos de venta** Cada sucursal o caja debe tener asignada la dirección correcta. Verifica uno por uno para evitar cobros indebidos en otras provincias.

**✅ Resumen rápido** Subí tu Certificado de Ingresos Brutos. Corregí la provincia en el Store ID de cada punto de venta. Controlá todas tus sucursales si tenés más de una.


---

---
title: Crear una Cuenta en POSBerry (Web y PC)
url: https://posberry.tawk.help/article/como-crearse-una-cuenta
---

# Crear una Cuenta en POSBerry (Web y PC)

*Guía para generar una cuenta personal en Posberry, tanto en la versión web como de escritorio*

**1. ** Acceda a la página [PosBerry.com](https://www.posberry.com/) **** **2. ** Vaya al apartado **Acceso Clientes** y seleccione la opción **Registrarse.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aJfRXUwXL5.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AgOmY4u9Z_.jpeg)

**3.** Complete el formulario inicial con los **datos de su empresa** , como nombre, localidad, CUIT, entre otros. **4.** Al finalizar el último formulario, haga clic en el botón **Continuar.** **5.** Deberá confirmar el **correo electrónico** de registro que se le enviará a su dirección proporcionada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rSlUfQ8iOz.jpeg)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [Tutoriales You Tube](https://www.youtube.com/@posberry9300)


---

---
title: Integrar Tienda Nube
url: https://posberry.tawk.help/article/integrar-tienda-nube
---

# Integrar Tienda Nube

## Instalación de POSBerry en Tienda Nube

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eD5TCCtMQN.png)

Ingrese al sitio web de POSBerry, vaya a configuración y allí haga clic en "Vincular" donde dice "Vincular Tienda Nube con POSBerry". A continuación se abrirá la página de Tienda Nube donde deberá iniciar sesión con su usuario.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mqhKHYltw6.png)

A continuación vincule POSBerry con Tienda Nube haciendo clic en el botón "Aceptar y empezar a usar".

## Configuración en POSBerry

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7pNIsGrVQa.png)

En la configuración de POSBerry vaya a la pestaña Integraciones. Debajo puede ver Tienda Nube. Allí marque la casilla "Recibir pedidos de Tienda Nube en este equipo." ATENCION: solo se puede recibir Tienda Nube en un unico punto de venta.

Elija la lista de precios que va a usar como precios de Tienda Nube. Configure cada cuantos minutos se descargarán los pedidos y se sincronizarán los productos. Si así lo desea puede "descargar ahora" los pedidos y sincronizar los productos en este momento.

## Productos

En el mismo momento que se bajan los pedidos también se sincronizan los productos desde Tienda Nube hacia POSBerry. Cada producto y (si tiene variantes) cada variante debe tener un SKU único e irrepetible que se utiliza en Tienda Nube y en POSBerry. Entonces cuando baje los productos desde Tienda Nube el Código del Producto en POSBerry será el SKU que ingresó.

## Cambiar Precios

Puede cambiar los precios directamente en Tienda Nube y se actualizarán en POSBerry (por defecto cada 10 minutos o como lo haya configurado). El precio se guardará en la lista de precios que haya indicado en la configuración. También puede cambiar el precio del producto / variante desde POSBerry y se actualizará de inmediato en Tienda Nube. Solo se sube el precio, para cambiar el nombre del producto lo debe hacer desde Tienda Nube. Si eligió lista de precios 2 por ejemplo, debe modificar el precio 2 para subirlo a Tienda Nube, y si modificó el precio en Tienda Nube, se descargará en la lista de precios 2 (en este caso que está configurado como lista 2).

Importante: El stock de tienda Nube y el stock de POSBerry no se vinculan, tienen su propio stock cada uno.


---

---
title: Productos Pesables y Productos Unitarios
url: https://posberry.tawk.help/article/productos
---

# Productos Pesables y Productos Unitarios

*en este instructivo vamos a aprender a configurar sus productos ya sea Pesables y productos unitarios.*

Esta Configuración les permite , poder vender sus productos ** Fraccionados por Kilos , Gramos , etc .** vamos a poder configurarlo de 3 diferentes Formas , desde la web , desde el Punto de venta y desde el Excel de Productos de forma masiva

## Instructivo Paso a Paso

## Desde el Excel de Productos

para poder hacerlo desde el Excel de Productos , debemos primeramente descargar el Excel de Productos desde La web : [Instructivo Excel De productos](https://posberry.tawk.help/article/ver-los-productos-web)

**1)** Descargamos nuestro excel de productos, **Descargar listado de Productos " En Excel " .** **** **2)** Una Vez dentro del Excel de Productos, debemos editar la columna **" Pesable " .** **** **3)** si queremos que el producto se pueda vender de forma fraccionable , agregamos una **" S " ( si )** , si queremos que el producto se venda por unidad agregamos una **" N " ( no ) .**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9-liEnJuPL.png)

**4)** Por ultimo Guardamos el Excel nuevo , con las nuevas modificaciones y lo importamos desde la web.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TSrQjoGO5O.png)

## Producto por Producto ( Web )

si lo desea hacer de forma unitaria , lo puede hacer tanto desde la web como desde el punto de venta ( Sistema de Caja) desde la **" Edicion del producto "** .

**1)** Ingresamos a la web: [web 2.0](https://app.posberry.com/products/products) . **2) ** Desde allí nos dirigimos al modulo **Productos .** **** **3) ** Luego en **Listado, ** buscamos el producto, y hacemos clic en edición del producto ( icono Lapicero ).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iJV_MgfG2l.png)

**4)** Dentro de la edición del Productos activamos la Opción **" Fraccionado ".** **5) ** Una vez activada la Opción lo guardamos , haciendo clic en el Botón **" Guardar " ** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XeyNWLN7t0.png)

## Producto Por Producto ( Punto De Venta )

si lo desea hacer de forma unitaria , lo puede hacer tanto desde la web como desde el punto de venta ( Sistema de Caja) desde la **" edicion del producto "** .

**1)** Ingresamos al **Punto de venta ( Sistema de Caja)** . **2) ** Primero buscamos el producto que queramos editar, dentro de la barra buscadora.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/n8C4RoCeY3.png)

**3) ** Una vez seleccionemos el Producto , hacemos clic en el botón editar Productos **" icono del lapicero"** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6SAqXBXck2.png)

**4) ** aquí Vamos a ingresar a la **" Edición del Producto "** . **5) ** Tildamos la opción **" Es Fraccionado"** . **6) ** luego **"GUARDAR"** , para guardar las nuevas modificaciones **.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mgTGvhDKnL.png)


---

---
title: Pedir Confirmacion de Impresion de Factura
url: https://posberry.tawk.help/article/confirmar-de-impresión-de-factura
---

# Pedir Confirmacion de Impresion de Factura

*En este instructivo te vamos a enseñar como activar la función de pedir confirmación de emision de factura en papel*

Esta función es util para lograr ahorros de papel de impresión, confirmando si el cliente quiere o no quiere su ticket de factura.

## Instructivo paso a paso

**1) ** Debe ir a **"CONFIGURACIÓN" ** en su equipo con POSBerry instalado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/10UwaTcK9N.png)

**2)** Debe ir a la pestaña **"IMPRESORAS"** , allí se encontrará con la funcion que debe activar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kDPHd6XNgv.png)

**3)** POR ULTIMO: Debe activar la función **" PEDIR CONFIRMACIÓN ANTES DE IMPRIMIR"** . Con ello activo, solo debe apretar el boton **"GUARDAR"** en el botón naranja con un dibujo de disquete.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZaTlxvIDNd.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/l0nQh4yRqZ.png)

## Forma de uso

Al finalizar una venta, en cuanto este por imprimir el comprobante. aparecerá esta ventana con la consulta de impresión, si apreta SI, imprime el comprobante, si pone NO, no imprime el comprobante.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gIfZzYysnf.png)


---

---
title: Ver los Productos Desde la PC
url: https://posberry.tawk.help/article/ver-los-productos-pc
---

# Ver los Productos Desde la PC

*Cómo Acceder al Listado de Productos*

**Instrucciones:** haga clic en el botón **[CTRL + o] ** o ** ** Presione **[CTRL + o] ** en su teclado. Vaya al menú **Stock** . Haga clic en **Listado de Productos** . Ahora podrá ver la lista completa de productos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/F3qcCSbyxE.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nrjIOc0uO7.png)


---

---
title: ¿Cómo dar de alta un producto en la web y de manera local?
url: https://posberry.tawk.help/article/¿cómo-dar-de-alta-un-producto
---

# ¿Cómo dar de alta un producto en la web y de manera local?

*Crear un nuevo producto en POSBerry*

En la ventana principal, haga clic en el botón rojo **[+]** , que se encuentra en el centro superior de la pantalla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Lt-UNs0XF-.png)

A continuación en la ventana "Productos" llene los campos con la información del producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2VkN7_PBNw.png)

Haga clic en el botón **[GUARDAR]** para guardar el producto.

## ¿Como dar de alta un producto desde la web?

En la barra de navegación haga clic en el botón Productos ("carrito de compras").

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QL6h-y5YpV.png)

En la página de productos haga clic en el botón azul [+] ("agregar"), que está en la parte derecha-superior de la página.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PYysvIu7te.png)

A continuación en la ventana "Editar Producto" llene los campos con los datos del producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/waeN7RaGeI.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2Qz51-5XzX.png)

Los campos en **"negrita"** son obligatorios y debe cargarlos siempre. Haga clic en el botón **[GUARDAR]** para guardar el producto.


---

---
title: Alta de Nuevo Punto de Venta
url: https://posberry.tawk.help/article/nuevo-punto-de-venta
---

# Alta de Nuevo Punto de Venta

*Cómo crear un nuevo Punto de Venta*

**1. ** Haz clic en el botón **[Configuración] (ícono de rueda dentada)** . **2. ** En el menú de la izquierda, selecciona la opción **[Punto de Venta]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/r4baHJhki1.png)

**3. ** En la parte superior de la lista de puntos de venta, haz clic en el botón **[Nuevo Punto de Venta].** **** **4. ** Completa todos los campos requeridos. **5.** Presiona el botón **[Guardar]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3QjB-FSmDX.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aYmRw0YJ5U.png)

**6. ** Aparecerá un mensaje de confirmación. Haz clic nuevamente en **[Guardar] ** para confirmar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sRAS_C_PVm.png)


---

---
title: Imprimir códigos de barras
url: https://posberry.tawk.help/article/imprimir-códigos-de-barras
---

# Imprimir códigos de barras

*Como imprimir codigos de barras de los productos*

## tenemos que hacer click en el boton menú (CTRL+O), seleccionamos el apartado stock y apretamos donde dice "listado de productos"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LXnM4EEQqe.png)

elegimos nuestros productos a imprimir el codigo de barras con las casilas de tildado, (pueden hacer click encima del primero, el cuadrito chico a lado del cuadro de codigo para seleccionar todo o deseleccionar todo) en impresora elegimos la impresora a usar y en formato elegimos el tamaño en que va a salir nuestra etiqueta de codigo de barra

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZmG__BCKAb.png)


---

---
title: Como Importar Clientes desde Un Archivo Excel En POSBerry
url: https://posberry.tawk.help/article/como-cargar-clientes-desde-tu-excel
---

# Como Importar Clientes desde Un Archivo Excel En POSBerry

*Aprendé a descargar tu listado de clientes en Excel, editarlo y volver a cargarlo en POSBerry.*

## Instructivo paso a paso

**Ingresá a la web de POSBerry V2** y dirigite al apartado **“Clientes”** . Dentro de **“Clientes”** , accedé a la sección **“Listado”** , donde podrás ver todos tus clientes actuales junto con sus datos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yCSdRdcF7i.png)

Debajo de este listado, hacé clic en el botón **“Excel”** para **descargar tu listado en formato de tabla de Excel** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XYUzpYcfWK.png)

Una vez descargado el archivo, **editá o agregá los nuevos clientes ** directamente desde Excel. **Guardá los cambios!!!!!!** . Las columnas de informacion mas importantes de rellenar son las que llevan un *** ( asterisco ) Codigo , Razon Social , Domicilio , Condicion, Documento .** **El Codigo del Cliente ** es solamente un numero para identificar al cliente dentro del sistema y este debe de ser unico.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TjSjFbIUwM.png)

Volvé a POSBerry y entrá en la opción **“Importar”** → **“Cargar archivo”** . Seleccioná el archivo Excel con las modificaciones. Elegimos el nuevo excel con las nuevos clientes cargados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XlvwU9EZ_i.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/j7aES5CyiD.png)

Una vez que Seleccione el Excel podrá visualizar los nuevos cambios a subirse haciendo clic "en el interruptor".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gn0L2BIwSi.png)

Después de cargarlo, podrás visualizar nuevamente todos los clientes actualizados en tu listado dentro de POSBerry.


---

---
title: Imprimir precios local (punto de venta)
url: https://posberry.tawk.help/article/imprimir-precios-local-punto-de-venta
---

# Imprimir precios local (punto de venta)

*Como imprimir los precios desde nuestro sistema de punto de venta*

Debemos ir a menú, stock y seleccionar la opción "Listado de productos".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Rr4tr7pTXQ.jpeg)

Para seleccionar o deseleccionar todos los productos en el listado, sigue estos pasos: 1. Haz clic derecho en la casilla marcada con un cuadro rojo en la imagen. 2. Selecciona la opción "Seleccionar todo" o "Deseleccionar todo", según lo que desees hacer. Para ver el historial de stock de un producto, sigue estos pasos: 1. Selecciona el producto del que deseas ver el historial de stock. 2. Haz clic derecho en el producto seleccionado. 3. Selecciona la opción "Historial". 4. Se abrirá una nueva ventana con el historial de stock del producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UTzA4cONVX.jpeg)

Para imprimir precios, sigue estos pasos: 1. Ve a la sección "Impresora". 2. Selecciona la impresora en la que deseas imprimir los precios. 3. En la sección "Formato", elige el tamaño o formato que deseas para los precios. 4. En la sección "Copias", selecciona la cantidad de copias que deseas imprimir. Una vez que hayas configurado los ajustes de impresión, haz clic en el botón "Imprimir" para imprimir los precios.

Todas las casillas que aparecen en la sección de impresión de productos son filtros que puedes utilizar para seleccionar con mayor comodidad los productos que deseas imprimir. Al seleccionar una opción en cualquiera de estas casillas, el sistema filtrará automáticamente los productos y mostrará solo aquellos que coincidan con los criterios de filtrado seleccionados. Por ejemplo, si seleccionas la opción "Solo activos" en la casilla correspondiente, el sistema mostrará solo los productos que estén activos en el sistema, ocultando aquellos que estén marcados como inactivos. Del mismo modo, si seleccionas un proveedor específico en la casilla "Proveedor", el sistema mostrará solo los productos asociados a ese proveedor. De esta manera, puedes utilizar los filtros para encontrar rápidamente los productos que deseas imprimir.

Al hacer click al imprimir, nos preguntará con un aviso si queremos imprimir x cantidad de etiquetas, damos que si y las imprimirá.


---

---
title: Cambiar Contraseña
url: https://posberry.tawk.help/article/cambiar-contraseña
---

# Cambiar Contraseña

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5fUhGYYQkD.png)

Para agregar camareros en la aplicación siga estos pasos: 1. Vaya a Opciones 2. Seleccione "Ventas" 3. Seleccione "Listado de camareros" 4. Haga clic en el botón [+] para agregar un nuevo camarero. 5. Se abrirá la ventana de nuevo camarero. Ingrese los datos correspondientes. 6. Haga clic en OK para crearlo.


---

---
title: ¿Qué es el stock mínimo y días de stock?
url: https://posberry.tawk.help/article/¿qué-es-el-stock-mínimo-y-días-de-stock
---

# ¿Qué es el stock mínimo y días de stock?

*Entiende los conceptos de stock mínimo y días de stock y cómo visualizarlos en el Plan de Compras desde la web.*

El **Stock Mínimo** es la cantidad mínima de unidades que desea mantener en inventario de un producto. Los **Días de Stock** calculan las unidades necesarias para cubrir las ventas de los próximos días, basados en las ventas de los últimos 30 días. Si configura 7 días de stock, el sistema calculará cuántas unidades necesita para abastecer los próximos 7 días de ventas. Ambos parámetros, Stock Mínimo y Días de Stock, se configuran por producto. Para visualizar las cantidades recomendadas en función de estos criterios, vaya a **Compras > Plan de Compras** en la web. Allí verá las sugerencias de compra según el stock mínimo o los días de stock configurados.

Puede visitar este intructivo para saber mas sobre planes de compras/ dias de stock/ Stock minimo: [Plan de compra](https://posberry.tawk.help/article/plan-de-compras)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Como Configurar e Integrar la Terminal PAYWAY con POSBerry para Cobrar con Tarjeta
url: https://posberry.tawk.help/article/como-integrar-su-terminal-payway-en-posberr
---

# Como Configurar e Integrar la Terminal PAYWAY con POSBerry para Cobrar con Tarjeta

*Guía paso a paso para vincular su terminal PAYWAY con POSBerry y comenzar a aceptar pagos con tarjeta de forma automática.*

La integración con PAYWAY solo es compatible con un dispositivo específico provisto por PAYWAY para este tipo de conexión automática. Para solicitar esta terminal, el comercio debe enviarnos los datos correspondientes a la empresa (razón social, CUIT, datos de contacto). Desde POSBerry nos encargamos de comunicarnos directamente con PAYWAY para que gestionen el envío del equipo correspondiente. Sin este dispositivo, no será posible realizar la integración automática con POSBerry.

Es fundamental que el CUIT configurado en su terminal PAYWAY coincida con el CUIT cargado en POSBerry . ¿Dónde verificarlo?

**En POSBerry:** Ingrese al menú **Configuración** → **Empresa** → Verifique el campo **CUIT** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FvuC2IZckd.jpeg)

**En su terminal PAYWAY:** Ingrese a la app → Deslice hacia la derecha → Ingrese a "Datos del establecimiento".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Y4L9iDrGTG.jpeg)

**1.** **Verifique el ID de su terminal** (número identificador que figura en el dispositivo PAYWAY).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZTBb1iixCN.jpeg)

**2.** En POSBerry, presione **Ctrl + O** para abrir el panel de configuración. **3.** Diríjase a: **Configuración** → **Integraciones** → Seleccione **PAYWAY** . **4.** Ingrese el ** ID de terminal** , haga clic en **Guardar.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HXbYkfYwSS.jpeg)

**5.** A partir de este paso, verá disponible **PAYWAY como medio de pago** al realizar una venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EOwX2k0B1Y.jpeg)

**6. ** Realice la venta desde POSBerry y seleccione **PAYWAY** como forma de pago.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lxULLyr-oB.jpeg)

**7. En su terminal PAYWAY:** Busque la operación correspondiente en el listado. Selecciónela para procesarla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/N9ZinTo25n.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Udf_cPQqgu.jpeg)

**8. ** El cliente podrá **apoyar o deslizar su tarjeta** para finalizar el pago.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/h6bi_Pk9ut.jpeg)

## ❌ ¿Cómo cancelar una venta?

1. Toque la flecha para regresar dentro de la terminal.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8HrEznEtnz.jpeg)

2. **En la pantalla emergente de confirmación** , seleccione **"Sí"** para cancelar el cobro.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Gktgee_sxT.jpeg)

Este instructivo le permite configurar de forma correcta la integración con PAYWAY para agilizar sus ventas y ofrecer una experiencia más cómoda a sus clientes. **Gracias por leer este instructivo.** Para más información, vea nuestros videos tutoriales en YouTube:


---

---
title: Como Realizar una Venta: Cobrar De Manera Efectiva a Tus Clientes
url: https://posberry.tawk.help/article/realizar-ventas
---

# Como Realizar una Venta: Cobrar De Manera Efectiva a Tus Clientes

*como hacer una Venta paso a paso, desde la búsqueda del producto hasta el cierre del ticket.*

## Cargar productos

En la ventana principal del programa use el buscador para encontrar el producto. Luego haga doble clic en el producto que quiere agregar a la venta. También puede moverse con las flechas del teclado para elegir el producto y finalmente apretar "enter" en el producto que quiere agregar a la venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/M7tlM8QEto.png)

## Cobrar

Una vez que haya agregado todos los productos, haga clic en el botón [Cobrar (F10)].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/p0K24wM0jQ.png)

agregue el total con el que va a pagar.

A continuación elija el medio de pago, efectivo o tarjeta  y cargue los importes. Al terminar de cargar el importe presione el botón [+]. Si el cliente desea abonar en efectivo puede ingresar el monto que le dio para que el programa calcule el vuelto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Fvzyfa8Zc4.png)

Si el cliente desea abonar con tarjeta, elija la tarjeta de la lista. Si la tarjeta es de crédito elija la cantidad de cuotas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XluAP_J5L6.png)

Para finalizar haga clic en el botón [GUARDAR].


---

---
title: Configurar impresora fiscal Epson por USB en Windows
url: https://posberry.tawk.help/article/configurar-impresora-fiscal-epson-por-usb-en-windows
---

# Configurar impresora fiscal Epson por USB en Windows

POSBerry utiliza la comunicación serial para comunicarse con las fiscales, pero es posible configurar una impresora fiscal epson TM900FA/TM220FA conectándola por USB, con los siguientes pasos: 1) Descargar el software de Epson TM Virtual Port Driver [https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=6481&scat=36&pcat=5](https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=6481&scat=36&pcat=5) 2) Instale el software Epson TM Virtual Port 3) Ejecute el programa Epson TM Virtual Port Assignment. Y presione el botón [Assign port]

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yF0bitvhM4.png)

4) Seleccione la impresora USB (La impresora tiene que estar encendida y conectada por USB), y presione [OK]. Y debe verse el nuevo puerto COM que esta asociado a la impresora USB. (En la imagen debajo es el COM5)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/L9JOaxf6uI.png)

5) Configure la impresora fiscal en POSBerry según el puerto que está asociado en Epson TM Virtual Port:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nRS23BDGwY.png)

6) Confirme la configuración. Si todo esta correcto debería poder imprimir tickets desde el nuevo puerto COM con la impresora conectada por USB.


---

---
title: Como configurar productos con receta para crear promociones en POSBerry
url: https://posberry.tawk.help/article/utilizar-recetas-para-promociones
---

# Como configurar productos con receta para crear promociones en POSBerry

*Guía paso a paso para usar el tipo de producto "Receta" y agrupar varios productos en una promo.*

POSBerry permite configurar promociones utilizando productos del tipo "Receta", ideales para combos, packs o menús. A continuación, te mostramos cómo hacerlo paso a paso:

✅ Paso 1: Crear el producto como receta Ingresá a la sección de Productos. Creá un nuevo producto y seleccioná el Tipo de producto: Receta. Completá los datos necesarios (nombre, precio, etc.) y hacé clic en Guardar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NEpaveBfiF.jpeg)

✅ Paso 2: Cargar los componentes de la receta Editá el producto que acabás de crear. Ingresá a la pestaña Receta. En el campo de búsqueda, escribí el nombre o código de los productos que van a componer la receta/promoción. Seleccioná cada producto y ajustá la cantidad a descontar del stock.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2Y1jalDmBK.jpeg)

Para modificar la cantidad: Hacé doble clic sobre el número, escribí la nueva cantidad y presioná ENTER para confirmar. Repetí el proceso con cada producto que quieras incluir en la receta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/f3KYaFfxJk.jpeg)

Este tipo de configuración es muy útil para promociones como combos de comida, packs de productos o cualquier oferta que combine varios ítems bajo una sola venta.


---

---
title: Activar el Modo Kiosco ( autocobros )en POSBerry GO
url: https://posberry.tawk.help/article/modo-kios
---

# Activar el Modo Kiosco ( autocobros )en POSBerry GO

*como activar el modo kiosco ( autocobros ) en su dispositivo movil*


---

---
title: Cierre de Caja: Realice Un Cierre de Caja De Manera Efectiva
url: https://posberry.tawk.help/article/cierre-de-caja
---

# Cierre de Caja: Realice Un Cierre de Caja De Manera Efectiva

*Cierre de caja desde POSberry*

Para realizar un cierre de caja, haga clic en la opción **[Cerrar caja]** ubicada en la parte inferior derecha de la pantalla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7DvzaOpGuw.png)

## Ventas en efectivo

Si realizó ventas en efectivo, puede hacer el **arqueo de billetes** en la parte inferior izquierda de la pantalla, ingresando la cantidad de billetes y monedas disponibles en caja.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MstOVdSF_c.png)

Si desea obtener más información sobre su cierre de caja, es recomendable utilizar el **control de stock** y el **control financiero** . En los siguientes enlaces encontrará las instrucciones detalladas para gestionar cada uno de ellos: **Control de stock** : [https://posberry.tawk.help/article/cierre-de-caja-control-de-stock](https://posberry.tawk.help/article/cierre-de-caja-control-de-stock) **Control financiero** : [https://posberry.tawk.help/article/cierre-de-caja-control-financiero](https://posberry.tawk.help/article/cierre-de-caja-control-financiero)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/q2zNbPxJf3.png)

## Cierre

Una vez que haya terminado el arqueo y el control de stock haga clic en **[GUARDAR]** luego en **[si]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/H6jFXV9yQR.png)

Si tiene una impresora configurada, se imprimirá automáticamente un comprobante del cierre de caja. A continuación, se muestra un ejemplo del cierre de caja impreso:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/n4J8LRyRuM.jpg)


---

---
title: Como Integrar su Dispositivo POSNET de Unicobros
url: https://posberry.tawk.help/article/como-integrar-su-dispositivo-posnet-de-unicobros
---

# Como Integrar su Dispositivo POSNET de Unicobros

*Como Integrar su Dispositivo POSNET de Unicobros en POSBerry De Escritorio*

## CONFIGURACIÓN WEB

Paso 1: Solicitud de datos Debe solicitar sus datos de Clave API y su Token de acceso a Unicobros. Paso 2: Acceso a la WEB POSBerry
Una vez ya teniendo los datos, debe ir a la WEB POSBerry y dirigirse a la sección de Configuraciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/e7S0BbkbQW.png)

Paso 3: Carga de datos en Integraciones En la sección de Integraciones, debe cargar los datos recibidos de Unicobros. Paso 4: Guardado de datos Una vez cargados los datos, debe hacer clic en el botón "Guardar" para almacenar la información.

## CONFIGURACIÓN LOCAL

Paso 5: Acceso al punto de venta local Ahora debemos ir a nuestro punto de venta instalado LOCALMENTE en su computadora. Paso 6: Configuración de Integraciones en el punto de venta local
Una vez dentro del sistema, debe ir a Configuraciones y luego a Integraciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/m_m7-SEZI9.jpeg)

Paso 7: Selección de la marca del equipo En la sección de Integraciones, debe visualizar la opción UNICOBROS y revisar la marca de su equipo. Solo hay 2 opciones disponibles: ING y URO. Seleccione la marca correspondiente (en el caso del ejemplo usamos URO) Paso 8: Actualización de datos
Luego de cargar la marca, debe hacer clic en el botón de REFRESCO (flecha girando). Debería aparecer un mensaje indicando "Cargados X dispositivo(s), seleccione el indicado en la lista".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/naZRr51MkX.jpeg)

Paso 9: Elección del posnet a integrar En la lista de posnets cargados, debe elegir el posnet que desea integrar. Paso 10: Guardado de cambios Para finalizar la integración, debe guardar los cambios realizados en el punto de venta local (Botón naranja con dibujo de disquete).

Paso 11: Verificación del medio de pago Al haber seguido los pasos correctamente, debe aparecerle un nuevo medio de pago llamado "UNICOBROS" dentro de la APP "COBRAR". Paso 12: Uso del medio de pago Unicobros Elija el medio de pago "Unicobros" y aparecerá en pantalla un mensaje indicando que se está conectando. Una vez que se establezca la conexión, ya puede realizar cobros utilizando Unicobros.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/V-YZG6JF_g.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/01FNYD-IJ9.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-2j0tBkq8K.jpeg)


---

---
title: Como realizar las cobranzas de tarjetas integrando un dispositivo Clover (Fiserv)
url: https://posberry.tawk.help/article/como-realizar-las-cobranzas-de-tarjetas-integrando-un-dispositivo-clover-fiserv
---

# Como realizar las cobranzas de tarjetas integrando un dispositivo Clover (Fiserv)

Para integrar un dispositivo Clover (solo se puede usar en un punto de venta a la vez) y realizar las cobranzas en tarjetas de manera integrada, siga los siguientes pasos: 1) Instalar la App en el dispositivo Clover ingresando a Más Herramientas (o App Market), buscar e instalar la aplicación **Secure Network Pay Display**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CbomXBu7G9.jpg)

2) En la app entrar a **Ajustes**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/80zjyG1F4L.jpg)

3) Configurar de la siguiente manera, anotar el DNS Name, en este ejemplo " **Clover-C043LQ1102661.local** ", lo necesitaremos para configurarlo en POSBerry. Alternativamente puede usar la dirección de IP (IP Address), pero hay que tener en cuenta que la dirección de IP puede cambiar si se reinicia el router. Finalmente presionar **Configure and Restart Server.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8cSb10TpAQ.jpg)

4) Se debería ver la siguiente pantalla, que nos dice que para salir del modo integrado, debe pulsar las 4 esquinas a la vez. Para continuar aprete el boton " **Me quedó claro"**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Bvjm2GfSNE.jpg)

5) Ya debería ver la pantalla normal de cobro

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5npQryWdFV.jpg)

6) Ingrese a **OPCIONES** en POSBerry, dentro de la configuración de **Integraciones->Clover** , ingrese el DNS Name o IP Address, y marque la casilla a la Izquierda de Servidor para activar la integración.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/z2MwmgTuoA.png)

7) En el momento que POSBerry intente comunicarse con Clover(Secure Network Pay Display) por primera vez, se tendrá que vincular con un código el cual tiene una validez de 30 días. En POSBerry debe salir un mensaje similar: (en caso que el mensaje con el codigo no se muestre, pruebe salir y entrar de POSBerry, o bien revisar la dirección del Servidor de Clover usar IP o Hostname)

Su clover primero le pedira el codigo de acceso al mismo, si no se cambio ello, el codigo predeterminado es 1234, deben cargarlo en el clover para continuar el procedimiento

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XrUXZ2Af1G.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/x2ZayGHpSf.png)

Debe ingresar en Clover este Código que muestra en POSBerry

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gIMb2m1HOL.jpg)

Una vez que estén vinculados se indicará por un icono testigo en la barra de estado de POSBerry

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lwPp-zHi5O.png)

Y una nueva opción de cobro estará disponible en las opciones de cobranza

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QY2sd9KjX_.png)

**Con esto ya estaría configurado el dispositivo para cobrar desde POSBerry. ** Algunas imágenes para ver la operatoria de cobro

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Z03AVnOem8.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lB7IiyrAnB.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sfTXkm52Ec.jpg)

Cuando el Clover consulte el número de Factura, presione **Omitir**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/INOvRJRzyH.jpg)

Con la posibilidad de imprimir o no el recibo para el cliente, se termina el proceso de cobro integrado para la venta en curso.


---

---
title: Como instalar y configurar Any Desk en Android Desde Posberry
url: https://posberry.tawk.help/article/anydesk-desde-android
---

# Como instalar y configurar Any Desk en Android Desde Posberry

*Guía para instalar AnyDesk y el plugin necesario para soporte remoto en dispositivos Android.*

**1. ** Despliega el menú lateral hacia la derecha y haz clic en **[Soporte Remoto]** 🖥️. **** **2. ** Aparecerá una pantalla emergente. Haz clic en el botón **[Actualizar]** y confirma la instalación de AnyDesk.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/f9I999Frjd.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/m0Jf-G3pNW.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SAxfVS2ChZ.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MzOZzwJJGq.jpeg)

**3. ** Una vez instalado AnyDesk en tu dispositivo, debes instalar el plugin para poder utilizar el mouse y teclado de forma remota. **** **4.** Para instalar el plugin, vuelve a **[Soporte Remoto]** 🖥️ y en la pantalla emergente haz clic en **[Actualizar]** . El plugin se instalará automáticamente. También puedes instalar el plugin manualmente desde el Play Store buscando "AnyDesk Plugin AD1".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/t63rCUtvws.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lKiPopSvRp.jpeg)

**5. ** Acepta la conexión del equipo de soporte. **** **6. ** En la pantalla emergente, habilita los permisos necesarios y haz clic en **[Aceptar] ✔️.** **** **7. ** Configura los permisos seleccionando **"Acceso total"** para garantizar el control remoto completo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_8KGkaF-oH.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QzUDUwqu1l.jpg)

**IMPORTANTE:** es posible que tenga que reiniciar la aplicación AnyDesk o reiniciar tu dispositivo Android para asegurar que el plugin funcione sin inconvenientes.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Recomendaciones para el excel de productos
url: https://posberry.tawk.help/article/recomendaciones-para-el-excel-de-productos
---

# Recomendaciones para el excel de productos

*Información útil para la correcta utilización del excel de productos*

Aquí tienes algunos consejos para manejar los productos en POSBerry: 1) Si quieres cambiar el código de un producto, no lo hagas directamente en el Excel de productos. En su lugar, edita el producto en la web o en el punto de venta. Si cambias el código en el Excel, se creará una copia del producto y la web lo detectará como un producto nuevo. 2) Si quieres eliminar productos, es mejor inactivarlos en la web o en el punto de venta. Si los eliminas en el Excel, no se borrarán ya que la web tiene un backup de seguridad. 3) No modifiques los títulos de las columnas predefinidas en el Excel. La web puede no reconocer el archivo si cambias el nombre o el formato de las columnas. 4) La columna "Stock Mínimo" no es para cargar el stock. Es una función de compras. Si quieres más información sobre esto, puedes visitar: [https://posberry.tawk.help/article/plan-de-compras](https://posberry.tawk.help/article/plan-de-compras) 5) Para cargar un producto correctamente en el Excel, debes completar todos los campos excepto las columnas opcionales o utilizadas para otras funciones de POSBerry, como las columnas de códigos de barras, impuesto interno, publicar en la web, unidades por bulto, agrupar por, días de stock y URL de la imagen. 6) Los proveedores NO se cambian desde el excel de listado de productos, estan de manera informativa unicamente, utilizado para cambiar de precios por proveedor. 7) Las familias en el excel de producto SOLO cambiarán si la familia estaba dada de alta anteriormente, si intentan cambiar una familia en el excel por una familia nueva, no tomará los cambios. 8) Si estas empezando con el sistema y no sabe que codigo agregarle a sus productos, se le recomienda hacer un listado comun del 1  hasta el ultimo producto, sumando +1 a cada casilla nueva de codigo, esto puede entenderse mejor con la imagen a continuacion:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mejEr8EeKU.jpeg)


---

---
title: Exportar Facturas/ Imprimir Facturas en Comprobante A4
url: https://posberry.tawk.help/article/exportar-facturas-facturas-en-comprobante-a4
---

# Exportar Facturas/ Imprimir Facturas en Comprobante A4

*Como exportar o imprimir comprobantes A4 de facturas*

debemos ir al sistema de escritorio, ir al apartado ventas, apretar el Boton mostrar, buscar y hacer click derecho sobre la factura deseada, elegimos la opción "Imprimir/guardar Comprobante A4"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/y3l2fyRfNX.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WQzFScccQf.jpeg)

## Guardar Comprobante:

debemos seleccionar el boton azul marcado en el recuadro verde, se abrirá una ventana en donde debemos poner el nombre del documento y guardarlo (se guarda de manera predeterminada en Documentos)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lUAX7C8Jvz.jpeg)

## Imprimir Comprobante:

debemos seleccionar el boton con forma de impresora marcado en el recuadro Rojo, se abrira una ventana en donde debemos seleccionar la impresora que utilizaremos (debe estar instalada previamente en windows), apretamos en OK y se imprimirá en la impresora seleccionada

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bX89THnd8w.jpeg)


---

---
title: Topes De Descuento
url: https://posberry.tawk.help/article/tope-de-descuento
---

# Topes De Descuento

*Detalles sobre el máximo descuento aplicable en una venta*

El **tope de descuento** se refiere al porcentaje máximo de descuento que se puede aplicar en una venta, según la configuración establecida en el sistema. Este límite puede configurarse por producto, operador o punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0D5oZstss-.jpg)

## ¿ Como funciona el tope de descuento ?

POSBerry selecciona y aplica el descuento más bajo entre los configurados en el sistema. Por ejemplo: **Si un producto tiene un tope de descuento del 100%.** **El operador tiene un límite del 10%.** **El punto de venta tiene un límite del 50%.** En este caso, el sistema permitirá solo un **10% de descuento** , ya que es el menor de los topes configurados. Si **se modifica el tope del operador al 100% ** en la misma venta, el sistema **aplicará un máximo de 50%** de descuento, correspondiente al tope del punto de venta.

Nota: **Si se asigna un 0%** de descuento a un producto en la configuración, **no se podrá aplicar ningún tipo de descuento ni promoción.**

## Imagen 1

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wqgaRJJ4-u.png)

## Imagen 2

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wWmixSCEGD.png)

Si un operador intenta aplicar un 60% de descuento a un producto (por ejemplo, **"Aceite de Oliva de Prueba"** con un tope del 100%), el sistema aplicará el tope más bajo disponible, que en este caso es el **10% del operador.**

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Ver Ventas Desde La Web
url: https://posberry.tawk.help/article/ver-ventas-web
---

# Como Ver Ventas Desde La Web

*Aprende a consultar y descargar informes de ventas desde la web*

**1.** Haga clic en el botón [Ventas] (icono de "moneda"). **2.** Seleccione un rango de fechas y elija la sucursal correspondiente. **3.** Haga clic en el botón [Actualizar] para cargar los datos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/shAJN0ZMih.png)

**4. ** La lista de comprobantes aparecerá a continuación. **** **5. ** Para descargar la lista, haga clic en el botón ** [En Excel].** **** **6. ** Para ver los productos vendidos, haga clic en el botón **[ i ]** a la derecha del comprobante. Esto mostrará los detalles de la venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/G7lPYK61rI.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_1D7yx5yTO.png)

**7.** También puede ver la lista de productos vendidos más abajo. **8. ** Para descargar los productos vendidos, haga clic en uno de los siguientes botones: **[En Excel (Totales)]** : muestra una línea por producto y punto de venta. **[En Excel (Detalles)]** : muestra varias líneas por producto (ventas individuales). **[En Excel (Resumen)]** : ofrece un resumen de las ventas realizadas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EP1BAgjLTS.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Hacer Devoluciones
url: https://posberry.tawk.help/article/hacer-devoluciones
---

# Hacer Devoluciones

*Aprenda a realizar una devolución de venta*

1. Vaya a la pestaña de **Ventas** y seleccione el rango de fechas en el que se realizó la venta que desea devolver. 2. Haga clic en el botón **[Mostrar]** para visualizar las ventas dentro de ese rango de fechas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pJbhFmG-XB.png)

3. Busque la venta que quiere devolver, haga clic derecho sobre ella y seleccione **[Generar devolución (Nota de Crédito)]** . La ventana se tornará de color rojo, indicando que está en modo devolución.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QSIpZeYm3e.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sZM4sZk-nu.png)

4. En la lista de productos, deje únicamente los que desea devolver. Si hay algún producto que no será devuelto, elimínelo de la lista. 5. Para finalizar la devolución, haga clic en [Cobrar]. El sistema devolverá los productos al inventario y ajustará el monto en caja, ya sea en efectivo o tarjeta.


---

---
title: ¿Cómo funciona el "Control de Stock"?
url: https://posberry.tawk.help/article/¿cómo-funciona-el-control-de-stock
---

# ¿Cómo funciona el "Control de Stock"?

Para hacer el "control de stock" seleccionaremos el deposito luego haremos clic en el botón de refrescar(recargar) aparecerán los listados con las información del stock.


---

---
title: Pantalla al cliente
url: https://posberry.tawk.help/article/pantalla-al-cliente
---

# Pantalla al cliente

*Que es y como se utiliza*

La pantalla al cliente es un servicio en el cual usted puede mostrar a sus clientes la venta en curso y las promociones o publicidades (banners) que desee (hasta 10 imágenes).

Para configurar la Pantalla al Clientes vamos a la Web de POSBerry a > **Configuración ** (rueda dentada) > **Punto de venta ** > seleccionamos el punto de venta de interés y buscamos la opción **Usar Pantalla al Cliente, ** la activamos y guardamos los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yv86Oj3vjK.png)

Luego debemos ir al Punto de Venta > y lo Sincronizamos (apretando F12). Cerramos y volvermos a abrir POSBerry para que se reflejen los cambios y  vamos al Menú ( **CTRL+O** ) > **Acerca de..** . > para ver si quedó Activo el servicio (y en color verde). En este apartado tiene las direcciones que corresponden para abrir la Pantalla al Cliente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qvGvtcmNMA.png)

Para configurar la **Pantalla al Cliente** en el punto de venta, debe hacer click en **Opciones ** > va a pestaña " **Servicios** ", y elige si desea que se muestre la venta en curso y/o si desea que se muestren las imágenes cargadas en la web (lo configuraremos pronto) y si quiere que la pantalla abra automáticamente en un monitor secundario (por ejemplo). Si opta por tener la pantalla del cliente en una tablet por ejemplo, conectada a la misma red en la cual está POSBerry, puede copiar la dirección URL que está en **Acerca de... ** y pegarla en el navegador de la tablet o dispositivo que utilizará para la Pantalla al Cliente. (Obs: de preferencia copiar y pegar la dirección que tienen el nombre del equipo, en este ejemplo "http://DESKTOP-3525DMF:8000". Pues si copia la dirección IP, esta puede cambiar en algún reinicio de su router, y en ese caso, hay que copiar y pegar "la nueva dirección IP" para que la Pantalla al Cliente funcione nuevamente).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ysmGXWgtRx.png)

Para cargar los banners o imágenes promocionales debe ir a la web de POSBerry > **Configuraciones ** (rueda dentada) > **Customer Display ** > carga sus imágenes y guarda los cambios. Recuerde que las imágenes tiene un límite (menores a 500 kb) y un formato PNG (2x1) para mejor visualización.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EKMucnidIT.jpeg)

Así ve la Pantalla al Cliente de la venta en curso:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lkkmJjkCdP.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WcyhaLTZg6.png)

Asi se ve la pantalla al cliente mostrando banners o promociones (las imagenes rotan automaticamente):

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fuFVCvHYW8.jpeg)


---

---
title: Sincronizacion: Como se Comunican Entre Ellos El Punto de venta con su web posberry
url: https://posberry.tawk.help/article/sincronización
---

# Sincronizacion: Como se Comunican Entre Ellos El Punto de venta con su web posberry

*Mantenga la información de su sistema actualizada.*

**Importante:** Es fundamental entender la sincronización, ya sea que uses el programa en la PC o en la web. **Sincronización automática:** En el programa instalado en la PC, se realiza una sincronización automática cada 10 minutos. Para asegurar un buen funcionamiento, a continuación explicaremos en detalle cómo funciona.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dvd_k6SK2c.png)

**Sincronización manual:** Si deseas aplicar de inmediato los cambios que realizaste en la web de POSBerry y no quieres esperar, puedes realizar la sincronización manual de las siguientes maneras: **Cómo realizar la sincronización manual:** Presionando la tecla **F12.** Haciendo clic en **Menú -> Sincronizar.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8yU6ujgDg-.png)

**¿Que hacer si los datos están desactualizados (Web)?** Si está trabajando en la web y los datos que ve no son actuales, puede pedir que sincronicen desde las PC para tener los datos mas nuevos. Si está trabajando en la web puede recargar la página o hacer clic en los botones de "refrescar" o "consultar" propios de cada página para traer los datos de nuevo.


---

---
title: Saldo Inicial
url: https://posberry.tawk.help/article/saldo-inicial
---

# Saldo Inicial

*Control Efectivo de Caja: Gestión Simple y Eficaz*

El saldo inicial es el dinero con el que comienza su caja cada día. Para gestionar eficazmente el efectivo en su caja, siga estas pautas.

**Ventas en efectivo y cierre de caja:** Si cierra la caja sin retirar el dinero de las ventas, este se sumará al saldo inicial del próximo día. Ejemplo: Si vendió $1000 y cierra sin retirar, al abrir mañana tendrá $1000 de saldo inicial.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/il1Sjr_UZo.png)

**Ajuste del saldo inicial:** Use ingresos y egresos para ajustar el saldo inicial. Para dejar cambio: Haga un ingreso con el monto deseado, cierre la caja, y aparecerá como saldo inicial. Ejemplo: Ingrese $500 para cambio, cierre la caja, y mañana tendrá $500 de saldo inicial.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7cOOkiigkK.png)

**Manejo del efectivo al final del día:** Si desea dejar una cantidad específica en caja, haga un egreso por la diferencia. Ejemplo: Si tiene $5000 y quiere dejar $2500, haga un egreso de $2500.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6FLWRuH8ih.png)

Si quiere saber más sobre **movimiento de caja** ** ** [https://posberry.tawk.help/article/como-crear-nuevo-movimiento-de-caja](https://posberry.tawk.help/article/como-crear-nuevo-movimiento-de-caja)

**Eliminación del saldo inicial:** Para empezar desde cero, haga un egreso por el total de efectivo en caja, incluyendo el saldo inicial.

**Cierre automático:** Si no realiza el arqueo de billetes, el sistema ajustará automáticamente la caja a cero.

Recuerde: Un control regular del efectivo ayuda a mantener sus cuentas claras y precisas.


---

---
title: Suscribirse Al debito automático En Posberry
url: https://posberry.tawk.help/article/debito-autómatico
---

# Suscribirse Al debito automático En Posberry

*Pasos para activar la suscripción al débito automático a través de Mercado Pago*

**1.** Acceda a **Configuraciones "⚙️"** y luego seleccione **Pagos.** **2.** Toque el botón azul grande **"Suscribirse a Mercado Pago".** **** **3. ** Será redirigido al sitio web de Mercado Pago para confirmar y aceptar la suscripción. **4.** Una vez suscrito, la mensualidad se debitará automáticamente el primer día de cada mes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NCXHZPR2GY.png)

**5.** Podrá ver el historial de pagos y verificar si hay vencimientos pendientes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2oPvxcPz3W.png)

**Nota importante:** Realice este proceso antes de que finalice el mes sin haberlo pagado, ya que al suscribirse, se le debitará automáticamente la mensualidad correspondiente. Si ya pagó el mes en curso y se le debita nuevamente, comuníquese con el soporte para solicitar un reembolso.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Renovación del certificado digital de factura electrónica.
url: https://posberry.tawk.help/article/renovación-del-certificado-digital-de-factura-electrónica
---

# Renovación del certificado digital de factura electrónica.

*En este punto es importante acotar, que el certificado digital tiene una vigencia de 2 años por lo que una vez cumplido ese tiempo, será necesario renovarlo.*

## Pasos para renovar el certificado digital. Paso 1: Eliminar certificado actual:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RlQvqJfNFe.png)

Paso 2: Generar el nuevo certificado:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/77D45oXNSN.png)

En la web de POSBerry, vaya al ícono de rueda dentada (Configuración) y seleccione PUNTO DE VENTA. Posteriormente, deberá elegir el punto de venta asociado al certificado digital que desea renovar. Presione en GENERAR ARCHIVO KEY. Guarde la configuración.

## Descargue el Certificate Request.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BBhf0BY24M.jpeg)

Haga clic en el botón [Configuración] ("forma de rueda dentada"). Luego en el menú de la izquierda haga clic en el botón [Punto de Venta]. Una vez en la configuración, haga click en punto de venta. Seleccione el punto de venta deseado. Haga click en Descargar Archivo CSR(Certificate Request)

## Genere el certificado digital en AFIP.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/w7hSFm2r7l.png)

Ingrese al servicio de "Administración de Certificados Digitales"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MmMKJBRsP7.png)

Presione el botón "Agregar alias"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MkDbZNj69b.png)

Ingrese el nombre del alias que desee utilizar. Luego presione el botón para subir el archivo de "Certificate Request" (Choose File) y explore en su equipo hasta el archivo "certificate_request_posberry.crt" generado desde la configuración web. Una vez seleccionado y cargado el archivo, pulse en Agregar Alias.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5AB0YWrOcK.png)

Si cumplió correctamente con los pasos, podrá ver el nombre que le asignó en ALIAS a su archivo y posteriormente obtendrá el detalle del archivo. Presione en VER.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4sN6VAvlmg.png)

Luego en "Descargar" para descargar el archivo certificado a su equipo. Una vez realizada la descarga, cierre la sesión en la AFIP.

## Vincule el certificado digital con el servicio de Facturación Electrónica en AFIP.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Zsk2qx_GVa.png)

Ingrese al "Administrador de Relaciones de Clave Fiscal"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jAmSr269lp.png)

Pulse en el botón "Nueva Relación".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CrlLzNzyby.png)

Luego haga clic en BUSCAR

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QLlC3cJkhF.png)

Presione sobre el botón AFIP y en el menú que se despliega, elija WebServices.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_S22VukdmL.png)

Posteriormente, pulse sobre Facturación Electrónica.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/l4Ezt4u01H.png)

En el recuadro siguiente en la linea Representante, pulse sobre BUSCAR.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ejvnnwh2Yd.png)

En "Computador Fiscal" seleccione el alias que usted creo luego presione en "CONFIRMAR". Este paso permite autorizar el computador para el uso de Factura Electrónica.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8_uIK-hOH1.png)

Haga clic en el botón [Configuración] ("forma de rueda dentada"). Luego en el menú de la izquierda haga clic en el botón [Punto de Venta]. Seleccione el punto de venta deseado. Donde dice Factura Electrónica - Archivo .crt, haga clic a subir archivo. Tiene que seleccionar el Certificado descargado desde la web AFIP. **Importante: ** **No confundirse de archivo, es el que se bajo de AFIP. ** **NO el que se bajo de la web de configuración de POSBerry.**

## Finalmente, guarde la configuración.


---

---
title: Configurar CAEA
url: https://posberry.tawk.help/article/configurar-caea
---

# Configurar CAEA

*Cómo dar de alta el punto de venta para CAEA en AFIP*

Para configurar el Punto de Venta para CAEA debe realizar los siguientes pasos. Ingrese a la AFIP con clave fiscal. En la pestaña ‘Mis Servicios’ busque ‘rece’ y haga clic en ‘Regímenes de facturación y registración (REAR/RECE/RFI)’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UVkqxp7BGw.png)

Haga clic en su nombre. Luego haga clic en ‘Empadronamiento REAR/RECE/RFI’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0bxC-3UL9w.png)

Luego entre a ‘Regímenes de Facturación’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/M8D1liCkLN.png)

Luego entre a ‘Empadronamiento Solicitud de CAEA’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rVApdSEVFL.png)

A continuación, haga clic en ‘Empadronamiento’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UUNhfqsJiB.png)

Haga clic en la casilla ‘D) Método de Contingencia’ y también en la casilla ‘E)’. Luego haga clic en ‘Aceptar’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bAuo-1ZRzb.png)

Si todo salió bien debería decir ‘Estado de la Solicitud: APROBADA’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dcDhbt_2UL.png)

A continuación, debe crear un nuevo punto de venta para CAEA. Busque ‘punto’ y haga clic en ‘Administración de punto de venta y domicilios’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OldpV5XLXa.png)

Al agregar el nuevo punto de venta le recomendamos que ponga como número el 99 adelante para reconocerlo, por ejemplo, si su punto de venta es 2, el punto de venta para CAEA sugerido es 992. Llene los campos, el campo ‘Sistema’ debe ser el mismo que en la imagen el que comienza con CAEA. Luego ponga ‘Aceptar’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nRMBVWBxGy.png)

Para finalizar, en la web de POSBerry entre a la configuración > punto de venta. Elija su punto de venta y a la derecha ingrese el Número PV CAEA, con el mismo número que creo el punto de venta en el paso anterior. Guarde los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AVM2NLgKjy.png)


---

---
title: Codigo de supervisor
url: https://posberry.tawk.help/article/codigo-de-supervi
---

# Codigo de supervisor

*herramienta util para que los cajeros no puedan eliminar productos ni ventas*

Para asignar un código de supervisor a un operador en POSBerry, siga estos pasos: 1. Acceda a la web de POSBerry y haga clic en el icono de configuración (rueda dentada). 2. Seleccione "Operadores" en el menú. 3. Elija el operador al que desea asignar un código de supervisor. 4. Asigne un código de supervisor en la sección correspondiente. 5. Asegúrese de que el operador sea "supervisor" o que se esté utilizando una cuenta de administrador. 6. Tenga en cuenta que si un operador tiene un código de supervisor, el sistema no le pedirá que ingrese un código al realizar determinadas acciones. por ello los cajeros NO deben tener un codigo de supervisor cargado en su operador.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jxbHS130-t.jpeg)

una vez creado el codigo de supervisor haga click en guardar.


---

---
title: Tipos de Promociones en POSBerry
url: https://posberry.tawk.help/article/tipos-de-promociones
---

# Tipos de Promociones en POSBerry

*Descuentos por producto, familia de productos, y más*

En POSBerry, los tipos de promociones están diseñados para aplicarse de manera flexible, ya sea en toda la venta o a productos específicos: **Promociones Generales:** Aplican a toda la venta o a clientes específicos. **Promociones por Producto:** Aplican a uno o varios productos o familias de productos. **Nota:** Si desea activar o desactivar promociones por producto, puede ajustar el tope de descuento en 0 para que no aplique ninguna promoción a ese producto. Si configura un tope mayor a 0, el producto podrá utilizar promociones. **Tipos de promociones disponibles:**

## General - Descuento por cliente

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wTRQOXjPu0.png)

Se aplica a un cliente o tipo de cliente específico.

## General - Descuento por medio de pago

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/r5TD8u4Pm1.png)

Se aplica a un medio de pago determinado.

## General - Descuento por monto

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZYkFn3OP5L.png)

Se aplica cuando la venta supera un monto establecido.

## Por Producto - Descuento por producto

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J1VwCoCp7E.png)

Se aplica a un producto o familia de productos.

## Por Producto - Promocion AxB

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wgQozl4wFU.png)

Al comprar una cantidad específica de un producto, se bonifica una o más unidades.

## Por Producto - Promocion A+B

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/89b3IZ7rmp.png)

Al comprar una cantidad de un producto junto con otro, se aplica un porcentaje de descuento.

## Por Producto - Descuento variable por cantidad

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4Z7Iql5h5H.png)

Comprando más unidades de un producto, se aplica un monto fijo o porcentaje de descuento.

## Por Producto - Descuento fijo

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FR9AwKGQIs.png)

Promoción fija que siempre aplica a un producto o familia de productos.

## Por Producto - Promocion AxB mas barato

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/I0KuCUVMrC.png)

Al comprar una cantidad de productos, se bonifican las unidades de menor precio.

## Global - Cantidad/Bulto

Aplica a productos o bultos de productos al comprar cierta cantidad, bonificando un porcentaje o monto fijo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sVTyUU4Y3A.png)

**Promociones por bulto: ** Al crear o editar un producto, establezca un valor mayor a cero en ** "unidades por bulto."** Esto hará que el sistema considere el bulto según la cantidad especificada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lPLvSWj8h1.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Motivos de eliminación: Función
url: https://posberry.tawk.help/article/motivos-de-eliminacion
---

# Motivos de eliminación: Función

*Como activar los motivos de eliminación y como funciona*

Para habilitar los motivos de eliminación en POSBerry, sigue estos sencillos pasos: 1. Abre el sistema de escritorio POSBerry. 2. Haz clic en el botón de menú o presiona las teclas "CTRL+O". 3. Selecciona "Configuración". 4. Desplázate hasta la sección "General". 5. Marca la casilla de "Utilizar motivos de eliminación al mostrador". ¡Listo! Ahora tendrás habilitados los motivos de eliminación en POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Z2q-03bOqn.jpeg)

Para confirmar si este esta en funcionamiento intente eliminar un producto del mostrador digital, debe salir una ventana con los motivos de porque se elimina este producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZRSsEM7NIZ.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mZMmodYeoD.jpeg)


---

---
title: Como Crear y Gestionar Recetas en POSberry
url: https://posberry.tawk.help/article/recetas
---

# Como Crear y Gestionar Recetas en POSberry

*Que son las recetas y como se utilizan*

Las recetas se componen de ingredientes que se descuentan del stock cada vez que se vende la receta. **1. Crear una receta:** En la pantalla principal, haz clic en el botón rojo **[+]** . Selecciona **"Receta"** en el tipo. Completa los campos requeridos y haz clic en **[Guardar]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IVLeLu1Nyu.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b6eEXBNO4b.png)

**2. Editar la receta:** Busca la receta que creaste y selecciona el botón de editar. En la parte superior, encontrarás el apartado **"Receta"** . Usa el buscador para agregar los ingredientes que la componen.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8pQRHXnAab.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LxyeVjD-I7.png)

**3. Eliminar o corregir ingredientes:** Si agregaste un ingrediente por error o deseas eliminarlo, simplemente desactiva la casilla de **"Activo"** . También puedes realizar este cambio desde la web.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PNvOXp3m5J.png)

**4. Añadir opcionales y adicionales:** **Opcionales** : Son elementos que pueden ser incluidos o no en la receta, según la preferencia del cliente. **Adicionales** : Son productos que pueden añadirse a la receta por un costo extra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/95eOsHR9Nd.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VoX1h1aCtU.png)

**5. Guardar la receta:** Una vez que todos los ingredientes estén configurados, haz clic en **[Guardar]** . ¡Receta creada con exito!


---

---
title: Motivos de Eliminación
url: https://posberry.tawk.help/article/motivos-de-eliminación
---

# Motivos de Eliminación

*Como activarlo, agregar, eliminar y/o editar los motivos de eliminación.*

Para activar la función de motivos de eliminación, siga estos pasos: 1. Abra la aplicación POSBerry y vaya a "Opciones". 2. Busque la casilla correspondiente a la opción "Motivos de eliminación". 3. Seleccione la ubicación donde desea que aparezcan los motivos: en el Mostrador Digital o en las mesas. 4. Haga clic en la casilla para marcarla y activar la función. 5. ¡Listo! Ahora podrá usar los motivos de eliminación en la ubicación que seleccionó.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hFtTf3r0tM.jpeg)

Para agregar, editar y/o eliminar motivos de eliminación, sigue los siguientes pasos: 1. Presiona las teclas CTRL+O. 2. Selecciona la opción "Ventas". 3. Elige la opción "Ver items eliminados". 4. En la ventana que se abre, puedes agregar, editar o eliminar los motivos de eliminación según sea necesario. Además, si necesitas trabajar con deliveries, sigue estos pasos: 1. Selecciona un elemento en la lista. 2. Se abrirá la ventana "Eliminados". 3. Para crear un nuevo motivo de eliminación haz clic en el botón "+". 4. Para editar un motivo de eliminación existente, selecciona el motivo y haz clic en el botón con el icono de lápiz.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SkBqo5KVKN.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/N6UOkuHJwQ.jpeg)


---

---
title: Transferencia de Stock
url: https://posberry.tawk.help/article/transferencia-de-stock
---

# Transferencia de Stock

*Realizar una transferencia de stock a otra sucursal*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iwccA5garW.png)

Haz clic en la pestaña **Stock** en el menú principal. Al lado del botón **Mostrar** , haz clic en la flecha hacia abajo. Selecciona la opción **Nueva Transferencia de Stock** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hhjt2BvN_P.png)

En la ventana emergente: Selecciona el **Depósito de Destino** de la lista. Opcionalmente, puedes agregar una **Observación** sobre la transferencia. Finalmente, haz clic en **GUARDAR** para confirmar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rAkyv2XEf6.png)

Una vez creado el movimiento, selecciona la ** transferencia de stock** del listado. Desde allí, puedes **agregar los productos** que deseas transferir utilizando el buscador ubicado en la parte inferior.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BPCFzL5ggQ.png)

Editar la **Cantidad** de cada producto

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/L_-XzcL-40.png)

una vez que hayas agregado todos los productos, haz clic derecho sobre la transferencia y selecciona la opción **Aplicar Movimiento ** para completar el proceso.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/t47ezjEVE6.png)

Confirmar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b4_xjckx7H.jpg)

Desde la sucursal destino: Ve al apartado de **Stock** . Busca el stock creado o el último stock. Haz clic derecho sobre el stock y selecciona la opción **Recibir Movimiento de stock** para completar la transferencia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nj2ftbtbXK.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9ExiVIuDT8.png)

Para visualizar los cambios en la web, primero debes realizar una sincronización: Una vez sincronizado, en la sección **Stock > Movimientos de Stock** podrás ver que las unidades se han descontado de un depósito y se han agregado al otro depósito.


---

---
title: Como Crear un Presupuesto de Venta
url: https://posberry.tawk.help/article/crear-presupuesto
---

# Como Crear un Presupuesto de Venta

*Como Crear un presupuesto de venta de manera Local en Formato A4 tanto en PDF como en impresion*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ipAznRiF3g.png)

¿Cómo hacer un presupuesto de venta en el sistema? Cargar productos: Busca los productos que deseas incluir en el presupuesto. Puedes hacerlo de dos formas: Usando los botones de accesos rápidos que se encuentran a la derecha. Escribiendo el nombre, código interno o código de barras en la barra de búsqueda de productos. Agregar cantidades: Una vez que encuentres el producto, selecciona la cantidad que quieres añadir al presupuesto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5JgHRoxPfx.png)

Paso siguiente: Generar el presupuesto Una vez que hayas cargado todos los productos, ve al menú en la parte superior izquierda. Haz clic en **el botón Menú (Ctrl+O)** , luego selecciona Ventas y finalmente elige la opción Presupuesto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RD0GNHRLAU.png)

Finalización del presupuesto Visualización del presupuesto: Al finalizar la selección de productos y generar el presupuesto, se abrirá una ventana mostrando el documento. Este contendrá los datos del cliente, la fecha, y el detalle de los productos con sus cantidades, precios unitarios y el total calculado. Opciones para imprimir o guardar: Para imprimir el presupuesto: Busca el botón con el icono de la impresora (marcado en las imágenes instructivas con una flecha verde). Haz clic en este botón para elegir una impresora y asi poder imprimir el documento en formato A4. Para guardar el presupuesto: Localiza el botón con el icono de disquete (señalado en las imágenes del instructivo con una flecha roja). Haz clic aquí para guardar el archivo en formato PDF A4.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XDePjNZBya.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ikKucB1q5p.png)


---

---
title: como realizar una limpieza de punto de venta
url: https://posberry.tawk.help/article/¿como-realizar-una-limpieza-de-punto-de-venta
---

# como realizar una limpieza de punto de venta

*borrar datos de punto de venta*

ATENCION:  es recomendable que antes de llevar a cabo esto se haga un backup de datos y se sincronice el sistema, **este procedimiento NO borra datos en el sistema web, **

en la pantalla de inicio de sesión debe hacer clic repetidamente en la palabra "versión"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uDUxKBx2qh.png)

a continuacion aparecera un icono con forma de lavadora, al presionarlo nos abrirá una ventana en donde debemos confirmar la limpieza de datos, escribimos en mayusculas "CONFIRMO" y aceptamos

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KPKFPMxA-S.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/79gfAR_yTc.png)

**ADVERTENCIA: ** La opción "Borrar Configuración", si está seleccionada, eliminará todas las personalizaciones realizadas en el punto de venta, incluyendo el panel personalizable, colores, temas, configuraciones de impresoras, balanzas, etc. ** Si desea mantener sus configuraciones actuales, por favor, no active esta casilla.**


---

---
title: Predeterminar lista de precios de venta por sucursal
url: https://posberry.tawk.help/article/predeterminar-lista-de-precios-de-venta-por-sucursal
---

# Predeterminar lista de precios de venta por sucursal

Para elegir la lista de precios de venta predeterminada para una sucursal en Posberry, sigue estos pasos: 1. Ve a la página web de Posberry y haz clic en el icono de configuración (rueda dentada). 2. Selecciona "Sucursales" en el menú desplegable. 3. Elige la sucursal para la que quieres establecer la lista de precios de venta predeterminada. 4. En la sección de "Lista de precios", selecciona la lista de precios que deseas usar como predeterminada para esa sucursal. 5. Haz clic en el botón de guardar para guardar los cambios. ¡Listo! Ahora la lista de precios de venta que elegiste estará predeterminada para esa sucursal en Posberry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vh0CajD0-r.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KtyBiwQAcr.jpeg)

Una vez que hayamos seleccionado la lista de precios para la sucursal, es importante asegurarse de que se haya guardado correctamente. Para ello, podemos revisar la lista de precios en la sección de sucursales nuevamente para asegurarnos de que se haya actualizado correctamente. Si todo está en orden, podemos cerrar la página de configuraciones y volver a la aplicación POSBerry. Ahora, cuando abramos la lista de productos en la sucursal seleccionada, se mostrarán los precios correspondientes a la lista de precios predeterminada que hayamos elegido en la configuración. De esta manera, podemos asegurarnos de que nuestros precios estén actualizados y sean coherentes en todas nuestras sucursales.


---

---
title: Obtener Credenciales de Mercado Pago para Vincularlo con POSBerry
url: https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculación-con-posberry
---

# Obtener Credenciales de Mercado Pago para Vincularlo con POSBerry

*Instrucciones para conectar Mercado Pago con POSBerry y habilitar pagos.*

**1.** Ingrese a la **web de POSBerry.** **** **2. ** Seleccione el ícono de **Configuración (rueda dentada)** . **3. ** Dentro de Configuración, diríjase a la sección **Integraciones.** **** **4. ** Desplácese hacia abajo y haga clic en el botón **"Vincular"** en la opción de " **Vincular Mercado Pago con POSBerry "** . Esto lo llevará a la página de autorización de Mercado Pago, donde deberá permitir el acceso de POSBerry a su cuenta. **5.** Una vez que autorice la vinculación, regresará automáticamente a la página de configuración en POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZPZ_G83Fwe.png)


---

---
title: Como pagar el abono mensual?
url: https://posberry.tawk.help/article/como-pagar-el-abono-mensual
---

# Como pagar el abono mensual?

Para pagar su abono mensual, puede hacerlo de varias maneras. Realizando transferencia bancaria, pagando con tarjeta ó adhiriendo el servicio al débito automático de Mercado Pago.

## Por transferencia bancaria:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/petLMpXz9O.jpg)

Puede realizar una transferencia al alias de posberry.bru una vez realizada la transferencia, necesitamos que la informe:

Ingrese con su usuario y contraseña a; www.posberry.com -> Acceso Clientes; Seleccione el ícono de "SOPORTE" que está en la parte superior de la pantalla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mVnho0fLxL.jpg)

En la siguiente pantalla que va a aparecer, pulse sobre "En línea".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6mrIA9G9Cb.gif)

En el cuadro que se despliega pida a soporte los datos de cuenta para realizar el pago y a su vez, una vez que lo realice, por este mismo medio puede hacer llegar el comprobante, indicando nombre del local y usuario admin posberry.

## Pagar con tarjeta de crédito/débito.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tQjyYY_FN5.jpg)

En la web, haga clic en el ícono de rueda dentada "Configuración".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Na2_LUN9VB.jpg)

En las opciones de configuración, pulse en la pestaña "Pagos".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Gb4rgr5b0d.jpg)

Haga clic en "PAGAR" y en el cuadro que se despliega a continuación, saldrán 3 opciones: Mercado Pago, Efectivo, Transferencia, allí elija Mercado Pago.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/w8FbVicPPW.jpg)

En la ventana siguiente, presione en "PAGAR CON MERCADO PAGO"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3zi6VTc30W.jpg)

En este apartado, seleccione la tarjeta de su preferencia que ya tenga registrada ó ingrese  una nueva tarjeta. Prosiga con las instrucciones de MERCADO PAGO para realizar el pago.

## Débito automático con MERCADO PAGO

Al igual que en el paso anterior, ingrese a la pestaña de "PAGOS" en su perfil web de POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HzxQ1hewb0.jpg)

Posteriormente y para finalizar, escriba el mail de su cuenta Mercado Pago y presione en el botón SUSCRIBIRSE A MERCADO PAGO.


---

---
title: Stock Valorizado (Web)
url: https://posberry.tawk.help/article/stock-valorizado-web
---

# Stock Valorizado (Web)

*Instrucciones para ver el stock valorizado agrupado por depósitos o productos.*

**1. ** **Acceder a Stock Valorizado:** Haz clic en el botón **[Stock]** y selecciona **[Stock Valorizado].** **2. Cargar los datos:** Para obtener los datos, haz clic en **[ Recargar ]** en la esquina superior derecha.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/o6JvFs1uvU.png)

**3. Seleccionar vista de stock:** Elige entre las dos vistas disponibles: **Por Depósitos** : muestra el stock valorizado agrupado por cada depósito. **Por Productos:** muestra el stock valorizado agrupado por cada producto

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wIxb2BVFc4.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DYF4UKuqSY.png)

**4. Visualizar totales:** Ambas vistas incluyen totales de **costo valorizado y venta valorizada ** para facilitar el análisis. **5. Descargar datos (opcional):** En la vista **Por Depósitos** , puedes descargar los datos seleccionando **[En Excel].**

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Verificar Por CUIT Datos De Clientes
url: https://posberry.tawk.help/article/verificar-por-cuit-datos-de-clientes
---

# Verificar Por CUIT Datos De Clientes

*Aprende a actualizar los datos de clientes automáticamente con su información fiscal en POSBerry.*

Para verificar y actualizar los datos de un cliente mediante su CUIT en POSBerry, sigue estos pasos: **1. Ubicar el botón "Verificar":** Dirígete a la lista de clientes en el sistema web de POSBerry. Busca el botón **[Verificar]** , ubicado debajo de la lista de clientes. **** **2. Iniciar el proceso de verificación:** Haz clic en el botón **[Verificar]** . **Espera unos minutos** mientras el sistema realiza la consulta y verifica los datos fiscales del cliente en base a su CUIT. **3. Revisar los cambios realizados:** Una vez completada la verificación, el sistema actualizará automáticamente los datos de los clientes según la información fiscal obtenida. Podrás ver los nuevos datos reflejados en la lista de clientes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/61_a-rqhHQ.png)


---

---
title: Mesas en POSBerry ( Personalizables)
url: https://posberry.tawk.help/article/mesas-en-posberry-personalizables
---

# Mesas en POSBerry ( Personalizables)

*¿Cómo crear, configurar, personalizar y usar mesas en POSBerry?*

Antes de utilizar las mesas, asegurate de asignar mesas en  la Opcion "Cantidad de mesas" , que se encuentra en la configuracion de Empresa desde la web

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J4_WQNvJlm.png)

## 🧭 Formas de gestionar mesas

En POSBerry existen dos formas de gestionar y organizar las mesas: **Desde el Sistema de Mesas (selección de mesas)** Te da acceso a una vista más visual del mapa de mesas y su organización por zonas. **Desde el Panel Personalizable** Permite tener todo a mano. Podés crear botones, mesas, listas y pestañas personalizadas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2zc6yuPvIU.gif)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QrTKyM_n0U.gif)

## 🪑Seleccionar Mesa (Mostrador de Mesas)

Al hacer clic en el botón "Mesas", ingresarás al sistema de selección de mesas. Desde aquí vas a poder ver todas las mesas disponibles. Consultar el estado de cada mesa: Rojo indica mesa en preparación. Amarillo indica mesa cerrada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zJ6WT0VcyU.png)

Seleccionar mesas rápidamente. Ingresar a la solapa “Mesas personalizables” para ver la organización por zonas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RHYOh_9YT-.png)

Buscar por productos para identificar en qué mesa se encuentra un producto, cuántos hay y qué número de mesa corresponde.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7jP-cCQ7Fg.png)

## 🗺️ ¿Cómo personalizar tu propia estructura de mesas?

En la solapa Mesas Personalizables podés crear zonas como "Terraza", "Patio de meriendas", etc.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0fAcq_JInr.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pwyzmIqijX.png)

Dentro de cada zona armás el mapa de mesas según la distribución real de tu local. Podés mover y cambiar el tamaño de las mesas. Organizarlas visualmente para que coincidan con la disposición física de tu espacio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xmcm1iWZrO.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kWw0z2GGqD.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cFPfwYB1U8.png)

## ⚙️ Panel Personalizable (Mesas)

Desde el Panel Personalizable también podés gestionar las mesas. Podés crear mesas, organizar por zonas y listas personalizadas. Acceder de forma rápida junto con otras herramientas como productos y promociones.


---

---
title: ¿Cómo cambiar el precio de un producto?
url: https://posberry.tawk.help/article/¿cómo-cambiar-el-precio-de-un-producto
---

# ¿Cómo cambiar el precio de un producto?

*Modificar el precio de un producto individual*

En la ventana principal use el buscador para encontrar el producto que desea modificar. Haga un solo clic en el producto que desea cambiar. Luego haga clic en el botón (🖊️) ("editar").

A continuación en la ventana "Editar Producto" cambie el precio del producto.

![imagen](https://media.giphy.com/media/gBpcK4gmcriskUMbea/giphy.gif)

Haga clic en el botón [GUARDAR] para guardar los cambios.

## Para cambiar el precio de un producto desde la web.

En la barra de navegación haga clic en el botón Productos ("carrito de compras").

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8sKhXb1Ofg.png)

Use el buscador para encontrar el producto que desea modificar. En la lista haga clic en el botón azul [🖊️] ("editar"), que está en la parte derecha de la tabla del producto que quiere cambiar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gCl7gttXo5.png)

A continuación en la ventana "Editar Producto" cambie el precio del producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Ejv6X0CabJ.png)

Haga clic en el botón [Guardar] para guardar los cambios.


---

---
title: Como actualizar el sistema manualmente
url: https://posberry.tawk.help/article/como-actualizar-el-sistema-manualmente
---

# Como actualizar el sistema manualmente

*Como actualizar el sistema por si la descarga automatica no funciona esperadamente.*

Debemos ir a POSBerry.com, ir al apartado de descargas y descargar la version de nuestro Sistema operativo del sistema, una vez descargado, deben ir a la carpeta donde hayan descargado la nueva actualización, la abren y reinstalan posberry. IMPORTANTE: NO se borra ningun dato del sistema durante este proceso, solo se actualiza la aplicación.

Mientras este proceso se efectúa, el sistema debe estar CERRADO, ya que de lo contrario no podran instalar la nueva versión.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eHTkWb1w-W.jpeg)


---

---
title: Instalación y configuración del teclado 3nStar KB78M para usar con POSBerry
url: https://posberry.tawk.help/article/como-instalar-y-configurar-tu-teclado-3nstar
---

# Instalación y configuración del teclado 3nStar KB78M para usar con POSBerry

*Guía paso a paso para configurar el teclado programable KB78M de 3nStar y aprovechar al máximo sus atajos personalizados dentro del sistema POSBerry.*

este es el diagrama que utilizaremos para nuestro teclado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QfNV7oHXc9.png)

**1. Descarga e instalación del software KB78MS** Para comenzar, es necesario instalar la aplicación oficial del teclado: **🔗 Descargar instalador KB78MS**

**2. Seleccionar el modelo de teclado** Una vez instalado el software: Abrí la aplicación KB78MS. Seleccioná el modelo de teclado KB78M en el menú de opciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/brXuIu0dut.png)

**3. Importar la configuración preestablecida** Para facilitar la configuración: Descargá el archivo .bat con las configuraciones ya creadas por POSBerry. (Este archivo contiene los atajos y teclas necesarias para trabajar con nuestro sistema.) Desde la aplicación, seleccioná la opción para cargar un archivo de configuración. Subí el archivo .bat descargado previamente. Esto cargará automáticamente todas las asignaciones de teclas necesarias.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/O168j7esln.png)

**4. Guardar y enviar configuración al teclado** Una vez cargado el archivo: Verificá en el panel la asignación de cada tecla. Hacé clic en guardar y enviar al dispositivo. El teclado ahora estará completamente configurado y listo para usar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4RJ13q3_IN.png)

## Configuración de atajos rápidos dentro de POSBerry (⚠️ Muy importante)

Para aprovechar al máximo el teclado, es esencial configurar los atajos dentro del sistema POSBerry: Ctrl + 0 → Cliente 1 Ctrl + 1 → Cliente 2 Ctrl + 2 → Ingreso Ctrl + 3 → Egreso **🔗 Video tutorial** Mirá cómo personalizar los paneles de ingreso y egreso en este video: 👉 [Ver video en YouTube](https://www.youtube.com/watch?v=fygwgZvFOn4)


---

---
title: Códigos de barra de balanza
url: https://posberry.tawk.help/article/códigos-de-barra-de-balanza
---

# Códigos de barra de balanza

*Guía Rápida: Cómo Configurar el Sistema según una Etiqueta de Balanza*

Para asegurar que los tickets se lean correctamente en POSBerry, es importante que la configuración de la balanza esté correctamente sincronizada con el sistema. Seguí estos pasos:

🔍 **1. Analizá la etiqueta impresa (ej: “Queso de Maquina”)** Encontrarás: Código POSBerry del producto (también llamado **PLU** ) ( **ej. 00001 este codigo contiene 5 digitos de PLU** ). **Importe total o cantidad.** Código de barras de **13 dígitos.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0ZaqmY2q3_.jpeg)

**⚖️ 2. Identificá si el código contiene Importe o Cantidad** Compará los últimos 5-6 dígitos antes del último (verificador) (ej. **5000** ). Si coinciden con el importe total: seleccioná **"Importe"** . Si coinciden con el peso/cantidad: seleccioná **"Cantidad"** ( ej. **coincide con el Peso ** ). 📌 No uses el último dígito (es solo de verificación).

**💰 3. Si elegiste “Importe”, determiná los decimales** Si el importe es entero (ej. 1995 = $1995), **Ingrese** **0 decimales.** **** Si termina en .5 (ej. 1955 = $19,55), **Ingrese** **1 decimal.** **** Si incluye centavos completos (ej. 1999 = $19,99), **Ingrese 2 decimales.En nuestro ejemplo "QUESO DE MAQUINA" no tiene Importe asi que no lo utilizamos.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/afcyFm-iZB.png)

**🧩 4. Anotá los valores necesarios para configurar en POSBerry** **Inicio del código de barras** : son los primeros dígitos del código de barras (pueden ser 1 o más, como 2 o 21). Este valor debe coincidir exactamente con el que figura al comienzo del código de barras. . En nuestro ejemplo **"QUESO DE MAQUINA"** empieza con " 2 " . **Código POSBerry (PLU)** : es el código interno del producto en el sistema. Buscá en la etiqueta cuál es el código dentro del código de barras y contá cuántos dígitos ocupa (por ejemplo: 00029 = 5 dígitos) **Importe o Cantidad** : lo que sigue al PLU en el código (otros 5 dígitos normalmente)

**🛠️ 5. Configurá POSBerry** Ingresá a **Configuración** y completá: **Inicio del código:** lo que viste al principio del código de barras. **El código contiene:** seleccioná "Importe" o "Cantidad". **Decimales ( si el final indica un importe ):** solo si elegiste "Importe" (0, 1 o 2). **Formato:** elegí la opción correcta según el número de dígitos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BanQwCmA5V.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/h2zLq0pPKi.jpeg)

**🏪 6. Comercios con múltiples sectores** Algunos Comercios usan un dígito para Identificar el sector: 21 = **Fiambrería** 22 = **Carnicería** 23 = **Panadería** **Ejemplo:** Podés usar solo el primer dígito (ej. 2) como "Inicio del código". Ejemplo: 2 puede ser sector general. Podés asignar un prefijo al PLU para cada sector: 10001 **→ Sector 1** 20001 **→ Sector 2** etc. Así, si usás solo el primer dígito (2) como inicio, te asegurás de que no haya conflicto con códigos de otros sectores.

✅ Resumen Coincidencia entre PLU de balanza y POSBerry es obligatoria. Elegí correctamente entre “Importe” o “Cantidad”. Indicá bien la cantidad de decimales. Usá el "Inicio del código" correcto.


---

---
title: Eliminar cliente desde (PC)
url: https://posberry.tawk.help/article/eliminar-cliente-desde-pc
---

# Eliminar cliente desde (PC)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XoZXyY_yRJ.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CLu_oMtQL9.jpeg)

Para eliminar un cliente en POSBerry Desktop, siga los siguientes pasos: 1. Abra el menú de "Clientes". 2. Busque el cliente que desea eliminar y selecciónelo. 3. Haga clic en el botón "Editar" para abrir la ventana de edición de cliente. 4. En la parte inferior de la ventana, encontrará el botón "Eliminar". 5. Se recomienda inactivar el cliente en lugar de eliminarlo, pero si desea eliminarlo definitivamente, haga clic en el botón "Eliminar". 6. Confirme la eliminación del cliente en la ventana emergente. Recuerde que eliminar un cliente es una acción irreversible y no se pueden recuperar los datos del cliente después de eliminarlo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CpZ92SGHyE.jpeg)


---

---
title: Rentabilidad por dia
url: https://posberry.tawk.help/article/rentabilidad-por-dia
---

# Rentabilidad por dia

*que es la rentabilidad por dia y como funciona*

La rentabilidad por dia funciona restando al precio de venta de un producto su precio de costo, dando asi su rentabilidad, por ej:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WkPSl0Mw2i.jpeg)


---

---
title: Como Instalar Posberry en Mac (macOS)
url: https://posberry.tawk.help/article/como-instalar-posberry-en-mac-macos
---

# Como Instalar Posberry en Mac (macOS)

*Guía paso a paso para instalar Posberry en tu Mac y solucionar posibles bloqueos de seguridad.*

Para descargar el instalador debemos ir a la pagina oficial de POSBerry, la cual es [https://www.posberry.com/](https://www.posberry.com/)

**1. Descargar e Instalar Posberry** Descarga el instalador de Posberry para macOS. Abre el archivo descargado y arrastra la aplicación a la carpeta "Aplicaciones".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4hZ_AsAE55.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kHGsADh5kJ.png)

**2. Permitir Instalación de Apps Externas** si no tienes permisos de instalar Posberry, debes permitir la instalación de aplicaciones fuera de la App Store: Abre Configuración del Sistema. Ve a Privacidad y Seguridad. intente instalar el sistema nuevamente. En la sección de seguridad, verás que macOS bloqueó Posberry. Haz clic en "Abrir de todos modos" para permitir la ejecución de la app.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J4Hq16qhtA.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RS-D8xUPqG.png)

**3. Ejecutar Posberry en macOS** Ve a la carpeta "Aplicaciones" y busca Posberry. Haz clic derecho sobre Posberry y selecciona "Mostrar contenido del paquete". Ingresa a la carpeta "Contents" y luego a la carpeta "MacOS". Dentro de "MacOS", haz doble clic en el archivo llamado "POSBerry" para ejecutarlo. [](http://ejecutarlo.Si) Si el sistema vuelve a bloquear la app, regresa a Privacidad y Seguridad y selecciona "Abrir de todos modos".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/B3voUiob8a.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PBnkcmUPRc.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WdPTxpT3y_.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/83LzLMsPo6.png)

**4. Configurar y Acceder a Posberry** Al abrir Posberry, aparecerá una notificación sobre cambios en las preferencias de seguridad. Acéptalos. La aplicación se abrirá normalmente. Ingresa tu usuario y contraseña y ya podrás inciar por primera vez tu POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YY6zPCvqSC.png)


---

---
title: Crear archivo ZPL personalizado para Código de Barras
url: https://posberry.tawk.help/article/crear-archivo-zpl-personalizado-para
---

# Crear archivo ZPL personalizado para Código de Barras

En el bloc de notas cree un archivo y guárdelo con extensión ".zpl" en la carpeta de configuración de POSBerry. En Windows está en: "C:\Users\USER\AppData\Local\POSBerry" donde "USER" es el nombre del usuario en el equipo. Por ejemplo, guardaremos "impresion.zpl".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kxIgZaC0DD.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OEhFirDmoQ.png)

Si abrimos el Listado de Productos, vamos a Códigos de barras y elegimos Formato, podemos elegir nuestro archivo "impresion".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uQHyPWAfui.png)

En el bloc de notas, debemos personalizar nuestro archivo "impresion.zpl". Para ello podemos usar las siguientes variables: {COPIAS} {CODIGO} {CODIGO128} {LINEA1} {LINEA2} {LINEA3} {LINEA4} {PRECIO} Adicionalmente, si tenemos una impresora que tiene de ancho varias etiquetas, podemos usar "CODIGO", "LINEA1" y "PRECIO" del 1 al 5: {CODIGO1} {CODIGO2} {CODIGO3} {CODIGO4} {CODIGO5} {LINEA1_1} {LINEA1_2} {LINEA1_3} {LINEA1_4} {LINEA1_5} {PRECIO1} {PRECIO2} {PRECIO3} {PRECIO4} {PRECIO5} Nota: Esto NO usa un precio de otra lista, simplemente es el numero de orden de la etiqueta, por ejemplo la etiqueta 1ra, 2da, 3ra, 4ta o 5ta en el ancho del papel de etiquetas. Etiqueta de ejemplo, en este caso usaremos {COPIAS}, {CODIGO} y {LINEA1}:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fH-9St_59n.png)

Para poder generar el codigo ZPL necesitamos Zebra. [Descargar Zebra](https://github.com/Arandusoft/POSBerry/releases/download/descargas/zebradesigner3-322629.exe) (para Windows). Una vez instalado, lo abrimos, y hacemos clic en "Crear una nueva etiqueta":

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FX7qW1jc7o.png)

A continuación seleccionamos nuestra impresora y hacemos clic en "Finalizar":

Agregamos desde la izquierda un "Cod. de barras" y un "Texto" y le ponemos el siguiente texto "Texto de Prueba 1234"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_gyFwa3iRQ.png)

Elegimos el formato del Código de Barras, por defecto es Code128 que necesita que usemos la variable {CODIGO128}, eso si nuestro código es muy largo o contiene texto (ideal para imprimir códigos de productos), pero si nuestro código es un estándar EAN-13 es la otra opción.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qBpbnaDq-4.png)

A continuación hacemos clic en "Imprimir" y marcamos la opción "Imprimir a fichero", luego hacemos clic en el botón azul "Imprimir":

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Wzy8q8CTHz.png)

Guardamos el archivo "Etiqueta.prn" y luego lo abrimos con el bloc de notas, tendremos algo así:

A continuación copiamos todo el texto de ese archivo y lo pegamos en nuestro archivo "impresion.zpl".

Debemos reemplazar "Texto de Prueba 1234" por "{LINEA1}" y debemos reemplazar "123456789012" por "{CODIGO}" ó "{CODIGO128}" según hayamos seleccionado. Además debemos agregar "{COPIAS}" debajo de "^XA" Nos quedaría así:

Guardamos el archivo y ya tenemos lista nuestra etiqueta.

EN CASO de que nuestra impresion no funcione con copias, debemos utilizar zebra, mandamos a imprimir como fichero y al mismo tiempo, le cargamos el numero de copias, al revisar el fichero debemos reemplazar el numero de copias que hayamos elegido con {COPIAS}, si se realizó correctamente debe salir la cantidad de copias especificadas en POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/okCErAfVyx.png)


---

---
title: Como Realizar el Cierre de Caja en Posberry Go
url: https://posberry.tawk.help/article/cierre-de-caja-desde-posberry-go
---

# Como Realizar el Cierre de Caja en Posberry Go

*Aprende a cerrar caja correctamente desde tu dispositivo móvil y administrar los movimientos de efectivo.*

## Acceder al Cierre de Caja

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AT2fx_Oi2T.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XpdlORsVWP.jpeg)

Ventas en Efectivo Si hay efectivo en la caja, se visualizará como "Efectivo". El saldo de caja mostrará el total de dinero disponible.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QfJ9dtBvfQ.jpeg)

Cierre de Caja Para realizar el cierre: Ingrese el total de dinero en la barra "Total de Billetes". es el monto que hay en caja en ese momento. Este monto se registrará como saldo inicial para la próxima apertura de caja. ya que posberry funciona con un " cierre de caja continuo " osea cierra caja y abre otra de inmediato para el proximo inicio

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VF7u4qv6WV.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Ytwwv_z1D6.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5csV5-PmZA.jpeg)

Si ingresa 0 en Total de Billetes, el saldo inicial del próximo inicio será 0. 🔹 Importante: Si deja el saldo en 0, el sistema forzará un egreso para dejar el próximo inicio en 0.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JkJqZJbt6H.jpeg)

Movimientos de Caja Ingreso: Entrada de dinero a la caja. Egreso: Retiro de dinero de la caja. Procedimiento para Cierre de Caja con Egreso y Saldo Inicial Acceda a los movimientos de caja: Despliegue el menú lateral hacia la derecha. Ingrese a "Mov. de Caja". Realice un egreso si desea retirar dinero. Luego, en Total de Billetes, ingrese la cantidad que dejará para el próximo inicio. En la próxima apertura, este monto se reflejará como saldo inicial.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gRVrsLMgCI.jpeg)

Tipo elige el tipo de movimiento ingreso o egreso monto ingrese el monto que quiere ingresar a la caja o lo que quiere retirar de la caja observacion una pequeña descripcion

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0HEVG8EvDe.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/C2tY75_U2y.jpeg)

Cierre de Caja con Saldo en 0 Si desea dejar la caja en 0 y el saldo inicial en 0, puede hacerlo de dos maneras: Realizando un egreso de todo el dinero antes del cierre. Dejando el Total de Billetes en 0 al cerrar la caja. ⚠ Recomendación: Siempre realice primero un egreso del dinero antes de cerrar la caja en 0 para mantener un registro de movimientos más claro.


---

---
title: Como Configurar Factura Electrónica Para Realizar Ventas válidas como Factura
url: https://posberry.tawk.help/article/configurar-factura-electrónica
---

# Como Configurar Factura Electrónica Para Realizar Ventas válidas como Factura

*Como configurar la Factura Electrónica tanto en POSBerry como en ARCA (ex AFIP) para que las ventas ya se realicen con CAE de ARCA (ex AFIP)siendo válida como factura*

Entienda que este es un proceso con varios pasos, por lo tanto debe seguir paso a paso para poder realizarlo correctamente. Antes de iniciar la configuración de la factura electronica, SI o SI debe ir a la web POSBerry, debe ir a configuraciones y debe ir a la sección "Empresa". Una vez allí, deberá cargar el cuit con que el que va a facturar, puede ser su cuit personal o un cuit de razon social, tenga en cuenta También debe elegir en el apartado "CONDICION IVA" si usted es responsable inscripto, si es monotributista, si es no categorizado o si es iva exento.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-oOKQc8p6F.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/v6HdOb_DlT.jpeg)

Se debe controlar en POSBerry y ARCA que el NÚMERO de punto de venta sean iguales tanto en POSBerry como en ARCA . IMPORTANTE: Se tiene que controlar también que el punto de venta en ARCA no esté en uso, ya que si está en uso se deberá crear un nuevo punto de venta en ARCA y por consecuente crear un punto de venta en POSBerry con la misma numeración.

La numeración de los puntos de venta tanto en afip como en posberry se controlan revisando el numero asignado a los puntos de venta. Esto en POSBerry se revisa dirigiéndose a la web -> Configuraciones (ruedita dentada) -> puntos de venta -> se selecciona el punto de venta a revisar y se debe mirar la numeración.

## Revisión en POSBerry:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/E-VkmXq_eP.jpeg)

## Revisión en ARCA :

Para revisar ello en ARCA debemos ir a la pagina de ARCA : [https://auth.afip.gob.ar/contribuyente_/loginClave.xhtml](https://auth.afip.gob.ar/contribuyente_/loginClave.xhtml) (ingreso a ARCA con clave fiscal)-> Colocar nuestros datos (cuit y clave fiscal) -> Hace click en la opción "ver todos"-> Elige la opción "Administración de puntos de venta y Domicilios" (si no tiene esta función debe hablar con un contador para activarla)-> Selecciona su empresa a representar-> hace click en la opción "A/B/M de puntos de venta" y revisa tanto el número como el uso del punto de venta con la misma numeración.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CEIA-I2nYv.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kXvdxril23.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jSTQLgwnSz.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HW0c9gYYIK.jpeg)

En este caso el punto de venta 1 en ARCA ya esta en uso, por lo tanto NO SE PUEDE USAR.

Se deberá crear un nuevo punto de venta, para ello creamos en este caso el punto de venta 2, si en su computadora ya instalo POSBerry y dice ser punto de venta 1, esta mal y debe cambiarlo, para ello le recomendamos visitar el instructivo mostrado en la imagen de [abajo.Si](http://abajo.Si) el punto de venta en ARCA no está en uso, no hace falta hacer el cambio de punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4OhRS5rRPZ.jpeg)

2) Una vez hecha la revisión, debe configurar o crear un punto de venta con el sistema "RECE para aplicativo y web services". Si es MONOTRIBUTISTA, debe elegir "Factura Electrónica - Monotributo - Web Services". Si es RESPONSABLE INSCRIPTO, debe elegir "RECE aplicativo y web services". Para dar de alta un nuevo punto de venta debemos hacer click en el botón "Agregar" en "A/B/M de Puntos de venta", cargar sus datos y luego de darle a aceptar, verificando que este dado de alta el punto de venta que creó.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gLTOpoC2_z.jpeg)

## Configuración en POSBerry:

En la web -> configuraciones -> punto de venta -> selecciona su punto de venta o crea uno nuevo, en ambos casos se configura igual, si no sabe como dar de alta un punto de venta utilice este instructivo: [https://posberry.tawk.help/article/nuevo-punto-de-venta](https://posberry.tawk.help/article/nuevo-punto-de-venta)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b2Y48g85Xg.jpeg)

_El tipo de facturación debe ser FACTURA ELECTRÓNICA. _ Se debe generar el archivo "KEY" (es automático, solo se debe darle a generar archivo KEY, guardar los cambios y volver al punto de venta). _el archivo CSR (certificate request) es el achivo a cargar en ARCA como un certificado digital, eso lo veremos en Configuración en ARCA . _ NO debe cargar CSR que descarga de POSBerry en la pagina de POSBerry, debe cargarlo en AFIP como mostraremos a continuación.

## Configuración en ARCA :

Debemos realizar los siguientes pasos: 1)_ Dar de alta la función en ARCA  de "administrador de certificados digitales" (si ya tiene activo este servicio, omita este paso) Para ello Debemos ir a "administrador de RELACIONES DE CLAVE FISCAL" ->elegimos la primera opción de "adherir servicio".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dRXp0DmUVF.jpeg)

En la sección "ARCA", debe hacer click en el boton marcado y luego hace click en servicios interactivos -> busca la opción "Administración de certificados digitales" y le hace click, nos abrirá la pestaña "Incorporar nueva relación", solo debe hacer click en "CONFIRMAR". Para finalizar este paso cierre su sesión en ARCA  y vuelva a entrar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FcQHGb1z7j.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OSBDoSe-Cq.jpeg)

2)_ Ahora debemos cargar el archivo CSR (certificate Request) este se descarga haciendo click en el botón "descargar archivo CSR (Certificate Request)", botón mostrado en "Configuración en POSBerry" -> Debe ir hacia ARCA  nuevamente, elige la opción de "administrador de certificados digitales" (si se realizo bien el paso anterior, debe aparecer un nuevo botón en ARCA con este nombre)  y debe hacer click en el botón "Agregar alias".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/t4aZ_DSYPN.jpeg)

En alias ponemos el alias que queramos, es solo un Nombre. Da click en "Seleccionar archivo", busca el CSR que ya debe haber descargado con anterioridad de posberry web, lo selecciona y da click en Abrir, para cargar el CSR en ARCA, por último hace click en "Agregar alias", para dar de alta el certificado.

3) En el alias que dio de alta, debe hacer click en "ver", nos mostrará otro menú, debemos hacer click en el dibujo de descarga, el que se detalla en la imagen de abajo, es la ultima descarga que haremos. este archivo debemos llevarlo a POSBerry web -> configuraciones -> punto de venta -> elige el punto de venta que esta siendo configurado, baja hasta encontrar la opción "Factura electronica.Crt", hace click en seleccionar archivo, y elige el que descargo de ARCA, carga el archivo y guarda los cambios en el punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/16uTT1usSY.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/a1SBfNTTTU.jpeg)

4) Debemos autorizar el computador, para ello debe: A) ir a "administrador de relaciones de clave Fiscal", elegir la "opción nueva relación". B) Hace click en buscar, al desplegar las opciones de ARCA, elige la opción "WebServices", y dentro de las opciones de WebServices, debe elegir la opción "Facturación Electrónica". C) Deberá cargar en "Representante", y elegir en "computador Fiscal" el alias que dio de alta anteriormente con su certificate request. D) para finalizar debe hacer click en confirmar luego de que este cargado el alias como representante. Listo! solo falta que realice una Revision Final para confirmar que ya puede facturar sus ventas con POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2VnR-nRGAb.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uVXIqN8jM_.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MyNWtgMzdz.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lMC-3sU3RH.jpeg)

## Revisión Final:

5) debemos probar que todo haya quedado correctamente cargado, una vez ya cargado o cambiado el punto de venta, debe hacer una venta al cliente "CONSUMIDOR FINAL" y debe aparecer el aviso de "GENERANDO FACTURA ELECTRONICA" debe cerrarse la venta y debe ir a ventas en el punto de venta, da click a mostrar y revisa que el tipo de factura sea FCB ( o FCC en caso de ser monotributista). En caso de que NO funcione, el paso a paso no fue realizado correctamente, debe intentarlo nuevamente o contactar con su soporte asignado.


---

---
title: Ajuste de Inventario Desde la PC
url: https://posberry.tawk.help/article/ajuste-de-inventario-pc
---

# Ajuste de Inventario Desde la PC

*Cómo Modificar el Inventario de Productos de Manera Sencilla*

1. En la ventana principal, haga clic en **[CTRL + o]** , luego diríjase a **[Stock]** y seleccione **[Inventario].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZaZXNv4hRu.png)

2. En la pantalla **"Inventario de Productos"** , use el campo de búsqueda **"Filtrar por Nombre"** para encontrar el producto cuyo stock desea ajustar. 3. Para modificar el **stock físico** , haga doble clic en el valor actual o seleccione el valor y presione **Enter** , luego ingrese el nuevo número.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aVQpwYbI-6.png)

4. Si quiere ocultar los productos inactivos, marque la casilla **[ ] Solo Activos.** 5.Puede filtrar por una familia específica de productos seleccionando la casilla **[ ] Familia** y eligiendo la familia desde el menú desplegable.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9gfHJcHDh-.png)

6. Después de realizar los ajustes, marque la casilla [ ] Mostrar solamente con diferencias para visualizar solo los productos que han cambiado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AYnStaNlk1.png)

7. Una vez revisados los cambios, haga clic en [Guardar]. 8. Confirme la operación haciendo clic en [Sí]. Si todo es correcto, verá el mensaje "El inventario se aplicó correctamente". Haga clic en [Aceptar].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/m0y9kbKlkT.png)

9. También puede actualizar el inventario importando un archivo Excel. Para esto, haga clic en **[Importar]** y seleccione el archivo que contiene los ajustes. 10. Si necesita obtener el formato del archivo Excel para hacer cambios, haga clic en el **Icono de Flecha** ubicado en la parte superior derecha.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/W2zM1N6SOq.png)


---

---
title: POSBerry Order - Configuración
url: https://posberry.tawk.help/article/posberry-order-configuración
---

# POSBerry Order - Configuración

*Como activar y configurar la tienda online*

Para poder utilizar las funciones de POSBerry Order primero verifique que tiene la versión de POSBerry 1.6.0.0 o Superior. Segundo, Habilite las opciones de Delivery o Pickup. Para eso debe hacer clic en configuración en la web, seleccionar la sucursal en la que va a estar habilitado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PKGUr1wHdu.png)

Luego hacer clic en la casilla de Pickup o Delivery, según el que desee utilizar. Finalmente haga en clic en ‘Guardar’ para aplicar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xcWJPZZxpf.png)

Este paso debe repetirlo para las todas las sucursales en las que desee habilitar el servicio de Delivery o Pickup. Nota: Puede tener ambos servicios activos al mismo tiempo. Si las casillas ya estaban marcadas debe hacer clic en ‘Guardar’ para que los cambios se envíen a la última versión.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yhTJCIZ5B8.png)

En las opciones de POSBerry debe ir a la pestaña de 'Servicios' y marcar 'Recibir pedidos en este dispositivo'. Por último, en POSBerry debe ir al menú y hacer clic en sincronizar o usar la tecla de acceso rápido F12 para sincronizar. Una vez realizado el proceso de sincronización debe cerrar POSBerry y volver a abrir el programa para que se apliquen los cambios realizados. Si el proceso fue exitoso podrá ver un icono de carrito de compras en la parte inferior derecha como se muestra en la imagen. Al hacerle clic al icono del carrito aparecerá un cuadro de información confirmando que el servicio que eligió este activo para la sucursal. Debe repetir este proceso para cada sucursal que desee aplicar el servicio. En el ícono del carrito puede ver que está conectado al servicio de POSBerry Order, y que está recibiendo pedidos, en este caso para Delivery y Pickup.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/h6DiBydtoV.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4txitRpbCC.png)

Nota: los servicios de Delivery y Pickup son independientes en cada sucursal. Puede tener sucursales que tienen delivery y otras que no, también puede tener sucursales con ninguna de las dos. Eso se cambia en la configuración de cada sucursal.

## Link hacia la pagina de POSBerry Order

La página principal donde se reúnen todas las empresas es https://www.posberry.com/order/. Allí puede ver su empresa y las demás empresas que usan POSBerry Order, ordenadas por distancia. Puede usar el buscador para encontrar las sucursales de su empresa. La dirección de la página individual incluye el “dominio” de su empresa en POSBerry. Por ejemplo, si su usuario es admin@metropizza, la parte después de la arroba se pone para ingresar a su página. Entonces para esta empresa quedaría https://www.posberry.com/order/metropizza/. Se ve como en la siguiente imagen:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/S9N0X0TlC-.png)

Haciendo clic en una de las sucursales puede obtener el link específico para esa sucursal. Por ejemplo, si hacemos clic en “Salta…” nos llevaría al siguiente link https://www.posberry.com/order/metropizza/2/. Como puede ver, luego del dominio de su empresa, se coloca el número de sucursal. Si su empresa tiene solo una sucursal, la página de la empresa redirecciona automáticamente a esa sucursal.

## ¿Qué productos se publican en la pagina?

Los productos que se publican son los que tienen marcada la opción ‘Publicar en la web’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/P2BhPm3u4m.png)

Además, el producto debe ser de tipo ‘Producto’ o ‘Receta’. Los ‘Insumos’, ‘Rubros’ y ‘Servicios’ NO se publican. Puede cambiar la imagen del producto desde la web, en la pestaña Productos por cada producto individual o para todos los productos en la pestaña Imágenes.

## Preferencia de Stock

En la configuración de Empresas en la web, puede cambiar las ‘Preferencias de stock Web’.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3Cs686gZAu.png)

La web puede mostrar todos los productos sin importar el stock, es decir no hacer control de stock, para ello seleccione la opción ‘Sin control’. También se pueden ocultar los productos sin Stock, con la opción ‘No mostrar productos sin Stock’, no se verán en la web. La otra opción es no permitir al cliente comprar mas de lo que hay disponible, para esto elija la opción ‘Restringir cantidades’.

## Opciones disponibles para las sucursales

En la pestaña ‘Sucursales’ en la web de configuración de POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XCZA5NI_hw.png)

Lo principal son los datos de ubicación, esto ayudará a los clientes a poder visualizar el sitio web de POSBerry Order según su ubicación. El correo electrónico se usa para que usted reciba los pedidos en su casilla. Poner la ubicación en el mapa es fundamental, ya que esto se usa para mostrar a los clientes la distancia que tiene entre la ubicación de la sucursal y la posición actual del cliente (ya sea su ubicación aproximada en la PC o la ubicación precisa en el celular).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/GdH4QY1dWo.png)

A continuación, puede ver el número de WhatsApp, ingrese un número válido para que los clientes puedan comunicarse con usted directamente. Solo funciona con números de WhatsApp, no con otros números de teléfono. La política de horarios web sirve para saber cuando la web está disponible para el cliente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J-YA8pd7Rv.png)

Recibir siempre: la web está abierta las 24 horas. Recibir solo en horario comercial: la web está abierta en los horarios que configure en la página de ‘Administrar Turnos’. Recibir solo si el sistema esta recibiendo pedidos online: todavía no está funcional, pero se usará para indicar que solo esté disponible la web mientras el programa POSBerry esté abierto en su PC. No recibir pedidos temporalmente: la web está deshabilitada por completo. Útil si se va de vacaciones, o para los feriados. El resto de las opciones son: Usar Delivery Web: para habilitar la opción de delivery en la web, que el cliente puede seleccionar. Precio del Delivery: cuánto le cuesta el delivery al cliente. Bonificar Delivery desde Monto: cuál es el valor del monto que tiene que igualar o superar la comprar para que el delivery sea gratis. Número de Cuadras gratis del Delivery: dentro de cuantas cuadras no se cobra el delivery. Número de Cuadras de alcance del Delivery: el máximo de cuadras a las que se hacen envíos. Por defecto está en 20. Número de minutos estimados de entrega del Delivery: cuánto tarda en promedio el delivery, por defecto está en 45. Usar Pickup Web: para habilitar la opción de retiro en sucursal en la web, que el cliente puede seleccionar. Activa: si la sucursal está activa se muestra en la web, si no está activa no se ve.

## Opciones en la Sucursal: Turnos

Para cada sucursal puede administrar los turnos, o el rango de horarios en que está activa. Los horarios que ingrese son visibles en la web siempre. También se usan con la opción ‘Recibir solo en horario comercial’ para deshabilitar el sitio web cuando esté fuera del horario de atención.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2OwQTLJFo6.png)

Haga clic en la sucursal y luego en ‘Administrar Turnos’. Puede ver los turnos que tiene configurados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RuE-pbxHQn.png)

También puede hacer un Nuevo Turno.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wGb50RYVT-.png)

Marque los días que corresponden, por ejemplo, marque las casillas Sábado y Domingo para indicar un horario de fin de semana. Ingrese la hora de inicio, en el primer cuadro van las horas y en el segundo cuadro van los minutos. Ejemplo 16:30. Ingrese la hora de finalización del turno, en el primer cuadro van las horas y en el segundo cuadro van los minutos. Ejemplo 20:30. La descripción la ven los clientes en la web, así que ingrese un texto que indique el horario. Por ejemplo: Sábados y Domingos de 16:30 a 20:30. Debe incluir el horario y los días en una forma que sea simple de entender por el cliente. Otros ejemplos: Lunes a Viernes de 9 a 13. Lunes, Miércoles y Viernes de 10 a 14. Debe ingresar solo un rango de horario por turno, es decir si usted atiende de 9 a 13 y de 16 a 20, debe crear un turno para el rango de 9 a 13 y otro turno para el rango de 16 a 20. Si tiene horario distinto el fin de semana, cree otro turno especial para fin de semana. A lo sumo cree 3 turnos, son mas que suficientes para indicar todo tipo de horarios comerciales comunes. Si usted atiende las 24 horas todos los días, ingrese en la descripción ‘Las 24 horas’ y en hora inicio 00:00, en hora fin 23:59. En este caso solo cree un turno. Para finalizar haga clic en ‘Guardar’.


---

---
title: Descargar Any Desk
url: https://posberry.tawk.help/article/descargar-any-desk
---

# Descargar Any Desk

*Como descargar el controlador remoto Any Desk*

Para descargar la aplicación AnyDesk, siga estos pasos: 1. Vaya a la página oficial de AnyDesk: https://anydesk.com/es 2. Haga clic en el botón grande y rojo que dice "Descargar ahora". 3. No es necesario crear una cuenta ni pagar nada. Simplemente haga clic en el botón de descarga para descargar la aplicación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6YBveeoyiC.jpeg)

Después de descargar AnyDesk desde la página oficial (https://anydesk.com/es) haciendo clic en "Descargar ahora", esperamos a que se complete la descarga y abrimos el archivo descargado. Si aparece una advertencia de seguridad, podemos elegir la opción "Conservar" para continuar. Una vez que se abra la aplicación, estará lista para ser utilizada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9oM8p_2CyR.jpeg)

Al abrirlo aparecerá el código de conexión de 9 dígitos en rojo.


---

---
title: Cajón de dinero
url: https://posberry.tawk.help/article/cajón-de-dinero
---

# Cajón de dinero

*Como habilitar la función de abrir cajon de dinero*

En el punto de venta, debemos ir a configuraciones, elegimos el apartado impresoras y tildamos la opción "Abrir cajón de dinero".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IkXuEhwNzd.jpeg)

IMPORTANTE: si tiene configurado un codigo de supervisor, las cuentas no supervisoras tendrán que utilizar dicho codigo para usar esta función.


---

---
title: ¿como se si afip esta dando error?
url: https://posberry.tawk.help/article/como-se-si-afip-esta-dando-error
---

# ¿como se si afip esta dando error?

*como confirmar la conexion a afip*

debemos ir hacer click en el boton de menu (CTRL+O), debemos ir al apartado "acerca de..." y cuando se abra la ventana debemos hacer click en el boton "diagnóstico"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PGgzCLdQaO.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4wxTY_xRYh.jpeg)

luego de abrirse la ventana de diasgnostico le damos a probar y esperamos a que termine el diagnostico

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RA_gKhci9O.jpeg)


---

---
title: Asignar mesas a los Camareros
url: https://posberry.tawk.help/article/asignar-mesas-a-los-camareros
---

# Asignar mesas a los Camareros

Para asignar mesas a un camarero en POSberry, siga los siguientes pasos: 1. Presione el botón "CTRL+O" en su teclado. 2. Seleccione la opción "Ventas" en el menú desplegable. 3. Seleccione "Listado de camareros". 4. Se abrirá la ventana del listado de camareros. Seleccione el camarero al que desea asignarle mesas. 5. Seleccione la opción "Asignar mesas" en la parte inferior de la ventana. 6. Utilice las flechas para asignar mesas al camarero. Si desea asignar varias mesas a la vez, mantenga presionado el botón del mouse y arrastre para seleccionar varias mesas. 7. Haga clic en "Guardar" para guardar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/V6Gw8oK1Rg.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ThkJPvdoqi.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/900edXiCCZ.jpeg)


---

---
title: Cómo Consultar Comprobantes Emitidos en ARCA (AFIP)
url: https://posberry.tawk.help/article/como-ver-ventas-en-arca-afip
---

# Cómo Consultar Comprobantes Emitidos en ARCA (AFIP)

*Aprende a visualizar tus ventas y comprobantes emitidos desde ARCA.*

Acceda al sistema ARCA y, en la primera fila de opciones, seleccione el penúltimo botón llamado "Mis Comprobantes".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EAjSppRrG0.jpeg)

Será redirigido a una página donde deberá elegir el CUIT correspondiente al representante.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Kscig1kZAV.jpeg)

Una vez dentro, seleccione la opción "Comprobantes Emitidos".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Uo06yqwmn7.jpeg)

Configure únicamente el rango de fechas en el que desea visualizar los comprobantes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Kf58d4eLUi.jpeg)

El sistema mostrará todas las facturas emitidas dentro del período seleccionado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/do4Y3-f5oP.jpeg)


---

---
title: Sincronizar manualmente en POSBerry Go
url: https://posberry.tawk.help/article/sincronizar-manualmente-en-posberry-go
---

# Sincronizar manualmente en POSBerry Go

*Descubre cómo actualizar los datos de forma manual en la versión móvil de POSBerry.*

Si necesita actualizar los datos en POSBerry Go porque los cambios realizados no se reflejan en la versión web, puede realizar una sincronización manual siguiendo estos pasos: **1.** Toque el botón del menú **" ☰ "** ubicado en la parte superior izquierda de la pantalla o deslice hacia la derecha para desplegar el menú. **2.** Seleccione el botón de **" ** 🔄 **Sincronizar"** para iniciar la sincronización manual.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LsZFVdkIYr.jpeg)

Es importante realizar esta acción periódicamente para asegurar que la información esté actualizada y evitar posibles discrepancias.


---

---
title: Crear lista de precio de venta
url: https://posberry.tawk.help/article/agregar-lista-de-precio-de-venta
---

# Crear lista de precio de venta

*Como crear y/o agregar listas de precio de venta a mi empresa*

Para agregar listas de precio en POSBerry, siga los siguientes pasos: 1. Vaya a la página web de POSBerry y haga clic en Configuraciones (icono de la rueda dentada) y seleccione Empresa. 2. Haga clic en el número de listas de precio para desplegar las opciones. 3. Elija la cantidad de listas de precio que desee (máximo 7 listas de precio). 4. Desplácese hasta el final de la página y haga clic en Guardar para guardar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wq3-mIBXOz.jpeg)


---

---
title: Balanzas Systel en línea de Caja
url: https://posberry.tawk.help/article/balanzas-systel-en-línea-de-caja
---

# Balanzas Systel en línea de Caja

*Con POSBerry usted podrá configurar balanzas marca Systel para lectura de peso, al momento de realizar el cobro en la caja.*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/h68KDCGeRI.jpg)

Los modelos soportados para este tipo de configuración son: Marca: Systel - Modelos: Croma / Clipse

## Modos de conexión de balanzas SYSTEL

Conexión de balanzas Systel Croma y Systel Clipse.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qfwQyLb79T.jpg)

Sin modificar nada en la balanza, se conecta con un cable serial que debe tener la configuración de la imagen.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uIl5Mz4BE_.jpg)

Posteriormente en el sistema, siga los siguientes pasos: 1. Vaya a Opciones. 2. Configuración. 3. Dispositivos. 4. En la sección Balanza, tilde en USAR BALANZA y seleccione el modelo. 5. En modo, elija Continuo. 6. Finalmente Presione OK

## Es importante destacar que "estos modelos de balanza solo nos van a permitir leer el peso. No nos permitirán transmitirle artículos".

Nota Final: Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) o a Itegra (sistema de Kretz) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, o en Itegra o su hardware de Kretz le recomendamos que se comunique directamente con el soporte técnico de Systel o Kretz para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry en el caso de Qendra, Systel y la correcta generación del archivo TXT para Itegra, Kretz. Para cualquier problema que pueda surgir después de la importación de datos a Qendra o a Itegra, por favor, póngase en contacto con el equipo de soporte de Systel o el soporte de Kretz, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Configuracion de Roles y Permisos
url: https://posberry.tawk.help/article/roles-y-permisos
---

# Configuracion de Roles y Permisos

*Instrucciones para crear, modificar y gestionar roles y permisos.*

## ¿Qué son los roles y permisos?

Los **roles** determinan los permisos que tiene cada operador para acceder, ver o modificar los datos de la empresa. A continuación, se explica cómo ver, crear y editar roles y sus permisos.

## ¿Cómo ver un rol?

**1. ** Haga clic en el botón **[⚙️ Configuración] (icono de rueda dentada).** **** **2. ** En el menú de la izquierda, haga clic en **[Roles]** . **** **3. ** Use el combo de selección **[Rol]** para elegir un rol existente y ver sus permisos. **(Ejemplo: rol "Cajero").**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pXKOgOL3Lq.png)

## ¿Cómo crear un nuevo rol?

**1. ** Haga clic en el botón **[⚙️ Configuración] (icono de rueda dentada).** **** **2. ** En el menú de la izquierda, haga clic en **[Roles].** **** **3. ** Haga clic en el botón **[NUEVO].** **** **4. ** Complete los campos requeridos: Nombre del Rol: Es el identificador del rol (no se puede cambiar después de ingresado). Descripción del Rol: Detalle adicional o información del rol. **** **5. ** Haga clic en **[GUARDAR]** para finalizar. **Importante:** Una vez creado el rol, deberá configurar los permisos asociados. Consulte la sección de **Editar Permisos** a continuación. Por defecto, el nuevo rol tendrá permisos para ver, editar y acceder a todas las páginas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/x9aTvH3g3O.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OF7nzECQbS.png)

## ¿Cómo editar los permisos de un rol?

**1. ** Haga clic en el botón **[⚙️ Configuración] (icono de rueda dentada).** **** **2. ** En el menú de la izquierda, haga clic en **[Roles].** **** **3. ** Seleccione el rol que desea modificar usando el combo de selección **[Rol].** **** **4. ** Para quitar permisos, destilde las casillas de verificación junto al permiso correspondiente. **** **5. ** Para agregar permisos, tildé las casillas de verificación deseadas. **** **6. ** Haga clic en **[GUARDAR]** para aplicar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MV75w8cxuK.png)

## Impacto en los operadores

Si un operador ya tiene asignado el rol modificado, los cambios de permisos se aplicarán automáticamente en la web, en el punto de venta se debe de sincronizar primeramente . Si no hay operadores asociados, puede crear un nuevo operador y asignarle el rol. Consulte el manual **Nuevo Operador** para más detalles. Los operadores deberán cerrar sesión y volver a iniciarla para que los cambios de permisos se apliquen correctamente.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Nuevo proveedor local (PC)
url: https://posberry.tawk.help/article/nuevo-proveedor-pc
---

# Nuevo proveedor local (PC)

*Como crear un nuevo proveedor en el sistema POSBerry del sistema.*

Para crear un nuevo proveedor en la pantalla principal haremos clic en opciones -> compras -> listado de proveedores

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dpzBx-honA.jpeg)

En la pantalla del listado de proveedores haremos clic al botón [+] ubicado en la parte superior derecha. con los botones dentro del cuadro rojo podrá crear (boton con signo "+") y editar (boton con icono de lapiz).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EwASnps-Q7.jpeg)

En la pantalla de nuevo proveedor llenaremos todos los campos obligatorios(*) y haremos clic en OK.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uLp6bo_u0v.jpeg)


---

---
title: Cambio de precios masivo De Manera Local
url: https://posberry.tawk.help/article/cambio-de-precios-masivo-pc
---

# Cambio de precios masivo De Manera Local

*Instrucciones para realizar cambios de precios en varios productos de forma rápida usando el sistema en PC.*

**IMPORTANTE: ** Antes de realizar cambios masivos en los precios de los productos, es fundamental realizar un **respaldo** de los precios actuales. Esto puede hacerse descargando el listado de productos en formato Excel. lea el siguiente instructivo para garantizar la seguridad de su información: [ImportarListadoProductos](https://posberry.tawk.help/article/ver-los-productos-web)

**1. ** Haz clic en **[CTRL+O]** , ve al menú **[Ventas]** y selecciona **[Cambiar Precios].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6dozZY2fXs.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KmvIuWu5BZ.png)

**2. ** Sigue estos pasos (cada sección se distingue por un color en la imagen): **** **Filtrar productos (naranja):** En la ventana de Lista de Precios, busca los productos a los que deseas ajustar precios. Puedes buscar productos específicos (por ejemplo, “chocolate”) o filtrar por otros criterios, como marca o familia de productos. **** **Seleccionar tipo de margen (verde):** **Margen de Precio Venta sobre Costo: ** Calcula el margen basado en el precio de venta y el costo del producto. **Margen del Producto: ** Usa el margen configurado en el producto. **Margen Manual: ** Permite ingresar un margen personalizado. **Modificar Precio de Costo: ** Al activarla, ajusta el costo basado en la opción Usar como precio base: **- Precio de Costo: ** Mantiene el costo actual del producto. **** **** **        - Precio de Última Compra: ** Actualiza el costo al de la última compra. **** **** **        - Precio de Venta: ** Ajusta el costo al nuevo precio de venta. Activa la Política de Redondeo si deseas redondear el precio (por defecto está en 0.10). **** ** Previsualizar cambios (azul):** Haz clic en [Previsualizar] para ver los ajustes antes de aplicarlos. **** **Seleccionar productos para omitir (violeta):** Si deseas excluir algún producto, desmarca su casilla [✔️] a la izquierda. **** **Aplicar cambios (rojo):** Si estás conforme, haz clic en **[Cambiar]** y confirma en **[Sí]** . Una ventana mostrará la cantidad de productos actualizados. Haz clic en **[Aceptar] ** para finalizar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/e83xR_0cru.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/R0Du6cMopw.png)

## Ejemplos de Ajustes de Precio

## Cambio según el Costo:

Útil si el costo cambió y deseas ajustar el precio de venta aplicando un margen. Ajusta el costo y margen en el editor de productos o desde una importación de Excel. Selecciona **[Margen Manual]** e ingresa el margen, o selecciona **[Margen del Producto].** Usa como precio base **[Precio de Costo].**

## Cambio según el Precio de Venta:

Para incrementar un porcentaje sobre el precio de venta actual, selecciona **[Margen Manual]** y elige **[Precio de Venta]** como base. Filtra los productos y ajusta, luego haz clic en **[Previsualizar]** y **[Cambiar].** **** Si **Modificar Precio de Costo** está activa, el costo se igualará al nuevo precio de venta.

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Cuantas Listas De Precios Puedo Utilizar En El Sistema
url: https://posberry.tawk.help/article/cuantas-listas-de-precios-maneja-el-sistema
---

# Cuantas Listas De Precios Puedo Utilizar En El Sistema

*Descubre cuántas listas de precios puedes configurar en POSBerry y cómo ajustarlas según tus necesidades.*

Para configurar la cantidad de listas de precios que deseas utilizar, sigue estos pasos: **1.** Haz clic en ⚙️ " **ícono de la rueda dentada ** " para ingresar a la configuración del sistema. **2.** En la página de configuración, desplázate hasta la sección **"Empresas"** . Allí, en la parte inferior, encontrarás un menú desplegable para seleccionar la cantidad de listas de precios que deseas utilizar. **3.** Para cambiar la cantidad, haz clic en el número de listas de precios actual y selecciona el nuevo número con el que deseas trabajar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UJERdAv6Jp.png)


---

---
title: Como Guardar Una Venta En Curso
url: https://posberry.tawk.help/article/se-puede-guardar-una-venta-en-curso-y-reanudarla-después
---

# Como Guardar Una Venta En Curso

*Como guardarla para imprimir un presupuesto o facturarla en otro momento.*

Cuando estés realizando una venta y desees guardarla, haz clic en el botón 💾" **Guardar pedido** " ubicado abajo en el lateral izquierdo de la pantalla . El sistema te preguntará si deseas guardar la venta; selecciona " **Sí** ".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Z95REqMWQt.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NluGQ-Xalq.png)

Para acceder a las ventas guardadas, haz clic en el botón " **Listado de pedidos** ". Allí podrás ver todas las ventas guardadas. Tienes varias opciones: **Imprimir:** Genera un presupuesto con los productos guardados, bajo el nombre "Detalle de pedidos", ideal para presentar a tus clientes. **Facturar:** Carga nuevamente la venta en el mostrador digital, donde podrás agregar o quitar productos antes de completar la factura.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QgbItY9nAi.png)


---

---
title: Verificador de precios Newland NQuire 300
url: https://posberry.tawk.help/article/verificador-de-precios
---

# Verificador de precios Newland NQuire 300

*Como configurar el verificador de precios Newland NQuire 300*

Para **configurar el verificador de precios en POSBerry** , siga estos pasos:

## 1. Conectar el Verificador a la Red

**Asegúrese de que el verificador esté en la misma red LAN** que la PC con POSBerry. En la **caja del verificador** , busque y anote su dirección IP. Ingrese la **dirección IP del verificador en su navegador** y acceda a su **página de configuración.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/buLiY2vek_.png)

## 2. Configurar la Conexión de Red

Dentro de la configuración, vaya a la sección **NETWORK** . **Seleccione el tipo de conexión** que desea usar: **Ethernet o WiFi** . **Presione "APPLY SETTINGS"** cada vez que realice un cambio para guardar los ajustes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ws1mhhyq4o.png)

## 3. Configurar el Protocolo de Red

**Si está conectando el verificador a través de WiFi** , ingrese la siguiente información: **ESSID:** nombre exacto de su red WiFi. **WIRELESS KEY TYPE** : seleccione **WPA o WPA2.** **WIRELESS KEY:** ingrese la **contraseña de su red WiFi.** **Seleccione el modo TCP Client** en el verificador. En **Remote IP Address** , ingrese la **dirección IP de la PC** que tiene instalado POSBerry. **Guarde todos los cambios presionando "APPLY SETTINGS".**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yn7YkJfjkY.png)

## 4. Configuración de IP Fija

**Es importante establecer una IP fija** tanto en la PC que ejecuta POSBerry como en el verificador de precios. Esto asegura que la configuración no se vea afectada si la IP de POSBerry cambia dinámicamente.

## 5. Obtener la IP de la PC con POSBerry

Abra la **aplicación POSBerry** y, en el **menú de opciones** (esquina superior derecha o **CTRL+O** ), seleccione **"Acerca de"** . Vaya a la pestaña de **"Informe del sistema"** y copie la **IP** mostrada allí para usarla en la configuración del verificador.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1s6UJ1S1ld.png)


---

---
title: Como integrar su posnet a POSberry
url: https://posberry.tawk.help/article/como-integrar-su-posnet-a-posberry
---

# Como integrar su posnet a POSberry

*en el sistema para pc con su posnet Fiserv*

Para **conectar un dispositivo POSNet a POSBerry** , siga los pasos a continuación:

## 1. Activar el servidor POSNet en POSBerry

Ingrese a **Configuraciones** y seleccione el apartado de **Integraciones.** **Active el servidor de POSNet** (marcando la casilla debajo de POSNet). Ingrese los datos correspondientes de su dispositivo POSNet: **ID de Comercio** **ID de Terminal** **Número de Terminal**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dzUo8NvgaW.jpeg)

## 2. Sincronizar POSNet con la Base Bluetooth

Encienda el **POSNet** y sincronícelo con su base: Presione **Enter** junto con la tecla **1.** Ingrese el **password: 12345678.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aLZNFSykIp.jpeg)

Aparecerá la pantalla de **Configuración** con dos opciones. Seleccione la opción **Base Bluetooth** presionando la tecla **1.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/F4SZ5kKApj.jpeg)

El dispositivo buscará conectarse a su base. **Presione el botón de Bluetooth en la base** y seleccione la base en el POSNet.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zv2d5BgEKm.jpeg)

seleccionamos la base presionando la tecla 1.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zY1bjj_rg5.jpeg)

## 3. Verificar la Conexión en POSBerry

Conecte el **USB del POSNet a la PC.** Vaya a ** POSBerry > Configuraciones > Integraciones** y presione el botón **Probar** . Deberá aparecer una ventana con el mensaje **"El dispositivo Fiserv se encuentra listo para usar".**


---

---
title: Tipos de productos
url: https://posberry.tawk.help/article/tipos-de-productos
---

# Tipos de productos

*Productos, servicios, recetas y Rubros*

**1. Productos:** Son aquellos que se **descuentan del stock** y son los **productos comunes** , como barritas de cereal o paquetes de galletas. **2. Servicios:** Son aquellos que se utilizan para servicios, como espectáculos o limpieza, y ** no necesitan stock** . El nombre del servicio se puede modificar en el mostrador web. **3. Recetas:** Se utilizan para **productos compuestos por otros productos** , por ejemplo, una hamburguesa que necesita pan, hamburguesa, tomate, etc. **Las recetas no solo descuentan su propio stock, sino también los de los productos que lo componen.** **4. Rubros:** Son aquellos productos cuyo **precio y nombre se pueden modificar y no utilizan stock** . Por ejemplo, verdulería, carnicería o almacén.

**Nota: ** Recuerda que para acceder a estas opciones debes hacer clic en **"Productos"** . Además, cada uno de estos conceptos se puede seleccionar a la hora de crear o modificar un producto en la sección **"Tipo de producto"** y **guardar la configuración** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ziVGRHOjB8.png)


---

---
title: Como Vincular un Equipo Point Smart en POSBerry GO
url: https://posberry.tawk.help/article/como-vincular-un-aparato-point-smart-en-posberry-go
---

# Como Vincular un Equipo Point Smart en POSBerry GO

*Como vincularlo al sistema de facturación para realizar cobros de tarjetas*

**Requisitos Previos:** Asegúrese de que su cuenta de **Mercado Pago** ya esté vinculada a POSBerry. Si aún no la vinculó, siga este [instructivo de vinculación de Mercado Pago](https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculaci%C3%B3n-con-posberry) . Los dispositivos **Point** deben estar vinculados a la misma cuenta de Mercado Pago que ya está en POSBerry. Para hacerlo, siga la guía oficial de Mercado Pago: [Cómo vincular o cambiar la cuenta de Point](https://www.mercadopago.com.ar/ayuda/como-cadastro-ou-troco-a-conta-Point_22300) . **Pasos para Vincular el Equipo Point Smart a POSBerry GO:** **** **1. ** En el menú lateral izquierdo de la aplicación, seleccione **Configuración.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XCZz5tI57H.jpeg)

**2.** Diríjase a la opción **Configurar MP Point Plus / Smart.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rb611_9kpW.jpeg)

**3.** Dentro de esta pantalla verá un listado y tres botones: **Botón de Recarga de Dispositivos** **(ícono de flechas en círculo)** : Presione este botón para cargar todos los dispositivos Point Smart o Plus vinculados a la cuenta. **Selección de Dispositivo:** Identifique el número de terminal en su dispositivo y búsquelo en el sistema. Seleccione la opción que coincida con el número de terminal. **Confirmación de Selección (ícono de tilde)** : Una vez seleccionado el dispositivo, presione este botón para confirmar que es el equipo a vincular. **4.** Reinicie el equipo **Point Smart / Plus** para aplicar los cambios. Si la vinculación se realizó correctamente, recibirá una confirmación en POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pkph4AWDch.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OEGSrniwco.jpeg)

**Verificación del Dispositivo Vinculado:** Luego de reiniciar el dispositivo, este debería mostrar el mensaje de vinculación: **"Iniciá la operación desde el sistema de punto de venta"** . Realice una venta de prueba usando el nuevo medio de pago para asegurarse de que POSBerry detecte la transacción y cierre la venta automáticamente al completar el pago con tarjeta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uJKf7xbKev.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ACaZw9037V.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0at2fMtrNt.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bu0QW4FFdC.jpeg)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Como Configurar y Aplicar la Fidelizacion Desde el Punto de Venta (PC)
url: https://posberry.tawk.help/article/fidelización-pc
---

# Como Configurar y Aplicar la Fidelizacion Desde el Punto de Venta (PC)

*Active la fidelización en su sistema y configure productos para acumular puntos desde la PC.*

Para usar la función de Fidelización en el punto de venta (PC), siga estos pasos para activar y configurar la acumulación de puntos: **1.Activación de Fidelizacion:     ** En la versión web, active la fidelización desde Configuración (icono de rueda dentada) → **Empresa** → "Usar Fidelización".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-rymmkDxgp.png)

2. Configurar Puntos en productos desde la PC: Para editar los productos desde la PC y asignarles puntos de fidelización: Acceda a **Menú** usando CTRL + O. Diríjase a **Stock → Listado de productos.** **** En la lista de productos, seleccione el ítem a editar y haga clic en el ícono del lápiz. En la ficha del producto, ingrese la cantidad de puntos de fidelización acumulables. Presione **Guardar** para finalizar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZJr1zdtUZZ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cZGA_KvdJh.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nnOcFerlnV.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vGgm8wPK1F.png)

## Cómo fidelizar a un cliente.

Para habilitar la acumulación de puntos en un cliente específico: Busque el cliente en el sistema y seleccione **Editar Cliente.** Marque la opción **Fidelización** para permitir que el cliente acumule y canjee puntos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ufYkudW64O.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Como Pedir O Enviar Mercaderia A Los Locales ( Pedido de Reposicion)
url: https://posberry.tawk.help/article/como-pedir-ó-enviar-mercadería-a-los-locales
---

# Como Pedir O Enviar Mercaderia A Los Locales ( Pedido de Reposicion)

*Instrucciones para realizar y gestionar pedidos de reposición a la central para mantener el stock actualizado.*

**1. Acceder a la función de Pedido de Reposición:** En el sistema POSBerry, haga clic en la pestaña **[Stock].** **** Junto al botón **Mostrar** , haga clic en la flecha hacia abajo y seleccione **[Pedido de Reposición].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qxcTxyW5Qf.png)

**2. Identificar el pedido:** En la ventana de **Pedido de Reposición** , complete el campo **Observación** con un texto que identifique el pedido (por ejemplo, " falta 5u de cerveza ").

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cr7fzzBBsD.png)

**3. Añadir productos al pedido:** Seleccione su pedido creado Use el buscador para encontrar los productos necesarios. Ingrese la cantidad de cada producto que necesita para el pedido.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SV0_8_3hXK.png)

**4. Guardar el pedido de reposición:** Haga clic derecho sobre el pedido y seleccione **[Guardar pedido de Reposición].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PsimxSODI0.png)

Confirmar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lhB4lW5gne.png)

**5. Sincronizar y gestionar en la web:** Realice una sincronización para visualizar el pedido en la web. **** En la versión web, acceda a **[Stock] > [Movimientos de Stock]** y seleccione el pedido de reposición. Ajuste las cantidades a enviar por cada producto, elija en **Enviar desde ** el origen del envío y luego haga clic en **[Generar envío de Mercadería]** . Confirme el envío.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/P6srzvKkxU.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NJ31GeR707.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YFJmItVSHh.png)

Confirmar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/soq2spRtYE.png)

**6. Verificación en el punto de venta:** Una vez completado, podrá ver la actualización en el stock del producto en el punto de venta, por ejemplo, **"5u de CERVEZA IMPERIAL 1L"** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kcDNTp9YKR.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Como Cancelar y Asignar Pagos a Multiples Facturas En La Cuenta Corriente De Un Cliente
url: https://posberry.tawk.help/article/como-cancelar-varias-facturas-en-la-cuenta-corriente-de-un-cliente
---

# Como Cancelar y Asignar Pagos a Multiples Facturas En La Cuenta Corriente De Un Cliente

*Instrucciones para cancelar varias facturas en la cuenta corriente de un cliente en POSBerry Local*

Con POSBerry usted podrá ofrecerle a sus Clientes a Crédito (Véase al artículo VENTAS A CRÉDITO), la posibilidad de pagar varias facturas pendientes de cobro.

En la pantalla de ventas, seleccione CAMBIAR CLIENTE o presione F2. Elija el cliente que desea gestionar. Presione el botón EXTRACTO para ver el estado de cuenta del cliente, incluyendo facturas pendientes y el límite de crédito disponible.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/M6BHJvuAnt.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Wxk6UgVavZ.png)

## Cargar saldo a una cuenta corriente

Haga clic en **[ Cargar saldo ]** . Seleccione el método de pago (Efectivo, Tarjeta de débito, o Tarjeta de crédito). Indique el monto a cargar y presione ** [GUARDAR].** **** En el cuadro de confirmación **"COBRANZA DE CUENTA CORRIENTE SE APLICÓ CORRECTAMENTE"** , presione **ACEPTAR** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PBcbwcNJ84.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lo6aLV3lkR.png)

## Asignar saldo a facturas pendientes

En la pantalla **EXTRACTO DE CUENTA** , seleccione **Cobranza de Cuenta Corriente.** En la ventana emergente, aparecerán las facturas en cuenta corriente aún pendientes. Seleccione la factura a la cual desea asignar el saldo. Presione **[GUARDAR]** para aplicar el pago. Una vez completado el proceso, el estado de cuenta del cliente se actualizará y las facturas canceladas desaparecerán del extracto de cuenta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QCu5ZoRTxV.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Oyhogj1lD4.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rj3C8QB9J5.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Se Pueden Hacer Descuentos en Determinados Productos solamente?
url: https://posberry.tawk.help/article/se-pueden-hacer-descuentos-en-determinados-productos-solamente
---

# Se Pueden Hacer Descuentos en Determinados Productos solamente?

*Configuración de promociones y descuentos en productos específicos*

Si, se puede hacer descuentos en determinados productos para eso al crear la promoción seleccione el tipo de promoción de productos que corresponda.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CaC_2Zgf__.png)

**1. Descuento por producto** Este tipo de promoción aplica un descuento al valor de un **producto específico.** **2. Promoción AxB** Ofrece una **unidad gratis** o con descuento por cada cantidad específica de un producto. Ejemplo: **Bonificar 1 unidad** por cada **4 unidades** compradas. **3. Promoción A + B** Aplica un descuento al combinar dos productos específicos. Ejemplo: **1 Coca-Cola + 1 Pepsi** con un **10% de descuento.** **4.** **Descuento variable por cantidad** Aplica un descuento en función de la cantidad adquirida. Ejemplo: **2 Coca-Colas ** con un **20% de descuento.** **5. Descuento fijo** Se establece un monto fijo de descuento por cada unidad vendida. **6. Promoción AxB más barato** Similar a la promoción AxB, pero en este caso, se **bonifica el producto de menor valor.**

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: ¿Cómo publicar productos para web order/QR de mesas?
url: https://posberry.tawk.help/article/¿cómo-publicar-productos-para-web-orderqr-de-mesas
---

# ¿Cómo publicar productos para web order/QR de mesas?

*Instrucciones para habilitar productos en la plataforma Web Order y para QR en mesas*

Para publicar en la web de order un producto en dicho producto debe estar marcada la opción publicar en la web, si se quiere modificar múltiples productos para que estén disponibles en la web al editar el archivo de Excel en la columna de publicar en la web coloque los valores en "S" a los productos que quiera que aparezcan el la web.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QI5W7C-C27.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rfJdEEYKws.png)


---

---
title: Recuperar Contraseña En POSBerry
url: https://posberry.tawk.help/article/cómo-puedo-recuperar-mi-contraseña-o-en-caso-de-perderla-que-debo-hacer
---

# Recuperar Contraseña En POSBerry

*Pasos para restablecer y cambiar su contraseña en POSBerry*

**1. Restablecer la contraseña:** Solicite a un usuario con permisos de administrador que restablezca su contraseña. El administrador debe acceder a la web de POSBerry y hacer clic en **Configuración** (ícono de rueda dentada). Seleccione **Operadores** . Encuentre y seleccione el usuario cuya contraseña desea restablecer. Haga clic en **Resetear Contraseña** . Aparecerá un mensaje con la nueva contraseña que deberá usar para iniciar sesión. Haga clic en **Guardar** para confirmar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/E4E9IKj_L2.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gfoVSgvQen.png)

**2. Cambiar su contraseña:** Inicie sesión con la contraseña proporcionada después del restablecimiento. Acceda al menú presionando **CTRL+O** y seleccione **Cambiar Contraseña.** **** Ingrese su contraseña actual en el primer campo y la nueva contraseña en los dos campos siguientes. Haga clic en **💾 Guardar** para completar el cambio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EHw0kWUFoP.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Filtrar Productos por Familias en OrdenAr
url: https://posberry.tawk.help/article/filtrar-por-familias-ordenar
---

# Como Filtrar Productos por Familias en OrdenAr

*Guía para utilizar el filtro de familias y encontrar productos específicos en OrdenAr*

**1.** Toque el menú desplegable que se encuentra sobre el buscador en la pantalla principal.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/D6FcXAh_wh.jpeg)

**2.** Seleccione la familia deseada en la lista del menú desplegable.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hRrKPZK4Ks.jpeg)

Al seleccionar una familia, se mostrarán únicamente los productos pertenecientes a la familia elegida, facilitando la búsqueda y organización de productos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EAmsKOj5JY.jpeg)


---

---
title: Configurar Pinpad de Firserv
url: https://posberry.tawk.help/article/configurar-pinpad-de-firserv
---

# Configurar Pinpad de Firserv

## Esta guía permite configurar inicialmente el Pinpad de Fiserv con la librería Clisitef.

Se tiene que abrir el archivo CliSiTef.ini (que se en encuentra en la carpeta POSBerryApp) con un editor de texto (Por ej. bloc de notas)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JQ60kDaWzu.png)

Y debe configurar el valor asignado en Porta= por el número de puerto COM que esta conectado el Pinpad. En el caso de la imagen es el COM3, entonces debe quedar como Porta=03.

Una vez configurado el puerto COM, inicia POSBerry y accede a la [Configuración], luego a la pestaña [Integraciones]

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/teuqg4mt_c.png)

Pulse el botón Probar dentro de la sección de Fiserv. Y debería tener esta respuesta:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UtFjMKshW0.png)

Finalmente el testigo de Posnet debería quedar debajo de la pantalla. Como se ve en el recuadro rojo de abajo.


---

---
title: Configurar y Usar Impresoras De Comandas en POSBerry Go
url: https://posberry.tawk.help/article/usar-impresora-de-comandas-en-posberry-go
---

# Configurar y Usar Impresoras De Comandas en POSBerry Go

*Guía paso a paso para habilitar y asignar la impresora de comandas en POSBerry Go*

**1.** Toque el **" botón de menú " ☰ (tres líneas)** en la esquina superior izquierda o deslice hacia la derecha en la pantalla para desplegar el menú. **2. ** Seleccione la opción **Configuración.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rG0D7SQZzX.jpeg)

**3.** Seleccione **Configuración** (representada por una rueda dentada) y luego toque **Dispositivos** . **4.** En la sección de dispositivos, seleccione ** Impresoras.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cjowLrrzeV.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lmHSw12XW1.jpeg)

**5. ** Active la opción **"Usar impresora de comanda"** y elija la impresora deseada de la lista. **6. ** Asigne la impresora seleccionada y, para asegurarse de que los tickets se impriman automáticamente, active la opción **"Imprimir comanda al cerrar".**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ttbmymwg-G.jpeg)


---

---
title: Cambiar De Cliente en POSBerry Go
url: https://posberry.tawk.help/article/cambiar-cliente-posberry-go
---

# Cambiar De Cliente en POSBerry Go

*Guía para seleccionar un cliente diferente al realizar una venta*

**1.** Toque el área donde se muestra el **nombre del cliente actual** , ubicada por encima del monto total de la venta. **2.** Se abrirá el **buscador de clientes** , donde podrá visualizar un listado de clientes y un cuadro de búsqueda.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1k_Q6Kvy0v.jpeg)

**3. ** Seleccione el nuevo cliente deseado de la lista o utilice el cuadro de búsqueda para encontrarlo rápidamente. **** **4. ** Una vez seleccionado, el nombre del nuevo cliente aparecerá en la pantalla de ventas, confirmando el cambio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DW5q8zyDXy.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hgfEbygOBo.jpeg)


---

---
title: Guardar Un Pedido En POSBerry Go
url: https://posberry.tawk.help/article/guardar-pedido-en-posberry-go
---

# Guardar Un Pedido En POSBerry Go

*Instrucciones para guardar un pedido y acceder a sus detalles*

**1. Cargue los ítems en la venta.** Asegúrese de agregar todos los productos o servicios que formarán parte del pedido. **2.** Toque el **menú de tres puntos** ubicado en la esquina superior derecha de la pantalla. **3. ** Seleccione la opción **"Guardar nuevo pedido"** y confirme la acción cuando se le solicite.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/t1Bs7GIY9Z.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eUP1PtKBPr.jpg)

**4.** Una vez confirmado, se cargará la pantalla de **Pedidos.** **5. ** Toque en el pedido recién guardado para ver los detalles completos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8njZPnP9Ar.jpg)

**6.** Si desea facturar el pedido, toque la opción con el símbolo **"$"** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/L4bqOHH0FA.jpg)


---

---
title: Editar Clientes POSBerry Go
url: https://posberry.tawk.help/article/editar-clientes-posberry-go
---

# Editar Clientes POSBerry Go

*Pasos para modificar la información de un cliente en POSBerry Go*

**1.** Toque el **" botón de menú " ☰ (tres líneas)** en la esquina superior izquierda o deslice hacia la derecha en la pantalla para desplegar el menú. **2. ** Seleccione la opción **Clientes.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hydXO_agQ5.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UZKF1_5YnX.jpeg)

**3.** En la lista de clientes, elija el cliente que desea editar. **4.** Accederá a la pantalla de edición del cliente. Realice los cambios necesarios en los campos correspondientes. **5.** Una vez finalizadas las modificaciones, toque el botón **💾 ( ** GUARDAR ) ubicado en la parte superior derecha de la pantalla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZmtC7q50sY.jpeg)


---

---
title: Como Cancelar Facturas En POSBerry Go
url: https://posberry.tawk.help/article/¿cómo-cancelar-facturas-en-posberry-go
---

# Como Cancelar Facturas En POSBerry Go

*Guía para realizar la cancelación de facturas y gestionar reembolsos en POSBerry Go*

**1.** Toque el **" botón de menú " ☰ (tres líneas)** en la esquina superior izquierda o deslice hacia la derecha en la pantalla para desplegar el menú. **2. ** Seleccione la opción **Ventas.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LLXIgauif3.jpeg)

**3.** En la pantalla de ventas, localice y seleccione la venta que desea cancelar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XeAzksvSoR.jpeg)

**4.** Toque el botón **Reembolsar** para abrir la pantalla de reembolso. **5.** En la pantalla de reembolso, marque los ítems que desee reembolsar y toque nuevamente en **Reembolsar.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/27CH7yqKjr.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6ocVIboiLJ.jpeg)

**6.** Aparecerá un mensaje de confirmación, toque el boton de **[ ACEPTAR ] ** para confirmar el reembolso

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JhXAd4rLsc.jpeg)

**7.** Regrese a la pantalla de **Ventas** y verifique el reembolso, el cual se mostrará en color rojo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TUXsxheh7y.jpeg)

Realizar la cancelación de una factura o gestionar reembolsos es sencillo y garantiza un control preciso de las transacciones en su punto de venta.


---

---
title: Usar Camara Como Lector De Codigo POSBerry Go
url: https://posberry.tawk.help/article/usar-cámara-como-lector-de-código-posberry-go
---

# Usar Camara Como Lector De Codigo POSBerry Go

*Aprende a configurar y utilizar la cámara de tu dispositivo para escanear códigos en POSBerry Go.*

**1. ** Toque el ícono de menú de tres líneas ** "☰"** en la esquina superior izquierda de la pantalla. **2. ** En el menú desplegable, seleccione la opción **⚙️ Configuración.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Kvc1Tw7yfg.jpeg)

**3.** En la pantalla de configuración, toque la opción **"Escáner"** . Desde allí, podrá habilitar la opción **"Usar cámara como lector de código"** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EclbdmMNLU.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VESV1ljwjJ.jpeg)

**4.** Una vez habilitada, encontrará un ícono de código de barras en la parte derecha de la barra de búsqueda. Al tocarlo, podrá usar la cámara para escanear códigos y añadir productos a la venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mzxBHEShTr.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OnWKhQJ-qv.jpeg)


---

---
title: Nueva familia POSBerry Go
url: https://posberry.tawk.help/article/nueva-familia-posberry-go
---

# Nueva familia POSBerry Go

*Guía paso a paso para añadir una nueva familia en POSBerry Go*

**1. ** Toque el ícono de menú de tres líneas **"☰"** en la esquina superior izquierda de la pantalla. **2. ** En el menú desplegable, seleccione la opción **Familias.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4tIHkvB734.jpeg)

**3.** Una vez en la pantalla de familias, toque el botón naranja con el símbolo **" + ".**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b14PDtpSiu.jpeg)

**4. ** Se abrirá la pantalla de nueva familia. Complete los campos requeridos con la información correspondiente. **** **5. ** Para finalizar, toque el botón de **guardar "💾" ** para crear la nueva familia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/b2oW0YQZTf.jpeg)


---

---
title: Editar Familia POSBerry Go
url: https://posberry.tawk.help/article/editar-familia-posberry-go
---

# Editar Familia POSBerry Go

*Pasos para acceder y modificar la información de una familia.*

**1. ** Toque el ícono de menú de tres líneas **"☰"** en la esquina superior izquierda de la pantalla. **** **2. ** En el menú desplegable, seleccione la opción **Familias.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/G6_8Pwl3-7.jpeg)

**3.** Aparecerá una lista de las familias. Toque la familia que desea editar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mr5Wh9r4oy.jpeg)

**4.  ** En la pantalla de edición, realice los cambios necesarios en los datos de la familia. **** **5. ** Una vez finalizados los cambios, toque el botón de guardar "💾" para confirmar y aplicar las modificaciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dqM9FECc8b.jpeg)


---

---
title: Cambiar De Mesa POSBerry Go
url: https://posberry.tawk.help/article/cambiar-de-mesa-posberry-go
---

# Cambiar De Mesa POSBerry Go

*Instrucciones para cambiar de mesa en POSBerry Go*

**1.** Toque el botón verde en la esquina inferior izquierda de la pantalla. **2.** Se abrirá una lista con las mesas disponibles.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iCjZwKX1ID.jpeg)

**3.** Seleccione la mesa a la que desea cambiar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jv12XwnRe-.jpeg)

Este proceso le permite gestionar los pedidos de manera más eficiente y optimizar la asignación de mesas en su negocio.


---

---
title: PIN de autorización: ¿Qué es y para qué sirve?
url: https://posberry.tawk.help/article/pin-de-autorización-¿qué-es-y-para-qué-sirve
---

# PIN de autorización: ¿Qué es y para qué sirve?

*Aprende sobre el PIN de autorización, su propósito y cómo configurarlo.*

El PIN de autorización, conocido en POSBerry como Código de Supervisor, es un código que permite restringir ciertas acciones del usuario, como eliminar renglones en una venta o limpiar la venta. Cuando un usuario intenta realizar alguna de estas acciones, aparecerá un mensaje solicitando la entrada del código. Este código se puede configurar en la sección de Operadores en la plataforma web y debe ser un número de al menos 4 dígitos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Y5uZWCoEua.png)

a la hora de eliminar un renglón de venta, vera esto en pantalla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qG8Rp-IkW6.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Cómo Realizar Una Copia De Seguridad (backup) De Los Datos En POSberry
url: https://posberry.tawk.help/article/como-hacer-copia-de-seguridad-backup-de-los-datos
---

# Cómo Realizar Una Copia De Seguridad (backup) De Los Datos En POSberry

*Aprenda a respaldar la información de su negocio en el sistema desktop de POSberry*

**1.** **Acceda a la configuración:** Vaya a Opciones Seleccione Configuración **2.** **Realice el backup local:** Haga clic en el botón **[** **Ahora ] ** Esto creará una copia de seguridad en su computadora

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gaMZdpS7WY.jpeg)

**3. Respalde en un disco externo:** Conecte el dispositivo de almacenamiento externo Haga clic en el botón **[ Externo ]**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WBU0JhNhWp.jpeg)

Seleccione el disco donde desea guardar el backup. Presione "Copiar" para iniciar el proceso.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5AhqriRRrG.png)

NOTA: Se deben revisar siempre el PenDrive/Disco Externo contenga los archivos copiados. Para terminar de confirmar que el proceso de copia fue exitoso.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Cambio de Punto de Venta en POSBerry
url: https://posberry.tawk.help/article/como-cambiar-de-punto-de-venta
---

# Cambio de Punto de Venta en POSBerry

*Guía para cambiar o reemplazar un punto de venta*

**IMPORTANTE:** Antes de comenzar, asegúrese de sincronizar los datos, realizar un respaldo (backup) y contar con acceso al usuario ADMIN.

**1. ** Sincronice sus datos y realice un backup. **** **2. ** Cierre sesión en la aplicación. **** **3. ** Acceda a la versión web y desvincule el punto de venta actual. Si necesita ayuda para desvincular un punto de venta, consulte [este artículo](https://posberry.tawk.help/article/como-desvincular-un-punto-de-venta) . **** **4. ** Elimine el punto de venta. Para más detalles sobre cómo realizar este proceso, consulte [este artículo](https://posberry.tawk.help/article/%C2%BFcomo-realizar-una-limpieza-de-punto-de-venta) . Es importante verificar nuevamente la sección de vinculación para evitar configurar el mismo punto de venta que se limpió.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IGFgEfl-cF.jpeg)

**Al inicializar por primera vez** (solo accesible con usuario ADMIN): Puede aparecer una ventana para seleccionar el nuevo punto de venta. Elija el punto deseado y permita que el sistema continúe cargando. Este proceso puede tardar dependiendo de la velocidad de su conexión a Internet, ya que descargará todos los datos de su empresa desde la web. Al finalizar, el sistema se cargará automáticamente.

**NOTA: ** Si aparece un mensaje de **ERROR AL INICIALIZAR** , intente realizar el proceso de nuevo.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Guardar y Visualizar un Delivery en POSBerry Go
url: https://posberry.tawk.help/article/guardar-delivery-en-posberry-go
---

# Guardar y Visualizar un Delivery en POSBerry Go

*Instrucciones para registrar y consultar un pedido de delivery en POSBerry Go*

**1.** Cargue los productos de la venta en la pantalla principal. **2.** Toque el **menú de tres puntos "⁝"** en la parte superior derecha y seleccione **💾 Guardar nuevo delivery.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8XB9CCH7PX.jpg)

**3.** En la pantalla emergente, confirme la acción tocando **[ACEPTAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2n6B4cLP6C.jpg)

**4. ** Para visualizar el delivery guardado, acceda al **menú principal** y seleccione **Delivery** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Cnih12e_H9.jpg)

**5.** Busque el cliente al que se asignó el delivery e ingrese en su perfil para ver los detalles.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8eprmkyGll.jpg)

**6.** Toque la opción **$** para facturar el pedido.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9VP-zEkdQ7.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iVVgfccitZ.jpg)


---

---
title: Nuevo Operador
url: https://posberry.tawk.help/article/nuevo-operador
---

# Nuevo Operador

*Como crear nuevo operador*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aPsD3rJXjA.png)

Para crear un nuevo operador, siga estos pasos: 1. Haga clic en el botón [Configuración] que se parece a una rueda dentada. 2. Seleccione la opción [Operadores] en el menú de la izquierda. 3. Haga clic en [NUEVO] para agregar un nuevo operador. 4. Complete los campos con la información del nuevo operador. El campo Rol determina los permisos del usuario y los campos Nombre y Apellido corresponden a la identificación del personal. 5. El campo Operador es el nombre de usuario que utilizará para iniciar sesión y no debe ser el mismo que otros usuarios. 6. Asegúrese de ingresar una dirección de correo electrónico distinta en el campo E-Mail y una contraseña segura que debe ingresarse dos veces. 7. Guarde el operador haciendo clic en [GUARDAR]. También, recuerde que al crear un nuevo usuario, el nombre de usuario debe ser único y debe incluir el nombre de la empresa. Por ejemplo, si la empresa es "supermarket" y el usuario es "juan", el nombre de usuario será "juan@supermarket". La contraseña se establece al crear el usuario y se utilizará para iniciar sesión.


---

---
title: Nuevo movimiento De Caja En POSBerry Go
url: https://posberry.tawk.help/article/nuevo-movimiento-de-caja-posberry-go
---

# Nuevo movimiento De Caja En POSBerry Go

*Pasos para agregar un movimiento de caja en la versión móvil de POSBerry*

**1.** Toque el **" botón de menú " ☰ (tres líneas)** en la esquina superior izquierda o deslice hacia la derecha en la pantalla para desplegar el menú. **2. ** Seleccione la opción **Nuevo Movimiento de caja.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/W4s13-u1q-.jpg)

**1.** En la pantalla de movimiento de caja, ingrese el **Tipo de Movimiento** , el **Monto ** y una **Observación.** **2.** Toque el botón **[GUARDAR]** para finalizar el registro.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cbHUvtk5Vr.jpg)


---

---
title: Cambiar lista de precios POSBerry Go
url: https://posberry.tawk.help/article/cambiar-lista-de-precios-posberry-go
---

# Cambiar lista de precios POSBerry Go

Para utilizar otra lista de precios toque el botón del menú de tres puntos ubicado en la parte superior derecha y toque la opción de lista de precios al hacerlo deberá aparecer un texto en pantalla indicando la lista de precio que estará actualmente vigente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/GjjBnE45-C.jpg)


---

---
title: Añadir un Nuevo Cliente en POSBerry Go
url: https://posberry.tawk.help/article/nuevo-cliente-posberry-go
---

# Añadir un Nuevo Cliente en POSBerry Go

*Pasos para registrar un cliente en POSBerry Go de forma rápida y sencilla*

**1.** Toque el **" botón de menú " ☰ (tres líneas)** en la esquina superior izquierda o deslice hacia la derecha en la pantalla para desplegar el menú. **2. ** Seleccione la opción **Clientes.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/43dlqn4ajb.jpg)

**3.** En la pantalla de clientes, toque el **botón naranja [+]** ubicado en la parte inferior derecha.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wHn6Vgizpw.jpg)

**4.** Complete los datos del nuevo cliente en la pantalla que aparece. **5.** Toque el icono **💾 (GUARDAR)** para guardar la información.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bb20oD23W5.jpg)


---

---
title: Crear un Nuevo Producto en POSBerry Go
url: https://posberry.tawk.help/article/nuevo-producto-posberry-go
---

# Crear un Nuevo Producto en POSBerry Go

*Cómo añadir un producto en POSBerry Go de forma rápida y sencilla*

**1.** Toque el **" botón de menú " ☰ (tres líneas)** en la esquina superior izquierda o deslice hacia la derecha en la pantalla para desplegar el menú. **2. ** Seleccione la opción **Productos.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KfjLisVd5G.jpg)

**3.** En la pantalla de Productos, toque el **botón naranja [+]** ubicado en la parte inferior derecha.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XKnhE10o8R.jpg)

**4.** Complete la información requerida, como detalles del producto, precio y opciones adicionales. **5.** Toque el ícono **💾 (GUARDAR)** para guardar la información del nuevo producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/92hqvEpsYY.jpg)


---

---
title: Limpiar Una Venta en POSBerry Go
url: https://posberry.tawk.help/article/limpiar-la-venta-en-posberry-go
---

# Limpiar Una Venta en POSBerry Go

*Cómo reiniciar la pantalla de ventas en POSBerry Go de manera rápida*

**1. ** Toque el **botón de tres puntos " ⁝ "** en la esquina superior derecha de la pantalla. **** **2. ** Seleccione la opción **Limpiar venta.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YalPhwJ2pQ.jpg)

**3.** Confirme la acción tocando el botón **[ACEPTAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qKgv0uy7WZ.jpg)


---

---
title: Iniciar sesión en POSBerry Go
url: https://posberry.tawk.help/article/iniciar-sesión-en-posberry-go
---

# Iniciar sesión en POSBerry Go

*Guía para acceder a POSBerry Go de manera rápida y sencilla*

**1. Datos de Usuario:** Introduzca su **usuario y contraseña** de la misma manera que en la versión de escritorio de POSBerry. **2. Función de Recordatorio:** Para un acceso más rápido en el futuro, marque la casilla **"Recordar equipo"** . Esto permitirá que el sistema guarde su usuario y contraseña, iniciando sesión automáticamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Luc5fwCZI_.jpg)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Filtrar Productos Por Familia en POSBerry Go
url: https://posberry.tawk.help/article/filtrar-por-familia-posberry-go
---

# Filtrar Productos Por Familia en POSBerry Go

*Cómo seleccionar y buscar productos por familia en POSBerry Go*

**1.** Toque en   " **⁝ ☰ Todas las familias " ** , podrá ver el menú desplegable con todas las familias.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CRflD0O30z.jpg)

**2.** Seleccione la familia que desee. ( ej. **8.1 COCINA ** )

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jDgWsbrFXA.jpg)

**3.** Al realizar una búsqueda, solo se mostrarán los productos que pertenecen a la familia seleccionada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ujeRKMQDRq.jpg)


---

---
title: Como Realizar Una Venta En POSBerry Go
url: https://posberry.tawk.help/article/realizar-una-venta-posberry-go
---

# Como Realizar Una Venta En POSBerry Go

*Pasos sencillos para cargar productos y completar una venta en POSBerry Go.*

**1. Cargar Productos:** Utilice el **buscador** para agregar los productos. Puede escribir el nombre del producto directamente desde el teclado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SXYpYdyzn7.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/L2aOP9azlx.jpg)

**2. Editar Productos:** Haga clic en el producto cargado para: **Ajustar la cantidad.** **Aplicar descuentos.** **Modificar el precio.** **Eliminar el producto.** **Agregar comentarios.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dvEo-sIHz-.jpg)

**3. Seleccionar Medio de Pago:** utilizando el boton **"PANT. COBRO "** podra elegir el medio de pago preferido o utilice el botón **“COBRO RÁPIDO”** para procesar un pago en efectivo rápidamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/18RbgT9U8Y.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/n-0bler8Y0.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/k-q5LA9eD7.jpg)


---

---
title: Etiquetas de Oferta
url: https://posberry.tawk.help/article/etiquetas-de-oferta
---

# Etiquetas de Oferta

*Imprimir etiquetas que tengan un icono de oferta*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8JSCheysxu.png)

**1. Seleccionar el Producto:** Busque el producto que desea poner en oferta. **2. Marcar como Oferta:** Haga clic en la casilla de verificación **'Oferta'.** Guarde los cambios seleccionando el botón **[Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OZfILb2rqx.png)

**3. Impresión de Etiquetas:** Al imprimir etiquetas, puede aplicar un filtro para mostrar solo los productos marcados en oferta. Los formatos de etiqueta compatibles con el icono de oferta incluyen: **A4 autoadhesivo, 80mm, 80mm grande, 64, 57, 56, 30, 24, 16, 8, Precio 1 y 2, y 40.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_TB-PAzYJS.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Cómo Gestionar El Plan De Compras
url: https://posberry.tawk.help/article/plan-de-compras
---

# Cómo Gestionar El Plan De Compras

*Estime las cantidades de productos a comprar según stock mínimo y días de stock*

**1. Acceder al Plan de Compras** En la web, ingrese a **[Compras] -> [Plan de Compras].** **2.Seleccione el depósito** Elija el depósito del cual desea realizar la consulta. Ejemplo: "Punto de Venta 2" (o el nombre del depósito que corresponda).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3_D-DT0H__.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/S-I1ZrEy95.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yjdxaSHIbu.png)

**3.** **Configurar stock mínimo o días de stock** En **[Plan de Compras]** , puede seleccionar entre **[Días de Stock]** o **[Stock Mínimo]** para que el sistema calcule la cantidad recomendada de productos a comprar: **[Días de Stock]** : Estima el tiempo que debe haber suficiente inventario. **[Stock Mínimo]** : Es el número mínimo de productos que debe haber antes de reponer. **4. Filtrar por proveedor o familia** Si lo desea, puede filtrar los productos por proveedor, o seleccionar **[Solo esta Familia]** para limitar la lista de productos a una familia específica. También puede buscar un producto por nombre o código usando el buscador. **5. Interpretar el listado de productos** El listado mostrará los productos, su stock actual, ventas realizadas, y al final, el **[Stock a Reponer]** , que indica la cantidad a comprar. **Número negativo** : El producto tiene unidades sobrantes. **Número positivo** : Es necesario realizar una compra. **6. Descargar listado ** Puede descargar el listado en Excel para su consulta. ****

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3WCV_yMYjU.png)

## Como funciona el Plan de Compras por días de stock?

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/q4bMEPD74E.jpeg)

7. **Ejemplo de cálculo del plan de compras** Supongamos que en la Tienda X el sistema estima lo siguiente para el producto **VR COCA COLA 1.5L:** **Stock actual** : 68 unidades **Promedio de ventas diarias** : 10.03 unidades en los últimos 30 días **Stock mínimo** : 16 unidades **Días de stock asignados** : 3 días **Cálculo:** Stock actual - ((Días de stock * Cantidad vendida por día) + Stock mínimo) = 68 - ((3 * 10.03) + 16) = 21.90 unidades sobrantes.

## Configurar Stock Mínimo y Días de Stock para cada producto

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/GGkRb0x8nZ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4pjgqpakCN.png)

Vaya a **[Productos] ("bolsa de compras").** Busque el producto y haga clic en el **ícono de lápiz** para editarlo. Modifique los valores de **[Stock Mínimo] y [Días de Stock]** según sus necesidades. Haga clic en **[Guardar]** para que el sistema utilice estos valores en el plan de compras.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Hacer Un Pedido Desde La Web Order Utilizando Qr De Mesas
url: https://posberry.tawk.help/article/¿como-usar-un-menu-qr-para-las-mesas
---

# Como Hacer Un Pedido Desde La Web Order Utilizando Qr De Mesas

*Guía para usar el menú de pedidos mediante QR en mesas*

**1. Crear el QR de Mesa:** Haga clic en el botón de **Mesas ** o aprete la tecla **F9** **.** En el panel de mesas, seleccione el botón **QR** en la esquina superior derecha. Aparecerá una ventana para imprimir el código QR correspondiente a cada mesa.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LBC5sYJwIB.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qloACFvslR.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OpOCtQHbL8.png)

**2. Escanear el QR y Realizar el Pedido:** El cliente debe escanear el código QR con su dispositivo para acceder al menú de la Web Order. En la Web Order, el cliente seleccionará los productos y hará clic en **Enviar Pedido.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VG3Tr6XMmS.png)

**3. Verificar y Editar Pedido:** Al enviar el pedido, aparecerá un panel de la mesa con los productos seleccionados. Aquí, el cliente puede: Agregar más productos al pedido. Añadir un nombre y una observación al pedido. Eliminar algún producto si es necesario.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BiAlbDaAW0.png)

**4. Confirmar y Enviar el Pedido:** Cuando el cliente esté listo, debe hacer clic en **Enviar Pedido** y confirmar la acción. Una vez enviado, el pedido se reflejará automáticamente en el punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cR514rW9yi.png)

Para hacer un nuevo pedido, el cliente puede seleccionar la opción **Hacer Otro Pedido.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KqFnOdF1vr.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3BXveoQR6N.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Configuracion General (PC)
url: https://posberry.tawk.help/article/configuración-general-pc
---

# Configuracion General (PC)

*Instrucciones para personalizar la apariencia y opciones generales del sistema en PC*

**1.** Presione **[CTRL+O]** y seleccione **[Configuración]** en el menú, o haga clic directamente en el botón de opciones en la parte superior derecha de la pantalla.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Y6pgx_77t4.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Zbqq2S8xOA.png)

**2.** En la pestaña **[General]** , encontrará opciones para: **Apariencia: ** personalice la interfaz visual de POSBerry. **Backup automático:** active la copia de seguridad automática o realice una manual presionando **[Ahora]** . También puede configurar permisos para eliminar datos o copias antiguas y programar el horario de backup. **Panel de Navegación y Mesas:** seleccione las opciones de visualización del panel y las mesas según sus necesidades. **Productos Pesables:** configure los códigos de productos pesables para impresión, como el inicio de código y otros detalles. **Parámetros del Punto de Venta:** active o desactive opciones de productos, habilite la pantalla de cocina y seleccione el punto de venta. La mayoría de estas opciones solo se modifican desde la web. **Otros permisos:** ajuste permisos específicos según sus preferencias. **5.** Para guardar los cambios, haga clic en **[ GUARDAR ].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pCeNl3Fwk5.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Pantalla de Cocina Virtual KVS (Kitchen Virtual State)
url: https://posberry.tawk.help/article/kvs-kitchen-virtual-state
---

# Pantalla de Cocina Virtual KVS (Kitchen Virtual State)

*Uso de la pantalla de cocina para gestionar y actualizar el estado de pedidos en tiempo real.*

Si su empresa tiene contratado KVS puede visualizar y modificar el estado de los pedidos de las mesas y los pedidos de delivery. KVS funciona en el navegador web de su preferencia y se accede mediante la red local. Con KVS puede saber hace cuanto tiempo se realizó un pedido, que se pidió, si esta pendiente, en preparación ó listo para entregar al cliente en todo momento.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cyGmsqv0bA.png)

**1. Acceso a KVS:** Para ingresar a la pantalla de KVS, debe hacer clic en **[ CTRL+O ] ( menu )** luego en **"acerca de". ** **** En la ventana de información, haga clic en **Servicios** y luego en el enlace de **Pantalla de Cocina.** Esto abrirá KVS en el navegador.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6FkFAiSGmQ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tR4N0PRudk.png)

Una vez hecho clic se abrirá en el navegador la ventana de KVS.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oPPfMhdqdN.png)

**2. Visualización en la pantalla de KVS:** **Arriba a la izquierda:** Información del clima. **Centro superior:** Filtro de tiempo que permite mostrar pedidos generados dentro de un tiempo específico. **Arriba a la derecha:** Fecha y hora actuales. **3. Pedidos de Mesas y Delivery:** Los pedidos de mesas están identificados como "Mesa" junto al número de mesa. Los pedidos de delivery están etiquetados como "Delivery a Consumidor Final" junto al nombre del cliente. Cada pedido muestra al mesero o vendedor que lo cargó y presenta una tabla con información de productos solicitados, que incluye: **Cantidad:** Número de unidades pedidas. **Nombre:** Descripción del producto. **Tiempo:** Tiempo desde que se realizó el pedido. **Estado:** Fase en la que se encuentra el pedido (Pendiente, En Preparación, o Preparado)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KUTqDajr6V.png)

**4. Cambiar el Estado de un Pedido:** Para actualizar el estado de un pedido, seleccione el botón **Cambiar Estado** del pedido correspondiente (mesa o delivery). En el menú desplegable, elija entre **Pendiente, En Preparación** , o Preparado. El cambio se reflejará instantáneamente en la pantalla.

## Estados de un pedido:

Los estados pueden ser " **Pendiente** ", " **En Preparación** " y " **Preparado** ". **Pendiente:** indica que el pedido solo ha sido cargado en el sistema. **En Preparación:** indica que el pedido ya se está preparando para el cliente. **Preparado:** indica que el pedido ya esta listo y se puede entregar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6u2WpOm4Ek.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en [TutorialesPosberry](https://www.youtube.com/@posberry9300) .


---

---
title: Configuración De Mercado Pago Point Smart
url: https://posberry.tawk.help/article/mercado-pago-point-smart
---

# Configuración De Mercado Pago Point Smart

*Pasos para sincronizar y configurar el dispositivo Point Smart como método de pago.*

Para configurar el dispositivo Mercado Pago Point Smart como método de pago en POSBerry, siga estos pasos: **1. Ingrese a su cuenta en POSBerry** y acceda a la página de configuración. **Nota:** Si no ha configurado las credenciales de Mercado Pago, consulte esta guía: [Obtener credenciales de Mercado Pago](https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculaci%C3%B3n-con-posberry) **.** **Nota:** Si no ha asociado el dispositivo a una sucursal y caja, consulte esta guía: [Asociar Sucursal y Caja a Point Smart](https://posberry.tawk.help/article/como-asociar-una-sucursal-y-caja-para-los-dipositivos-point-plussmart) **.** **** **2. ** Sincronice el sistema de punto de venta y acceda a las opciones de configuración.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mPCQba0pQN.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wUkhEQ0PNS.png)

**3. Actualice la lista de dispositivos:** Haga clic en el botón de refrescar (Paso 1 en la imagen). Verá una lista de los dispositivos Point Plus y Point Smart vinculados a su cuenta de Mercado Pago. **4. Seleccione el dispositivo Point Smart:** Seleccione el dispositivo Point Smart ( **suelen comenzar con PAX_ y los últimos números, es el número de serie del equipo** ) que va a utilizar en la caja que está configurando en este momento. Si tiene más de un equipo en su cuenta, como en la imagen, los últimos números del nombre corresponde al número de serie del Point Smart, para identificarlo mire detrás del Point Smart, hay un código de barras que dice S/N, **los últimos 8 dígitos deben corresponder al que se selecciona de la lista.** **5. Guarde la configuración** presionando el botón [GUARDAR]. **6. Reinicie el dispositivo Point Smart** para que tome los cambios y confirme que está vinculado al punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jPj7DtySsc.png)

**7. Verificación:** Una vez configurado, el sistema mostrará **"Mercado Pago Point Smart" ** como una opción de pago al momento de **[Cobrar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/foJg-eGalz.png)


---

---
title: Como Contactar Con El Equipo de Soporte
url: https://posberry.tawk.help/article/como
---

# Como Contactar Con El Equipo de Soporte

*Formas rápidas y efectivas para recibir asistencia en POSBerry.*

En POSBerry, estamos comprometidos en ofrecerte soporte para que tu experiencia con nuestra plataforma sea excelente. Si necesitas asistencia técnica o tienes dudas sobre su uso, aquí te mostramos las formas de contactar a nuestro equipo de soporte: **1. WhatsApp - Asistencia Inmediata:** **** Para una atención rápida y directa, puedes comunicarte con nuestro equipo de soporte a través de WhatsApp. Simplemente envía un mensaje al número **+54 9 3794 766752** y uno de nuestros especialistas te asistirá en lo que necesites. Este canal es ideal para resolver dudas urgentes y obtener respuestas en tiempo real. Puedes mandar mensajes de textos o mensajes de audio. Este número no puede recibir llamadas. **2. Correo Electrónico: Soporte Detallado** **** Si prefieres detallar tu consulta o problema, también puedes escribirnos un correo electrónico a soporte@posberry.com . Este canal es perfecto para solicitudes que requieren una explicación más extensa o para enviar documentación adicional. Nuestro equipo se encargará de responderte con la mayor brevedad posible, brindándote la solución más adecuada. **3. Tawk ( En linea): Soporte en linea** **** desde esta pagina, busque el botón verde **" en linea" ** haga clic en el y podrá ver el chat para conversar con nosotros en la pantalla emergente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/usWIzCLIjZ.png)

**4. Horario de Atención:** **** Soporte disponible de **lunes a viernes, de 9:00 a 21:00** (hora de Argentina). No atendemos durante feriados nacionales de Argentina.

Gracias por leer este instructivo 😁.


---

---
title: Tipos de GiftCard
url: https://posberry.tawk.help/article/tipos-de-giftcard
---

# Tipos de GiftCard

*Guía para crear y personalizar los diferentes tipos de GiftCards desde la web*

**1. Descripción de los Tipos de GiftCards:** Las GiftCards permiten a los clientes canjear sus puntos acumulados en beneficios específicos. Los tipos disponibles son: **Monto:** Un valor monetario fijo. **Porcentaje:** Un porcentaje aplicado al total de la venta. **Producto:** Unidades específicas de un producto. **2. Crear un Nuevo Tipo de GiftCard:** En el menú, haz clic en el icono de regalo **🎁 [GiftCards].** Haz clic en el botón **[Nuevo Tipo GiftCard].** **3. Seleccionar Tipo de GiftCard:** Elige entre **Monto, Porcentaje o Producto.** **4. Configurar el Valor:** Ingresa el monto, porcentaje, o selecciona el producto y cantidad de unidades. **5. Definir Puntos de Fidelización:** En **Puntos de Fidelización** , especifica los puntos necesarios para canjear esta GiftCard. **6. Establecer la Validez:** Configura la cantidad de días en que la GiftCard será válida desde su emisión. **(Escribe "0" para que no tenga vencimiento).**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DOeFh4zvxh.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: GiftCards desde la web
url: https://posberry.tawk.help/article/giftcards
---

# GiftCards desde la web

*Cómo consultar y administrar GiftCards de clientes desde la plataforma web de POSBerry.*

**1. Acceder a la sección de GiftCards:** En el menú, haz clic en el icono de regalo **🎁 [GiftCards]** . **2. Visualizar clientes con puntos acumulados:** En la pestaña **GiftCards** , se mostrará un listado de los clientes que tienen puntos disponibles.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1WE_EZcrPT.png)

**3. Consultar movimientos de puntos:** Haz clic en el botón **[Movimientos]** para ver un historial de ventas que acumulan puntos y los canjes realizados que restan puntos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QVI-gPWnV5.png)

**4. Ver listado de GiftCards por cliente:** Al hacer clic en **[GiftCards],** podrás ver las GiftCards de cada cliente, su estado de uso y la fecha de vencimiento de cada tarjeta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/76lGlZOVZl.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Consultar y Canjear GiftCards De Manera Local
url: https://posberry.tawk.help/article/fidelización-ver-y-canjear-giftcards-en-desktop
---

# Consultar y Canjear GiftCards De Manera Local

*Instrucciones para canjear GiftCards y consultar puntos de fidelización de manera local*

**1. Acceder a la sección de canje de puntos:** En el menú, ve a **[Ventas]** y selecciona **[Canjear Puntos].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yTb9rxUy1i.jpg)

**2. Seleccionar cliente y realizar el canje:** Escoge al cliente en la lista y haz clic en **[Canjear].** Selecciona la GiftCard a utilizar y haz clic en **[Canjear]** . Automáticamente volverás a la ventana anterior, donde se mostrarán los puntos restantes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UgYQYUHmvh.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/r3qSv8Og4c.jpg)

**3. Consultar GiftCards canjeadas:** Para ver un historial de GiftCards ya canjeadas, haz clic en **[Ver GiftCards].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BWPsVu2m5N.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fXVhtFatGA.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Stock en Fecha
url: https://posberry.tawk.help/article/stock-en-fecha
---

# Stock en Fecha

*Cómo revisar y descargar el stock disponible en una fecha seleccionada.*

**1. Acceder a la sección de stock por fecha:** En la web de POSBerry, haz clic en **[Stock]** y luego selecciona **[Stock en Fecha].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Tdnl3_7iYM.png)

**2. Cargar el listado de stock:** Haz clic en el botón **[Recargar] ** en la parte superior derecha para cargar los datos. **3. Visualizar y filtrar el listado:** Los productos aparecerán en un listado en la parte inferior de la página. Puedes filtrar los productos utilizando el buscador ubicado arriba de la lista. **4. Ver detalles de un producto:** Para consultar información adicional sobre un producto, haz clic en el botón **[Información]** junto al producto deseado. **5. Descargar el listado de stock:** Puedes descargar el listado en el formato que prefieras seleccionando **[En Excel] o [PDF].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-2Z-ybD_-x.png)

**En formato Excel.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eZqx54WpUX.png)

**En formato PDF.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oEtmX5uajS.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Movimiento de Stock (Web)
url: https://posberry.tawk.help/article/movimiento-de-stock-web
---

# Movimiento de Stock (Web)

**1. Acceder a los movimientos de stock:** En la web de POSBerry, haz clic en 📦 **[Stock]** y luego selecciona **[Movimientos de Stock].** **2. Configurar filtros de búsqueda:** Elige el rango de fechas y selecciona la sucursal deseada (o elige ver todos los movimientos de todas las sucursales). **3. Actualizar datos:** Haz clic en el botón 🔄 **[Recargar]** en la esquina superior derecha para traer los datos actualizados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JG0I985IZU.png)

**5. Ver detalles de un movimiento específico:** Al seleccionar un movimiento en particular, verás sus detalles en la tabla **"Detalle del Movimiento".** **** Puedes descargar estos detalles también en Excel haciendo clic en **[En Excel].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-PDD0rHkap.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/P8dX2oN0V6.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Ajuste de Stock a Cero para Uno o Más Productos
url: https://posberry.tawk.help/article/como-dejar-en-0-el-stock-de-uno-o-mas-productos
---

# Ajuste de Stock a Cero para Uno o Más Productos

*Cómo dejar el stock en cero mediante el uso de un archivo Excel de inventario.*

**1. Descargar el inventario:** Ingresa a la web de POSBerry y selecciona 📦 **[Stock]** (ícono de caja de madera). Haz clic en **[Inventario]** para acceder a la lista completa de productos. Sincroniza los datos para que el inventario esté actualizado. Descarga el archivo Excel del inventario para hacer los cambios necesarios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AxNwma0MlI.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qMG8B6F-7U.jpeg)

**2. Modificar el archivo Excel:** En el archivo Excel, localiza las columnas **STOCK** y **STOCK FÍSICO** de los productos que deseas ajustar. Cambia el valor a **0 ** para los productos que necesitas dejar en cero.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bDuQt_qNfX.jpeg)

**3. Subir el inventario actualizado:** Regresa a POSBerry, en la sección de **[Stock].** Selecciona **[Inventario]** y haz clic en **[Subir Inventario].** Selecciona el archivo Excel editado presionando **[Seleccionar archivo]** y cárgalo. Espera a que el archivo se procese y revisa los cambios de stock. **4. Guardar cambios:** Confirma los ajustes en el sistema para que se apliquen correctamente.

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Aplicar una GiftCard
url: https://posberry.tawk.help/article/aplicar-una-giftcard
---

# Aplicar una GiftCard

*Guía para aplicar una GiftCard en una venta en Posberry.*

**1. Seleccionar al cliente:** Elige el cliente al que deseas aplicar la GiftCard desde la lista de clientes. **2. Acceder a la opción de GiftCard:** Presiona **CTRL + O** y navega a **Ventas > Aplicar Código de GiftCard.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RXQqun_yVQ.png)

**3. Ingresar el código de la GiftCard:** Introduce el código de la GiftCard del cliente seleccionado. Si se aplica correctamente, recibirás el mensaje: **"GiftCard aplicada correctamente. Solo se puede usar en esta venta; no limpie la venta ni cambie el cliente antes de cobrar, o la GiftCard se perderá."**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DTMBocQOFj.png)

**4. Confirmar productos (si aplica):** Si la GiftCard es para productos específicos, el sistema te preguntará si deseas añadir los productos a la venta. Haz clic en **Aceptar** solo si no los cargaste previamente. Si los productos ya están cargados, selecciona **Cancelar. **

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9m6ma8BDB-.png)

**5. Finalizar la venta:** Al cobrar, verás una nota indicando la GiftCard aplicada y el monto bonificado (por ejemplo, GiftCard $1.000,00). Tras completar la venta, verifica que el movimiento de caja refleje la transacción con la condición de pago **GIFTCARD** y el código utilizado entre paréntesis.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WvFPWOQG7H.png)

**6. Consultar en Cierre del Día:** En la sección de **Cierre del Día** , podrás revisar las ventas realizadas con GiftCards.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/buziR04g_B.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Imprimir Etiquetas (Códigos de Barra)
url: https://posberry.tawk.help/article/imprimir-etiquetas-códigos-de-barra
---

# Imprimir Etiquetas (Códigos de Barra)

*Guía para imprimir etiquetas con códigos de barra para tus productos desde Posberry.*

**1. Acceder al listado de productos:** Haz clic en **[Opciones]** , navega hasta **[Stock]** , y selecciona **[Listado de Productos]** . **2. Filtrar productos para imprimir:** Usa las herramientas de búsqueda para seleccionar los productos específicos de los que deseas imprimir etiquetas. **3. Configurar la impresión:** En la esquina superior derecha de la ventana, selecciona la impresora y el formato de impresión deseado. **4. Imprimir etiquetas:** Una vez configurado, haz clic en **[Imprimir].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BlNE-1UbNd.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Realizar un Ajuste en la Caja
url: https://posberry.tawk.help/article/ajuste-de-caja
---

# Realizar un Ajuste en la Caja

*Guía para ajustar montos en la caja desde el reporte de caja.*

**1. ** Haz clic en **[Caja]** y selecciona **[Reporte de Caja].** **** **2. ** Ingresa la **fecha inicial, fecha final** y selecciona la **sucursal** . Luego, haz clic en **[🔄 Recargar]** para actualizar la información.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PpX5S6MtmS.png)

**3. ** En la sección de caja, verás detalles como fechas de inicio y cierre junto con los totales. **** **4. ** Para ajustar un ítem específico, haz clic en **[✏️ Editar]** a la derecha del mismo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sfqS6QpkBh.png)

**5. ** Escribe el **monto** a ajustar (positivo o negativo) y una **Observacion** **razón del ajuste.** **** **6. ** Haz clic en **[Guardar]** para aplicar el ajuste.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sQ3tdl5TrT.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Editar Proveedor Desde La Web
url: https://posberry.tawk.help/article/editar-proveedor-web
---

# Editar Proveedor Desde La Web

*Instrucciones para localizar y modificar los datos de tus proveedores registrados.*

**1. ** Haz clic en **[Compras] 🛍️** y selecciona ** [Proveedores].** **** **2. ** Utiliza el **buscador** para encontrar el proveedor que deseas editar. **** **3. ** Para modificar los datos del proveedor, haz clic en el botón **[✏️]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sU5lfqqWMb.png)

4. Realiza los cambios necesarios en los campos correspondientes y, para finalizar, haz clic en el botón **[OK]** para guardar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BGrVugeoXN.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Ver Proveedores Desde La Web
url: https://posberry.tawk.help/article/ver-proveedores-web
---

# Ver Proveedores Desde La Web

*Aprende cómo buscar y visualizar la información de tus proveedores registrados en el sistema.*

**1. ** Haz clic en **[Compras]** (🛍️) y selecciona **[Proveedores]** . **** **2. ** Utiliza el **buscador** para encontrar proveedores específicos según sea necesario.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XDHNOuxJSp.png)

**3. ** Para ver los datos completos de un proveedor, haz clic en el botón [ℹ️].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tkC9jdLsbG.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IyL2m1Jjx1.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Utilizar Opcionales y Adicionales
url: https://posberry.tawk.help/article/opcionales-y-adicionales
---

# Como Utilizar Opcionales y Adicionales

*Instrucciones para agregar y gestionar opcionales y adicionales en productos o recetas.*

## ¿Qué son los opcionales y cómo se utilizan?

Los **Opcionales** (disponibles solo para productos o recetas) son insumos que se venden junto con un producto o receta y se descuentan del stock al momento de la venta. Para agregar un opcional a un producto o receta: **1.** Seleccione el producto o receta. **2.** Haga clic en el botón **[🖊️] (editar producto).**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/86pPY6fHgQ.png)

**3.** En el panel de edición, en la parte superior, verá las opciones de **opcionales y adicionales** . Haga clic en la opción que desea agregar o modificar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RcyhtdCPaa.png)

**4.** Verá los opcionales ya asignados al producto, su cantidad y si están activos. **5.** Use el buscador para agregar el insumo deseado. **6.** Para cambiar la cantidad, haga clic en la cantidad y ajuste el valor. **7.** Finalmente, haga clic en **[GUARDAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8ul1f3JWHx.png)

Si el producto está cargado en el panel, los opcionales y adicionales se mostrarán de inmediato. De lo contrario, aparecerá una opción para editarlos directamente en el producto cargado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YCBQbUdjI0.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ePIAfCno2B.png)

## ¿Qué son los adicionales y cómo se utilizan?

Los **Adicionales** (solo para productos o recetas) son insumos que también se venden junto con un producto o receta, pero se agregan desde el cuadro de diálogo de opcionales y adicionales. Al hacerlo, se crea un nuevo renglón en la venta y el stock se actualiza como en cualquier otra venta. Para agregar un adicional a un producto o receta: **1.** Seleccione el producto o receta. **2. ** Haga clic en el botón **[🖊️] (editar producto).**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/H7qtDCA4v1.png)

**3.** En el panel de edición, en la parte superior, verá las opciones de **opcionales y adicionales** . Haga clic en la opción que desea agregar o modificar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sdUOjiPLzE.png)

**4.** Verá los adicionales ya asignados al producto, su cantidad y si están activos. **5.** Use el buscador para agregar el insumo deseado. **6.** Para cambiar la cantidad, haga clic en la cantidad y ajuste el valor. **7.** Finalmente, haga clic en **[GUARDAR]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KCvtduFVL6.png)

Si el producto está cargado en el panel, los opcionales y adicionales se mostrarán de inmediato. De lo contrario, aparecerá una opción para editarlos directamente en el producto cargado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/p7NuWbYBJV.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ivnCoayG1J.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Asignar y Configurar Permisos de Usuario en Roles
url: https://posberry.tawk.help/article/¿cómo-asignar-los-permisos-de-usuarios-¿para-qué-sirve-cada-uno-de-ellos
---

# Asignar y Configurar Permisos de Usuario en Roles

*Guía para asignar y entender los permisos de usuario dentro del sistema POSBerry.*

Los permisos de usuario se asignan al crear o editar un rol para hacerlo siga estos pasos: **** **1. ** Accede a **[Configuración]** y selecciona **[Roles]** . **** **2. ** Crea un nuevo rol o elige un rol existente para asignar permisos. **** **3. ** Marca o desmarca las casillas de los permisos según el nivel de acceso que desees asignar: **Ver:** permite visualizar la información. **Editar:** permite realizar modificaciones. **Crear:** permite añadir nuevos elementos. **Eliminar:** permite borrar elementos de forma permanente **** **4. ** Haz clic en **[Guardar]** para aplicar los cambios en el rol seleccionado.

Visite este Instructivo para aprender a usar mas a detalle Roles y Permisos: [Roles y Permisos](https://posberry.tawk.help/article/roles-y-permisos)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Añadir Leyenda en la Impresión de Tickets
url: https://posberry.tawk.help/article/leyenda-de-impresión
---

# Añadir Leyenda en la Impresión de Tickets

*Guía para agregar una descripción personalizada en el ticket de venta.*

1. Haz clic en el botón con el icono **[📝libreta con el lapiz]** para abrir la ventana **Leyenda de Impresión.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/k3vtgYo-iE.png)

2. Completa los campos: **Cantidad: ** Ingrese el número de artículos (ejemplo: "1"). **Descripción:** Escriba la descripción del producto o servicio (ejemplo: "Desayuno").

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sok_H3XGN8.png)

3. La leyenda aparecerá en el ticket de venta. Al finalizar el cobro, se mostrará como: **"1 X Desayuno 3.250,00"** (según los datos del ejemplo).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8hWaU2HiIu.png)

Gracias por leer este instructivo. Para más información, consulta nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Cierre de caja: Control de stock
url: https://posberry.tawk.help/article/cierre-de-caja-control-de-stock
---

# Cierre de caja: Control de stock

*Como controlar el Stock con el cierre de caja*

Para esto nos dirigiremos al cierre de caja, tendremos un botón con el dibujo de una caja de madera, hacemos click en el y nos llevará al control de stock:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yP_3d1LORo.jpeg)

Para controlar el stock, hay tres opciones que podemos usar: 1. Productos Favoritos: muestra el stock de los productos que hayamos marcado como favoritos. 2. Familias favoritas: muestra el stock de todas las familias de productos que hayamos marcado como favoritas. 3. Familia: muestra el stock de todos los productos pertenecientes a la familia que hayamos seleccionado en el menú desplegable

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RmpdY-2cht.jpeg)

Con esta opción podremos controlar facilmente el stock de nuestros productos si asi se desea. Tambien tendremos la opción de imprimirlo si asi lo deseamos.


---

---
title: Realizar Ajustes al stock de mi comercio
url: https://posberry.tawk.help/article/realizar-stock-de-mi-comercio
---

# Realizar Ajustes al stock de mi comercio

*Ajuste de stock en la PC, en la Web y ControlAr*

La correcta gestión de inventario es crucial para evitar pérdidas y reducir costos. Con POSBerry, puedes gestionar tu inventario de manera eficiente tanto desde la PC, como en la web y a través de la aplicación ControlAr, permitiéndote un seguimiento en tiempo real.

**Opción 1: Ajuste de inventario en la PC (para un solo punto de venta)** Aprende cómo actualizar y administrar tu inventario de manera eficiente usando la versión de escritorio de POSBerry. Para más detalles, revisa nuestro tutorial paso a paso: [Ajuste Inventario Local](https://posberry.tawk.help/article/ajuste-de-inventario-pc) **Opción 2: Ajuste de inventario en la Web (para múltiples puntos de venta)** Si gestionas varias sucursales, descubre cómo administrar tu inventario desde cualquier lugar con la versión web de POSBerry. Consulta nuestro tutorial paso a paso: [Ajuste Inventario Web](https://posberry.tawk.help/article/ajuste-de-inventario-web) **Opción 3: ControlAr (para gestionar abonos en múltiples equipos)** Utiliza ControlAr para un control más avanzado y en tiempo real de tu inventario en múltiples dispositivos. Descubre cómo con nuestro tutorial dedicado: [Tutorial ControlAr](https://posberry.tawk.help/category/controlar)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Verificar Historial de Stock De Manera Local
url: https://posberry.tawk.help/article/verificar-historial-de-stock
---

# Verificar Historial de Stock De Manera Local

*Guía para consultar el historial de movimientos de stock de un producto*

**1.** Haga clic en **[Ctrl+O]** > ** [Stock]** > **[Listado de productos]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Gy1M844nOk.png)

**2. ** Desde el listado de productos, puede buscar un producto aplicando filtros como familia, proveedor, solo activos, etc. Marque la casilla correspondiente y el listado se filtrará automáticamente. **** **3. ** Seleccione el producto que desea revisar y haga clic en el botón **[📊 Historial Producto].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/35VKx9RURV.png)

**4. ** En la ventana emergente, podrá ver todos los cambios de stock que ha sufrido el producto, así como buscar movimientos de stock y filtrarlos por fecha. **** **5. ** Si desea descargar el historial, haga clic en el botón de descarga (flecha hacia abajo) ubicado en la parte superior derecha de la pantalla emergente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HWprXzD1vK.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Cree y Aplique un Nuevo movimiento de Stock de Manera Local
url: https://posberry.tawk.help/article/movimiento-de-stock-pc
---

# Cree y Aplique un Nuevo movimiento de Stock de Manera Local

*Pasos para gestionar movimientos de stock (ajustes, roturas, alta inicial, faltantes o algún otro tipo que tenga disponible). en la aplicación*

**1. ** Para crear un nuevo tipo de movimiento de stock web, consulte el instructivo aquí: [Nuevo Tipo de Movimiento de Stock Web](https://posberry.tawk.help/article/nuevo-tipo-de-movimiento-de-stock-web) . **** IMPORTANTE: Asegúrese de aplicar el movimiento una vez que los productos estén cargados, para que los cambios se reflejen en el stock. **** **** **2. ** Haga clic en **[CTRL+O]** , luego siga hasta **[Stock]** y haga clic en **[Nuevo]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KTmBjqkBVV.png)

**3. ** En la ventana " **Nuevo Movimiento de Stock** ", elija el tipo de movimiento que va a realizar (ajustes, roturas, alta inicial, faltantes, u otro tipo disponible). **** **4. ** Ingrese una observación sobre el movimiento que va a realizar. **** **5. ** Haga clic en **[💾 GUARDAR]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PreKkkZy_T.png)

**6. ** Diríjase a la pestaña **[Stock]** y seleccione el movimiento de stock que creó en el paso anterior. **** **7. ** Use el buscador para encontrar el producto que quiere incluir en este movimiento de stock. Haga doble clic en el producto para agregarlo. **** **8. ** Edite las cantidades necesarias.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/O42BujSmsT.png)

**9. Aplique el movimiento de stock** . Recuerde que el stock no se modifica hasta que el movimiento sea aplicado. Una vez aplicado, no se podrá editar. **** **10. ** Para aplicar el movimiento de stock, seleccione el movimiento Haga clic en la flecha ▼ junto al botón **"Mostrar" , ** luego ** ** haga clic en [Aplicar Movimiento].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YgSaGFFJoE.png)

**11.** Confirme la aplicación del movimiento haciendo clic en **[Sí]** . Los cambios serán reflejados en el stock y no se podrán editar posteriormente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/i4psMIjtHl.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MepDtavrYP.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Nuevo Tipo de Movimiento de Stock (Web)
url: https://posberry.tawk.help/article/nuevo-tipo-de-movimiento-de-stock-web
---

# Nuevo Tipo de Movimiento de Stock (Web)

*Guía paso a paso para agregar un nuevo movimiento de stock desde la web*

**1. ** Haga clic en el botón **[Stock]** y luego seleccione **[Tipos de Movimiento de Stock].** **** **2. ** Haga clic en el botón **[Nuevo Tipo de Movimiento].** **** **3. ** En el panel de la derecha, ingrese el nombre del nuevo movimiento de stock. **** **4. ** Seleccione el tipo de aplicación para el movimiento: **Ingreso, Egreso o No aplica.** **** **5. ** Haga clic en el botón **[Guardar]** para confirmar el nuevo tipo de movimiento.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bqPnvl3955.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Ver Depositos Desde La Web
url: https://posberry.tawk.help/article/ver-depósitos-web
---

# Ver Depositos Desde La Web

*Acceda y visualice los detalles de sus depósitos desde la Web*

**1. Acceda a la configuración:** Haga clic en el botón **"Configuración "⚙️** **** **2. Seleccione depósitos:** En el menú izquierdo, haga clic en **"Depósitos"** **** **3. Consulte los detalles:** Seleccione el depósito que desea revisar Visualice toda la información en el panel derecho

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lDrv91n2Le.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Editar proveedor De Manera Local
url: https://posberry.tawk.help/article/editar-proveedor-pc
---

# Editar proveedor De Manera Local

*Aprenda a actualizar los datos de sus proveedores en Desde La web*

**1. Acceda al listado de proveedores:Opción 1:** Haga Clic en (CTRL+O) Seleccione **"Compras"** Haga clic en **"Listado de proveedores"**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2aHxZqEw22.png)

**Opción 2:** En el panel derecho, vaya a **"Compras"** Haga clic en la flecha ▼ junto al botón **"Mostrar"**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oRwu-c6xub.png)

**2. Seleccione el proveedor:** Busque el proveedor que desea modificar Haga clic en el botón **"Editar" ✏️**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aXyBY31uOT.png)

**3.** **Realice los cambios:** Modifique la información necesaria Haga clic en **"GUARDAR"** para guardar

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PaB6ak7Heo.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Servicios y Planes Disponibles En POSberry
url: https://posberry.tawk.help/article/servicios
---

# Servicios y Planes Disponibles En POSberry

*Descubra los servicios adicionales y beneficios de la licencia full para su negocio*

**SERVICIOS ADICIONALES 🔧** **** Incluye todo el plan básico más: **** **** **1. Gestión de Pedidos:** **Pantalla del cliente 📺 :** Visualice y administre órdenes y estados de pedidos **Delivery 🛵 :** Sistema completo de gestión de entregas **App para meseros 📱 :** Tome pedidos directamente desde las mesas **** **2. Herramientas de Venta:** **Verificador de precios:** Escanee productos para consultar precios **Tienda en línea 🌐:** Página web para ventas online con:
• Catálogo de productos por sucursal
• Sistema de pedidos
• Integración con delivery **3. Servicios al Cliente:** **Fidelización:** Sistema de puntos y gift cards **Venta y preventa remota:** Opere desde múltiples dispositivos en red **LICENCIA FULL ⭐** **** Incluye todos los servicios adicionales más: **** **1. Gestión Centralizada:** Panel de control unificado Productos y precios Clientes y cuentas corrientes Inventarios Control de caja **** **2. Funciones Multi-sucursal:** Envío de mercadería entre locales Reportes por sucursal Integración completa entre todas sus sucursales

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: ¿Puedo Generar Un Plan de Compra Para Saber que debo Comprar a Mis Proveedores?
url: https://posberry.tawk.help/article/se-puede-generar-un-plan-de-compras-para-saber-que-debo-comprar-a-mis-proveedores
---

# ¿Puedo Generar Un Plan de Compra Para Saber que debo Comprar a Mis Proveedores?

*Aprenda a generar un listado de productos que necesita comprar para mantener su stock actualizado*

**1. Acceda al plan de compras:** Haga clic en el **"icono de cartera "👝** para abrir la sección de compras Seleccione la opción **"Plan de compras"** **2. Configure sus preferencias:** Elija el depósito donde realizará la compra Utilice los filtros disponibles para personalizar su búsqueda: • Días de stock
• Proveedor específico
• Familia de productos
• Productos por reponer **3. Genere el listado:** Haga clic en el icono de recargar 🔄 (ubicado a la derecha del selector de depósito) El sistema mostrará el listado de productos para comprar **** **4. Exporte su plan de compras (opcional):** Haga clic en el botón ** [En Excel] 📥** ubicado debajo del listado para descargar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EbKX8814lK.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3tJOSH-oIc.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NeVVBBtqr9.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: ¿Como Asignar Un costo De Envio Sobre Mis Pedidos de "Delivery"?
url: https://posberry.tawk.help/article/¿cómo-asignar-un-costo-de-envío-sobre-mis-pedidos-de-delivery
---

# ¿Como Asignar Un costo De Envio Sobre Mis Pedidos de "Delivery"?

*Guía para configurar y aplicar el costo de envío en sucursales y ventas.*

## Para Order:

Ve a Configuración en el menú principal. Selecciona la sucursal correspondiente. Desplázate hacia abajo hasta encontrar la opción Precio del Delivery. Haz clic en el campo y coloca el monto deseado. Finalmente, haz clic en el botón **Guardar 🖫** para aplicar los cambios. (Este ajuste solo informa al cliente del precio del delivery).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_k3S9rFwKX.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bOYDT5xbS3.png)

## En una venta

Para incluir el costo del servicio de delivery en una venta, agrega un **producto** de tipo **Servicio** llamado **Delivery.** Añade este producto al pedido cada vez que se realice una venta con envío a domicilio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/y3imj_uHpe.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Configuración De Impresoras Para Comandas
url: https://posberry.tawk.help/article/impresión-de-comandas-números
---

# Configuración De Impresoras Para Comandas

*Guía para asignar números de impresoras a productos y familias*

## Configuración de impresoras por producto y familia

Cada **producto** puede tener asignado un **número de impresora.** Cada **familia** de productos también puede tener asignado un **número de impresora** que se aplicará a todos los productos de esa familia. Si en el producto aparece el **número 0,** se utilizará el número de impresora de la **familia** del producto. Si en la familia del producto aparece el **número 0** , se utilizará el número de impresora del **producto.**

## No Imprimir

Si tanto la **familia** como el **producto** tienen el **número 0** , la comanda no se imprimirá.

## Impresión basada en el producto

Si el **producto** tiene un número entre **1 y 4** , se utilizará esa impresora asignada al producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/frQBVmeHlO.png)

## Impresión basada en la familia

Si el **producto** tiene el número **0** y la **familia** tiene un número entre **1 y 4** , se utilizará esa impresora asignada a la familia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CnbMEEOXsH.png)

## Artículo Relacionado

Ingrese a [Impresión de comandas - Asignar](/article/impresión-de-comandas-asignar) , para saber como asignar las impresoras, productos y familias.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Descargar e Instalar el Sistema Posberry En Tu Computadora
url: https://posberry.tawk.help/article/descargar-el-sistema-posberry
---

# Descargar e Instalar el Sistema Posberry En Tu Computadora

*Instrucciones para descargar e instalar el sistema de escritorio de Posberry.*

**1. ** Ve a la página [https://www.posberry.com](https://www.posberry.com) y selecciona la sección de Descargas. **** **2. ** Elige el archivo compatible con tu sistema operativo, en este caso Windows, y descárgalo haciendo clic en su ícono 💻.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/w9XTSwBvND.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-rmsCiwjwe.png)

**3. ** Una vez que la descarga haya finalizado, ejecuta el archivo. **4. ** Es posible que recibas un mensaje de advertencia de Windows. Para continuar, haz clic en **"Más información"** y luego en **"Ejecutar de todas formas".**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FIgsnbKHEO.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ugEwzvDYjz.jpeg)

**5.** Al ejecutar el instalador, selecciona el idioma deseado. **6.** Haz clic en **Instalar** y el sistema Posberry se instalará automáticamente en tu computadora.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nrccLGhGkc.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Zuup--g8GW.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YoNcsSb__2.jpeg)

**7.** Al finalizar la instalación, haz clic en **Finalizar** y el sistema estará listo para usarse.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hgfRxZKRE5.jpeg)

**IMPORTANTE:** Para la primera vez que inicies el sistema, debes utilizar el **usuario ADMIN** de tu empresa. Después de cargar los datos iniciales, podrás ingresar con los demás operadores.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Anular Compras Desde La Web
url: https://posberry.tawk.help/article/anular-compras-web
---

# Anular Compras Desde La Web

*Proceso para anular o restaurar compras a través de la web.*

**1. ** Haz clic en **[Compras] 🛍️** . **** **2. ** Ingresa la **fecha de inicio** y la **fecha final** , selecciona la **sucursal** y luego haz clic en **[Recargar] 🔄** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_rANjB1Uwg.png)

**3. ** Aparecerá un listado con las compras registradas. Las compras anuladas estarán marcadas en rojo. **** **4. ** Si una compra no está anulada, puedes **anularla** haciendo clic en el botón **[x]** ❌ a la derecha de la compra. **** **5. ** Si la compra ya está anulada, puedes restaurarla haciendo clic en el mismo botón **[x]** ❌.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AWsPch9M12.png)

**6.** En ambos casos, aparecerá un mensaje de confirmación. Haz clic en [Sí] para proceder.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/H0NPqvf_th.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uax-egcKQ8.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Tique de cambio
url: https://posberry.tawk.help/article/tique-de-cambio
---

# Tique de cambio

*Como configurar tiques de cambios*

En la ventana principal haga click en el boton (opciones) y vaya al apartado (impresoras) y tilde la opcion "imprimir tique de cambio" y damos click en guardar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_h53C431_p.jpeg)

## Como usar tiques de cambio

Para recibir un tique de cambio, sigue estos pasos: 1. Haz clic en el botón (CTRL+O). 2. Selecciona la opción de ventas. 3. Busca y haz clic en "Recibir tique de cambio". 4. Escanea el código de barras del tique de cambio. 5. Selecciona "Devolución" si solo deseas hacer una nota de crédito, o "Devolución/Venta" si deseas hacer una devolución y una venta juntas. 6. Los productos a vender se marcarán en verde y los productos a devolver en rojo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6_AF2cyUTM.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/GX02s-1bKt.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hVwdORR5an.jpeg)

se puede escanear el codigo de barras del tique de cambio (funciona en todas las sucursales) o ir a la venta de ese producto, hacer click derecho y elegir la opcion "generar devolucion: nota de credito" o "generar devolucion: nota de credito/venta"


---

---
title: Confirmar compras Desde La Web
url: https://posberry.tawk.help/article/confirmar-compras-web
---

# Confirmar compras Desde La Web

*Instrucciones para confirmar o cambiar el estado de las compras desde la plataforma web.*

**1. ** Haz clic en el botón **[Compras] 🛍️ (icono de "bolsa de supermercado").** **** **2. ** Ingresa la **fecha de inicio** y la **fecha final** , selecciona la **sucursal** , y luego haz clic en el botón **[Recargar] 🔄 (icono de "flechas").**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/K4VvFs0EPc.png)

**3. ** Verás el listado de compras. Las **compras confirmadas** aparecerán en **verde** y las **no confirmadas** en **rojo** . **** **4. ** Para confirmar una compra, haz clic en el botón **[v] ✔️** a la derecha de la compra. Si la compra ya está confirmada, puedes revertirla a no confirmada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PgThn4eNxn.png)

5. Aparecerá una ventana de confirmación. Haz clic en **[Sí]** para continuar con el cambio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Vi-0iqPzMk.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Bp1p4YXCtC.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Consultar Cuentas Corrientes de Clientes Desde La Web
url: https://posberry.tawk.help/article/cuenta-corriente-de-clientes-web
---

# Consultar Cuentas Corrientes de Clientes Desde La Web

*Pasos para visualizar y gestionar las cuentas corrientes de tus clientes desde la web.*

**1. ** Ve al menú de **Clientes** y haz clic en **Cuentas Corrientes de Clientes.** **** **2. ** Se mostrará una lista de clientes con cuentas corrientes activas. **** **3. ** Usa el buscador para filtrar clientes rápidamente. **** **4. ** Para ver el detalle de las transacciones realizadas por un cliente, haz clic en el botón Detalle correspondiente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/glRBt_DsnN.png)

**5. ** El detalle de las transacciones se mostrará en la parte inferior de la pantalla. **** **6. ** Puedes usar el buscador dentro del detalle para filtrar transacciones específicas. **** **7. ** Si necesitas ver más transacciones, navega usando los números en la parte inferior de la página. **** **8. ** Para ver transacciones con saldo cero, selecciona la casilla **Mostrar transacciones con saldo cero.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1nFcJkiZRD.png)

9. Para ver más detalles de una venta específica, haz clic en el botón de información **(i)** a la derecha de la venta. Aparecerá una ventana con todos los datos de la venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bDpegncvju.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Puedo realizar cambios de precios en linea de caja?
url: https://posberry.tawk.help/article/puedo-realizar-cambios-de-precios-en-linea-de-caja
---

# Puedo realizar cambios de precios en linea de caja?

*modificar los precios directamente desde la caja si tienes los permisos adecuados.*

Si tienes permisos para editar, puedes modificar el precio de un producto directamente desde la línea de caja. Simplemente selecciona el renglón correspondiente en la venta y ajusta el precio según sea necesario.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eiOt0L-03t.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Editar un Operador
url: https://posberry.tawk.help/article/editar-operador
---

# Como Editar un Operador

*Instrucciones para modificar la información de un operador en Posberry.*

**1. ** Haga clic en el botón **[⚙️ Configuración] (icono de rueda dentada).** **** **2. ** En el menú de la izquierda, haga clic en **[Operadores].** **** **3. ** Seleccione el nombre del operador que desea editar. **4. ** Modifique los campos necesarios. **Importante: ** El campo de correo electrónico (E-Mail) debe ser único. No es posible que dos operadores compartan la misma dirección de correo electrónico. **** **5. ** Para finalizar, haga clic en **[GUARDAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZnE81AQGGc.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Activar y Utilizar El Menu Qr
url: https://posberry.tawk.help/article/como-activar-y-utilizar-el-menu-qr
---

# Como Activar y Utilizar El Menu Qr

*Guía para crear y organizar el menú digital QR con los productos para tus clientes.*

## Activar el Menú QR:

**1. ** Diríjase a la sección de **[Configuraciones] (icono de "⚙️ rueda dentada").** **** **2. ** Luego, seleccione **[Empresa]** en el panel de la derecha. **** **3. ** Busque la opción " **Usar Menú QR** " y active la casilla. **4. ** Haga clic en el botón **[Ver QR]** para generar el código QR.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CKGw3yyGpV.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2hJH83vyAx.png)

**5. ** Al escanear este código, los clientes podrán acceder al menú.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Q5bAUYViiF.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ihI3FgqrZG.png)

## Cómo Agrupar Productos en el Menú

**1. ** Edite el producto que desea agregar al menú, ya sea de manera local o a través de la web. **** **2. ** Asigne un nombre en el campo "Agrupar por" para organizar los productos en categorías. Por ejemplo, si agrupa varios productos bajo el nombre "PIZZAS", todos aparecerán en la misma categoría del menú. **IMPORTANTE: ** Asegúrese de que los nombres de los grupos estén escritos de manera idéntica. Por ejemplo, "PIZZAS" y "piZzas" se considerarán como dos grupos distintos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lRM31zIBg2.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nio_cRfMij.png)

**3. ** Una vez hecho, recargue la página y sincronice el punto de venta. El grupo aparecerá con sus productos dentro del menú QR.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/u_iDTAbrHP.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Ver el Historial de Stock en la Web
url: https://posberry.tawk.help/article/historial-de-stock-web
---

# Como Ver el Historial de Stock en la Web

*Instrucciones para consultar el historial de stock desde la web*

**1. ** Haga clic en el botón **[Stock] (icono de "caja de madera 📦")** . Luego, haga clic en **[Stock]** . **** **2. ** Seleccione el depósito con el que desea trabajar y haga clic en el botón de recarga **(icono de "flechas circulares 🔄").**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/498ugyukpv.png)

**3.** Puede buscar el producto usando el campo de búsqueda **("🔍 Buscar")** o filtrando por Familia y Solo Activos. **4.** Una vez que encuentre el producto, haga clic en el botón de información **(icono "ℹ️")** ubicado a la derecha del producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Pd-0qqFryS.png)

**5. ** En la ventana **"Historial de Stock,"** podrá ver los diferentes movimientos como ventas y compras, incluyendo detalles como el operador y la fecha. **** **6. ** Puede exportar los datos a un archivo de Excel usando el botón de descarga **[En Excel].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YXvx98M-7F.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Editar una Sucursal Desde La Web
url: https://posberry.tawk.help/article/editar-sucursal-web
---

# Editar una Sucursal Desde La Web

*instrucciones para modificar los datos de una sucursal en la web*

**1. ** Haga clic en el botón **[Configuración] (icono de "rueda dentada" ⚙️).** **** **2. ** Luego, en el menú de la izquierda, haga clic en **[Sucursales].** **** **3. ** En la lista de sucursales, haga clic en el nombre de la sucursal que desea editar. **** **4. ** A la derecha, podrá ver los datos de la sucursal y su estado (activo o inactivo). **** **5. ** Actualice los campos que necesite modificar. **** **6. ** Haga clic en el botón **[Guardar].** Aparecerá un mensaje de confirmación. Haga clic en el botón **[Guardar] ** en el mensaje de confirmación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/f4uopnePBD.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gr40nsy0p1.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Crear una Nueva Sucursal Desde La Web
url: https://posberry.tawk.help/article/nueva-sucursal-web
---

# Crear una Nueva Sucursal Desde La Web

*Pasos para añadir una nueva sucursal en la web*

**1. ** Haga clic en el botón **[Configuración] (icono de "rueda dentada" ⚙️).** **** **2. ** En el menú de la izquierda, seleccione **[Sucursales].** **** **3. ** En la parte superior del listado de sucursales, haga clic en el botón **[Nueva Sucursal].** **** **4. ** Complete los campos requeridos para agregar la nueva sucursal. **** **5. ** Haga clic en el botón **[Guardar].** Saldrá un mensaje de confirmación. Haga clic en el botón **[Guardar]** en el mensaje de confirmación. Importante: Al crear una nueva sucursal, también se generará un depósito relacionado con la sucursal, con el mismo nombre y domicilio. Puede recargar la página y editarlo desde el botón **[Depósitos]** en el panel de la izquierda.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AN7no3nKqZ.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Ver las Sucursales Desde La Web
url: https://posberry.tawk.help/article/ver-sucursales-web
---

# Ver las Sucursales Desde La Web

*Instrucciones para acceder a la información de las sucursales en la web*

**1.** Haga clic en el botón **[Configuración] (icono de "rueda dentada" ⚙️).** **2.** En el menú de la izquierda, seleccione **[Sucursales].** **3. ** En la lista de sucursales, haga clic en el nombre de la sucursal que desea ver. **Nota:** El domicilio que se imprime en el ticket de una venta se toma de la sucursal, a diferencia de antes, donde correspondía al punto de venta. **4. ** A la derecha, podrá ver los datos de la sucursal y su estado de activación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EhCnFUX65z.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Desactivar una Sucursal desde la Web
url: https://posberry.tawk.help/article/dar-de-baja-sucursal-web
---

# Desactivar una Sucursal desde la Web

*Pasos para desactivar una sucursal desde la web*

**1. ** Haga clic en el botón **[Configuración] (icono de "rueda dentada" ⚙️).** **** **2. ** En el menú de la izquierda, seleccione **[Sucursales].** **** **3. ** En la lista de sucursales, haga clic en el nombre de la sucursal que desea editar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nrDu-qndWN.png)

**4. ** A la derecha, podrá ver los datos de la sucursal y su estado de activación. **** **5. ** Desmarque la casilla de verificación **"Activa"** para dar de baja la sucursal.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VA01f-3k96.png)

**6.** Haga clic en el botón **[Guardar]** . **7.** Aparecerá un mensaje de confirmación. Haga clic en el botón **[Guardar]** del mensaje de confirmación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iieY9pGIXz.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Desactivar un Operador Desde La Web
url: https://posberry.tawk.help/article/dar-de-baja-operador
---

# Como Desactivar un Operador Desde La Web

*Guía rápida para desactivar un operador en la web*

**1. ** Haga clic en el botón **[Configuración] (icono de "rueda dentada" ⚙️).** **** **2. ** En el menú de la izquierda, haga clic en **[Operadores].** **** **3. ** Seleccione el nombre del operador que desea editar. **** **4. ** Haga clic en la casilla de verificación **"Activo"** para desmarcarla, desactivando así al operador. **** **5. ** Para finalizar, haga clic en el botón **[GUARDAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yNZWDci-Z6.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Transferencias Mercado Pago
url: https://posberry.tawk.help/article/transferencias-mercado-pago
---

# Transferencias Mercado Pago

*Como utilizar la función de transferencias en el sistema*

Debemos habilitar en el punto de venta en Opciones> Integraciones y activar la función " Usar confirmación de Transferencias MP" y guardar cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EkmV83Xb3E.jpeg)

las transferencias de mercado pago funcionan de la siguiente manera: 1) elije el medio de pago "Transferencias MP". 2) al pulsar el botón "+" aparecerá un cuadro, en el mismo aparecerá la transferencia que el cliente nos envie a traves del alias de mercado pago. 3) al enviar el cliente su pago, aparecera en el cuadro su transferencia enviada, debe seleccionarla y confirmar para cerrar la venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nekkNe1niX.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Xzjxj8cS4c.jpeg)


---

---
title: Como Ver Compras De Manera Local
url: https://posberry.tawk.help/article/ver-compras-pc
---

# Como Ver Compras De Manera Local

*Instrucciones para visualizar y revisar compras desde la app*

## Pasos para ver las compras

**1. ** Haga clic en la pestaña **[Compras].** **** **2. ** Luego, haga clic en el botón **[Mostrar].** **** **3. ** En la lista de compras, seleccione una compra para ver los detalles completos. **Nota:** En el detalle, el campo "Precio" indica el precio por unidad sin IVA para Facturas A. **** **4. ** Para ver el detalle de los pagos realizados, haga clic en la pestaña **[Pagos]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6u77BarQH1.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7verlJtWh8.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TurialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Como Ver y Gestionar Operadores
url: https://posberry.tawk.help/article/ver-operadores
---

# Como Ver y Gestionar Operadores

*Instrucciones para visualizar y acceder a los detalles de los operadores en la web*

## Ver detalles de los operadores

**1. ** Haga clic en el botón **[⚙️ Configuración] (icono de rueda dentada).** **** **2. ** En el menú de la izquierda, haga clic en **[Operadores].** **** **3. ** En la lista, verá resaltado en rojo el usuario con el que debe iniciar sesión. **** **4. ** Para ver más detalles de un operador, haga clic en su nombre.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0vIbnRQABA.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [TutorialesPosberry](https://www.youtube.com/@posberry9300)


---

---
title: Editar Tipos de Movimientos de Stock (Web)
url: https://posberry.tawk.help/article/editar-un-tipo-de-movimiento-de-stock-web
---

# Editar Tipos de Movimientos de Stock (Web)

*Cómo modificar un tipo de movimiento de stock en la Web*

**1.** Haga clic en el botón **[Stock]** y luego en **[Tipos de Movimiento de Stock]** . **2. ** Utilice el filtro para buscar el movimiento deseado o haga clic en el nombre del ítem en la lista a la izquierda para ver los detalles. **3.** En el panel derecho, ingrese el nuevo nombre del movimiento y seleccione el tipo de aplicación: **Ingreso, Egreso** , o **No Aplica.** 4. Haga clic en el botón **[Guardar]** para confirmar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FI_3-MqnhH.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [Posberry Tutoriales](https://www.youtube.com/@posberry9300) .


---

---
title: Como convertir los presupuestos en facturas
url: https://posberry.tawk.help/article/como-convertir-los-presupuestos-en-facturas
---

# Como convertir los presupuestos en facturas

*convertir los PSP (presupuestos de compra) a FC (factura)*

debemos ir al punto de venta donde hicimos la venta a psp, vamos al apartado ventas, hacemos click derecho sobre la factura, y elegimos la opcion "convertir psp a factura de venta"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/GszU6-17pA.jpeg)

al elegir esa opcion nos va a aparecer una nueva ventana para elegir con que cliente facturar esa venta, elegimos el que deseamos, se realizará la conversion y para asegurarnos tnemos que ver que esa factura en tipo diga FCC, FCB, etc y que ya no este el tipo PSP

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CQ1kKC-RTL.jpeg)


---

---
title: Activar Licencia OEM
url: https://posberry.tawk.help/article/como-activar-la-licencia-oem
---

# Activar Licencia OEM

*Guía para activar el código OEM desde la App*

Para activar la licencia OEM en Posberry, siga estos pasos: **1.** En la parte inferior derecha del menú de inicio, haga clic en **"Tengo un código".**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/O9foTXJwHF.png)

**2. ** Aparecerá un cartel de activación. Ingrese el **código OEM** en el campo correspondiente. **3. ** Haga clic en **Guardar.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/x6eLeHtfPU.png)

**4.** Inicie sesión con su usuario. Al sincronizar, el código se guardará automáticamente en el sistema. **5. ** Tras iniciar sesión, aparecerá un **mensaje de éxito** en pantalla confirmando la activación de Posberry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rRAULhG-XD.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Mercado Pago Cash Out
url: https://posberry.tawk.help/article/mercado-pago-cash-out
---

# Mercado Pago Cash Out

*Como utilizar el mercado pago Cash Out*

IMPORTANTE: debe estar habilitado por un agente de cuenta de Mercado Pago previamente esta opción.

Debe ir a Opciones, luego a integraciones, y tilda la opción usar mercado pago Cash Out:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QvsM-vxkrY.jpeg)

Su modo de uso es simple: 1)  Elegir el metodo de pago mercado pago QR. 2) Pulsar el boton con el signo "+". 3) nos consultará cuanto dinero desea extraer, si no se desea extraer se escribe 0 en el cuadro de cash out.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tyUW2CNOKP.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZXADftQSje.jpeg)

El qr cobrará tanto la venta como la extracción de dinero, en este ejemplo es 1 peso de venta y 1 peso de extraccion:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dZFzSyWzyK.jpeg)

El cliente podrá ver su extraccion y el total de su venta en su pantalla:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8ktAPM4SKY.jpeg)

Y este extracto saldrá discriminado en el cierre de caja como "Mercado Pago Cash Out":

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CYXg7OYiSn.jpeg)


---

---
title: Como activar la licencia OEM en POSBerry GO
url: https://posberry.tawk.help/article/como-activar-la-licencia-oem-en-posberry-go
---

# Como activar la licencia OEM en POSBerry GO

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BapsZ0L0TX.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IiTbGvt-We.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5WSWTYo4X8.jpg)

Para ingresar el código OEM en toque en el botón tengo un código, luego en la pantalla de activación ingrese el código y toque en guardar, finalmente ingrese con su usuario y contraseña. El código se guarda automáticamente al sincronizar. Al iniciar con su cuenta aparecerá un mensaje de éxito en pantalla que confirmara la activación de POSBerry.


---

---
title: Consultar IVA de Ventas (Web)
url: https://posberry.tawk.help/article/iva-ventas-web
---

# Consultar IVA de Ventas (Web)

*Guía para consultar y exportar el reporte de IVA sobre las ventas en la web*

Para acceder a la página de IVA Ventas, haga clic en el ícono de **MONEDA ($)** , luego seleccione **Ventas** y finalmente haga clic en **IVA Ventas.** **Pasos para consultar el IVA de Ventas:** **1.** Seleccione el **rango de fechas** que desea consultar. **2.** Elija la **sucursal** correspondiente. **3.** Haga clic en el botón **Refrescar** (ícono de flechas en forma de rueda) ubicado a la derecha. En la parte inferior, se mostrará la lista de las ventas y los **totales de los impuestos** generados por las mismas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/715TdwV4NO.png)

Para descargar el listado, haga clic en el botón **EN EXCEL** y guárdelo en su computadora.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Vender a Crédito De Manera Local (PC)
url: https://posberry.tawk.help/article/vender-a-crédito-pc
---

# Vender a Crédito De Manera Local (PC)

*Guía paso a paso para realizar ventas a crédito utilizando la App*

Esta guía asume que ya está familiarizado con la sección **"Realizar Ventas"** del manual. Realizar una venta a crédito sigue un proceso similar al de las ventas normales, con la diferencia de que primero debe seleccionar al cliente al que desea otorgar el crédito. El cliente debe tener habilitada la opción **"Vender a Crédito".** Si la opción no está habilitada, es posible que deba editar los detalles del cliente. Consulte el manual **"Editar Cliente"** para realizar esta modificación. El límite de crédito indica el monto máximo que el cliente puede gastar en total a crédito. Si el cliente excede ese límite, el sistema no permitirá finalizar la venta hasta que se pague la deuda existente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/drm5JKQB51.png)

**1. Seleccionar Cliente:** Para seleccionar al cliente, haga clic en **[Buscar Cliente ]** y luego haga doble clic en el cliente deseado. También puede usar el Panel Inteligente a la derecha, seleccionando un cliente favorito o buscando en **"Todos los Clientes"** y eligiendo del listado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aoDeh9XchS.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1XlkP_gVyO.png)

una vez que elija el cliente, si este ya esta configurado para vender a credito se lo mostrara de inmediato en la pantalla con texto en rojo **" A Credito "**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FcVwDW4g24.png)

**2. Agregar Productos** Este paso se realiza de la misma manera que en el proceso descrito en **"Realizar Ventas".** **3. Confirmar** Aparecerá un mensaje de confirmación. Haga clic en **[ OK ]** para completar la venta. La venta a crédito se registrará en el sistema y aparecerá en rojo en el listado de ventas. Para más detalles, consulte el manual "Ver Ventas".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DPhhxw3ods.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Configuracion Del Tope de descuento
url: https://posberry.tawk.help/article/configuración-tope-de-descuento
---

# Configuracion Del Tope de descuento

*Aprende a establecer topes de descuento para productos, operadores y puntos de venta en el sistema Posberry.*

Como se mencionó en la sección de **Tope de Descuento, ** éste se puede aplicar a un producto, un operador o un punto de venta en específico.

## Configurar tope de descuento a un producto.

**1.** Seleccione el icono del **"Carrito de supermercado"** para desplegar el listado de productos. **2.** Elija el producto a modificar y haga clic en el recuadro azul con el lápiz

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BK2VGwe9RS.jpg)

**4. ** Modifique el Tope de Descuento al valor deseado **** **5. ** Haga clic en Guardar para conservar los cambios. **6.** Para que los cambios se reflejen en el punto de venta, sincronice el equipo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/einoIHvJEr.png)

## Configurar Tope de Descuento a un operador.

**1.** En la parte superior de la pantalla, presione el icono de "Rueda Dentada" y seleccione "Operadores". **2. ** Seleccione el operador al que le asignará el tope de descuento.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HQu66d-8Y0.png)

**3. ** Modifique el valor del descuento según su criterio. **** **4. ** Presione Guardar. **** **5. ** Para ver el cambio en el punto de venta, sincronice el equipo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZYQYixbNEM.png)

## Asignar Tope de Descuento de un punto de venta

**1. ** Haga clic en el icono de **"Rueda Dentada". ** **** **2. ** Presione **Punto de Venta** en la columna de configuración. **** **3. ** Seleccione el punto de venta que va a modificar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qxs_NIF9MS.png)

**4. ** Asigne el porcentaje de descuento que considere adecuado. **** **5. ** Haga clic en **Guardar.** **** **6. ** Para que el cambio se refleje en el punto de venta, sincronice la PC.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/y7JYnHsrYL.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Como Editar Tipos de Condición de Pago (Web)
url: https://posberry.tawk.help/article/editar-tipos-de-condición-de-pago-web
---

# Como Editar Tipos de Condición de Pago (Web)

*Aprende a modificar los tipos de condición de pago en la web, incluyendo detalles sobre tarjetas y efectivo.*

**1. ** Haga clic en el botón **[Ventas] (icono de "moneda").** **** **2. ** Luego, seleccione **[Tipos de Condición de Pago].** **** **3. ** En el listado de la izquierda, encontrará todos los tipos de condición de pago registrados. **** **4. ** Haga clic en uno de ellos para ver los detalles en el panel de la derecha. **** **5. ** Puede editar el nombre, así como especificar si se trata de tarjeta o efectivo. Si es una tarjeta, también puede ajustar las cuotas. **** **6. ** Para finalizar, haga clic en **[Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UYAgK7BSWg.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Como Editar un Coeficiente en las Condiciones de Pago
url: https://posberry.tawk.help/article/editar-coeficiente-web
---

# Como Editar un Coeficiente en las Condiciones de Pago

*Aprende a modificar los coeficientes de las condiciones de pago en la web*

1. En **Tipos de Condición de Pago,** seleccione una tarjeta. 2.  Haga clic en uno para ver los detalles en el panel de la derecha. Si es una tarjeta, podrá ver las cuotas y el coeficiente que aplica a cada una.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-mC8nfcNqK.png)

3. Haga clic en el coeficiente que desea editar. 4. Cambie los valores según sea necesario. 5. Haga clic en la tilde verde para guardar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uLGz5Pvsve.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [Posberry Tutoriales](https://www.youtube.com/@posberry9300) .


---

---
title: Cómo Configurar Cuotas y Coeficientes en las Condiciones de Pago
url: https://posberry.tawk.help/article/nuevo-coeficiente-web
---

# Cómo Configurar Cuotas y Coeficientes en las Condiciones de Pago

*Aprende a ingresar y gestionar cuotas y coeficientes para las condiciones de pago en la Web.*

**1. ** Para agregar un nuevo coeficiente, desplácese hacia abajo hasta la sección de cuotas. **** **2. ** Ingrese los valores para el número de cuotas y el coeficiente correspondiente. **** **3. ** Haga clic en el botón **[Guardar nuevo]** para almacenar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/00bZEqMuYx.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Como Funcionan los Coeficientes en las Condiciones de Pago
url: https://posberry.tawk.help/article/cuotas
---

# Como Funcionan los Coeficientes en las Condiciones de Pago

*Descubre cómo gestionar y aplicar los coeficientes de financiamiento en cuotas*

El coeficiente de las cuotas es un multiplicador. Por ejemplo: si el precio total de una venta es 100 y el pago se realizará en dos cuotas, y el coeficiente para dos cuotas está configurado en 1.2, entonces: **                                           100 × 1.2 = 120** **** Por lo tanto, 120 será el **precio total** financiado en dos cuotas.

**1. ** Haga clic en el botón **[Ventas]** (icono de "moneda") y luego haga clic en **[Tipos de Condición de Pago].** **** **2. ** En el listado de la izquierda, encontrará todos los tipos de condición de pago registrados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/86ra7fHNZy.png)

**3. ** Haga clic en uno para ver los detalles en el panel de la derecha. Si es una tarjeta, podrá ver las cuotas y el coeficiente que aplica a cada una.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jPrnNMHZ1R.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Crear nuevo producto Local (punto de venta)
url: https://posberry.tawk.help/article/crear-nuevo-producto-local-punto-de-venta
---

# Crear nuevo producto Local (punto de venta)

*Como crear un nuevo producto en nuestro sistema local*

en POSBerry, debemos hacer click en el siguiente boton con el signo "+" o bien usar la combinación de teclas [CTRL + N]:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fBD-a6K88E.jpeg)

Al hacerlo se nos abrirá la siguiente ventana en la cual podremos cargar los datos de nuestro producto:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zsAGYJsaU4.jpeg)

En POSBerry, al crear un nuevo producto, debemos completar la siguiente información: - Tipo de producto: elegir entre Producto, Rubro, Receta, Insumo y Servicio. - Descripción: ingresar el nombre o descripción del producto. - Código de barras: podemos cargar hasta dos códigos de barras distintos por producto. - Tope de descuento: establecer el límite de descuento que se aplicará al producto. - Oferta: al tildar esta opción, el precio del producto imprimirá la leyenda "Oferta". - Puntos de fidelización: indicar cuántos puntos se sumarán al cliente al comprar este producto (si se utiliza la función de fidelización en la empresa). - Fraccionado: indicar si el producto es pesable o fraccionable para utilizar con una balanza. Cada campo es importante para llevar un registro detallado de los productos y su funcionamiento en la empresa.

Al cargar los datos del producto, damos click en guardar y ya creamos nuestro nuevo producto.


---

---
title: Visualizar Ventas De Manera Local
url: https://posberry.tawk.help/article/ver-ventas-pc
---

# Visualizar Ventas De Manera Local

*Aprende a consultar ventas, filtrar por fechas y obtener información detallada de cada venta en la App POSberry*

**1.** Haga clic en la pestaña ** [Ventas].** **2.** A continuación, presione el botón **[Mostrar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/27YUyGfmub.png)

**3.** Puede configurar el rango de fechas para filtrar las ventas seleccionando las fechas de inicio y fin.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jr0b2g5fhQ.png)

**4.** En la lista de ventas, seleccione una venta para ver sus detalles en el panel de abajo. **5.** Para ver la información de los pagos asociados a una venta, haga clic en la pestaña [Pagos].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/D0dciHLqKN.png)

**6.** Haciendo doble clic sobre una venta, podrá ver toda la información en una ventana emergente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/I96bKkFHFy.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: ¿Necesito Internet para usar el sistema POSBerry?
url: https://posberry.tawk.help/article/¿se-necesita-internet-para-usar-el-sistema
---

# ¿Necesito Internet para usar el sistema POSBerry?

*Conozca cuándo es necesario contar con una conexión a Internet para utilizar correctamente POSBerry.*

## Casos en los que necesita Internet

**Primera vez** : Para iniciar el sistema por primera vez. **Sincronización:** Si desea copiar los datos del sistema a la web. **Cambios en la web:** Para descargar los cambios realizados en la versión web del sistema. **Factura electrónica:** Para emitir facturas electrónicas.

## Casos en los que no necesita Internet

**Uso local con impresora Epson:** Si utiliza una impresora Epson con POSBerry, el sistema puede funcionar sin conexión a Internet, ya que la licencia permite que los datos se guarden localmente en su equipo.

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry930](https://www.youtube.com/@posberry9300)


---

---
title: Cuenta corriente de clientes (pc)
url: https://posberry.tawk.help/article/cuenta-corriente-de-clientes-pc
---

# Cuenta corriente de clientes (pc)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/R7kzkGZ8xP.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-vzfPww-dr.png)

Para ver la información de las cuentas corrientes de los clientes tiene que hacer clic en cambiar cliente, seleccione el cliente y luego en el botón Extracto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kIJZqlj9Rt.png)

También puede ir a opciones -> ventas -> listado de clientes y en la pagina del listado, seleccione el cliente hacer clic en el botón extracto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XbTNquGRDc.png)

En la pestaña de extracto podrá ver las transacciones y el saldo disponible en la cuenta corriente del cliente.

Para ingresar el pago de una venta en cuenta corriente seleccione la venta correspondiente y haga clic en el botón Pagar, aparecerá la ventana de pagos donde puede realizar el pago.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zYHN83UK3J.png)

Para ingresar saldo a la cuenta corriente haga clic en el botón cargar saldo, aparecerá la ventana para cargar saldo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/D-a0jAkJQc.png)

Una vez ingresado el saldo este se mostrara en la ventana de extracto Para ver el detalle de una venta seleccione la venta deseada y luego haga clic en detalle aparecerá una pantalla como la siguiente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dnKzV1JMeV.png)

Para ver el detalle de saldo cargado seleccione la transacción y haga clic en detalle aparecerá una pantalla como la siguiente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/icWK-SshZa.png)

En la pantalla de detalle se puede seleccionar las ventas y proceder a pagar las ventas pagadas se convierten en saldo cero. En la pantalla de extracto se mostraran los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_GQwINnAbX.png)

Para ver transacciones con saldo cero haga clic en mostrar transacciones con saldo cero y se mostraran las transacciones con saldo cero como por ej.: ventas ya pagadas.


---

---
title: Dar de baja un Tipo de Clientes (Web)
url: https://posberry.tawk.help/article/dar-de-baja-un-tipo-de-clientes-web
---

# Dar de baja un Tipo de Clientes (Web)

*Cómo desactivar un tipo de cliente desde la web*

**1. ** Haga clic en el botón **[Clientes] ** ("icono con tres personas"). **** **2. ** Haga clic en el botón **[Tipos de Clientes].** **** **3. ** En la lista de la izquierda, haga clic en el nombre del tipo de clientes que desea dar de baja para ver los detalles. **** **4. ** Haga clic en el botón **"Activo"** para desmarcarlo. **** **5. ** Para finalizar, haga clic en el botón **[Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Va-k__xI0p.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Dar De Baja Un Tipo De Cliente (Pc)
url: https://posberry.tawk.help/article/dar-de-baja-un-tipo-de-cliente-pc
---

# Dar De Baja Un Tipo De Cliente (Pc)

*como desactivar un Tipo de Cliente desde la App*

1. En la ventana principal, haga clic en el botón **[Ctrl + o]** , seleccione **[Ventas]** , y luego haga clic en **[Listado de Clientes]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3ADoHPYttO.png)

**2.** Elija un tipo de cliente de la lista. **3.** Haga clic en el botón **[🖊️] (editar)** al lado del botón **[+]** , identificado como "editar tipo de cliente".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Uo1EpVCbwZ.png)

**4. ** En la ventana **"Tipo de Clientes"** , desmarque la opción **"Activo".** **** **5. ** Para finalizar, haga clic en el botón **[GUARDAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XFrwU9yWCG.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Editar Tipos de Clientes (Web)
url: https://posberry.tawk.help/article/editar-tipos-de-clientes-web
---

# Editar Tipos de Clientes (Web)

*Cómo modificar los tipos de clientes desde la web*

**1. ** Haga clic en el botón **[Clientes]** ("icono con tres personas"). **** **2. ** Haga clic en el botón **[Tipos de Clientes]** . **** **3. ** En la lista de la izquierda, haga clic en el nombre del tipo de clientes que desea editar para ver los detalles. **** **4. ** Cambie el campo **"Nombre del tipo de Clientes".** **** **5. ** Para finalizar, haga clic en el botón ** [Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ter5xJ-eoe.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Editar Tipos de Clientes (PC)
url: https://posberry.tawk.help/article/editar-tipos-de-clientes-pc
---

# Editar Tipos de Clientes (PC)

*Cómo modificar los tipos de clientes desde la App*

**1.** En la ventana principal haga clic en el botón **[ CTRL + O]** siga hasta **[Ventas]** y luego haga clic en **[Listado de Clientes].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IYtUbTos1G.png)

**2.** Elija un tipo de cliente de la lista. **3.** Haga clic en el botón **[🖊️] (editar)** al lado del botón **[+]** , identificado como "editar tipo de cliente". **4. ** Modifique el campo **"Tipo"** con el nuevo nombre del tipo de cliente. **5. ** Para finalizar haga clic en el botón **[GUARDAR]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Hq1AXlfF43.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Ver Tipos de Clientes (Web)
url: https://posberry.tawk.help/article/ver-tipos-de-clientes-web
---

# Ver Tipos de Clientes (Web)

*Cómo visualizar los tipos de clientes desde la web*

**1.** Haga clic en el botón **[Clientes]** (representado por un "icono con tres personas"). **2.** Haga clic en el botón **[Tipos de Clientes].** **3.** En la lista de la izquierda, haga clic en el nombre del tipo de cliente que desea ver para visualizar los detalles.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/D-p1tCDJ14.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Nuevo Tipo de Clientes (Web)
url: https://posberry.tawk.help/article/nuevo-tipo-de-clientes-web
---

# Nuevo Tipo de Clientes (Web)

*Cómo agregar un nuevo tipo de cliente en la web*

**1. ** Haga clic en el botón **[Clientes]** (representado por un "icono con tres personas"). **2. ** Haga clic en el botón **[Tipos de Clientes].** **** **3. ** continuación, haga clic en el botón ** [Nuevo Tipo de Cliente].** **** **4. ** Llene los campos con la información necesaria y, para finalizar, haga clic en el botón **[Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Rtu6B2ewEr.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Subir lista de Clientes
url: https://posberry.tawk.help/article/subir-lista-de-clientes
---

# Subir lista de Clientes

*Cómo cargar un archivo con clientes en la web*

**1. ** Haga clic en el botón ** [Clientes] (representado por un "icono con tres personas").** **** **2. ** Debajo de la lista de Clientes, verá el texto **"Subir listado de Clientes"** junto a un botón que dice **[Seleccionar Archivo]** . Haga clic en este botón.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PGPf7TlEKE.png)

**3. ** Elija el archivo de Excel que desea subir desde su dispositivo. **** **4. ** Una vez seleccionado el archivo, haga clic en el botón [Enviar Cambios] para subir los nuevos clientes o actualizaciones a la web. **** **5. ** Los cambios se reflejarán automáticamente, y podrá ver los nuevos clientes o clientes editados una vez que se complete la subida.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tjUmYy_neW.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Agregar Cliente a favoritos (Web)
url: https://posberry.tawk.help/article/agregar-cliente-a-favoritos-web
---

# Agregar Cliente a favoritos (Web)

*Cómo marcar un cliente desde la web*

**1. ** Haga clic en el botón **[Clientes] (ícono con tres personas)** . **2. ** Use el buscador para filtrar la lista y encontrar el cliente que desea modificar. **3. ** Cuando ubique al cliente, haga clic en el botón azul [/] (editar) a la derecha del cliente

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0KiRyEqONM.png)

**4.** En la ventana **"Clientes"** cambie el campo **"Favorito"** a **"Si"** . **5. ** Para finalizar haga clic en el botón ** [Ok].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yW1ApQ613A.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Dar de baja un cliente (Web)
url: https://posberry.tawk.help/article/dar-de-baja-un-cliente-web
---

# Dar de baja un cliente (Web)

*Cómo inactivar un cliente en la versión de web*

**1. ** Haga clic en el botón **[Clientes] (ícono con tres personas)** . **2. ** Use el buscador para filtrar la lista y encontrar el cliente que desea modificar. **3. ** Cuando ubique al cliente, haga clic en el botón azul [/] (editar) a la derecha del cliente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Bkb5I2rf-1.png)

**4. ** En la ventana **"Datos del Cliente"** , cambie el campo "Activo" a **[No]** . **5.** Para finalizar haga clic en el botón **[Ok].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ukmUQ-8Xsx.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Dar de baja un cliente (PC)
url: https://posberry.tawk.help/article/dar-de-baja-un-cliente-pc
---

# Dar de baja un cliente (PC)

*Cómo inactivar un cliente desde la App*

**1.** En la ventana principal haga clic en el botón **[ CTRL + O ]** siga hasta **[Ventas] ** y luego haga clic en **[Listado de Clientes]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/uRRN8DSeUA.png)

**2. ** En la ventana **"Listado de Clientes"** , puede usar el buscador o filtrar por Tipo de Cliente y otros parámetros disponibles. **** **3. ** Haga clic en el cliente que desea dar de baja. Después, Haga clic en el botón **[🖊️] (editar)** que se encuentra en la parte superior derecha de la ventana.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J8uCtOcJmC.png)

**4. ** En la ventana **"Clientes"** , desmarque la opción **"Activo".** **** **5. ** Para finalizar, haga clic en el botón **[GUARDAR].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/IDBgHBPuC3.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Editar Cliente (Web)
url: https://posberry.tawk.help/article/editar-cliente-web
---

# Editar Cliente (Web)

*Cómo modificar los datos de un cliente en la versión web*

**1. ** Haga clic en el botón **[Clientes] (ícono con tres personas)** . **2. ** Use el buscador para filtrar la lista y encontrar el cliente que desea modificar. **** **3. ** Cuando ubique al cliente, haga clic en el botón azul [/] (editar) a la derecha del cliente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cpoh_SuuyR.png)

**4. ** En la ventana **"Datos del Cliente"** , modifique los datos que sean necesarios. Recuerde que los campos marcados con **(*)** son obligatorios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fSI70g-RcP.png)

**5.** Para corregir los datos fiscales del cliente usando su CUIT, puede usar la función de autocompletar. Haga clic en el botón **[Autocompletar datos desde CUIT]** , que se encuentra debajo del campo CUIT. **6. ** Para finalizar, haga clic en el botón **[Ok].**

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Editar Cliente (Pc)
url: https://posberry.tawk.help/article/editar-cliente-pc
---

# Editar Cliente (Pc)

*Cómo modificar los datos de un cliente desde la App*

**1. ** En la ventana principal, haga clic en el botón **[ Ctrl + o ]** , luego seleccione **[Ventas]** y haga clic en **[Listado de Clientes].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lCBZtFtVy4.png)

**2.** En la ventana **"Listado de Clientes"** , puede filtrar utilizando el buscador, por Tipo de Cliente o por otros parámetros disponibles. **3.** Haga clic en el cliente que desea editar y luego haga clic en el botón **[Editar Cliente]** en la parte superior derecha de la ventana.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tKwyu-9Cc3.png)

**4.  ** En la ventana **"Clientes",** modifique los datos necesarios. Recuerde que los campos marcados con **(*)** son obligatorios. Si ingresa un CUIT válido, el sistema puede consultar los datos en internet y rellenar los campos automáticamente. **5.** Para finalizar, haga clic en el botón **[ GUARDAR ].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iLqfTfbdMV.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Nuevo Cliente (Web)
url: https://posberry.tawk.help/article/nuevo-cliente-web
---

# Nuevo Cliente (Web)

*Cómo agregar un nuevo cliente desde la web*

**1.** Haga clic en el botón **[Clientes] (ícono de "tres personas").** **** **2.** Haga clic en el botón **[+] (agregar)** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RS7f4wQQ7K.png)

**1.** En la ventana **"Datos del cliente"** , ingrese los datos del nuevo cliente. Los campos marcados con ***** son obligatorios. **2.** Para finalizar, haga clic en el botón **[Ok].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2LTQ3QZoAg.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Descargar lista de clientes
url: https://posberry.tawk.help/article/descargar-lista-de-clientes
---

# Descargar lista de clientes

*Cómo exportar la lista de clientes en formato Excel*

**1. ** Haga clic en el botón **[Clientes] (ícono de "tres personas").**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9G-jo4gJmu.png)

**2. ** Debajo de la lista de clientes, encontrará el texto **"Descargar listado de Clientes"** y un botón que dice **[ En Excel ]** . Haga clic en este botón para descargar la lista de clientes en formato Excel.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qnaj69GWv0.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Ver Clientes (Web)
url: https://posberry.tawk.help/article/ver-clientes-web
---

# Ver Clientes (Web)

*Cómo consultar y filtrar la lista de clientes en la web*

**1. ** Haga clic en el botón **[Clientes] (ícono de "tres personas").** **** **2. ** Puede filtrar la lista de clientes utilizando el buscador para encontrar clientes específicos de manera rápida.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VTaNiKAjEY.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Ver Clientes (PC)
url: https://posberry.tawk.help/article/ver-clientes-pc
---

# Ver Clientes (PC)

*Cómo consultar y filtrar la lista de clientes*

1. En la ventana principal, haga clic en el botón **[Ctrl + o]** , seleccione **[Ventas]** , y luego haga clic en **[Listado de Clientes]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4OgGk3AAc_.png)

**2.** En la ventana **"Listado de Clientes" ,** puede filtrar los resultados utilizando el buscador, filtrando por Tipo de Cliente o según otros parámetros disponibles. [](http://disponibles.Si) **3. ** Si desea guardar la lista de clientes, puede hacer clic en el botón **[Exportar]** para generar un archivo en formato Excel.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ELwOfruknM.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Ver Productos Desde la Web / Excel
url: https://posberry.tawk.help/article/ver-los-productos-web
---

# Ver Productos Desde la Web / Excel

*Cómo Acceder al Listado de Productos en la Web*

**Instrucciones:** **** 1. Haga clic en el botón **Productos** (ícono del carrito de compras). 2. Automáticamente verá el listado de todos los productos disponibles.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Nkzigt0rmz.png)

3. También puede descargar el **listado de productos en formato Excel** para tener un respaldo o hacer un análisis detallado. Solo debe ir al final de la lista, en el apartado **Descargar Listado de Productos** , y hacer clic en **[EN EXCEL].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jEjnc1ot3t.png)

Gracias por leer este instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Imprimir Cupones
url: https://posberry.tawk.help/article/imprimir-cupones
---

# Imprimir Cupones

*Cómo configurar e imprimir cupones en POSBerry*

POSBerry puede imprimir dos tipos de cupones: un **cupón general** (cupon.txt, cupon.png) y un **cupón para productos favoritos** (cuponfav.txt, cuponfav.png).

**cupon.txt** o **cuponfav.txt** deben ser archivos de texto plano (como los creados con el Bloc de notas), pero **NO** creados con programas como Word. El ancho de cada línea de texto dependerá de la impresora, pero en general, se recomienda que cada línea tenga un máximo de 27 caracteres. **cupon.png** o **cuponfav.png** deben ser archivos en formato PNG, creados desde cualquier programa de diseño. Deben tener fondo blanco y texto negro, y **NO** deben tener transparencias. El tamaño dependerá de la impresora y de lo que desee mostrar, por lo que le sugerimos realizar pruebas hasta encontrar el tamaño adecuado.

## En Windows:

Copie el archivo de cupón en la carpeta: C:\Users\USER\AppData\Local\POSBerryApp Donde "USER" es el nombre de su usuario en Windows. En esa carpeta también encontrará el archivo **posberry.exe.**

## En ECR (sistema basado en Linux):

Copie el archivo de cupón en la carpeta: /home/posberry/POSBerry En esa carpeta también encontrará el archivo ejecutable **POSBerry.**

## ¿Qué archivo debo copiar?

Puede copiar solo un archivo, ya sea **cupon.txt** o **cupon.png** , pero también es posible combinarlos: puede usar **cupon.png** para el logo y **cupon.txt ** para el texto. Lo mismo aplica para **cuponfav.txt** y **cuponfav.png.**

Gracias por leer este instructivo. Para más informacion, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Eliminar / Inactivar Promociones (Web)
url: https://posberry.tawk.help/article/eliminar-promociones-web
---

# Eliminar / Inactivar Promociones (Web)

*Cómo eliminar o inactivar promociones en POSBerry (Web)*

**IMPORTANTE:** Eliminar e inactivar una promoción no es lo mismo. Si elimina una promoción, esta se borra permanentemente del sistema. Al inactivarla, simplemente deja de estar disponible, pero permanece en la lista por si se desea reactivar en el futuro.

## Eliminar una promoción:

**1. ** Haga clic en el botón **[Productos] (ícono de "carrito de compras") ** en el ** ** menú de navegación. **2.** Seleccione en el menú de productos la opción **[Promociones]** . **3.** Haga clic en el botón [🖊️] (editar) que aparece a la derecha de la promoción para acceder a sus Configuración.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ntzPpPzdX6.png)

**4.** Desplácese hasta la parte inferior de la pantalla. **5.** Haga clic en el botón **Eliminar** y confirme su decisión haciendo clic en **Eliminar.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1mY3ghT8lT.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3jG675kxXS.png)

## Inactivar una promoción:

**1.** Dentro de las configuraciones de la promoción que seleccionó, desmarque la opción **"Activa"** . **2. ** Haga clic en el botón **[Guardar]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1Ha0TUPqHh.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6IagHish8z.png)

**3.** Una vez inactiva, podrá ver la promoción desactivada en la lista de promociones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MBIu3RRzKX.png)

Gracias por leer este instructivo. Para más información, vea nuestros vídeos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Eliminar / Inactivar Promociones (PC)
url: https://posberry.tawk.help/article/eliminar-promociones-pc
---

# Eliminar / Inactivar Promociones (PC)

*Cómo eliminar o inactivar promociones en POSBerry desde la PC*

**IMPORTANTE:** Eliminar e inactivar una promoción no es lo mismo. Si elimina una promoción, esta se borra permanentemente del sistema. Al inactivarla, simplemente deja de estar disponible, pero permanece en la lista por si se desea reactivar en el futuro.

## Eliminar una promoción:

**1. ** Haga clic en el botón **[ CTRL + o ]** , luego seleccione **Stock,** y finalmente haga clic en **Promociones** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5EUXEoiNIM.png)

**2. ** Elija la promoción que desea eliminar y haga clic en el **botón [🖊️] (editar) ** para acceder a los detalles de la promoción.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/L5we-ctEOF.png)

3. Haga clic en el botón **[Eliminar]** y luego confirme haciendo clic en el botón **[OK]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AgsHwclmtG.png)

## Inactivar una promoción:

**1.** Dentro de las configuraciones de la promoción que seleccionó, desmarque la opción **"Activa"** . **2. ** Haga clic en el botón **[Guardar]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UdYhYZfrKA.png)

**3.** La promoción aparecerá como inactiva en el listado de promociones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0vEkiJ2KFg.png)

Gracias por leer este instructivo. Para más informacion, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Editar Promociones (PC)
url: https://posberry.tawk.help/article/editar-promociones-pc
---

# Editar Promociones (PC)

*Cómo editar promociones en POSBerry desde la PC*

**1. ** Haga clic en el botón **[ CTRL + o ]** , luego seleccione **Stock,** y finalmente haga clic en **Promociones** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pei56qf372.png)

**2. ** Elija la promoción que desea modificar en la lista. **** **3. ** Haga clic en el botón **[🖊️] (editar)** para acceder a los detalles de la promoción.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rN_WSOBMh1.png)

**4. ** Realice los cambios necesarios en la promoción. **5. ** Haga clic en **[Guardar]** y confirme la acción haciendo clic en **[Sí].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UlSS4W54eI.png)

**IMPORTANTE** : Las promociones pueden ser modificadas en cualquier momento, excepto el **"Tipo de Promoción"** , que no puede cambiarse una vez creada. si desea saber mas sobre las configuraciones de las Promociones, visite este instructivo: [https://posberry.tawk.help/article/nueva-promoci%C3%B3n-pc](https://posberry.tawk.help/article/nueva-promoci%C3%B3n-pc) tambien encontrara el manual completo de instructivos sobre promociones aquí: [https://posberry.tawk.help/category/promociones](https://posberry.tawk.help/category/promociones)

Gracias por leer este instructivo. Para más informacion, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Ver Promociones (PC)
url: https://posberry.tawk.help/article/ver-promociones-pc
---

# Ver Promociones (PC)

*Cómo consultar el listado de promociones en POSBerry*

**1. ** Haga clic en el botón **[ CTRL + o ]** , luego seleccione **Stock,** y finalmente haga clic en **Promociones** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Xl-UWRKVvO.png)

**2. ** Utilice los filtros disponibles para mostrar solo las **promociones activas, vigentes** o por **tipo de promoción** . **3. ** También puede usar el buscador para encontrar promociones específicas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5SG4pM2LUd.png)

**4.** Para ver las promociones que aplican en una venta, haga clic en el **"ícono de regalo"** en la parte superior derecha.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0rdIx5My32.png)

**5. ** Otra opción para ver las promociones aplicables es hacer clic en el texto **"Prom./Desc."** o en el monto (por ejemplo, "$-3832,40").

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kzVwif7gBl.png)

Gracias por leer este instructivo. Para más informacion, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Editar Promociones (Web)
url: https://posberry.tawk.help/article/editar-promociones-web
---

# Editar Promociones (Web)

*Cómo modificar una promoción existente en la plataforma web de POSBerry*

**1. ** Haga clic en el botón **[Productos] (ícono de "carrito de compras") ** en el ** ** menú de navegación. **2.** Seleccione en el menú de productos la opción **[Promociones]** . **3.** Haga clic en el botón [🖊️] (editar) que aparece a la derecha de la promoción para acceder a sus Configuración.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/A_K9ZRRNfS.png)

**4. ** Realice los cambios necesarios en la promoción. **5. ** Haga clic en **[Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iVHnswaZ_k.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OqSIqSY0EF.png)

**IMPORTANTE** : Las promociones pueden ser modificadas en cualquier momento, excepto el **"Tipo de Promoción"** , que no puede cambiarse una vez creada. si desea saber mas sobre las configuraciones de las Promociones, visite este instructivo: [https://posberry.tawk.help/article/nueva-promoci%C3%B3n-pc](https://posberry.tawk.help/article/nueva-promoci%C3%B3n-pc) tambien encontrara el manual completo de instructivos sobre promociones aquí: [https://posberry.tawk.help/category/promociones](https://posberry.tawk.help/category/promociones) Gracias por leer este instructivo. Para más información, vea nuestros vídeos tutoriales en YouTube: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Ver Promociones (Web)
url: https://posberry.tawk.help/article/ver-promociones-web
---

# Ver Promociones (Web)

*Cómo ver y filtrar promociones en POSBerry desde la web*

**1. ** Haga clic en el botón **[Productos] (ícono de "carrito de compras") ** en el ** ** menu de navegacion 2. Seleccione en el menú de productos la opción **[Promociones]** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/daetL-HCpn.png)

**3.  ** Puede utilizar los filtros para ver solo las **promociones activas** , **las vigentes** o filtrarlas por **tipo de promoción.** **** **4. ** Si lo prefiere, también puede usar el buscador para encontrar promociones específicas rápidamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dV3xVxDuI3.png)

Gracias por leer el instructivo. Para más información, vea nuestros vídeos tutoriales en YouTube aquí: [https://www.youtube.com/@posberry9300](https://www.youtube.com/@posberry9300)


---

---
title: Como Crear Una Nueva Promocion De Manera Local
url: https://posberry.tawk.help/article/nueva-promoción-pc
---

# Como Crear Una Nueva Promocion De Manera Local

*Cómo crear nueva promoción desde el punto de venta.*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AmPrfLtDQN.png)

Haga clic en el botón **Menú** o presione las teclas **[Ctrl + O]** . A continuación, seleccione la opción **Stock** . Finalmente, haga clic en **Promociones** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vQ453FrRuS.png)

Una vez dentro de **Promociones** , haga clic en el botón **[+]** (Agregar)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8IJULOXHLP.png)

**Descripción** : Escriba una descripción de la promoción que le permita identificarla fácilmente. **Vigencia** : Es el período de tiempo durante el cual la promoción será válida. Puede seleccionar cualquier rango de fechas. **Días de vigencia** : Son los días de la semana en que la promoción estará activa. Por defecto, se aplicará todos los días, pero puede ajustar este parámetro según sea necesario. **Leyenda en el ticket** : Es el texto que aparecerá en el ticket para mostrar la promoción. **Tipo de promoción** : Seleccione uno de los tipos de promociones disponibles. Al elegir un tipo, el formulario cambiará para mostrar los campos específicos de esa promoción. **Lista de precios** : Escoja a qué lista de precios se aplicará la promoción o si se aplicará a todas las listas. **Condición** : Defina y configure cómo se aplicará la promoción en función de las reglas establecidas. Esta configuración varía según el tipo de promoción que elija. Por ejemplo, si desea hacer una promoción de **"2x1" (llevando 2 productos, paga 1)** , seleccione el tipo de promoción **A x B ** y configure la condición para que por cada **2 productos** , se bonifique **1** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iHpT6iCdqK.png)

Para conocer más sobre los diferentes tipos de promociones y sus condiciones, consulte el apartado https://posberry.tawk.help/article/tipos-de-promociones. Allí encontrará información detallada sobre cada tipo de promoción y cómo configurarlas adecuadamente. **Bonificación** : Indique si la promoción incluye una bonificación, es decir, un descuento o beneficio adicional que se aplicará al cliente. Para finalizar, haga clic en ** [OK]** . **IMPORTANTE** : Las promociones siempre se pueden editar, excepto el **Tipo de promoción** , que no puede modificarse una vez creada. También es importante tener en cuenta que las promociones están reguladas por un **tope de descuento** . Si algún producto tiene un tope de **0** , ninguna promoción podrá aplicarse a ese producto.

Gracias por leer este instructivo. Para más detalles, consulte nuestros tutoriales en YouTube [aquí](https://youtube.com) .


---

---
title: Agregar o quitar productos de Favoritos (Web)
url: https://posberry.tawk.help/article/agregarquitar-favoritos-web
---

# Agregar o quitar productos de Favoritos (Web)

*Cómo gestionar productos favoritos desde la web*

**1.** Los favoritos son los productos que aparecen en el panel de la derecha en el programa de PC. **2.** En la barra de navegación, haga clic en el botón **[Productos] (ícono de carrito de compras).** **** **3. ** Utilice el buscador para encontrar el producto que desea agregar a favoritos. **** **4. ** En la lista de productos, haga clic en el botón violeta **[🖊️] (editar)** , ubicado a la derecha del producto que desea agregar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zyGyFFtcV5.png)

**5.** En la ventana **"Datos del Producto"** , marque la casilla de **"Favoritos"** para seleccionarlo. **6.** En el campo **"Texto Panel"** , escriba el nombre que quiere que se muestre en el panel de favoritos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/r21zmRgrw9.png)

7. Vaya nuevamente hacia arriba en la misma ventana de edición de productos y haga clic en el botón ** [Guardar].**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SatyxJPjRj.png)

El producto ahora aparecerá en el panel de la derecha en el programa de PC.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vX1x4U2kFT.png)

## Quitar un producto de Favoritos:

Para quitar un producto de favoritos, repita los mismos pasos y desmarque la casilla de **"Favoritos"** . Nota: Si desmarca un producto de los favoritos, se ocultará la próxima vez que abra el programa de PC.

Gracias por leer el instructivo. Para más detalles, consulte nuestros tutoriales en YouTube [aquí](https://youtube.com) .


---

---
title: Desactivar o Eliminar Tipos de Condición de Pago (Web)
url: https://posberry.tawk.help/article/dar-de-baja-tipos-de-condición-de-pago-web
---

# Desactivar o Eliminar Tipos de Condición de Pago (Web)

*Cómo gestionar las condiciones de pago en la plataforma web*

**1.** Vaya a la sección **[Ventas] (ícono de moneda)** y seleccione ** [Tipos de Condición de Pago].** **** **2. ** En el listado de la izquierda, encontrará todos los tipos de condiciones de pago registrados. **3. ** Haga clic en el tipo de condición que desee para ver sus detalles en el panel derecho. 4. Para desactivarlo, desmarque la casilla **"Activa"** . 5. Haga clic en ** [Guardar]** para confirmar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/X6p81b8UrT.png)

## Eliminar un tipo de condición de pago:

**IMPORTANTE:** La diferencia entre desactivar y eliminar es que al eliminar un tipo de condición de pago, este se borra completamente de la plataforma web de Posberry y la app, lo que significa que no podrá utilizarse nuevamente. Desactivar solo inhabilita su uso actual, pero se mantiene disponible en la lista para su uso futuro. Para eliminarlo, haga clic en **[Eliminar]** y confirme su acción.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2Fbi9pGYOQ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kNnc1WYOBe.png)

Gracias por leer el instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300/videos](https://www.youtube.com/@posberry9300/videos)


---

---
title: Desactivar o Eliminar un Tipo de Movimiento de Stock (Web)
url: https://posberry.tawk.help/article/dar-de-baja-un-tipo-de-movimiento-de-stock-web
---

# Desactivar o Eliminar un Tipo de Movimiento de Stock (Web)

*Cómo dar de baja un tipo de movimiento de stock*

**1. ** Vaya a la sección ** [Stock]** y haga clic en **[Tipos de Movimiento de Stock]** . **2.** Utilice el filtro de búsqueda para localizar el tipo de movimiento que desea gestionar. Haga clic en su nombre en la lista de la izquierda para ver los detalles. **3.** En la parte derecha de la pantalla, desmarque la casilla **"Activa"** para desactivar el tipo de movimiento. 4. Haga clic en **[Guardar]** para confirmar los cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/j-rKDs-mDU.png)

## eliminar un tipo de movimiento de stock de manera permanente:

**IMPORTANTE:** La diferencia entre desactivar y eliminar es que eliminar un tipo de movimiento lo borra completamente de la plataforma web de Posberry y de la app, por lo que no se podrá volver a usar. Al desactivarlo, simplemente se inhabilita, pero seguirá estando en la lista por si desea utilizarlo en el futuro. Haga clic en el botón **[Eliminar]** y confirme su decisión.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nIhOsGGfLi.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qp5GIzGGNk.png)

Gracias por leer el instructivo. Para más información, vea nuestros videos tutoriales en YouTube: [https://www.youtube.com/@posberry9300/videos](https://www.youtube.com/@posberry9300/videos)


---

---
title: Inactivar Punto de Venta
url: https://posberry.tawk.help/article/inactivar-punto-de-venta
---

# Inactivar Punto de Venta

*Como Inactivar puntos de venta que no se usan*

**IMPORTANTE** : Si dejas un punto de venta activo, aunque no lo uses, el sistema te cobrará una licencia adicional en tu mensualidad.

Sigue estos pasos para desactivar un punto de venta: 1. Ve a la sección de **Configuraciones** en la web y selecciona **Puntos de Venta.** 2. Elige el punto de venta que deseas desactivar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Cn_G-n9oFg.png)

3. En las opciones, desmarca la casilla **"Activo"** y guarda los cambios. 4. Ten en cuenta que no es posible eliminar puntos de venta, solo desactivarlos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gO_2iXK4No.png)

Para más información sobre la configuración de puntos de venta, puedes visitar el siguiente instructivo: [https://posberry.tawk.help/article/editar-punto-de-venta](https://posberry.tawk.help/article/editar-punto-de-venta)

Este instructivo te permite gestionar de forma clara y sencilla los puntos de venta que no estás utilizando.


---

---
title: Editar Punto de Venta
url: https://posberry.tawk.help/article/editar-punto-de-venta
---

# Editar Punto de Venta

*Modificar los datos del Punto de Venta en la web*

1. Para editar un punto de venta, vaya a ** [Configuración] (ícono de "rueda dentada")** y seleccione el apartado **[Punto de Venta]** . Luego, elija el punto de venta que desea modificar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pkh22GtLk2.png)

2. Una vez seleccionado, en el lado derecho de la pantalla encontrará las opciones de configuración del punto de venta. 3. Desde este menú, podrá ajustar las siguientes opciones: **Número de PV:** Asigne el número correspondiente al punto de venta creado. **Pertenece a la sucursal:** Seleccione la sucursal a la que desea asociar este punto de venta. **Tipo de facturación:** Especifique el sistema de facturación que utilizará. Si no está seguro, consulte a su soporte técnico o distribuidor. **Descripción:** Asigne un nombre o descripción para identificar el punto de venta. **Tope de descuento:** Configure el límite de descuento que se puede aplicar a los productos. **Cliente determinado:** Elija un cliente específico o configure el sistema para seleccionar "consumidor final" o "cliente eventual" por defecto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/s7Jh-d4uSK.png)

**Agrupar productos idénticos:** Active esta opción para agrupar productos iguales sin repetirlos en la lista de ventas. **Forzar login al cerrar caja:** Active esta opción para que, al cerrar caja, se solicite iniciar sesión nuevamente antes de abrir el siguiente turno. **Permitir editar precio unitario:** Permite que el precio unitario de los productos pueda ser modificado. **Permitir editar cantidades:** Permite que las cantidades de los productos puedan ser ajustadas durante la venta. **Activa:** Active o desactive el punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aBZQHaC9SK.png)

**Usar pantalla al cliente:** Si desea más información sobre esta función, visite: [Pantalla al cliente](https://posberry.tawk.help/article/pantalla-al-cliente) . **Usar venta y preventa remota:** Para obtener más detalles, consulte: [Venta y preventa remota](https://posberry.tawk.help/article/venta-y-preventa-remota) . **Usar verificador de precios:** Para más información, consulte: [Verificador de precios](https://posberry.tawk.help/article/verificador-de-precios-posberry) . **Usar Pantalla al Cliente", "Usar Venta y Preventa Remota" y "Usar Verificador de Precios" tienen un costo adicional.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hg3ivg4bl6.png)

4. Después de realizar los cambios en la configuración, haga clic en el botón **[Guardar]** para aplicar los ajustes. Este formato simplifica el proceso par

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Jbl_DWH3G1.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qTPL78dki3.png)


---

---
title: Impresion de Comandas, Como Asignar Comanderas Tanto a Productos Como a Familias
url: https://posberry.tawk.help/article/impresión-de-comandas-asignar
---

# Impresion de Comandas, Como Asignar Comanderas Tanto a Productos Como a Familias

*Cómo asignar una o mas impresoras comanderas para configurar a su gusto la salida de las comandas de sus productos*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kumnxyKOBm.jpeg)

Configuración de Impresoras Comanderas Acceda a: Opciones > Configuración > Impresoras. En la sección de configuración de comanderas: Seleccione el número de comandera (1-9) en la columna izquierda. Elija la impresora asociada en la columna derecha. Para comanderas IP, seleccione la opción correspondiente (señalada con flecha roja en la imagen). Configure las impresoras comanderas IP en el área designada (marcada con un cuadro rojo). Asegúrese de activar la opción "Usar impresora de comandas en cocina" y asignar al menos una comandera para habilitar el servicio. Finalice haciendo clic en [OK]. Nota: Consulte la imagen adjunta para referencia visual de los elementos mencionados.

## Como Asignar un Producto a una Comandera

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RD28Nf1CnO.jpeg)

Asignación de Impresora a un Producto En la ventana principal, busque el producto deseado. Haga clic en el botón "Editar" luego de elegir el producto deseado. En la ventana "Datos del producto", ubique el campo "N° de Impresora" (resaltado en la imagen). Seleccione la impresora que desea asignar a este producto del menú desplegable. Para guardar los cambios, haga clic en [OK]. Nota: Esta configuración determina qué impresora se utilizará para las comandas de este producto específico. NO usará ninguna otra, ni siquiera la Comandera asignada a su Familia.

## Asignar a una Familia una Comandera

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/f2X-bXBmS8.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mButH0Kxh6.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PYP9jR2VMr.jpeg)

Asignación de Impresora a una Familia de Productos 1. Acceda a: Opciones > Stock > Listado de productos.2. En la ventana "PRODUCTOS", localice la sección de Familias en la parte superior.3. Seleccione la familia que desea modificar del menú desplegable.4. Haga clic en el botón "Editar" (icono de lápiz) junto al menú de Familias.5. En la ventana emergente "Editar Familias", busque el campo "Nro de Impresora".6. Seleccione la impresora deseada para esta familia de productos.7. Para guardar los cambios, haga clic en [GUARDAR].Nota: Esta configuración asignará la impresora seleccionada a todos los productos pertenecientes a la familia editada, optimizando el proceso de impresión de comandas por categorías de productos.

## Artículo Relacionado

Ingrese a [Impresión de comandas - Números](/article/impresión-de-comandas-números) para saber que pasa cuando asigna un número al producto y a la familia.


---

---
title: El sistema SI puede enviar precios a las balanzas
url: https://posberry.tawk.help/article/¿el-sistema-puede-enviar-precios-a-las-balanzas
---

# El sistema SI puede enviar precios a las balanzas

*¿El sistema puede enviar precios a las balanzas?*

El sistema es compatible con la transmisión de precios a balanzas. Actualmente, soporta modelos Kretz y Systel, tanto por puerto de comunicaciones como por IP. Antes de adquirir una nueva balanza o para verificar la compatibilidad de su modelo actual, le recomendamos consultar con nuestro equipo técnico.


---

---
title: Subir listado de Recetas
url: https://posberry.tawk.help/article/subir-listado-de-recetas
---

# Subir listado de Recetas

*Cómo cargar un archivo Excel con recetas actualizadas en la plataforma.*

1.Haga clic en el ícono del "carrito de compras" y luego seleccione la opción **Productos.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vbJsLixqMm.png)

2. Desplácese hacia abajo en la página hasta encontrar el apartado **Subir listado de Recetas, ** verá el botón ** [En Excel]** . Haga clic en él.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/RZ7G3nLQ4q.png)

3. La lista de recetas se descargará automáticamente en formato Excel.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iZwax56Cqn.png)

Si desea obtener más información sobre las recetas, puede consultar este instructivo: [Recetas en Posberry](https://posberry.tawk.help/article/recetas) .


---

---
title: Descargar listado de Recetas
url: https://posberry.tawk.help/article/descargar-listado-de-recetas
---

# Descargar listado de Recetas

*Cómo descargar la lista de recetas en formato Excel desde la plataforma.*

1.Haga clic en el ícono del "carrito de compras" y luego seleccione la opción **Productos.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UL10I7xoFL.png)

2. Desplácese hacia abajo en la página hasta encontrar el apartado **Descargar listado de Recetas, ** verá el botón ** [En Excel]** . Haga clic en él.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QSBS4mPFKh.png)

3. La lista de recetas se descargará automáticamente en formato Excel.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/X83hTL7-ZO.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/9NyoKbSN2S.png)

Si desea obtener más información sobre las recetas, puede consultar este instructivo: [Recetas en Posberry](https://posberry.tawk.help/article/recetas) .


---

---
title: Descargar lista de Productos Desde La Web
url: https://posberry.tawk.help/article/descargar-lista-de-productos-web
---

# Descargar lista de Productos Desde La Web

*Cómo obtener y gestionar la lista de productos en formato Excel desde la plataforma web*

1. Acceda a la sección de **productos** haciendo clic en el " **icono de carrito de compras" ** , ubicado en el menú principal.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DKVBdN11v7.png)

2. Dentro de la página de productos, desplácese hacia abajo hasta encontrar la opción **"Descargar listado de productos"** . 3. Haga clic en el botón **[En Excel]** para descargar el archivo. La lista de productos se descargará automáticamente en la carpeta de descargas de su navegador.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HY1w4gptVl.png)


---

---
title: Importar productos desde Excel
url: https://posberry.tawk.help/article/importar-productos-desde-excel
---

# Importar productos desde Excel

*Cómo subir y gestionar productos en el sistema mediante un archivo Excel.*

**1.** **Descargar el archivo de productos:** Si no sabe cómo descargar la lista de productos en Excel, consulte el artículo: [https://posberry.tawk.help/article/descargar-lista-de-productos-web](https://posberry.tawk.help/article/descargar-lista-de-productos-web)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VxbDBRoVFB.png)

**2. Preparar el archivo Excel: ** Una vez descargado, verá que algunas columnas contienen un asterisco (*), lo que indica que esos campos son obligatorios. Aquí hay una descripción de los campos clave: **Código:** Preferible que solo use números y que no tenga código de productos repetidos (campo obligatorio). **Descripción: ** Palabras y números (campo obligatorio). **Código de Barras:** Solo números (opcional). **Familia: ** Nombre o categoría del producto (opcional). **Costo:** Precio de compra del producto (campo obligatorio). **Precio de Venta:** Precio de venta al cliente (campo obligatorio). **Stock Mínimo:** Valor mínimo del inventario antes de recibir alertas (opcional). **Tope de Descuento:** Descuento máximo permitido (0-100%) (opcional). **IVA:** Impuesto sobre el producto (opcional). **Pesable:** ‘S’ para productos vendidos por peso, ‘N’ para productos no pesables (opcional). **Tipo:** ‘P’ para producto, ‘S’ para servicio, ‘I’ para insumo, ‘R’ para receta (opcional). **Activo:** ‘S’ para activo, ‘N’ para inactivo (opcional). **Impuesto Interno:** Monto del impuesto (opcional). **Publicar en la Web:** ‘S’ para mostrar en la web, ‘N’ para no mostrar (opcional). **Unidades por Bulto:** Cantidad de productos por bulto (opcional). **URL de Imagen:** Enlace a la imagen del producto (opcional).

**3. Descripción de cada columna:** **Código:** Identificador único del producto para búsqueda. **Descripción:** Nombre del producto. **Código de Barras:** Para escanear el producto al vender. **Familia:** Categoría a la que pertenece el producto (ej. SNACKS). **** **Costo:** Valor de compra y gastos del producto. **Precio de Venta:** Valor al que se vende al cliente. **** **Stock Mínimo:** Cantidad mínima de producto antes de recibir alertas de stock bajo. **** **Tope de Descuento:** Límite máximo de descuento aplicable. **** **IVA:** Define si el producto tiene IVA aplicable. **** **Pesable:** Indica si el producto se vende por peso. **** **Tipo:** Tipo de producto (producto, servicio, insumo, receta). **** **Activo:** Define si el producto está disponible para la venta. **** **Impuesto Interno:** Monto del impuesto. **** **Publicar en la Web:** Muestra o no el producto en la tienda web. **** **Unidades por Bulto:** Número de productos por bulto. **** URL de Imagen: Dirección web de la imagen del producto.

## Subir la lista de productos

**Subir el archivo a la web:** Para subir la lista de productos: Desplácese hacia abajo en la página de productos hasta encontrar el botón [Seleccionar archivo] en el apartado "Subir lista de productos" y haga clic en él. Cargue el archivo Excel de su lista de productos actualizada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wLSBfu41Cn.png)

Después de que la lista se haya subido, se mostrará un resumen de los cambios realizados, como códigos duplicados o cambios en nombres y códigos de barras en comparación con la lista anterior.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Va5Qq1O7--.png)

Además, haga clic en el botón "Mostrar detalles" para obtener información específica sobre los cambios realizados en los productos afectados.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gVBqBeAppR.png)

Una vez que haya verificado los cambios, escriba la palabra "CONFIRMO" en el campo correspondiente y haga clic en el botón [Enviar cambios].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iyJ8qRPlHi.png)


---

---
title: Recalcular Stock Desde la PC
url: https://posberry.tawk.help/article/recalcular-stock-pc
---

# Recalcular Stock Desde la PC

*Cómo Recalcular el Stock en POSBerry*

**IMPORTANTE** : El stock real es el que se muestra en la **web** . El stock en los puntos de venta es solo informativo y puede presentar errores debido a problemas de sincronización, cierres del programa durante una sincronización, o inestabilidad en la red. Por eso, existe la herramienta de **recalculo de stock.** **1. ** Haga clic en el botón **[CTRL + o]** o presione las teclas **[CTRL + o]** en su teclado. **2. ** Luego, vaya a **Stock** y seleccione **Recalcular Stock.**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gy7_VBBxex.png)

3. En la ventana emergente, puede elegir cómo aplicar el recalculo: **Completo:** Ajusta el stock de todos los productos. **Completo (rápido)** : Igual que el completo, pero con un proceso más rápido y simplificado. **Con movimientos en las últimas 24 horas** : Actualiza solo los productos que han tenido movimientos (ventas, compras) en las últimas 24 horas. **Familia favorita** : Recalcula el stock solo para los productos de las familias que ha marcado como favoritas. **De una familia específica** : Le permite recalcular el stock de una familia específica que elija de su lista.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dPDwIWBPmM.png)

4. Una vez seleccionada la opción adecuada, haga clic en **[Recalcular]** para aplicar los cambios.


---

---
title: Dar De Baja Un Producto Desde La Web
url: https://posberry.tawk.help/article/dar-de-baja-un-producto-web
---

# Dar De Baja Un Producto Desde La Web

*remover los productos que no se usan*

1. Haga clic en el apartado **Productos** (ícono del carrito de compras).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BjrU2oaWLD.png)

2. Use el buscador para encontrar el producto que desea dar de baja. A la derecha del producto, verá un ícono de **lápiz** para editar. Haga clic en él.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/W76FZONYRJ.png)

3. En la ventana emergente "Editar Producto", podrá hacer clic en el botón **Eliminar** para remover el producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YgSHVn6MX3.png)

4. Si desea desactivarlo en lugar de eliminarlo, desplácese hacia abajo en esa ventana y desmarque la opción **Activo** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Fkdf7dFP7g.png)


---

---
title: Dar de Baja un Producto Desde la PC
url: https://posberry.tawk.help/article/dar-de-baja-un-producto-pc
---

# Dar de Baja un Producto Desde la PC

*Removiendo Productos Que No Se Usan*

IMPORTANTE: Hay dos formas de dar de baja un producto desde la PC: inactivándolo o eliminándolo. 1. Primero, busque el producto que desea dar de baja y selecciónelo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bN2lbDUZ6x.png)

2. Haga clic en el botón con el **ícono de lápiz** (Editar), ubicado junto al buscador.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yYamVu47oy.png)

3. En la ventana emergente "Editar Producto", desmarque la opción **Activo** si desea inactivar el producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hS2zZNeOqc.png)

4. Si prefiere **eliminar** el producto por completo, haga clic en el botón **Eliminar** .

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zgyNjEwch6.png)


---

---
title: Ver Familias Desde La Pc
url: https://posberry.tawk.help/article/ver-familias-pc
---

# Ver Familias Desde La Pc

*Como ver las familias en POSBerry*

En la ventana principal haga clic en el botón [Opciones] luego siga hasta el menu [Stock] y luego haga clic en [Listado de Productos].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4gpxfqqtHt.png)

Puede ver la lista de familias en la parte superior, en el combo de selección.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JuPJbSago0.png)


---

---
title: Crear Una Nueva Familia Desde La Pc
url: https://posberry.tawk.help/article/nueva-familia-pc
---

# Crear Una Nueva Familia Desde La Pc

*Como crear una familia en POSBerry*

En la ventana principal haga clic en el botón [CTRL+0] luego siga hasta el menú [Stock] y luego haga clic en [Listado de Productos].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7aay_JA9p_.png)

Haga clic en el botón [+] ("editar familias") para agregar una nueva familia. En la ventana emergente, escriba el nombre de la familia. Marque el campo "Activo" para habilitar la familia. Si lo desea, puede configurar la impresora para asociarla a esta familia. También, si quiere que la familia sea favorita, haga clic en la estrella en la parte superior derecha. Para finalizar, haga clic en el botón [GUARDAR].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SVoRByWs9K.png)


---

---
title: Editar Familia Desde La Pc
url: https://posberry.tawk.help/article/editar-familia-pc
---

# Editar Familia Desde La Pc

*Como editar una familia en POSBerry*

En la ventana principal haga clic en el botón [CTRL+0] luego siga hasta el menú [Stock] y luego haga clic en [Listado de Productos].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WV3llo_JhR.png)

Puede ver la lista de familias en la parte superior, Elija la familia que quiere modificar y haga clic en el botón (🖊️) ("editar"). En la ventana emergente puede cambiar el nombre de la familia. Para finalizar haga clic en el botón [GUARDAR]. Importante: Si cambia el nombre de la familia se cambiará para todos los productos que ya la estaban usando. Es recomendable que el nuevo nombre de la familia sea solo para corregir algún error de tipeo o para abarcar mas productos. Si no es ninguno de esos dos casos quizás puede optar por crear una nueva familia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/R6R0KyzjmV.png)


---

---
title: Cómo Desactivar una Familia Desde la PC en POSBerry
url: https://posberry.tawk.help/article/dar-de-baja-una-familia-pc
---

# Cómo Desactivar una Familia Desde la PC en POSBerry

*Guía para Activar o Desactivar Familias en POSBerry Desde tu Computadora*

**Instrucciones:** Vaya al menú principal y seleccione **Menú -> Stock -> Listado de productos.** Haga clic en el botón **Editar familias.** En el panel de edición, ubique el botón Activo. Si desea desactivar la familia, asegúrese de que el campo **Activo** no esté marcado. Cuando no esté tildado, significa que la familia ha sido desactivada. **Nota** : Las familias no pueden eliminarse desde POSBerry. Para eliminarlas completamente, debe hacerlo desde la web.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mvqgvAfSYe.png)


---

---
title: Como Editar una Familia Desde La Web
url: https://posberry.tawk.help/article/editar-familia-web
---

# Como Editar una Familia Desde La Web

*Guía Rápida para Modificar Familias en la Web*

1. Haga clic en el botón "Productos" (ícono del "carrito de compras") y luego en el botón [Familias]. 2. Puede usar el buscador para encontrar una familia en particular.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/G8gk-0zS23.png)

3. Una vez seleccionada la familia que desea editar, en el panel de la derecha podrá configurarla. Aquí podrá editar el campo "Nombre de la Familia", asegurarse de que esté activada y agregar una imagen de referencia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Yx2v66f4-b.png)

Importante: Si cambia el nombre de la familia, este se actualizará para todos los productos que ya la estaban utilizando. Se recomienda que el nuevo nombre sea solo para corregir algún error de tipeo o para abarcar más productos. Si no es ninguno de esos casos, considere optar por crear una nueva familia.


---

---
title: Cómo Crear una Nueva Familia desde la Web
url: https://posberry.tawk.help/article/nueva-familia-web
---

# Cómo Crear una Nueva Familia desde la Web

*Aprende a Añadir Familias de Manera Rápida y Sencilla*

Aquí te dejo una versión más simple y organizada: 1. Abre el menú de Productos (icono del "carrito de compras"). 2. Haz clic en "Familias".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SYniMdepP1.png)

3. Selecciona "Nueva Familia" en la parte superior izquierda de la lista. 4. A la derecha, podrá editar el campo "Nombre de la Familia", asegurarse de que esté activada y también podrá agregar una imagen de referencia. 5. Para terminar, haga clic en el botón [Guardar].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jlMn-R6Jd6.png)


---

---
title: Cómo Ver Todas Las Familias Desde La Web
url: https://posberry.tawk.help/article/ver-familias-web
---

# Cómo Ver Todas Las Familias Desde La Web

*Aprende a Acceder a la Información de Familias de Manera Rápida y Eficiente*

Haga clic en el botón "Productos" (representado por el ícono de "carrito de compras"). Luego, seleccione el botón [Familias].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LdneAVO-Xd.png)

Desde esta sección, puede utilizar el buscador para encontrar una familia en particular. A la derecha, podrá ver los detalles de la familia, incluyendo su nombre y si está activa.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/58jxWoy5Y3.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rYHRqWOUVx.png)


---

---
title: Como Eliminar una Familia en Solo 2 Clics Desde la Web
url: https://posberry.tawk.help/article/dar-de-baja-una-familia-web
---

# Como Eliminar una Familia en Solo 2 Clics Desde la Web

*Elimina Familias de Forma Rapida y Eficiente en el Sistema Web*

Eliminar una familia en el sistema web es rápido y sencillo. Solo debes seguir estos pasos: Selecciona la familia que deseas eliminar. Haz clic en el botón "Eliminar". En pocos segundos habrás gestionado con éxito la eliminación de la familia.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/r_cecHoU8L.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wn7ZN4uQPH.png)

Para acceder a la sección de familias en el sistema web, sigue este enlace: [https://posberry.tawk.help/article/ver-familias-web](https://posberry.tawk.help/article/ver-familias-web) . Desde esta página, podrás gestionar todas las familias que hayas creado en el sistema.


---

---
title: Movimientos De Caja: Acceso Rapido y Acceso Personalizado
url: https://posberry.tawk.help/article/movimiento-de-caja
---

# Movimientos De Caja: Acceso Rapido y Acceso Personalizado

*Movimientos de caja Egresos e ingresos tanto rapidos como personalizados*

Los movimientos rápidos de caja le permiten gestionar fácilmente ingresos y egresos de efectivo. Siga estas instrucciones para un manejo eficiente:

**Acceso a movimientos rápidos** Encuentre los ingresos y egresos rápidos en la sección de "Accesos Rápidos".

**Realizar un movimiento** Haga clic en el tipo de movimiento deseado (ingreso o egreso). En la pantalla emergente, ingrese el valor del movimiento y añada una observación para detallar el motivo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/R8USw-_x5r.png)

**Efecto en la caja** Estos movimientos modificarán inmediatamente el saldo de la caja. Todos los movimientos se detallarán en el cierre de caja.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iK28iSCztD.png)

## Anulación de Movimientos de Caja

Para anular un movimiento, siga estos pasos: Busque el botón '+' en la esquina superior derecha de la pantalla. Haga clic en el botón '+' para abrir el menú de movimientos. Realice el movimiento opuesto por el mismo valor del movimiento que desea anular. Por ejemplo: Para anular un ingreso de $1000, haga un egreso de $1000. Para anular un egreso de $500, haga un ingreso de $500. Este proceso dejará la caja en su estado original, como si el movimiento inicial nunca hubiera ocurrido.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5On2NdsZix.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NJ0yXN_NAh.png)

Como verá, el movimiento se anulará y la caja volverá a quedar como se encontraba antes.

## Cómo Realizar un Movimiento de Caja Personalizado

Para crear un movimiento personalizado, siga estos sencillos pasos: Busque el botón '+' en la esquina superior derecha de la pantalla. Haga clic en el botón '+' para abrir el menú de movimientos personalizados. En la nueva ventana, podrá: Seleccionar el tipo de movimiento (ingreso o egreso) Ingresar el valor del movimiento Añadir información adicional o una nota sobre el movimiento Una vez completados los detalles, confirme para registrar el movimiento. Estos movimientos personalizados le permiten tener un control más detallado de sus transacciones de caja.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2F5G-gAuDI.png)

Puede utilizar movimientos de caja creados por usted desde la web. Estos movimientos personalizados también aparecerán en los accesos rápidos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HGxmdsdBKN.png)

**Visualización en el cierre de caja** Todos los movimientos, incluyendo sus observaciones, se mostrarán en el cierre de caja. Recuerde: Mantener un registro preciso de los movimientos de caja es crucial para una gestión financiera efectiva.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xtxc9vGHIE.jpg)


---

---
title: Promocion Afiliados
url: https://posberry.tawk.help/article/promocion-afiliados
---

# Promocion Afiliados

*Como configurar una promoción de Afiliados (con DNI)*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DeipQcXHaj.png)

Sube el archivo de Afiliados.txt a la web de POSBerry en Configuración > Archivos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ePvd4OcL5E.png)

Crea un tipo de clientes Afiliados.txt

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/mkpQUb7Lnf.png)

Crea un nuevo cliente PROMOCION AFILIADOS y asignale el tipo de clientes Afiliados.txt

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Prx-Q-h17v.png)

Crea una PROMOCION AFILIADOS y en "Tipo de Cliente" selecciona Afiliados.txt

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EcSj_6KFc7.png)

Al momento de vender selecciona el cliente PROMOCION AFILIADOS. (F2).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/swxelUsBHz.png)

Luego presione F2 dos veces, ingrese el DNI y presione Enter.


---

---
title: Instructivo para Borrar los Datos de POSBerry Go en Dispositivos Clover con Android 10 AOSP
url: https://posberry.tawk.help/article/instructivo-para-borrar-los-datos-de-posberry-go-en-dispositivos-clover-con-android-10-asop
---

# Instructivo para Borrar los Datos de POSBerry Go en Dispositivos Clover con Android 10 AOSP

**Introducción** Este instructivo tiene como objetivo guiar al usuario a través del proceso de eliminación de datos almacenados por la aplicación POSBerry Go en dispositivos Clover que funcionan con Android 10 ASOP.

**Pre-requisitos** Dispositivo Clover con Android 10 ASOP. La aplicación POSBerry Go debe estar instalada.

**Pasos a Seguir** **1. Ingresar a Ajustes** Desplázate por la lista y selecciona la opción Aplicaciones y notificaciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/arpuNN-IoV.png)

**2. Acceder a Aplicaciones y Notificaciones** Desplázate por la lista y selecciona la opción Aplicaciones y notificaciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/K5QRrvJXGd.png)

**3. Ver Todas las Aplicaciones** Haz clic en Ver todas las aplicaciones para visualizar la lista completa de aplicaciones instaladas en el dispositivo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WSdA22KfT7.png)

**4. Buscar POSBerry Go** Desplázate por la lista hasta encontrar la aplicación POSBerry Go y selecciónala.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qCmAjyO_VE.png)

**5. Acceder a Almacenamiento y Caché** Una vez dentro del detalle de la aplicación, haz clic en Almacenamiento y caché.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4QVhJWHBz7.png)

**6. Borrar Almacenamiento** Finalmente, presiona el botón Borrar Almacenamiento y confirma la acción para eliminar todos los datos de la aplicación. **** **Conclusión** Siguiendo estos pasos, habrás borrado exitosamente todos los datos almacenados por la aplicación POSBerry Go. Ahora tu punto de venta estará limpio y listo para reinicializar.


---

---
title: Cómo Instalar e Iniciar POSBerry en Clover: Una Guía Paso a Paso
url: https://posberry.tawk.help/article/cómo-instalar-e-iniciar-posberry-en-clover-una-guía-paso-a-paso
---

# Cómo Instalar e Iniciar POSBerry en Clover: Una Guía Paso a Paso

*Comienza a Utilizar POSBerry en tu dispositivo Clover de manera sencilla y rápida*

**Paso 1: Ingresar en Clover a "Más Herramientas"**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VWGwOajoqU.png)

En la pantalla principal de tu dispositivo Clover, busca la sección que dice "Más Herramientas" y haz clic en ella.* Busca la aplicación POSBerry e instálala.

**Paso 2: Abrir la app POSBerry**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SkOsOWwt72.png)

Una vez instalada la aplicación, ábrela. Verás una pantalla de introducción similar a la imagen adjunta.

**Paso 3: Dar Siguiente en la Intro**

Haz clic en el botón que dice "Siguiente" o en la flecha a la derecha para avanzar.

**Paso 4: Opciones de Acceso a la Cuenta**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eeGHxVmEo5.png)

Si ya tienes una cuenta, presiona el botón que dice "Tengo una cuenta". Si no tienes una cuenta, puedes crear una en [POSBerry Express](https://www.posberry.com/express/) . Después de crear la cuenta en tu PC, recibirás un código QR.

**Paso 5: Ingreso**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oWu_cVIjsm.png)

Utiliza el botón de QR en la aplicación para escanear el código. Si optas por la opción "Tengo una cuenta", introduce tus credenciales en el formato admin@empresa y tu clave. (Consejo: si no planeas crear más cuentas, te recomendamos marcar la opción de "recordar equipo").

**Paso 6: Selección de Punto de Venta**

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kbN8vW0_Q7.png)

Si tienes más de un punto de venta asociado a tu cuenta, el sistema te pedirá que selecciones a cuál punto de venta asociarás este equipo Clover.

**Paso 7: ¡Listo para Usar!**

Ahora estás listo para comenzar a usar el sistema de punto de venta de POSBerry en tu dispositivo Clover.


---

---
title: ¿Cuándo recalcular stock?
url: https://posberry.tawk.help/article/¿cuándo-recalcular-stock
---

# ¿Cuándo recalcular stock?

Generalmente no es necesario, ya que el sistema lo hace automáticamente. En el caso en particular, si realizó ventas o movimientos de stock y aún no vio reflejado en el programa los cambios. Le recomendamos primero Sincronizar (Opciones > Sincronizar) y luego realizar el cálculo de stock (Opciones > Stock > Recalcular Stock).


---

---
title: ¿Los cambios que hago en la Web no se reflejan en el punto de venta, que hago?
url: https://posberry.tawk.help/article/¿los-cambios-que-hago-en-la-web-no-se-reflejan-en-el-punto-de-venta-que-hago
---

# ¿Los cambios que hago en la Web no se reflejan en el punto de venta, que hago?

Lo primero que tiene que hacer es Sincronizar. Verifique que tenga conexión a internet y vaya a Opciones > Sincronizar. Luego si se trata de Stock, puede recalcular el stock. Vaya a Opciones > Stock > Recalcular stock.


---

---
title: POSBerry web en el celular
url: https://posberry.tawk.help/article/posberry-web-en-el-celular
---

# POSBerry web en el celular

*como agregar POSBerry web en la pantalla de nuestro teléfono celular*

debemos entrar en nuestro navegador, ir a la pagina de POSBerry, seleccionar la opcion (acceso clientes), luego nos  redireccionara a la Web-POSBerry, buscamos en abajo en nuestra pantalla y apretamos en donde dice "agregar POSBerry web a la pantalla principal"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PaJANxDIFA.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yk89Kfr3kt.jpeg)

Luego nos aparecera este mensaje, le damos en aceptar y ya tendremos instalado Web-POSBerry en nuestro celular

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TCdrOnMRcV.jpeg)


---

---
title: Cambio de Precios Masivo y por Compra
url: https://posberry.tawk.help/article/cambio-de-precios-masivo-y-por-compra
---

# Cambio de Precios Masivo y por Compra

*Como entender el cambio de precios*

## Explicación del funcionamiento de ambos métodos

Al cambiar el precio en ' Cambio Masivo de Precios ' se cambia el margen de ganancia (opcionalmente) y el precio final según la política de redondeo fijada y otras configuraciones. No se cambia el costo en este caso (salvo que marque la opción modificar precio de costo, por defecto no está marcada). Al cambiar el precio en ' Nueva Compra ' se cambia el costo del producto y el precio final según el margen de ganancia y la política de redondeo fijada en la configuración de la empresa. No se cambia el margen de ganancia en este caso.

## Posibles diferencias entre ambos métodos

Si encuentra diferencias en el precio final, lo mas probable es que esté utilizando una política de redondeo diferente en el cambio masivo de precios y en nueva compra. Le recomendamos utilizar la misma política de redondeo en este caso. En 'Cambio Masivo de Precios' se configura en la misma ventana y en 'Nueva Compra' se configura en las opciones de la empresa. Otra diferencia que puede haber es con que calculamos el precio final. En la 'nueva compra' se modifica el costo y se usa el margen de ganancia para calcular el precio final. En 'cambio masivo de precios' se puede utilizar el costo, precio de ultima compra y precio de venta. Eso puede dar diferencias también. Si utiliza el precio de costo y la misma política de redondeo no debería darle diferencias entre los dos métodos.


---

---
title: Como  Adherirse a la consulta de datos de cliente por CUIT
url: https://posberry.tawk.help/article/como-adherirse-a-la-consulta-de-datos-de-cliente-por-cuit
---

# Como  Adherirse a la consulta de datos de cliente por CUIT

*suscribirse al servicio que exporta datos de afip autocompletandolos en POSBerry*

1) primeramente deben ir a afip con su clave fiscal, e ir a la opción "Administrador de Relaciones de Clave Fiscal.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UwhXKl4KbD.png)

2) Allí, deberán ir a "Nueva Relacion", el segundo botón, y buscan en el apartado WEB SERVICES.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VN19ANe-om.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cGQcLRTeyh.png)

En Web Services deben buscar la opción " CONSULTA DE CONSTANCIA DE INSCRIPCION" y la clickea.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yJPrmHbXoX.png)

Al clickearlo, aparecerá la opción para buscar un representante, deben apretar BUSCAR y seleccionar su computador (es el mismo en donde carga sus certificados digitales) y luego confirma el servicio a adherir.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qcbXR2axU1.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lORh5e-LH1.png)

Al darle confirmar cuando ya tenga cargado el computador a adherir al servicio, da a confirmar y deberia cambiar la pagina diciendo que el permiso fue solicitado.

Si aparece esta imagen aparece es porque el servicio ya fue cargado al computador que eligió.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/atOhgxCvDm.png)


---

---
title: Como desvincular un punto de venta
url: https://posberry.tawk.help/article/como-desvincular-un-punto-de-venta
---

# Como desvincular un punto de venta

*como desvincularlo para volverlo a vincular o para cambiar el ordenador para el punto de venta*

Debemos ir a la web, entrar a configuraciones (ruedita dentada) ir a la seccion "Vinculacion" y desvincular el punto de venta que necesite

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/G9F93Dvcy1.jpeg)

en el mensaje confirmamos la desvinculacion

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0Dciq6v3-l.jpeg)

esto sirve para cambiar de ordenador el punto de venta o para volver a vincular a la misma si hay un cambio en su computadora y le aparezca este mensaje

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MLGnKP_AAI.jpeg)


---

---
title: Mercado Pago Punto de Venta QR
url: https://posberry.tawk.help/article/mercado-pago-punto-de-venta-qr
---

# Mercado Pago Punto de Venta QR

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_UwJD2Marn.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/rtbmhbbSud.png)

Para obtener el QR del Punto de Venta primero debe obtener las credenciales de mercado pago En la información de empresa en la parte inferior esta el enlace para obtener las credenciales de mercado pago haga clic en "Obtenga sus Credenciales de Mercado Pago".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/q33AmEBZqt.png)

Para obtener las credenciales haga clic en el botón activar credenciales

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fTiTzy9B6s.png)

En nombre de la app ingrese posberry En rubro ingrese el rubro de su empresa Acepte las condiciones y haga clic en enviar formulario

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8MmUoyrDf5.png)

Luego nos pedirán verificar la identidad pidiéndonos el numero de celular y una foto del documento (de ambos lados) Después de confirmar nuestra identidad se crearan las credenciales Para copiar los datos de cliente e ingresarlos en la configuración de posberry primero debemos hacer clic en Tu negocio -> Configuración -> credenciales -> Acceder

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7PrSSK3Deu.png)

Luego en la pagina de credenciales haga clic en credenciales de producción. En la pagina de credenciales copiaremos el Client ID y el Client Secret para pegar los valores correspondientes en configuración.


---

---
title: Como crear nuevo tipo de movimiento de caja
url: https://posberry.tawk.help/article/como-crear-nuevo-movimiento-de-caja
---

# Como crear nuevo tipo de movimiento de caja

*como crear egresos e ingresos de dinero personalizados*

debemos ir a la web posberry, ir a caja,  tipos de movimientos de caja y elegimos la opcion "crear nuevo tipo de movimiento"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/i9I7_xXz6M.jpeg)

1) Haz clic en el botón correspondiente y se abrirá un panel de creación en la parte derecha de la pantalla. 2) Escribe el nombre que quieres darle al nuevo movimiento en el campo "Nombre del tipo de movimiento de caja". 3) Selecciona si es un ingreso o un egreso en el campo "Tipo de aplicación". 4) Haz clic en "Guardar" para guardar el nuevo tipo de movimiento. A partir de ahora, podrás utilizar este nuevo movimiento cada vez que necesites realizar una operación de ingreso o egreso de efectivo en POSBerry.


---

---
title: Como descargar POSBerry GO desde Clover Dashboard
url: https://posberry.tawk.help/article/como-descargar-posberry-go-desde-clover-dashboard
---

# Como descargar POSBerry GO desde Clover Dashboard

*descargar por fuera de app market el sistema POSBerry GO*

debe ir a clover dash board (clover web): [https://www.la.clover.com/dashboard/login?lng=es-AR](https://www.la.clover.com/dashboard/login?lng=es-AR)

va a más herramientas

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OgS6kpDX2W.png)

va a la app market de clover

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/caYOSKt477.png)

busca la aplicacion POSBerry GO y la conecta

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OPTXbrbZIg.png)

Puede ser que para el sistema este ya instalada y deba desinstalarla primero, para ello solo apreta los 3 puntos y vuelve al ultimo paso de conectar la app

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iqjAcMRp3D.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3I7_QIoFcI.png)


---

---
title: Balanzas Kretz en linea de caja.
url: https://posberry.tawk.help/article/balanzas-kretz-en-linea-de-caja
---

# Balanzas Kretz en linea de caja.

*Con POSBerry usted podrá configurar balanzas de la marca KRETZ, para lectura de peso al momento de realizar el cobro en la caja.*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PJx_RqUgSS.jpg)

Los modelos de balanzas Kretz soportados, son: Novel Eco / Novel Eco2 / Delta / Delta Eco / Aura Eco / Elite Eco

## Modo de Conexión.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jMYPEJzgMJ.jpg)

Al igual con el caso de SYSTEL, se conecta con un cable con la configuración de la figura anterior.

## Como configurar las balanzas KRETZ para línea de caja?

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/vctjaMLdvT.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ueerY4H50Z.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_sHK2Mk_kr.jpg)

Nota Final: Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Itegra (sistema de Kretz) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con en Itegra o su hardware de Kretz le recomendamos que se comunique directamente con el soporte técnico de Kretz para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo TXT desde POSBerry en el caso de Itegra. Para cualquier problema que pueda surgir después de la importación de datos a Itegra, por favor, póngase en contacto con el equipo de soporte de Kretz, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Ver Punto de Venta
url: https://posberry.tawk.help/article/ver-punto-de-venta
---

# Ver Punto de Venta

*Listado de Puntos de Venta en la web*

Haga clic en el botón [Configuración] ("forma de rueda dentada"). Luego en el menú de la izquierda haga clic en el botón [Punto de Venta]. En la lista de puntos de venta haga clic en el nombre del punto de venta que quiere ver. A la derecha podrá ver todos los detalles.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QfNTooJyeo.png)

Nota: ahora el domicilio que se imprime en el ticket de una venta se toma de la sucursal (antes dicho correspondía al punto de venta).


---

---
title: Como hacer una Factura tipo A en Facturación electrónica
url: https://posberry.tawk.help/article/como-hacer-una-factura-tipo-a-en-facturación-electrónica
---

# Como hacer una Factura tipo A en Facturación electrónica

*como hacer una factura para responsables inscriptos.*

Para generar correctamente un comprobante electronico tipo A, debe seguir los siguientes pasos: 1) Dar de alta un cliente de tipo "RESPONSABLE INSCRIPTO" y que el cuit de este haya sido cargado correctamente. (pueden facilitar la carga de datos cargando solo el cuit en el campo cuit para que se auto complete). 2) vender a ese cliente para que hacer la factura tipo A.

Si le sale este cartel:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DboO-em2aN.jpeg)

Es porque en afip su Cuit NO esta autorizado a emitir comprobantes tipo A, debe hablar con su contador para resolverlo.


---

---
title: ¿Puedo utilizar balanza en linea de caja?
url: https://posberry.tawk.help/article/¿puedo-utilizar-balanza-en-linea-de-caja
---

# ¿Puedo utilizar balanza en linea de caja?

Si, para los productos pesables. Puede configurar un producto como pesable en la edición de productos.


---

---
title: Guía de adición rápida: atajos de teclado
url: https://posberry.tawk.help/article/guía-de-adición-rápida-atajos-de-teclado
---

# Guía de adición rápida: atajos de teclado

## Multiplicador de cantidades

Escriba **2*pizza** para agregar dos unidades del producto "pizza". También puede escribir **2*001** para agregar dos unidades del producto con código "001".

## Cargar subtotal

Escriba **$200*pizza** para agregar la cantidad de producto "pizza" que cueste en total $200. Escriba **$200*001** para agregar la cantidad de producto con código "001" que cueste en total $200.

## Siempre cargar subtotal

También puede activar en Opciones > Configuración " **Usar subtotal en carga rápida** " para usar el subtotal en vez del multiplicador de cantidades. Entonces **siempre se cargará subtotal** , sin la necesidad de agregar el símbolo monetario ($). Con la configuración activada, escriba **200*pizza ** para agregar la cantidad de producto "pizza" que cueste en total $200. Con la configuración activada, escriba **200*001** para agregar la cantidad de producto con código "001" que cueste en total $200.


---

---
title: Descargar Detalle de Saldo de Cuenta corriente por WEB
url: https://posberry.tawk.help/article/descargar-detalle-de-saldo-de-cuenta-corriente-por-web
---

# Descargar Detalle de Saldo de Cuenta corriente por WEB

*Como descargar el listado de ventas a cuenta corriente desde la web POSBerry*

Debemos seguir estos sencillos pasos: 1)Debemos ir a la web 2.0, LINK: https://app.posberry.com/ 2) Debemos ir al apartado de clientes, y seleccionar el icono de billetera en en renglón del cliente. 3) En la sección de información de cuenta corriente del cliente, clickea el boton con la leyenda "excel" para descargar el detalle de movimientos del cliente seleccionado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/T6FQZXDuf1.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yrvzAiWwSR.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gsWS01AEGx.jpeg)


---

---
title: "Cuentas Corrientes de Clientes": ¿Qué son y para qué sirven?
url: https://posberry.tawk.help/article/cuentas-corrientes-de-clientes-¿qué-son-y-para-qué-sirven
---

# "Cuentas Corrientes de Clientes": ¿Qué son y para qué sirven?

Cuando usted vende al cliente puede hacerlo en efectivo, con tarjeta de crédito, mercado pago, transferencia o cheque. Eso nosotros lo llamamos venta al contado. En cambio, si usted entrega las mercaderías a su cliente sin cobrarle en el momento, se registra la venta en la cuenta corriente del cliente, generando un saldo negativo. Ese tipo de ventas la llamamos venta a crédito. El cliente puede o no tener venta a crédito. El cliente debe estar propiamente registrado en el sistema. Se puede configurar cual es el límite de crédito del cliente. A medida que el cliente realiza compras aumenta el saldo negativo, y a medida que las paga o las cancela se salda. Puede gestionar en el programa de escritorio y en la web la cuenta corriente de cada cliente. Para mas información vea el siguiente artículo: [Vender a crédito](/article/vender-a-crédito-pc) .


---

---
title: Conexión de Balanzas Kretz Report y Systel Quora/Quora
Max
url: https://posberry.tawk.help/article/conexión-de-balanzas-kretz-report-y-systel-quoraquora-max
---

# Conexión de Balanzas Kretz Report y Systel Quora/Quora
Max

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZmathBzIBH.jpg)

Estos modelos recibirán los precios de artículos desde POSBERRY.

## NO se podrán colocar como Balanzas de linea de Caja para leer el peso .

## Conexión de balanzas, por puerto RS-232

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zXzQU2GQa0.jpg)

En el caso que conexión con equipos Omnilink por puerto serial, aplica para Balanzas Kretz Report con puerto RS-232, tal como lo muestra la imagen.

## Versiones Kretz Report con conexión TCP/IP

Se conecta la balanza a la red con un Patch Cord. En la balanza se ingresa al Menú de Configuración pulsando las siguientes teclas: ***En Kretz Report Serie 3600:*** 99999 y PRG confirmar con Entrar y con Flecha Abajo avanzar hasta Red y allí confirmamos el numero de balanza. Si hay más de una balanza numerar las mismas de forma correlativa. Configurar a continuación la dirección de IP dentro del rango que se encuentra la Omnilink. Confirmamos con Entrar. Finalizamos y salimos del Menú con Sale.

***En Kretz Report NX *** : 2° Función y * clave 99999 Entrar y con Flecha Abajo avanzamos hasta Red y allí configuramos la dirección de IP. Aquí el numero de balanza no es significativo y pueden repetirse en caso de haber mas de una balanza.

**En Kretz Report LT y Systel Quora/Quora Max:** la conexión será a través de cable USB. El sistema tomara automáticamente la conexión por lo que no habrá que modificar nada en la balanza.

Nota Final: Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) o a Itegra (sistema de Kretz) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, o en Itegra o su hardware de Kretz le recomendamos que se comunique directamente con el soporte técnico de Systel o Kretz para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry en el caso de Qendra, Systel y la correcta generación del archivo TXT para Itegra, Kretz. Para cualquier problema que pueda surgir después de la importación de datos a Qendra o a Itegra, por favor, póngase en contacto con el equipo de soporte de Systel o el soporte de Kretz, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Iniciando sesión en OrdenAr
url: https://posberry.tawk.help/article/iniciando-sesión-en-ordenar
---

# Iniciando sesión en OrdenAr

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YjldgxBD1p.jpg)

Para iniciar sesión en OrdenAr debe ingresar la dirección de IP del dispositivo en que este activo POSBerry (recuerde que debe estar abierto POSBerry al iniciar sesión) sino sabe la dirección simplemente toque el botón de conectar e la aplicación intentara encontrar el dispositivo que tenga el programa POSBerry abierto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lmLTod1Cem.jpg)

Finalmente para ingresar a la aplicación ingrese su numero de camarero y toque el botón conectar.


---

---
title: Nuevo Proveedor (Web)
url: https://posberry.tawk.help/article/nuevo-proveedor-web
---

# Nuevo Proveedor (Web)

Haga clic en el botón [Compras] ("bolsa de supermercado") y luego haga clic en [Proveedores]. Haga clic en el botón azúl [+] ("agregar").

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZkqWUPXyk2.png)

Llene los campos con los datos del proveedor. Los campos marcados con * son obligatorios. Al finalizar haga clic en el botón [OK].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CTUmwXohsf.png)


---

---
title: ¿Cómo vínculo ordenar con la PC?
url: https://posberry.tawk.help/article/¿cómo-vínculo-ordenar-con-la-pc
---

# ¿Cómo vínculo ordenar con la PC?

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CJ-nk1tntJ.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/74eizIX7rC.jpg)

Para vincular la app de ordenar con POSBerry desktop debe colocar la dirección de ip de la pc y POSBerry desktop debe estar abierto. Para saber la dirección de IP de la pc con POSBerry debe hacer clic en Opciones-> acerca de.. y en la ventana de acerca de haga clic en la pestaña de servicios y copie la dirección de http hasta el 8000/ como se ve en la imagen de OrdenAr. Otra opción es tocar el botón conectar mientras POSBerry desktop este abierto la app intentara buscar la aplicación de POSBerry para conectarse.


---

---
title: Como configurar las comanderas ip en POSBerry
url: https://posberry.tawk.help/article/como-configurar-las-comanderas-ip-en-posberry
---

# Como configurar las comanderas ip en POSBerry

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wRiWPIpych.png)

Haga clic en Configuración, en la pantalla de configuración vaya a la pestaña Impresoras. Haga clic en el botón [+] situado en la parte superior derecha, al lado del botón [?].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0yGHSRWRlb.png)

A continuación haga clic en el botón Agregar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kYSqLIGgvk.png)

Escriba la dirección IP de la impresora. Luego haga clic en Guardar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/81bSSdBhCT.png)

Haga clic en Guardar nuevamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/bHsIlYN6bh.png)

Ya puede seleccionar la impresora tanto como impresora de tickets en la parte superior, o debajo como impresora de comandas de cocina.


---

---
title: Modificar ticket
url: https://posberry.tawk.help/article/modificar-ticket
---

# Modificar ticket

*agregar y/o modificar logo, encabezados y pies de pagina*

debe ir a la web, entrar a configuraciones (ruedita dentada) ir al apartado "ticket" y modificar esos campos a eleccion, estos saldrán en el ticket

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HMAtKIyD_J.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NjZB4fKPKZ.jpeg)


---

---
title: Como agregar IVA 21% a uno o mas productos
url: https://posberry.tawk.help/article/como-agregar-iva-21-a-uno-o-mas-productos
---

# Como agregar IVA 21% a uno o mas productos

Debemos tener en cuenta que si un producto si tiene iva 0, este o estos productos con dicho iva NO tendran percepciones de iva en sus ventas, trayendole problemas contables.

Para agregar iva 21% a uno o mas productos debe descargar el listado excel de productos de la web, allí tendrá una columna llamada "IVA", ahi debe modificar su porcentaje de iva. Para hacer mas facil la carga de iva, pueden usar un filtro en la columna "IVA" para que les muestre todos los productos con iva 0.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4MtHCxMhDJ.jpeg)


---

---
title: Como Conectar la balanza Systel Cuora Max
url: https://posberry.tawk.help/article/como-conectar-la-balanza-systel-cuora-max
---

# Como Conectar la balanza Systel Cuora Max

Debemos conectar la balanza a la Computadora,si tiene Qendra y POSBerry instalados en las misma computadora NO debe tener las dos aplicaciones funcionando al mismo tiempo, ya que estos bloquearan el puerto de la balanza.

Debe configurar el ID de su balanza al numero 20, siguiendo los pasos mostrados en la imagen:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/TS59UQcVov.png)

la conexión será a través de cable USB. El sistema tomara automáticamente la conexión por lo que no habrá que modificar nada mas que el ID en la balanza.

Nota Final: Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, le recomendamos que se comunique directamente con el soporte técnico de Systel para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry. Para cualquier problema que pueda surgir después de la importación de datos a Qendra, por favor, póngase en contacto con el equipo de soporte de Systel, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Cuentas verificadas: Operadores
url: https://posberry.tawk.help/article/cuentas-verificadas-operadores
---

# Cuentas verificadas: Operadores

*cuenta no verificada.*

A partir de la fecha, es obligatorio registrar una dirección de correo electrónico válida al momento de crear una nueva empresa en el sistema. Esta medida se ha implementado con el objetivo de mejorar la seguridad y la gestión de las cuentas de nuestros usuarios. La dirección de correo proporcionada será utilizada para los siguientes fines: Recuperación de contraseña: En caso de que el usuario olvide su contraseña, podrá utilizar la función de recuperación a través de su email. Reseteo de contraseña: Si se requiere un reseteo de la contraseña por cualquier motivo, este se realizará mediante instrucciones enviadas al correo electrónico registrado. Validaciones y verificaciones: El correo electrónico será empleado para cualquier validación necesaria o para la configuración de la verificación en dos pasos, aumentando así la protección de las cuentas.


---

---
title: Como configurar balanza
url: https://posberry.tawk.help/article/como-configurar-balanza
---

# Como configurar balanza

Es muy importante tener en cuenta para la configuración, la marca y modelo de balanza a operar, ya que de eso dependerá el buen desempeño o nó del dispositivo. Las marcas soportadas por defecto por el sistema son: Kretz Novel Eco 2 Kretz Report NX Kretz Aura Eco Systel Cuora Max **En algunos casos será necesario usar el Software Itegra para verificar la comunicación entra la balanza y la PC/Sistema.

## Configuración de sistema para impresión de ticket/etiqueta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cFYkkBMAQR.png)

Para esta configuración, la balanza debe estar en modo DATOS -> COMUNICACIÓN. En el sistema, Ingresar en: Opciones -> Stock -> Listado de productos

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nBIFZz4VmN.png)

Posteriormente, al abrir la pantalla: Enviar a balanza-> Seleccionar el puerto de la balanza y modelo de balanza. Posteriormente, seleccionar los productos de acuerdo al filtro que se requiera para enviar: familia, solo activos, fraccionables, etc. Una vez seleccionado el filtro, pulsar sobre el botón ACTUALIZAR: Confirmar la acción de envío de productos a la balanza y esperar la transmisión de datos. Una vez finalizado el proceso pulsar sobre OK.

## Configuración de balanza y sistema en línea de caja.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_Lg4F4_Av9.png)

Para esta configuración, la balanza debe estar configurada en modo LECTURA O TRANSMISION CONTINUA DE PESO. En Posberry: Opciones -> Configuración -> Dispositivos -> Usar Balanza -> Seleccionar.

Nota Final: Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) o a Itegra (sistema de Kretz) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, o en Itegra o su hardware de Kretz le recomendamos que se comunique directamente con el soporte técnico de Systel o Kretz para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry en el caso de Qendra, Systel y la correcta generación del archivo TXT para Itegra, Kretz. Para cualquier problema que pueda surgir después de la importación de datos a Qendra o a Itegra, por favor, póngase en contacto con el equipo de soporte de Systel o el soporte de Kretz, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Como importar en el Qendra el CSV que se exporta desde POSBerry
url: https://posberry.tawk.help/article/como-importar-en-el-qendra-el-csv-que-se-exporta-desde-posberry
---

# Como importar en el Qendra el CSV que se exporta desde POSBerry

Primero debemos generar la exportación desde POSBerry, esto es desde el menu Stock->Listado de Productos, filtramos los datos que queremos exportar, y usamos la Exportación [Balanza CSV]

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dk94lB-O5M.png)

Descargue el Qendra desde la pagina de Systel. Una vez instalado (y si es la primera vez en abrir), ingrese al sistema con el usuario: admin, clave: 1234 Una vez dentro del mismo, ingrese a la siguiente opción del Asistente de Importación

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/q2JtQgfURV.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/g2K407tB2V.png)

Presione click en [Siguiente]

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NU2bRavwx4.png)

Seleccione las opciones como están en la imagen de arriba

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fQ-onWSBc9.png)

Seleccione el archivo previamente guardado (cuando exporto los datos CSV de POSBerry en el primer paso)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/LEaEYrcqRE.png)

Seleccione las opciones como están en la imagen de arriba

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0nhB7JwjZe.png)

Se verá una vista previa de sus productos exportados, como se ve en esta imagen de arriba

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sE2QIXIksA.png)

Seleccione los campos para relacionar en la importación como estan en en la imagen de arriba, preste atención que hay dos campos de valor fijo, la sección (puede elegir la más conveniente para su negocio) y el tipo de valor (seleccionamos Peso). Los otros campos como estan en la imagen, solamente los campos que están en el recuadro rojo, los demás no son necesarios. Presione el botón [Siguiente]

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FSIKJFiZQV.png)

Ya es el ultimo paso de la importación, y debería conseguir importar los productos al Qendra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Cfa9OY-iwu.png)

Finalmente revise en el listado de productos, si efectivamente están todos los productos que desea transmitir a la balanza, antes de transmitirlos.

**Nota Final:** Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, le recomendamos que se comunique directamente con el soporte técnico de Systel para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry. Para cualquier problema que pueda surgir después de la importación de datos a Qendra, por favor, póngase en contacto con el equipo de soporte de Systel, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Como importar el archivo CSV de POSBerry a qendra
url: https://posberry.tawk.help/article/como-importar-el-archivo-csv-de-posberry-a-qendra
---

# Como importar el archivo CSV de POSBerry a qendra

*cargar los productos de POSBerry a balanza systel a través de importar el CSV a Qendra*

Primero debemos descargar el CSV, yendo al boton MENÚ (CTRL+O), vamos a stock-> listado de productos, y elegimos la opcion "Balanza CSV", guardamos el documento que genera y abrimos el Qendra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yVtcvOpdOo.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BIvB8uBEMy.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/86EUIHB3yh.jpeg)

## Configuracion Qendra:

(antes de iniciar la importacion de datos es importante que tanto el Qendra como la balanza esten limpias de productos y tengan creada una sección), y que la balanza tenga en su ID el numero 20

debemos ir a "archivo" -> "Importar" -> "Asistente de importacion"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nfdxTXKzjG.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/EdkmExA1ag.jpeg)

hacemos click en siguiente

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Sgl5xdAyEh.jpeg)

elegimos las mismas opciones que en la imagen:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_Ej1Lv5Ugu.jpeg)

hacemos click en el boton señalado y seleccionamos el archivo CSV que bajamos de posberry

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FbVvqZOkI6.jpeg)

damos click en abrir y luego en siguiente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/n6anqsYU3y.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sQsK8pVfaL.jpeg)

luego debemos elegir estas opciones 1(en la seleccion de delimitado puede elegir "(;)") 2(primera fila como titutos activa) y lueog dar en siguiente

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/U5MuVvSzn1.jpeg)

en la siguiente ventana debe hacer click en la flecha al costado de cada cuadro de texto y elegir las opciones como esta en la imagen (cuando seleccionemos valor fijo se abrira ese otro cuadro de texto, este corresponde a la sección creada anteriormente, ese nombre variará dependiendo como llamó a la sección)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NVD7weU4Sa.jpeg)

a continuacion Qendra nos dirá si hay algun error en la carga de datos, apareciendo el listado, damos click en siguiente

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/empcNe846D.jpeg)

luego nos dirá cuantos registros se importaron y cuantos no se importaron por contener errores, damos click en iniciar

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QVWdijaLNS.jpeg)

Luego de dar click en iniciar, enviará los datos, al finalizar, debe enviar las novedades a la balanza para que se efectúe el importe de datos.

**Nota Final:** Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a Qendra (sistema de Systel) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, le recomendamos que se comunique directamente con el soporte técnico de Systel para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry. Para cualquier problema que pueda surgir después de la importación de datos a Qendra, por favor, póngase en contacto con el equipo de soporte de Systel, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: Como importar en el iTegra el txt que se exporta desde POSBerry
url: https://posberry.tawk.help/article/como-importar-en-el-itegra-el-txt-que-se-exporta-desde-posberry
---

# Como importar en el iTegra el txt que se exporta desde POSBerry

## CONFIGURACIÓN BALANZA:

Primero se crea el departamento

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5ymonTLPuy.png)

Debemos Verificar en “Todos” sino existe un departamento 1. Sino Agregar con numero “1” y nombre. Luego en configurar equipo, se hace click en algún numero.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZsRdayP6aD.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/W9ymZcUfmA.png)

Se carga el Modelo, la IP, puerto (el mismo de la imagen), se selecciona el departamento 1 en “Pertenece”. Y por último guardar. Seguir la imagen de guia. Al guardar debería conectar con la balanza, sino debe verificar los datos cargados

## COMO IMPORTAR:

Abrimos el menú Archivo como en la imagen y seleccionamos "en desde archivo"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OXPmSXH49H.png)

Debemos Cargar los datos indicados como las imagenes muestran

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-jJ6ZFCLnL.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eg49wzE1EE.png)

Luego hacemos click en “Guardar” y por ultimo en “Importar”. (En “Codigo de barras” se puede ver el formato que se va a imprimir en la balanza)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/2vCJHm9xQQ.png)

**Nota Final:** Hemos hecho todo lo posible para asegurar que la exportación de datos desde POSBerry a iTegra (sistema de Kretz) sea lo más sencilla y efectiva posible. No obstante, si experimenta problemas o inconvenientes específicos relacionados con Qendra o el hardware de Systel, le recomendamos que se comunique directamente con el soporte técnico de Kretz para resolver cualquier asunto pendiente. Es importante mencionar que nuestra responsabilidad se limita a la correcta generación del archivo CSV desde POSBerry. Para cualquier problema que pueda surgir después de la importación de datos a Qendra, por favor, póngase en contacto con el equipo de soporte de Kretz, ya que la venta y el soporte de sus equipos lo realiza otra empresa.


---

---
title: El sistema acepta codigos QR para realizar cobros?
url: https://posberry.tawk.help/article/el-sistema-acepta-codigos-qr-para-realizar-cobros
---

# El sistema acepta codigos QR para realizar cobros?

Si, con el sistema de Mercado Pago para eso debe seguir los pasos apropiados en la configuración para activar el sistema de QR de Mercado Pago.


---

---
title: ¿Puedo usar balanzas que imprimen tickets y códigos de suma?
url: https://posberry.tawk.help/article/¿puedo-usar-balanzas-que-imprimen-tickets-y-códigos-de-suma
---

# ¿Puedo usar balanzas que imprimen tickets y códigos de suma?

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YYkOvCrePV.jpg)

La respuesta es SI. POSBerry está diseñado para trabajar con envío de precios y códigos de productos a balanzas definidas, así como también para trabajar con PESO CONTINUO en línea de caja.

## Modelos de balanzas.

Actualmente POSBerry esta homologado para trabajar con las siguientes marcas y modelos:

## Kretz Novel Eco 2

## Kretz Report NX

## Kretz Aura Eco

## Systel Cuora MAX


---

---
title: Excel de precios con Proveedores
url: https://posberry.tawk.help/article/excel-de-precios-con-proveedores
---

# Excel de precios con Proveedores

*Como utilizar el excel de precios con la columna de proveedores*

Para acceder al excel de precios con proveedores, deben hacer los siguientes pasos: 1) acceder a la web 2.0, Link: https://app.posberry.com/ 2) descargar el excel de precios yendo a "Productos"->"listado". 3) para hacer mas facil el uso del excel con el proveedor, pueden usar un filtro en la columna "proveedores" para que solo le muestre los productos de ese proveedor en particular.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_Vx2LfT5nc.jpeg)


---

---
title: Que sucede al cambiar el Cuit o Razon social
url: https://posberry.tawk.help/article/que-sucede-al-cambiar-el-cuit-o-razon-social
---

# Que sucede al cambiar el Cuit o Razon social

*Pasos a seguir para cambiar correctamente el cuit de la empresa*

Se debe tener en cuenta, Importante: 1) Se deben INACTIVAR TODOS LOS PUNTOS DE VENTA, ya que estos estan trabajando con el cuit antiguo. link de como inactivar puntos de venta: https://posberry.tawk.help/article/inactivar-punto-de-venta 2) Se debe cambiar el cuit en la web-> configuraciones-> empresa y se deben guardar los cambios. 3) Se deben DAR DE ALTA NUEVOS PUNTOS DE VENTA, ya que estos estaran trabajando con el cuit que cargaron anteriormente.

IMPORTANTE: NO se puede cambiar el cuit con el que trabajan los puntos de venta antiguos, solo se pueden dar de alta nuevos puntos de venta que trabajen con el nuevo cuit cargado.


---

---
title: Confirmar Pago Manualmente En Mercado Pago QR
url: https://posberry.tawk.help/article/confirmar-pago-manualmente-en-mercado-pago-qr
---

# Confirmar Pago Manualmente En Mercado Pago QR

Para activar esta función, debe hacer lo siguiente: 1) Abrir opciones en el punto de venta LOCAL ( NO web). 2) ir al apartado "integraciones". 3) Tildar la opcion "permitir pago manualmente".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dHc3JRcGw7.jpeg)

Al cobrar una venta con Mercado Pago QR, luego de esperar unos segundos con la ventana del qr abierto, aparecerá el botón "CONFIRMAR", al pulsarlo, tendrá un campo donde cargar el numero de operación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SiVOw1cLEZ.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nGTIrnR9pJ.png)


---

---
title: Eliminar cliente desde (web)
url: https://posberry.tawk.help/article/eliminar-cliente-desde-web
---

# Eliminar cliente desde (web)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eoBxGJANk8.png)

Para eliminar un cliente tiene que en la pagina de cliente en el listado de clientes hacer click al bóton de eliminar


---

---
title: Como Reconfigurar puerto de impresora interna en Epson Cash Register
url: https://posberry.tawk.help/article/como-reconfigurar-puerto-de-impresora-interna-en-epson-cash-register
---

# Como Reconfigurar puerto de impresora interna en Epson Cash Register

Paso 1, editar las propiedades de la impresora EPSON-TM en el linux, para ello, deben ir a mas herramientas-> administracion de impresoras.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tEEuesvmV8.jpeg)

paso 2: despues de entrar en propiedades, en "URI del dispositivo:" hacemos click en cambiar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-iWGB0wVWf.jpeg)

Paso 3: elegir el que dice EPSON TM/BA y darle aplicar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/c8tbwnLoUu.jpeg)


---

---
title: Verificador de Precios POSBerry
url: https://posberry.tawk.help/article/verificador-de-precios-posberry
---

# Verificador de Precios POSBerry

*Como utilizar la función de verificador de precios que provee POSBerry*

Debemos ir a la web y seguir los siguientes pasos: 1) Ir a configuraciones, punto de venta. 2) Seleccionar el punto de venta al cual activar la función. 3) Tildar la opción " Verificador de precios" y guardar cambios.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3typ9FQ5e3.jpeg)

En el sistema, deberán seguir los siguientes pasos: 1) Deben ir al boton Menu y elegir la opcion "Acerca de..." 2) eligen la pestaña de "Servicios". 3) hacen click en alguno de los dos links que se facilitan de "Verificado de Precios". 4) copian y pegan ese link en la computadora donde desean utilizarlo. 5) SIEMPRE tanto la computadora con el sistema instalado como la computadora la cual utilizará el link para los clientes, deben estar bajo la misma red wifi y no deben tener bloqueos de proxy y/o de Firewall.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/V249JACxMJ.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/jnCWwapU1_.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/XtZv-hoB-8.jpeg)

El cliente debe hacer 2 sencillos pasos: 1) escanear el codigo del producto. 2) leer el precio mostrado.


---

---
title: Instalar comandera de formatos 80mm y 57mm
url: https://posberry.tawk.help/article/instalar-comandera-de-formatos-80mm-y-75mm
---

# Instalar comandera de formatos 80mm y 57mm

*Como instalar la MAYORIA de impresoras comanderas*

Con el siguiente enlace de los drivers de genéricos de 3nstar, se pueden dar de alta la mayoria de impresoras comanderas, los pasos son: 1) Instalar estos drivers: http://3nstar.com//wp-content/uploads/2017/08/3nStar-RPT005-008-010-Drivers-2017.zip 2) Luego de instalarlos, se abrirá una pestaña en la cual le pedira que especifique los datos de su comandera, si su comandera tiene cortadora de papel, elije las opciones con una C (cutter), caso contrario solo elige las opciones de la izquierda. 3) Puede probar la opción de "Check USB Port" para saber en que puerto esta su impresora (no funciona en el 100% de los casos).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lEFeJJM5nu.jpeg)

4) Deben dar de alta su impresora con la opcion "Other" en la opción "Printer Interface: " dando click en el botón "Install Now". 5)  Se abrirá una ventana que le preguntará en ingles si desea configurar su impresora ahora, hace click en "SI". 6) Te llevará a las configuraciones de la impresora dada de alta, van a puertos, y seleccionan el puerto de su comandera, normalmente son los que dicen USB 7) una vez termina el proceso, imprima una hoja de prueba en el "General" en las propiedades de su impresora, si todo quedo ok saldra la impresion. 8) Si NO imprime, revise si el puerto fue asignado correctamente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/YiN6nj_zft.jpeg)

IMPORTANTE: No todas las impresoras comanderas pueden ser instaladas con este driver generico, en caso de no lograrlo, debe descargar los drivers originales del fabricante.


---

---
title: Agregar/quitar favoritos (PC)
url: https://posberry.tawk.help/article/agregarquitar-favoritos-pc
---

# Agregar/quitar favoritos (PC)

*Como agregar o quitar un producto de favoritos*

Para agregar productos a favoritos, sigue estos sencillos pasos: 1. Ve a la página principal y usa el buscador para encontrar el producto que quieres agregar. 2. Una vez que lo hayas encontrado, haz clic en él. 3. Luego, busca el botón gris con un lápiz (🖊️) y haz clic en él para editarlo. 4. Una vez que hayas hecho clic en el botón de edición, el producto se agregará automáticamente a tus favoritos, los cuales podrás encontrar en el panel de la derecha. ¡Así de fácil!

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/cV1enqMrCT.jpeg)

1. Abra la ventana "Productos". 2. Haga clic en la estrella ubicada en la parte superior derecha para marcarlo como favorito. 3. Si desea personalizar el nombre que aparecerá en el panel de favoritos, escriba el texto deseado en el campo "Texto Panel". 4. Haga clic en "Guardar" para finalizar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/yAY61-R10J.jpeg)

1. Escriba el nombre que desea ver en el panel de favoritos en el campo "Texto Panel". 2. Haga clic en el botón "Aceptar". Para quitar un producto de la lista de favoritos: 1. Repita los mismos pasos y desmarque la casilla de favoritos. 2. El elemento será ocultado de la lista de favoritos la próxima vez que abra la aplicación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/HEtEBAV9W4.jpeg)


---

---
title: impresora Fiscal TM900 por Red
url: https://posberry.tawk.help/article/impresora-fiscal-tm900-por-red
---

# impresora Fiscal TM900 por Red

*Como conectar nuestra fiscal TM900 por ip*

primero necesitaremos tener la aplicación FPTERMINAL, luego deben tener conectada su impresora fiscal, encencida y haber configurado sus preferencias en dicha aplicación.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Ec1vcQC3HT.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ak4PmqkNSA.jpeg)

una vez la impresora esté lista para usarse con la app, debe ir a "configuracion" y abrir sus opciones, lo primero es saber que ip tiene nuestra conexion y que gateway (puerta de enlace) tiene nuestra red, para ello debemos entrar al cmd o simbolo del sistema ( buscar en barra de busqueda en caso de desconocer que es) y dentro del simbolo del sistema debemos escribir " IPCONFIG", apretamos ENTER y allí nos dirá que puerta de enlace tenemos, este tiene que coincidir con la ip que configuremos en la fiscal, por ej: si tengo una puerta de enlace 192.168.0.1 la ip de mi fiscal tiene que ser 192.168.0.x (en la x podemos elegir un numero entre 1 hasta 250 para nuestra fiscal, es el unico numero variable)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SBfUHjUwZy.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/z86QAVcfBT.jpeg)

luego de configurar la ip debemos enviarla a la fiscal apretando el boton send.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WeKkhaDjdc.jpeg)

a continuacion debemos ir a "GET IP: NETWORK", apretar SEND y este nos tiene que decir la IP que configuramos, si configuramos 192.168.0.241 en "SET IP: NETWORK" esta nos debe salir al apretar SEND de nuevo en GET IP

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SOZw8pjMwA.jpeg)

IMPORTANTE: luego de estos cambios debe reiniciar la fiscal y la computadora

## Configurar en posberry:

debe tener su punto de venta con tipo de impresión "FISCAL", luego debe ir a su sistema de escritorio, hace click en menú, va a configuraciones, se dirige al apartado impresoras, elige el protocolo: "EPSON 22DA GEN HTTP" y en IP escribe la ip que configuró para su sistema, luego cierre y abra el sistema.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/E7u1tRtCcz.jpeg)


---

---
title: Balanza
url: https://posberry.tawk.help/article/balanza
---

# Balanza

Para acceder a la balanza haga clic en el botón [Opciones > Ventas > Balanza]

Busque el producto a pesar en la barra de búsqueda [barra superior]

En la parte inferior están las opciones de Impresión. Para imprimir la etiqueta elija la impresora y el formato. Finalmente haga clic en Imprimir.


---

---
title: Como optimizar Windows 10 para mejor rendimiento en la PC
url: https://posberry.tawk.help/article/como-optimizar-windows-10-para-mejor-rendimiento-en-la-pc
---

# Como optimizar Windows 10 para mejor rendimiento en la PC

*Como bajar la calidad de graficos de windows para mejorar rendimiento*

Para mejorar la velocidad de POSBerry y otras aplicaciones, sigue estos pasos: 1. Busca en la barra de tareas de Windows el "Configurador de búsqueda" y escribe "configuración avanzada del sistema". 2. Selecciona "Ver configuración avanzada del sistema". 3. En la ventana emergente, busca y haz clic en "Configuración" en el apartado de "Rendimiento". 4. Selecciona "Ajustar para obtener el mejor rendimiento". 5. Haz clic en "Aplicar" y luego en "Aceptar".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NvcookBYuX.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/e2j3r3Rt45.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/eN4kAjTlwT.jpeg)


---

---
title: Como puedo cobrar con dos o más medios de pago en una misma venta
url: https://posberry.tawk.help/article/como-puedo-cobrar-con-2-medios-de-pago-en-una-misma-venta
---

# Como puedo cobrar con dos o más medios de pago en una misma venta

*Mercado pago y efectivo, efectivo y tarjetas, etc.*

Para cobrar una venta en POSBerry desktop, es necesario ingresar el total de cada medio de pago. Por ejemplo, si el total de la venta es de $300 y el cliente paga $100 con efectivo, $100 con tarjeta y $100 con transferencia, debe agregar una nueva línea de pago para cada medio presionando el botón "+" y seleccionando el tipo de pago correspondiente. Los detalles de cada pago pueden ser vistos en la información de la venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qwvogAIL_x.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/GFFjdZB4Zx.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zr7OMrkq6m.jpeg)

## IMPORTANTE: Se recomienda utilizar hasta 4 lineas de pagos.


---

---
title: Dar de baja Proveedor (PC)
url: https://posberry.tawk.help/article/dar-de-baja-proveedor-pc
---

# Dar de baja Proveedor (PC)

Para dar de baja a un proveedor, siga estos pasos: 1. Abra la aplicación POSberry 2. Haga clic en la opción "Opciones" 3. Seleccione la sección "Compras" 4. Haga clic en "Listado de proveedores" 5. Busque el proveedor que desea dar de baja en la lista y selecciónelo 6. Haga clic en el botón "Dar de baja" o "Eliminar" (seria recomendable solo darlo de baja, pero tambien puede eliminarlo).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oWiSg7v-FH.jpeg)

En la pantalla del listado de proveedores seleccione el proveedor y haga clic en editar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/65Tz4v7ITf.jpeg)

En la pantalla de edición de proveedor desmarque la casilla activo y haga clic en OK.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/csaU-Cdome.jpeg)


---

---
title: ¿Qué hacer cuando afip deja de funcionar?
url: https://posberry.tawk.help/article/¿qué-hacer-cuando-afip-deja-de-funcionar
---

# ¿Qué hacer cuando afip deja de funcionar?

Cuando los servidores de afip se caen, tenemos dos formas de seguir facturando:

## 1) Punto de venta Caea

Para que puedas informar todas tus ventas a AFIP luego de no tener conexion a internet, es importante que tengas activado el Punto de Venta CAEA de contingencia. De esta forma, todas las ventas que realices durante ese periodo quedarán guardadas y serán informadas automáticamente cuando se restablezca la conexión con AFIP. Si deseas obtener más información sobre cómo configurar el Punto de Venta CAEA en POSberry, puedes visitar el siguiente enlace: [https://posberry.tawk.help/article/configurar-caea](https://posberry.tawk.help/article/configurar-caea)

## 2) Vender a eventual y luego convertir esa venta a consumidor final

Primero, cambie al cliente eventual y continúe facturando de esa manera. Cuando pueda generar y enviar sus comprobantes electrónicos, vaya a las ventas que son de tipo PSP que desea convertir a tipo FCC o FCB y conviértalas. Si desea saber cómo convertir los PSP en FCC o FCB, visite el siguiente enlace: https://posberry.tawk.help/article/como-convertir-los-presupuestos-en-facturas.


---

---
title: ¿Cómo puedo crear camareros en el sistema?
url: https://posberry.tawk.help/article/¿cómo-puedo-crear-camareros-en-el-sistema
---

# ¿Cómo puedo crear camareros en el sistema?

Para agregar camareros en la aplicación siga estos pasos: 1. Vaya a Opciones 2. Seleccione "Ventas" 3. Seleccione "Listado de camareros" 4. Haga clic en el botón [+] para agregar un nuevo camarero. 5. Se abrirá la ventana de nuevo camarero. Ingrese los datos correspondientes. 6. Haga clic en OK para crearlo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/CQ9Mt_GrZY.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JlXMfhNf_e.jpeg)


---

---
title: Nuevo tipo de clientes Local (pc)
url: https://posberry.tawk.help/article/nuevo-tipo-de-clientes-local-pc
---

# Nuevo tipo de clientes Local (pc)

Debe dirigirse a "Ventas"-> "Listado de clientes", al hacer click, se abrirá la pestaña de listado de clientes.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kTNdp85Jsj.jpeg)

Al hacer click en el boton señalado, podra cargar el nombre del nuevo tipo de cliente, lo guarda y ya tiene su nuevo tipo de cliente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/s3kLkGTuLQ.jpeg)


---

---
title: ¿Se pueden crear distintos operadores?
url: https://posberry.tawk.help/article/¿se-pueden-crear-distintitos-operadores
---

# ¿Se pueden crear distintos operadores?

Si, puede crear mas operadores desde la página de configuración web. Puede crear cajeros, administradores, encargado de stock, etc. Los que necesite.


---

---
title: IVA Ventas (PC)
url: https://posberry.tawk.help/article/iva-ventas-pc
---

# IVA Ventas (PC)

Para obtener el archivo IVA Ventas directamente desde el punto de venta, siga los siguientes pasos:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/g5B0A7o5pp.jpeg)

En la sección Opciones: 1. Seleccione Ventas. 2. Luego IVA Ventas

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OFN7suwNrW.jpeg)

3. Elija el rango de fecha que desea consultar. 4. Haga clic en MOSTRAR. 5. Con las ventas en pantalla, presione en EXPORTAR.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ZxNgGFxSfu.jpeg)

7. Seleccione una carpeta o directorio en donde guardará el archivo. 8. Asigne un nombre para identificarlo. 9. Presione Guardar. 10. De vuelta en la pantalla del sistema, presione en CANCELAR y continúe operando como de costumbre.


---

---
title: Agregar Impresora POSBerry Go
url: https://posberry.tawk.help/article/agregar-impresora-posberry-go
---

# Agregar Impresora POSBerry Go

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MME5tNN0dp.jpg)

Para agregar una impresora toque el botón del menú y luego en configuración.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/12F_h8VVr2.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ydkvB5O_c4.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JzpM8ry0C6.jpg)

Para agregar una nueva impresora, siga los siguientes pasos: 1. En la pantalla de lista de impresoras, toque el botón naranja "Agregar nueva impresora". 2. En la pantalla de nueva impresora, ingrese los datos correspondientes como el nombre de la impresora y la dirección IP. 3. Una vez ingresados los datos, toque el botón "Guardar". 4. La nueva impresora agregada se mostrará en la lista de impresoras disponibles.


---

---
title: Editar producto POSBerry Go
url: https://posberry.tawk.help/article/editar-producto-posberry-go
---

# Editar producto POSBerry Go

*Como editar productos en POSBerry Go*

Para editar un producto en POSBerry, siga estos pasos: 1. Toque el botón de las tres rayas en la esquina superior izquierda de la pantalla. 2. Seleccione la opción "Productos" en el menú desplegable. 3. Busque el producto que desea editar y toque en su nombre para acceder a su información detallada. 4. Edite la información necesaria, como el nombre del producto, la descripción, el precio y demás información. 5. Guarde los cambios realizados tocando el botón "Guardar".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MEJhP5dNeb.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dRjEiK2kOB.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gfVuVG7fqw.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tE17vEySRp.jpeg)


---

---
title: Como saber cuanto debo Pagar?
url: https://posberry.tawk.help/article/como-saber-cuanto-debo-pagar
---

# Como saber cuanto debo Pagar?

*como saber cual es el monto a pagar actual del servicio POSBerry*

Para conocer el monto del próximo pago que debe realizar por el servicio en POSBerry, siga los siguientes pasos: 1. Ingrese a la web de POSBerry. 2. Haga clic en el icono de configuraciones (rueda dentada). 3. Seleccione la opción de "Pagos". 4. En la pantalla se mostrará el monto del próximo pago a vencer. Recuerde que este es el monto que debe pagar para seguir utilizando los servicios de POSBerry.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Rnhgy76vJ-.jpeg)


---

---
title: Motos delivery
url: https://posberry.tawk.help/article/motos-delivery
---

# Motos delivery

*Como crear y editar motos delivery*

Debemos ir al punto de venta POSBerry, clickeamos el boton Menu, vamos a ventas y elegimos la opción "Delivery (motos)".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AXh8d-xHDB.jpeg)

al seleccionar "Delivery (motos)", se abrirá la ventana "Listado delivery". Para crear un nuevo delivery, haz clic en el botón "+" y para editar un delivery existente, selecciona el delivery y haz clic en el botón con el icono de lápiz.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NZ4jVPLjim.jpeg)


---

---
title: Nuevo Cliente Local (punto de venta)
url: https://posberry.tawk.help/article/nuevo-cliente-local-punto-de-venta
---

# Nuevo Cliente Local (punto de venta)

*Como crear un nuevo cliente en nuestro punto de venta*

Para crear un nuevo cliente en el sistema, podemos hacerlo de dos maneras: hacer clic en el botón "Nuevo Cliente" que se encuentra en la pantalla principal de Posberry o usar el atajo de teclado "F3". Al hacerlo, se abrirá una ventana donde podremos ingresar los datos del nuevo cliente.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/JD7Iyg9MsI.jpeg)

Nota importante: Si el cliente es monotributista o responsable inscripto, puede completar sus datos rápidamente ingresando su número de CUIT en el campo correspondiente, ya que el sistema autocompletará su información de razón social, domicilio, localidad y provincia.

Al crear un nuevo cliente, podemos elegir su lista de precios predeterminada y su tipo de cliente, que es similar a las familias de productos. Además, podemos establecer un tope de descuento para limitar cuánto afectan los descuentos a ese cliente. Por ejemplo, si tenemos una promoción de descuento del 20%, pero el tope de descuento del cliente es del 10%, solo se le aplicará un descuento del 10%.

Cuando seleccionamos la opción "Vender a crédito" al crear un cliente en el sistema, estamos estableciendo que dicho cliente tendrá una cuenta corriente. Esto significa que podrá realizar compras tanto a contado como a crédito, y que tendrá un límite de crédito que le permitirá hacer compras a crédito hasta cierto monto.

La opción "Fidelización" en nuestro sistema permite que el cliente acumule puntos por cada compra que realice y pueda utilizarlos para obtener descuentos o canjearlos por productos en el futuro.


---

---
title: Nueva compra Local (punto de venta)
url: https://posberry.tawk.help/article/nueva-compra-local-punto-de-venta
---

# Nueva compra Local (punto de venta)

*Como crear una nueva compra desde nuestro punto de venta*

Debemos ir a Menú, vamos a compras y elegimos nueva compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BKFZ-9d6Vv.jpeg)

Para crear una nueva compra, sigue estos pasos: 1. Abre la pestaña "Nueva Compra". 2. Selecciona el proveedor de la compra. 3. Elige si la factura es de productos o de servicios. 4. Selecciona la fecha y la fecha contable de la factura. 5. Carga el Código de Autorización Electrónico (CAE) o el Código de Autorización de Impresión (CAI) de la factura. El tipo de comprobante o factura que selecciones dependerá del proveedor elegido y afectará cómo se calculan los impuestos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/V3HEyZCeD1.jpeg)

Para crear una nueva compra, sigue estos pasos: 1. Asegúrate de que si la compra es a contado, se descontará del total de la caja. 2. [ ](http://2.Si) si no quieres que el dinero sea descontado de la caja, asegúrate de que la compra sea a crédito. 3. si deseas cargar el stock de los productos comprados, asegúrate de tildar la opción "Afectar Stock".

Para cargar productos en la compra, sigue estos pasos: 1.En la casilla "Producto", busca el producto que deseas cargar, ya sea por código, descripción o código de barras. 2.Ingresa la cantidad del producto que deseas comprar. 3.Ingresa el precio unitario del producto. 4.Los impuestos y los totales se calcularán automáticamente, pero si deseas, puedes editarlos antes de guardar la compra.

Si deseas cargar un nuevo producto en el sistema, sigue estos pasos: 1. Haz clic en el botón naranja con el signo "+" que se encuentra junto a la casilla de búsqueda "Producto". 2. Se abrirá una nueva pestaña para agregar un nuevo producto al sistema. 3. Completa los campos necesarios para el nuevo producto, como el código, descripción, precio, categoría, etc. 4.Haz clic en "Guardar" para agregar el nuevo producto al sistema. 5.Una vez guardado, podrás encontrar el producto en la búsqueda y agregarlo a la compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/_57WuoQZB1.jpeg)

Si deseas cargar un nuevo proveedor en el sistema, sigue estos pasos: 1.Haz clic en el botón naranja con el signo "+" que se encuentra junto a la casilla de búsqueda de nuevo proveedor. 2. Se abrirá una nueva pestaña para agregar un nuevo proveedor al sistema. 3. Completa los campos necesarios para el nuevo proveedor, como el nombre, dirección, teléfono, correo electrónico, etc. 4. Haz clic en "Guardar" para agregar el nuevo proveedor al sistema. 5. Una vez guardado, podrás seleccionar al nuevo proveedor en la compra.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/twA3c1w8dh.jpeg)

Para finalizar la compra, sigue estos pasos: 1. Verifica que todos los productos y detalles de la compra estén correctos. 2. Haz clic en el botón "Guardar" para finalizar la compra. 3. Aparecerá una ventana de confirmación, asegúrate de verificar los detalles de la compra antes de hacer clic en "Sí". 4. Al hacer clic en "Sí", la compra se guardará en el sistema y se cerrará la ventana de compra.


---

---
title: Cambiar configuración regional
url: https://posberry.tawk.help/article/cambiar-configuración-regional
---

# Cambiar configuración regional

Para que la web de POSBerry funcione correctamente debe asegurarse que la configuración regional sea la adecuada.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zNr8C2zFWb.png)

Presione las teclas Win+R y escriba "control panel", a continuación haga clic en Aceptar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PjZDNsdBbp.png)

Haga clic en Cambiar formato de fecha, hora o número

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Mz4KGc0CIK.png)

Elija "Español (Argentina)", y verifique que los formatos coincidan con el de la imágen. Haga click en Aceptar.


---

---
title: Forzar el reenvío de información
url: https://posberry.tawk.help/article/forzar-el-reenvío-de-información
---

# Forzar el reenvío de información

Reenviar la información puede servir en el caso que no estén los datos online.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/NdeasWtzdt.png)

Haga click rapidamente varias veces en el número de versión hasta que salga la pestaña herramientas.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/lc8557p7yJ.png)

En la pestaña herramientas haga clic en sincronismo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ckmS9fW5P0.png)

A continuación elija que quiere sincronizar, la fecha desde donde sincronizar y la fecha hasta cuando sincronizar. Para terminar haga click en el botón Sincronizar. Luego realize una sincronización desde el Menú (Ctrl + O) > Sincronizar (F12).


---

---
title: Soporte remoto desde la pantalla de login (Epson)
url: https://posberry.tawk.help/article/soporte-remoto-desde-la-pantalla-de-login-epson
---

# Soporte remoto desde la pantalla de login (Epson)

Para ejecutar el soporte remoto desde la pantalla de login en el hardware Epson hacer lo siguiente: Hacer doble clic en el logo de POSBerry y luego hacer clic en el botón "Soporte Remoto" de la ventana que sale, para que abra AnyDesk.


---

---
title: Como asociar una sucursal y caja para los dipositivos Point Plus/Smart
url: https://posberry.tawk.help/article/como-asociar-una-sucursal-y-caja-para-los-dipositivos-point-plussmart
---

# Como asociar una sucursal y caja para los dipositivos Point Plus/Smart

Entre a Mercado Pago > Tu negocio > Tus lectores Point. Haga clic en los 3 puntos a la derecha del Point que quiera modificar. En el menú haga clic en "Cambiar la caja asociada al lector".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Ey7EqEM0Lq.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/5teJ8rtmB4.png)

A continuación seleccione la sucursal y el punto de venta al que quiere asociar el Point.


---

---
title: Detener el autologin
url: https://posberry.tawk.help/article/detener-el-autologin
---

# Detener el autologin

Para frenar el autologin, apenas se muestre la ventana de login, dejar apretadas las teclas Ctrl + Shift. Tiene que ser rápído porque se demora 1 segundo en ejecutar el autologin. Tiene que ser cuando se vea la ventana, si lo dejan apretado desde antes puede que no funcione.


---

---
title: Como usar la App ControlAr para controlar los Precios
url: https://posberry.tawk.help/article/como-usar-la-app-controlar-para-controlar-los-precios
---

# Como usar la App ControlAr para controlar los Precios

Ingrese a la app ControlAr como se indica el el artículo Instalar ControlAr.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gs_XJPbxmG.png)

A continuación en el menú de Opciones entre a "Controlar Precios" el botón Verde.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4YhKGX8r0s.png)

Cargue los productos con el buscador o use el scanner de códigos de barras. Cada vez que ingrese un producto se le pedirá que ingrese el precio. El precio es el de venta final al cliente, y puede ingresar los precios del 1 al 7 dependiendo los que use su empresa.

Cuando haya cargado todos los productos presione el botón "Enviar".

Los precios se actualizan al instante en POSBerry, si quiere que también se vean en la web tiene que sincronizar.


---

---
title: Como usar la App ControlAr para controlar las Etiquetas
url: https://posberry.tawk.help/article/como-usar-la-app-controlar-para-controlar-las-etiquetas
---

# Como usar la App ControlAr para controlar las Etiquetas

Ingrese a la app ControlAr como se indica el el artículo Instalar ControlAr.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/y6NIwQ5r9G.png)

A continuación en el menú de Opciones entre a "Controlar Precios" el botón Amarillo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OfsPVjJU3Y.png)

Cargue los productos con el buscador o use el scanner de códigos de barras.

Si tiene una impresora integrada y configurada en su dispositivo Android, podrá imprimir las etiquetas con el botón "Imprimir".

De otra forma, cuando haya cargado todos los productos presione el botón "Enviar".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/iMV132bnZu.png)

A continuación en POSBerry vaya al Menú (Ctrl + O) > Stock > Listado de Productos. Allí haga clic en el ícono de smartphone arriba a la derecha. Eso hará que se marquen para impresión los productos que seleccionó en OrdenAr.


---

---
title: Como usar la App ControlAr para hacer Stock
url: https://posberry.tawk.help/article/como-usar-la-app-controlar-para-hacer-stock
---

# Como usar la App ControlAr para hacer Stock

Ingrese a la app ControlAr como se indica el el artículo Instalar ControlAr.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0WhR48eLTa.png)

A continuación en el menú de Opciones entre a "Controlar Stock" el botón Rojo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/N8LI4rsSoJ.png)

Cargue los productos con el buscador o use el scanner de códigos de barras. Cada vez que ingrese un producto se le pedirá que ingrese la cantidad. La cantidad es el stock real que hay de ese producto.

Cuando haya cargado todos los productos presione el botón "Enviar".


---

---
title: Cierre de caja: Control Financiero
url: https://posberry.tawk.help/article/cierre-de-caja-control-financiero
---

# Cierre de caja: Control Financiero

*Como utilizar el control financiero*

Para utilizarlo, debemos ir a cierre de caja, y hacer click en el boton con icono de grafica, al hacerlo se nos mostrará el apartado de control financiero:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/0qSWJVku41.jpeg)

Tendremos las siguientes opciones de control financiero:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pDYMqTojuI.jpeg)

al cambiar de tipo de informe, siempre debemos hacer click en mostrar luego de seleccionar el mismo, tambien se podrá imprimir estos informes de cierre de caja.


---

---
title: Delivery en POSBerry
url: https://posberry.tawk.help/article/delivery-en-posberry
---

# Delivery en POSBerry

*Como activar y utilizar delivery en el sistema*

Debemos: -> ir a la web POSBerry, configuraciones y en empresa tildar la opción "usar delivery".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/WfBBveCIfe.jpeg)

En el sistema de punto de venta se nos habilitará las siguientes opciones:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hkIiWUrTcV.jpeg)

Al hacer click en el boton con el icono de moto (debemos tener cargada ya la venta en el mostrador digital) nos abrirá una ventana para cargar observaciones (un ejemplo: hamburguesa sin cebolla) y nos pedirá que le asignemos el delivery o moto a cargo del delivery.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Z39KOfOYHv.jpeg)

Al darle a "OK", se guardará la venta en el listado de delivery, al hacer click en el boton de "Listado de delivery" veremos nuestra venta en la ventana "Delivery".

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/24U8NQ5gX9.jpeg)

Tendremos 3 instancias del delivery: 1) En Preparacion: se hace la preparacion del pedido para enviarlo. (para enviarlo a Enviados debe estar YA FACTURADO el pedido y debe usar el boton con flecha hacia la derecha). 2) Enviados: En este estado el pedido ya fue enviado con su respectiva moto. (para enviar el pedido a entregados debe hacer click en el boton con flecha hacia la derecha). 3) Entregados: Final del proceso, para terminar con el delivery, daremos click en finalizar pedido, el cual nos mostrará el siguiente mensaje:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/QSfJ1AG2AZ.jpeg)

Al darle "OK" se finaliza el pedido, una vez hecho esto, no podrá cambiar de estado ni visualizar el delivery.


---

---
title: POSBerry Order - Delivery y PickUp
url: https://posberry.tawk.help/article/posberry-order-delivery-y-pickup
---

# POSBerry Order - Delivery y PickUp

*Como ver y cambiar el estado de los pedidos*

## Pedidos Pickup

Para ver los pedidos de pickup, haga clic en el siguiente botón:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/OWXYGlb5Fz.png)

Así se ve un pedido de pickup:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/hnI7DklQlT.png)

Puede ‘Aceptar Pedido’ o ‘Rechazar Pedido’. Una vez aceptado y cuando ya hayan armado el pedido, puede hacer clic en el botón ‘Aviso de Retiro’ para que se notifique vía mail al cliente que puede venir a retirar el pedido.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/w4FhvqO5Xc.png)

## Pedidos Delivery

Para ver los pedidos de delivery, haga clic en el siguiente botón:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tJctpSTqGD.png)

Así se ve un pedido de delivery:

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/DJ2duOqdYN.png)

Puede ‘Aceptar Pedido’ o ‘Rechazar Pedido’. En ambos casos el cliente recibe un email avisándole el estado del pedido. Al mandarlo a ‘Enviados’ (luego de aceptar y facturar) se le envía un mail al cliente indicando que el pedido está en camino a su domicilio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/45W_aKUAqL.png)

## Distancia

Cuando el cliente entra a su página, se le pide permiso para conocer su ubicación. Si el usuario acepta, usamos el GPS y al hacer el pedido se les muestra a cuantos kilómetros / a cuantas cuadras aproximadas está de la sucursal (depende de la página que el usuario está viendo, en KM si es la página de la empresa y en cuadras si está en la página de la sucursal, en el carrito). Con esos datos, se puede saber aproximadamente si el usuario está dentro del límite de cuadras que configuró para el delivery en su sucursal. En la siguiente imagen puede ver en la ventana de Delivery que el cliente Leandro Díaz está a 5,53 KM de distancia, se ve en rojo ya que la sucursal tiene configurado un tope máximo de 20 cuadras o 2 kilómetros. Si ve en rojo los KM, le recomendamos que se comunique por teléfono con el cliente para confirmar su domicilio, que esté dentro del rango de cuadras en el cual ustedes hacen los delivery. Nota: La ubicación desde un celular es mas precisa que desde una PC.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aQ7AD9igJa.png)

Si hace clic en el botón ‘Ver Detalles’ puede ver la distancia y si está ‘Dentro del límite’ o ‘Fuera del límite’ y cuántos kilómetros tiene configurado como límite su sucursal. Si el usuario no activó la ubicación, no se usa el GPS y el mensaje que muestra es ‘No pudimos obtener la ubicación del comprador y saber si se encuentra dentro del área de cobertura.’ En los pedidos de delivery creados en el local, se ve el mensaje ‘No registrada.’ Ya que no usamos ese campo para ese tipo de pedidos, solo se usa la distancia para los pedidos de la web de Order.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Holg3PuexH.png)


---

---
title: Ver Tipos de Condición de Pago (Web)
url: https://posberry.tawk.help/article/ver-tipos-de-condición-de-pago-web
---

# Ver Tipos de Condición de Pago (Web)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dRe8a1m1Kd.png)

Haga clic en el botón [Ventas] ("moneda") y luego haga clic en [Tipos de Condición de Pago]. En el listado de la izquierda están todos los tipos de condición de pago registrados. Haga clic en uno para ver los detalles en el panel de la derecha.. Si es una tarjeta, puede ver los coeficientes de cada cuota.


---

---
title: "Arqueos de Caja": ¿Qué son y para qué sirven?
url: https://posberry.tawk.help/article/arqueos-de-caja-¿qué-son-y-para-qué-sirven
---

# "Arqueos de Caja": ¿Qué son y para qué sirven?

El arqueo de caja sirve para controlar los billetes y monedas que tiene en la caja, que coincidan con las ventas realizadas en efectivo y el dinero inicial que había en la caja. Se realiza en el [cierre de caja](/article/cierre-de-caja) .


---

---
title: ¿Se puede restringir acciones a algunos operadores?
url: https://posberry.tawk.help/article/¿se-puede-restringir-acciones-a-algunos-operadores
---

# ¿Se puede restringir acciones a algunos operadores?

Si, puede configurar que permisos tiene cada operador mediante la configuración web de Roles y Operadores. Por ejemplo, que los cajeros no puedan modificar los precios, que el encargado de stock solo pueda entrar a ciertas secciones del sitio web, entre otras.


---

---
title: ¿Qué impresoras son compatibles para la impresión de precios de góndolas?
url: https://posberry.tawk.help/article/¿qué-impresoras-son-compatibles-para-la-impresión-de-precios-de-góndolas
---

# ¿Qué impresoras son compatibles para la impresión de precios de góndolas?

Puede usar una impresora A4 para imprimir entre los distintos formatos.


---

---
title: Mercado Pago Point Plus
url: https://posberry.tawk.help/article/mercado-pago-point-plus
---

# Mercado Pago Point Plus

Como configurar Mercado Pago Point Plus Ingrese a la cuenta de su empresa en POSBerry y acceda a la página de configuración. (Previamente debe tener configurada las credenciales de Mercado Pago, si no lo hizo, revise esta guia: [https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculaci%C3%B3n-con-posberry](https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculaci%C3%B3n-con-posberry) ) (Previamente debe tener asociados a una sucursal y caja el dispositivo Point Smart, revise esta guia: [https://posberry.tawk.help/article/como-asociar-una-sucursal-y-caja-para-los-dipositivos-point-plussmart](https://posberry.tawk.help/article/como-asociar-una-sucursal-y-caja-para-los-dipositivos-point-plussmart)) ) Si las credenciales están configuradas, sincronice el sistema de punto de venta y ingrese a opciones.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wUkhEQ0PNS.png)

Siga los pasos de la imagen, presione el botón de refrescar (Paso 1), y al desplegar la lista, se podrán ver todos los dispositivos Point Plus y Point Smart vinculados a su cuenta de Mercado Pago. Seleccione el dispositivo Point Plus que va a utilizar en la caja que está configurando en este momento. Si tiene más de un equipo en su cuenta, como en la imagen, los últimos números del nombre corresponde al número de serie del Point Plus, para identificarlo mire detrás del Point Plus, hay un código de barras que dice S/N, los ultimos 8 digitos deben corresponder al que se selecciona de la lista. Seleccione el dispositivo y presione [GUARDAR] NOTA: se debe reiniciar el Point Plus para que tome los cambios de modalidad a punto de venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1Fy5QJTaEM.png)

Una vez configurado, al [Cobrar], se le presentará un nuevo método de pago como se lo resalta en la imagen.


---

---
title: Precio por kilo o por litro
url: https://posberry.tawk.help/article/precio-por-kilo-o-por-litro
---

# Precio por kilo o por litro

*Imprimir etiquetas con precio por kilo o por litro*

No todas las etiquetas soportan mostrar el precio por kilo o por litro. Las etiquetas que soportan precio por kilo o por litro son: Hoja A4 (16), Hoja A4 (30), Hoja A4 (40), Hoja A4 (64), Hoja A4 (80), Hoja A4 Oferta (2), Hoja A4 Oferta (1), Hoja A4 Precio 1 y 2 (8), Hoja A4 Autoadhesivo 6.40 x 2.54, Hoja A4 Autoadhesivo 4.80 x 2.54, Ancho 80mm, Ancho 56mm, Hoja A4 Precio y Precio Bulto (8), Hoja A4 (24).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Q8qO0vaCTG.png)

Para que al imprimir salga el precio por kilo o por litro, primero debe editar el producto, que este tenga tildado 'Es Fraccionado' y elegir la cantidad y la unidad (marcado en rojo en la imagen). Si esto no está establecido no se verá en la etiqueta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/UbfQ52SkBe.png)

En esta etiqueta A4 (16) vemos que se muestra el precio por kilo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AKo0RLVY2o.png)

En esta etiqueta A4 (16) vemos que se muestra el precio por litro.


---

---
title: Como informar Caea en POSBERRY GO
url: https://posberry.tawk.help/article/como-informar-caea-en-posberry-go
---

# Como informar Caea en POSBERRY GO

*Como informar uno o mas caea en POSBerryGO*

Debemos dirigirnos al boton con 3 rayas y pulsarlo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Fd76DGWWMD.jpeg)

En el menú que desplegamos elegimos la opción "pendientes" para que nos lleve donde están guardados los caea.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/fYf9-1P6UP.jpeg)

En el cuadro amarillo hay dos opciones, la primera es informar 1 documento, el cual debemos seleccionar previo a pulsar ese boton, la segunda opcion es para informar todos los documentos.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oTQaD9tT1w.jpeg)

En ambos casos al pulsar su boton, nos preguntara si informaremos el o todos los documentos, le damos a SI para que los informe.


---

---
title: Cargar Pagos de Ventas a Crédito (PC)
url: https://posberry.tawk.help/article/cargar-pagos-de-ventas-a-crédito-pc
---

# Cargar Pagos de Ventas a Crédito (PC)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ibf-Q5djBP.png)

Esta forma de cargar el pago consiste en encontrar la venta, para la versión que consiste en encontrar cliente vea en el manual Ver Extracto de Cuenta Corriente. En la pestaña ventas elija el rango de fechas en donde fue realizada la venta a crédito a la que quiere cargar un pago. Luego haga clic en [Mostrar]. Haga clic derecho en la venta (en rojo) y luego haga clic en [Cargar un Pago].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8JnK--KgvK.png)

Ingrese el medio de pago y el monto, luego haga clic en [OK].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Bi60bJx5PK.png)

Saldrá un mensaje informativo. Haga clic en [Aceptar].

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/amUneZ6etK.png)

Si terminó de pagar toda la venta cambiará de color a verde.


---

---
title: ¿Cómo puedo importar mi listado de "Productos" e "Ingredientes"?
url: https://posberry.tawk.help/article/¿cómo-puedo-importar-mi-listado-de-productos-e-ingredientes
---

# ¿Cómo puedo importar mi listado de "Productos" e "Ingredientes"?

Para importar productos e ingredientes puede (desde la web) ir a la pagina de productos y en la parte inferior de la pagina donde aparece subir listado de productos haga clic en seleccionar archivo. El archivo debe de ser formato Excel, lo recomendable en lo posible es siempre descargar el archivo y trabajar editándolo. Finalmente aparecerán los cambios que se producirán al subir el archivo haga clic en el botón de enviar cambios para realizar los cambios correspondientes.


---

---
title: ¿Puedo utilizar pantallas táctiles?
url: https://posberry.tawk.help/article/¿puedo-utilizar-pantallas-táctiles
---

# ¿Puedo utilizar pantallas táctiles?

Si, el sistema es compatible con pantallas táctiles. Puede usar los paneles numéricos para ingresar los montos en vez de usar el teclado en muchas pantallas. Para encontrar los productos puede usar el panel de accesos rápidos y el panel personalizable, donde puede buscar por familia de productos o por producto directamente, sin usar el teclado.


---

---
title: ¿Qué tablets/televisores son compatibles para la pantalla de cliente?
url: https://posberry.tawk.help/article/¿qué-tabletstelevisores-son-compatibles-para-la-pantalla-de-cliente
---

# ¿Qué tablets/televisores son compatibles para la pantalla de cliente?

Necesita una tablet o televisor (smart tv) con wifi y navegador de internet, compatible con JavaScript y HTML 5.


---

---
title: Asistente de Balanzas e impresoras
url: https://posberry.tawk.help/article/asistente-de-balanzas-e-impresoras
---

# Asistente de Balanzas e impresoras

*asistencia en la conexión de balanzas e impresoras a POSBerry*

este asistente facilita el proceso de conexión de ambos dispositivos, para utilizarlo vaya a Menu (CTRL+O), elija configuraciones


---

---
title: Venta y Preventa remota
url: https://posberry.tawk.help/article/venta-y-preventa-remota
---

# Venta y Preventa remota

*Como activar y utilizar la venta y preventa remota*

Debe ir a la Web, entrar en configuraciones (ruedita dentada) y debe ir al apartado "punto de venta", seleccionamos el punto de venta donde queremos activar el servicio y tildamos la opción "usar venta y preventa remota"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/kb3l0qE5SZ.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/J8ijRGG53f.jpeg)

Para utilizar el sistema debe ir al sistema de escritorio que tenga el punto de venta al que le habilitaste el servicio, hacer click sobre el botón (CTRL+O), elegir la opcion "acerca de..."

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/S4y7zuo73R.jpeg)

dentro de la pestaña que nos abre esta opción, tenemos que seleccionar el apartado de "servicios" y tenemos que ir a la tercera sección de venta y pre venta remota, hacemos click sobre cualquiera de los dos links los cuales nos abrirán en el navegador de su preferencia la ventana de venta y pre venta remota, esta puede copiarla y utilizarla en otra computadora que esté en la misma red wifi que la computadora en la cual está instalado el sistema de escritorio del cual sacamos los links, si estan en distintas redes, estas no funcionarán.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KMgchDXR2y.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/SRg5XJMxpv.jpeg)


---

---
title: COMO CONFIGURAR IMPRESORA DE ETIQUETAS ZEBRA Y 3NSTAR 38*20*2
url: https://posberry.tawk.help/article/como-configurar-impresora-de-etiquetas-zebra-y-3nstar-38202
---

# COMO CONFIGURAR IMPRESORA DE ETIQUETAS ZEBRA Y 3NSTAR 38*20*2

1-Ubicamos el archivo .zpl en la carpeta “AppData\Local\POSBerry” (donde queda guardado el backup)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nlRpSHoR44.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FbPyt_g8eN.jpeg)

## Impresora 3nStar

2-Abrimos el archivo .zpl con el block de notas Vamos a encontrar comandos similares a estos ^XA				  ---Apertura del formato ^PW670			  ---Ancho de impresión (donde arranca a imprimir) ^LH85,70			  ---Eje X e Y de la impresión ^BY2,2,37 ^BC,30,10,N,N^FD{CODIGO}^FS  ---Tipo de código de barras {el código que imprime (código, ean, ean2)} ^FO0,50^A0,30^FD{LINEA1}^FS   ---Posición de línea, ancho y alto de caracteres {linea1 = descripción} ^FO0,80^A0,30^FD{LINEA2}^FS ^PW1				  ---Ancho de impresión (donde arranca a imprimir) para segunda etiqueta ^LH75,70 ^BY2,2,37 ^BC,30,10,N,N^FD{CODIGO}^FS ^FO0,50^A0,30^FD{LINEA1}^FS ^FO0,80^A0,30^FD{LINEA2}^FS ^XZ				  ---Fin  del formato

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6PnUTQx1I1.jpeg)

## Impresora Zebra

^XA ^PW670 ^LH85,60 ^BY2,2,37 ^BC,30,10,N,N^FD{CODIGO}^FS ^FO0,50^A0,30^FD{LINEA1}^FS ^FO0,80^A0,30^FD{LINEA2}^FS ^PW1 ^LH410,60 ^BY2,2,37 ^BC,30,10,N,N^FD{CODIGO}^FS ^FO0,50^A0,30^FD{LINEA1}^FS ^FO0,80^A0,30^FD{LINEA2}^FS ^XZ Podemos modificar los parámetros según conveniencia y guardamos para probar la impresión (no es necesario cerrar el archivo)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/E6Xsl7illB.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nDhg_17lLP.jpeg)

Luego seleccionamos la Impresora, el formato y la cantidad de copias (1 copia = 2 etiquetas) en el Posberry.


---

---
title: Mercado Pago Point
url: https://posberry.tawk.help/article/mercado-pago-point
---

# Mercado Pago Point

Como configurar Mercado Pago Point (Bluetooth o Mini) Ingrese a la cuenta de su empresa en POSBerry y acceda a la pagina de configuración. (Previamente debe tener configurada las credenciales de Mercado Pago, si no lo hizo, revise esta guia: [https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculaci%C3%B3n-con-posberry)](https://posberry.tawk.help/article/obtener-credenciales-de-mercado-pago-para-la-vinculaci%C3%B3n-con-posberry)) Si las credenciales ya están configuradas, debe apretar el botón [VINCULAR]

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gLqCUJcQfG.png)

Luego haremos clic en el botón vincular que esta debajo de los campos de clientes para vincular con nuestro dispositivo Android.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6DEMI4Efez.png)

Una vez vinculado en nuestro dispositivo Android en la aplicación de mercado pago haremos clic en el menú -> Tu negocio -> Point en la pantalla de point veremos las opciones Nombre del Dispositivo integrado y Modo Integrado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/oElZMPvWxI.png)

Ingresaremos en Nombre del dispositivo integrado escribimos el nombre que queramos ponerle al dispositivo y tocamos el botón sincronizar.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xSHQ7orUHq.png)

Activaremos el modo integrado.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/1imALuzvTH.png)

En posberry haremos clic en Opciones -> Configuración -> dispositivos en la sección de Mercado Pago en el campo [Mercado Pago Point (device_name)] ingrese el mismo nombre del dispositivo que ingreso en su dispositivo Android. Finalmente para realizar una venta utilizando el sistema de mercado pago point ingrese los ítems luego haga clic en el botón Cobrar(F10), seleccione en medios de pago Mercado Pago Point y cargue el monto. Aparecerá la pantalla de mercado point cuando esta termine de sincronizar con posberry podrá cobrar usando el lector de mercado point.


---

---
title: ¿Como hago un cierre de caja sin realizar el arqueo de billetes?
url: https://posberry.tawk.help/article/¿como-hago-un-cierre-de-caja-sin-realizar-el-arqueo-de-billetes
---

# ¿Como hago un cierre de caja sin realizar el arqueo de billetes?

cuando vaya a cerrar la caja, en vez de cargar los billetes, ingresa el total de caja en el total de billetes

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/gr6aWT43vz.jpeg)

una vez cargado ello, puede cerrar caja sin necesidad de hacer el arqueo


---

---
title: Predeterminar un cliente en punto de venta
url: https://posberry.tawk.help/article/predeterminar-un-cliente-en-punto-de-venta
---

# Predeterminar un cliente en punto de venta

tendremos que ir a la web posberry, debemos ir a configuraciones (rueda dentada) y elegimos el apartado "punto de venta"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tKNCwjeuS0.jpeg)

elegimos que punto de venta vamos a predeterminar, hacemos click en donde este el cliente actual predeterminado y seleccionamos que cliente queremos y vamos a guardar en las opciones al final de la pagina.


---

---
title: Soporte Remoto
url: https://posberry.tawk.help/article/soporte-remoto
---

# Soporte Remoto

*Como acceder al soporte remoto*

primero tenemos que hacer click en el boton de Menú (CTRL+O), luego elegimos el apartado "Soporte Remoto"  y enviamos al Soporte estos 9 numeros que nos aparecerán

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/-KXpOFbKRs.jpeg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/qIQRxmPxBU.jpeg)


---

---
title: Balanza Systel Cuora Neo
url: https://posberry.tawk.help/article/balanza-systel-cuora-neo
---

# Balanza Systel Cuora Neo

Esta balanza tiene la particularidad de conectarse por internet. A continuación le mostramos los pasos para poder pasar los precios de POSBerry a la balanza.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/BN4bBekM5k.png)

En la parte superior derecha donde dice "Enviar a balanza" agregamos la impresora haciendo clic en el botón +. Una vez agregada elegimos debajo el modelo "Systel Cuora Neo".

Marcamos los productos que queremos enviar a la balanza y hacemos clic en "Actualizar". Se enviará la lista de precios con sus respectivos precios, los productos marcados con tilde y las imágenes de los productos (de tenerlas disponibles).


---

---
title: Nota de crédito en POSNet
url: https://posberry.tawk.help/article/nota-de-crédito-en-posnet
---

# Nota de crédito en POSNet

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Nw0rREOhX9.png)

En ventas, seleccione la venta, a la que desea generar la devolución. Luego, haga clic derecho sobre esa venta y se desplegara un menú, elija “Generar devolución” (Nota de Crédito).

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/wN_nPOrZS-.png)

Presione en COBRAR (F10)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/dJMrtfPwr1.png)

Ingrese la tarjeta de crédito/débito a la que se le aplicará la devolución.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3CB2eRihAD.png)

El dispositivo, solicitará el ingreso del pin (clave) de la [tarjeta.Si](http://tarjeta.Si) la clave es la correcta, se imprimirá el 1er comprobante y luego con aceptar continuar, imprimirá el 2do.


---

---
title: ¿Cómo cobrar con POSNet?
url: https://posberry.tawk.help/article/cómo-cobrar-con-posnet
---

# ¿Cómo cobrar con POSNet?

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6ZSkRwA8e2.png)

Luego de hacer una venta de forma habitual y presione en COBRAR...

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/8mWHcbTd-H.png)

Seleccione el medio de pago PINPAD - FISERV

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/FXMm5njcoR.png)

Elija según sea el caso, el tipo de tarjeta con la que va a cobrar. Para el ejemplo usaremos DÉBITO.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/AT53zoQmQK.png)

Elegida la tarjeta, presione sobre el símbolo "+"

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6kvXMPJ3C7.png)

Inmediatamente en la pantalla del sistema, le saldrá la ventana de notificación para que deslice, ingrese o acerque la tarjeta al POSNet.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Yn5m4O5C_2.png)

También aparecerá la notificación en el dispositivo POSNet.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KwBNMw8n-K.png)

En la pantalla siguiente deberá seleccionar el tipo de cuenta bancaria: Corriente ó Ahorros. Para el ejemplo usaremos: Cta. Ahorros.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nIRyrEHZtD.png)

Acto seguido, deberá indicar si es una venta A Vista (en presencia del cliente) ó si es Compra y Retiro.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/7TANtj3y7_.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/4UzXaP9iI0.png)

Para finalizar, el sistema le solicitará al cliente la clave, la cual debe ingresar en el pinpad [POSNet.Si](http://POSNet.Si) la clave es correcta, saldrá impreso el comprobante de operación y con solo presionar el boton verde (Enter), podrá obtener una segunda impresión del recibo de operación.


---

---
title: El sistema cuenta con herramientas para hacer preventa en el local?
url: https://posberry.tawk.help/article/el-sistema-cuenta-con-herramientas-para-hacer-preventa-en-el-local
---

# El sistema cuenta con herramientas para hacer preventa en el local?

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ujzhOY1GBi.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/tBJhlPaBks.png)

Si, para hacer una preventa tiene que acceder a Preventa y Venta tiene que ir a Opciones (ctrl + o) y luego hacer clic en Acerca de En la ventana de información de POSBerry haga clic en servicios En preventa y venta haga clic en uno de los enlaces. En el navegador se abrirá la pagina de Preventa y Venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/sIALZg_LCh.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VMqiKr7CpS.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/xc_IL3L3lX.png)

Para realizar una preventa en la pagina de Preventa y ventas tiene que cambiar la opción de ventas a pedidos. Luego se cargan los artículos y se hace clic en guardar. La orden se mandara a POSBerry de escritorio como un pedido.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/ISj_BKto1s.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/klz1EomkD-.png)

Para cobrar el pedido realizado debe ir a POSBerry y hacer clic en el botón listado de pedidos Luego seleccione el pedido creado lo reconocerá por que los pedidos creados en Preventa y Venta Remota tienen el valor "Lan" en origen. Haga clic en Facturar (F10) para cargar el pedido a una venta.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/aRYPoyrqCT.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/beLwdvAc9H.png)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/v9yX4DmE_6.png)

Para cobrar haga clic en en botón Cobrar (F10) aparecerá la ventana de cobro. Finalmente seleccione el medio de pago, para cargar el monto haga clic en el botón + en este caso todo el monto fue pagado con efectivo. Apreté el botón OK para realizar la venta.


---

---
title: ¿Puedo usar ordenar para preventa en mi local?
url: https://posberry.tawk.help/article/¿puedo-usar-ordenar-para-preventa-en-mi-local
---

# ¿Puedo usar ordenar para preventa en mi local?

Efectivamente puede utilizar los pedidos en las mesas como forma de preventa. A la hora de vender seleccione la mesa con el pedido y ya estarán los productos cargados listos para ser cobrados.


---

---
title: ¿Pueden los camareros eliminar ventas?
url: https://posberry.tawk.help/article/¿pueden-los-camareros-eliminar-ventas
---

# ¿Pueden los camareros eliminar ventas?

Una vez creado el pedido en una mesa los camareros no pueden quitar elementos de dicho pedido o cancelarlo solo pueden agregar más items al mismo. Solo desde el mostrador se puede seleccionando el pedido borrar elementos del mismo o cancelarlo.


---

---
title: Husos horarios
url: https://posberry.tawk.help/article/husos-horarios
---

# Husos horarios

POSBerry funciona con el uso horario local de la pc y la web también muestra las horas en base a la configuración de su pc.


---

---
title: Cargar pedidos en una mesa OrdenAr
url: https://posberry.tawk.help/article/cargar-pedidos-en-una-mesa-ordenar
---

# Cargar pedidos en una mesa OrdenAr

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/PFEGoUDCJE.jpg)

Para cargar un pedido en una mesa primero seleccione la mesa.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pcGyjgMI8f.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/VxCtgWKTpJ.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/pNucvVpqD4.jpg)

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Yctl0uzYWr.jpg)

Para cargar los productos toque en el buscador para que aparezcan los productos, también puede tocar el teclado ubicado a la izquierda del buscador para escribir el nombre del producto.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/MExIiNnRVv.jpg)

Finalmente seleccione el medio de pago y toque SI para enviar el pedido.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/zKGvYDMTsb.jpg)

Las mesas que tengan pedidos se mostraran con el valor del pedido.


---

---
title: Diferencias entre "Usuarios" y "Roles de Usuarios"
url: https://posberry.tawk.help/article/diferencias-entre-usuarios-y-roles-de-usuarios
---

# Diferencias entre "Usuarios" y "Roles de Usuarios"

Los usuarios son las cuentas de cada empleado que utiliza el sistema de POSBerry y los roles son el conjunto de acciones permitidas que puede realizar un usuario. Las acciones permitidas dependen de cada rol.


---

---
title: Visualizar los Gráficos
url: https://posberry.tawk.help/article/visualizar-los-gráficos
---

# Visualizar los Gráficos

*Estadísticas de su empresa*

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/nNcLdl4ycu.png)

En la página principal haga clic en el botón [Estadísticas] ("que tiene forma de gráfico"). Existen 4 tipos de gráficos: lineal, de barras, de dona y de tiempo.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/c3fqcKXjis.png)

Gráfico lineal: dibuja curvas con puntos a lo largo del tiempo, con los montos como los picos. Abajo a la derecha un resumen de los totales.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Zn8kXwfhXP.png)

Gráfico de barras: dibuja barras verticales a lo largo del tiempo, como los montos como los picos. Abajo a la derecha un resumen de los totales.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/Yco5uJUu2E.png)

Gráfico de tiempo: muestra por día y horario, la frecuencia de las ventas. Al pasar el mouse por uno de los recuadros pintados de color, muestra total, cantidad y ticket promedio.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/KtdwV34wlH.png)

Gráfico de dona: muestra en un circulo, con distintas porciones cada elemento, los elementos mas grandes ocupan mayor espacio. Al pasar el mouse puede ver el nombre y el monto de cada elemento.

## Configurar Gráficos

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/o-8E8-555r.png)

Tipo de gráfico: puede cambiar los datos que se visualizan, eligiendo del menú desplegable que se encuentra al hacer clic en el nombre del gráfico.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/3MQwrUz8TX.png)

Frecuencia del gráfico: puede cambiar cuantos días se muestran.

![imagen](https://tawk.link/5c365d69361b3372892f443c/kb/attachments/6iX7i2VG-T.png)

Sucursal: En algunos gráficos puede cambiar la sucursal a visualizar.

## Guardar Vista

Cuando cambie la vista del gráfico, ya sea por tipo, frecuencia o sucursal, se guarda automáticamente y la próxima vez que entre quedará de la misma forma.


---

---
title: ¿A cuantas balanzas puedo enviar precios?
url: https://posberry.tawk.help/article/¿a-cuantas-balanzas-puedo-enviar-precios
---

# ¿A cuantas balanzas puedo enviar precios?

POSBerry tiene la ventaja, de enviar información a balanzas homologadas; todo dependerá del número de equipos que haya en el local y la manera que están conectadas. En el caso que las balanzas estén conectadas en red, se puede enviar información a la cantidad de dispositivos que el cliente desee y que soporte su local. Por el contrario, si la balanza se conecta directo a la PC, el número de equipos a los que se puede enviar información, estará limitado a la cantidad de puertos de conexión que tenga el computador.


---

---
title: Puedo conectar, verificadores de precios?
url: https://posberry.tawk.help/article/puedo-conectar-verificadores-de-precios
---

# Puedo conectar, verificadores de precios?

POSBerry, tiene la capacidad de manejar verificadores de precios. Desde el punto de venta, se genera la dirección IP para conectar el equipo que funcionara como verificador de precios. Ejemplo de ello puede ser una PC con Windows ó Tablet Android, a las cuales se les conecta un lector de códigos de barras y que tengan acceso a la red. A dichos equipos se les asigna la dirección IP del punto de venta y es allí cuando se completa el circuito para la consulta de precios.


---

---
title: Impresoras de Etiquetas compatibles
url: https://posberry.tawk.help/article/impresoras-de-etiquetas-compatibles
---

# Impresoras de Etiquetas compatibles

Para la impresión de etiquetas de precios, puede usarse una impresora de inyección de Tinta, que use el formato de papel A4. Sin embargo, existen impresoras de etiquetas disponibles en el mercado, las cuales manejan rollos de papel autoadhesivos y que tienen un tamaño similar al de una impresora térmica comandera. Su conexión es por medio de USB y en el mercado se pueden conseguir de marcas como: ZEBRA, TSC, entre otras.


---

---
title: ¿Como doy de baja el servicio?
url: https://posberry.tawk.help/article/¿como-doy-de-baja-el-servicio
---

# ¿Como doy de baja el servicio?

Para dar de baja el servicio contáctese vía mail a info@posberry.com.


---

---
title: ¿Cuáles son los medios de pago?
url: https://posberry.tawk.help/article/¿cuáles-son-los-medios-de-pago
---

# ¿Cuáles son los medios de pago?

Puede realizar el pago mediante Mercado Pago por mes individual, suscripción a Mercado Pago, transferencia bancaria y en efectivo. Para cualquier consulta sobre los pagos puede contactar con el soporte o sino por mail a info@posberry.com.


---

---
title: ¿Cuáles son los precios?
url: https://posberry.tawk.help/article/¿cuáles-son-los-precios
---

# ¿Cuáles son los precios?

Los precios se mantienen actualizados en la página principal de POSBerry [https://www.posberry.com/](https://www.posberry.com/) . Si ya esta suscripto a POSBerry, puede ver el total a pagar en la web, en la parte de Configuración > Pagos. Por cualquier consulta sobre los pagos comuníquese con info@posberry.com.


---

---
title: ¿Cuánto tiempo puede mi negocio funcionar sin Internet?
url: https://posberry.tawk.help/article/¿cuánto-tiempo-puede-mi-negocio-funcionar-sin-internet
---

# ¿Cuánto tiempo puede mi negocio funcionar sin Internet?

El sistema puede funcionar sin internet hasta 30 días. Es necesaria la sincronización para que el sistema funcione correctamente. Si tiene una impresora Epson con POSBerry instalado, tiene una licencia para poder usar el sistema sin internet.


---

---
title: ¿Qué ancho de banda necesito?
url: https://posberry.tawk.help/article/¿qué-ancho-de-banda-necesito
---

# ¿Qué ancho de banda necesito?

Se requiere una conexión a internet recomendada de por lo menos 10 megas. De todas formas, recomendamos que la conexión sea la más rápida que tenga a disposición, ya que agiliza la velocidad de la sincronización, tanto para la subida como para la bajada. Si hace factura electrónica también necesita que internet funcione bien para facturar.


---

---
title: ¿Puedo hacer un inventario desde mi celular?
url: https://posberry.tawk.help/article/¿puedo-hacer-un-inventario-desde-mi-celular
---

# ¿Puedo hacer un inventario desde mi celular?

Si, la página de inventario esta optimizada para celulares, por lo tanto puede realizar un inventario sin inconvenientes.


---

---
title: ¿El sistema cuenta con un sitio de venta online donde se puedan ofrecer los productos de mi comercio?
url: https://posberry.tawk.help/article/¿el-sistema-cuenta-con-un-sitio-de-venta-online-donde-se-puedan-ofrecer-los-productos-de-mi-comercio
---

# ¿El sistema cuenta con un sitio de venta online donde se puedan ofrecer los productos de mi comercio?

Si, contamos con POSBerry Order, para que pueda vender a sus clientes mediante Delivery y PickUp. Usted elije que productos quiere mostrar en la web, si desea hacer solo Delivery o solo PickUp, o los dos a la vez. Elije la lista de precios. Configura el estilo de la página. Los colores, el logo de su empresa. El titulo que quiere mostrar como nombre comercial. El precio del Delivery, la distancia máxima a la que brinda el servicio. Días y horarios de atención. También puede brindar promociones a sus clientes, igual que en el local.


---

---
title: ¿Hay un limite de cantidad de mesas?
url: https://posberry.tawk.help/article/¿hay-un-limite-de-cantidad-de-mesas
---

# ¿Hay un limite de cantidad de mesas?

No, no hay un límite. El sistema puede trabajar con la totalidad de las mesas que tenga en su establecimiento.


---

---
title: ¿Qué impresoras son compatibles?
url: https://posberry.tawk.help/article/¿qué-impresoras-son-compatibles
---

# ¿Qué impresoras son compatibles?

Para punto de venta factura electrónica: - ESC/POS - TSPL Para punto de venta fiscal: - EPSON - HASAR - EPSON 2DA GENERACION - HASAR 2DA GENERACION - BEMATECH Para punto de venta serial: - SERIAL - ESC/POS - TZPL - PARALELO También puede imprimir comprobantes en A4.


---

---
title: ¿Qué balanzas son compatibles?
url: https://posberry.tawk.help/article/¿qué-balanzas-son-compatibles
---

# ¿Qué balanzas son compatibles?

Las balanzas compatibles son: - Kretz Novel Eco 2 - Kretz Report NX - Kretz Aura Eco - Systel Cuora Max Con conexión de puerto de comunicaciones (COM) y por dirección IP.


---

---
title: ¿Qué impresoras son compatibles para la impresión de etiquetas?
url: https://posberry.tawk.help/article/¿qué-impresoras-son-compatibles-para-la-impresión-de-etiquetas
---

# ¿Qué impresoras son compatibles para la impresión de etiquetas?

Son compatibles las impresoras que admiten el formato ESC/POS, Raster, TSPL y ZPL.


---

---
title: ¿Puedo utilizar cajón de dinero?
url: https://posberry.tawk.help/article/¿puedo-utilizar-cajón-de-dinero
---

# ¿Puedo utilizar cajón de dinero?

Si, el sistema es compatible con cajón de dinero.


---

---
title: ¿Puedo conectar impresoras de etiquetas?
url: https://posberry.tawk.help/article/¿puedo-conectar-impresoras-de-etiquetas
---

# ¿Puedo conectar impresoras de etiquetas?

Si, puede imprimir etiquetas con el formato ESC/POS, Raster, TSPL y ZPL.


---

---
title: ¿Cuántas comanderas puedo usar en sistema?
url: https://posberry.tawk.help/article/¿cuántas-comanderas-puedo-usar-en-sistema
---

# ¿Cuántas comanderas puedo usar en sistema?

El sistema soporta hasta 4 comanderas, configurables para cada producto / familia de productos. También puede usar una comandera para imprimir los tickets.


---

---
title: ¿El sistema trabaja con códigos de barras impresos de productos pesables?
url: https://posberry.tawk.help/article/¿el-sistema-trabaja-con-códigos-de-barras-impresos-de-productos-pesables
---

# ¿El sistema trabaja con códigos de barras impresos de productos pesables?

Si, el sistema permite ingresar el código PLU para cada producto individual. En la configuración puede elegir el formato que utiliza su balanza.


---

---
title: ¿Puedo usar impresoras de comandas en la cocina?
url: https://posberry.tawk.help/article/¿puedo-usar-impresoras-de-comandas-en-la-cocina
---

# ¿Puedo usar impresoras de comandas en la cocina?

Si, se pueden configurar hasta 4 comanderas distintas. Puede por ejemplo usar una para las bebidas y otra para la comida. O usarlas de la forma que prefiera. Puede configurar cada producto / familia de producto para que salga impreso en la comandera que desea.


---

---
title: ¿Puedo usar una tablet/smarttv en la cocina?
url: https://posberry.tawk.help/article/¿puedo-usar-una-tabletsmarttv-en-la-cocina
---

# ¿Puedo usar una tablet/smarttv en la cocina?

Si, puede usar una tablet o smart tv en la cocina, mediante el servicio de KVS (Kitchen Virtual State) para ver los pedidos, delivery y mesas.


---

---
title: ¿Qué tablets/televisores son compatibles para la pantalla de cocina?
url: https://posberry.tawk.help/article/¿qué-tabletstelevisores-son-compatibles-para-la-pantalla-de-cocina
---

# ¿Qué tablets/televisores son compatibles para la pantalla de cocina?

Necesita una tablet o televisor (smart tv) con wifi y navegador de internet, compatible con JavaScript y HTML 5.


---

---
title: Para la aplicación OrdenAR (Meseros) ¿Qué celulares son compatibles?
url: https://posberry.tawk.help/article/para-la-aplicación-ordenar-meseros-¿qué-celulares-son-compatibles
---

# Para la aplicación OrdenAR (Meseros) ¿Qué celulares son compatibles?

Los celulares compatibles son Android 4.4 o superior. Por el momento no soporta iPhone / iOS. Para ver la versión de Android entrar a Configuración -> Acerca del teléfono > Información del software y allí ver Versión de Android.


---

