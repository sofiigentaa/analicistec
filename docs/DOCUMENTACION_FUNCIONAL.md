# AntiEstafa AR — Documentación funcional

| | |
|---|---|
| **Producto** | AntiEstafa AR, detector de estafas para Argentina |
| **Versión** | 1.0 (hackatón, octubre 2026) |
| **URL** | https://antiestafa-ar-2.vercel.app |
| **Repositorio** | https://github.com/Ridioortv/analicistec |

---

## 1. Propósito

AntiEstafa AR ayuda a cualquier persona a saber, en segundos, si un mensaje que recibió (por WhatsApp, SMS o mail) es una estafa, por qué lo es y qué hacer. Además cubre los dos momentos críticos que rodean a una estafa: **antes de pagar** (verificar un alias/CBU o un comprobante) y **después de detectarla** (denunciar y avisar a la familia).

## 2. Usuarios

| Perfil | Necesidad | Cómo lo resuelve la app |
|---|---|---|
| **Persona mayor** | Entender si un mensaje es peligroso sin términos técnicos. | Modo abuela, lectura en voz alta, app instalable con un ícono. |
| **Familiar que "hace de soporte técnico"** | Responder rápido el "¿esto es verdad?" del grupo familiar. | Análisis en segundos y alerta lista para reenviar por WhatsApp. |
| **Comprador/vendedor online** (Marketplace, Mercado Libre) | Detectar comprobantes falsos y pedidos de transferencia sospechosos. | Detector de comprobante y chequeo de alias/CBU. |
| **Víctima o casi víctima** | Saber cómo denunciar. | Generador de denuncia con la evidencia ordenada. |

## 3. Alcance

**Incluye:** análisis de texto, imágenes y audios, lectura de códigos QR, estafas del momento, práctica con quiz, revisión directa de links, verificación técnica de links, puntaje de riesgo, recomendaciones, chequeo de alias/CBU/CVU, análisis de comprobantes, denuncia, alertas, guía para víctimas ("Ya caí"), accesibilidad, historial local, manual dentro de la app y app instalable.

**No incluye:** registro de usuarios, almacenamiento de mensajes en servidores, consulta a bases bancarias o de denuncias, bloqueo automático de números ni presentación automática de denuncias.

## 4. Requisitos funcionales

### RF-01 · Analizar un mensaje
- **Entrada:** texto pegado y/o una captura (JPG, PNG, WebP, GIF o HEIC; máximo 4 MB).
- **Proceso:** en paralelo, (a) se extraen los links del mensaje y se verifican técnicamente (RF-02) y (b) la IA (Gemini con visión) analiza el contenido con contexto de estafas argentinas.
- **Salida:** veredicto (seguro / sospechoso / estafa), puntaje 0-100, banderas rojas, pasos de "Qué hacer ahora" y un resumen en dos líneas.
- **Reglas:** si no hay texto ni imagen, se pide cargar algo. Si la imagen supera 4 MB o el formato no es válido, se avisa antes de enviar.
- **Facilidades de carga:** botón "Pegar" que trae el texto del portapapeles (solo si el navegador lo permite), botón "Borrar", pegado de una captura con Ctrl+V dentro del cuadro, arrastrar y soltar la imagen, y Ctrl+Enter para analizar.
- **Al terminar:** la pantalla se desplaza hasta el resultado y le da el foco (lo anuncian los lectores de pantalla). "Analizar otro mensaje" vuelve al cuadro de texto vacío.

### RF-02 · Verificar links
- Para cada link (máximo 3 por mensaje) se obtiene: antigüedad del dominio (RDAP), presencia de certificado SSL, destino final tras las redirecciones y similitud con marcas conocidas (Mercado Pago, Mercado Libre, ARCA/AFIP, Correo Argentino, bancos) por distancia de Levenshtein.
- **Reglas:** no se accede a direcciones privadas ni locales (protección SSRF). Cada consulta tiene un tiempo máximo de 4 segundos; si vence, el análisis sigue sin ese dato. Los resultados por dominio se reutilizan durante 1 hora.

### RF-03 · Calcular el puntaje final
- Combina el puntaje de la IA con las señales técnicas (dominio nuevo, marca imitada, sin SSL). Una señal técnica fuerte puede elevar el riesgo aunque el texto parezca inocente.
- **Semáforo:** 🟢 parece seguro · 🟡 sospechoso · 🔴 estafa.

### RF-04 · Mostrar el dominio engañoso
- En cada link revisado se resalta la parte que difiere de la marca oficial (por ejemplo `mercadopag0` frente a `mercadopago`) y se informa la antigüedad del dominio y si tiene SSL.

### RF-05 · "Así se ve el real"
- Si un link imita a una marca, se muestran 2 o 3 reglas generales de cómo se comunica de verdad esa empresa (por ejemplo, "nunca te pide claves por mensaje").
- **Regla:** no se muestran datos ni URLs específicos que no estén verificados.

### RF-06 · Preguntas para afinar
- Tres preguntas opcionales de sí/no: "¿Te pidieron plata o datos?", "¿Conocés a quien te lo mandó?", "¿Te apuran para hacerlo ya?".
- Las respuestas se suman al análisis de la IA. Si no se responden, el análisis funciona igual.

### RF-07 · Progreso visible
- Mientras se analiza se muestran los pasos: "Revisando links…" (solo si hay links), "Analizando el mensaje…", "Calculando el riesgo…".

### RF-08 · Ejemplos de un toque
- Botones con mensajes de ejemplo (falso ARCA, falso Mercado Pago, falso Correo Argentino, "hola mamá" y uno legítimo) que se cargan en el cuadro de texto. Usan dominios inventados.

### RF-09 · Chequear un alias, CBU o CVU antes de transferir
- **Entrada:** el alias/CBU/CVU de destino y, opcionalmente, el mensaje que acompaña el pedido.
- **Proceso:** validación de formato (CBU/CVU de 22 dígitos con dígitos verificadores; alias de 6 a 20 caracteres con letras, números, punto o guion) y evaluación del contexto con IA.
- **Salida:** nivel de riesgo (bajo, medio, alto), señales y una recomendación.
- **Regla:** nunca se afirma que una cuenta es segura; siempre se recomienda verificar por otro canal antes de transferir.

### RF-10 · Detectar un comprobante falso
- **Entrada:** captura del comprobante (PNG, JPG o WebP, máximo 4 MB).
- **Salida:** "parece real", "sospechoso" o "probablemente falso", con señales y recomendación.
- **Regla:** nunca se afirma certeza; siempre se recomienda confirmar el ingreso en la app del banco o la billetera.

### RF-11 · Generar una denuncia
- Arma un texto formal con fecha y hora, mensaje recibido, links, señales detectadas, veredicto y puntaje, y una sección de dónde presentarla (de forma genérica).
- Acciones: copiar, descargar como `.txt` e imprimir o guardar como PDF.

### RF-12 · Alertar a la familia
- Genera un texto de alerta listo para compartir, con botón para copiar y botón "Mandar por WhatsApp" que abre WhatsApp con el texto cargado.

### RF-13 · Modo abuela y lectura en voz alta
- Modo abuela: letra grande y el resultado resumido en dos líneas.
- Botón "Escuchar" que lee el resumen con voz en español (es-AR si está disponible) y "Detener". Se oculta si el navegador no lo soporta.

### RF-14 · Mis análisis (historial local)
- Guarda los últimos 10 análisis de mensajes y links **solo en el dispositivo** (almacenamiento del navegador), con tipo, veredicto, puntaje y un extracto corto.
- El usuario puede **apagar el guardado** (al apagarlo se borra lo guardado) y **borrar el historial** con doble confirmación.
- Nunca se envían al servidor.

### RF-15 · Instalar como app
- Botón "Instalar app" visible arriba de todo, en la compu y el celular. Instala con un clic cuando el navegador lo permite; si no, muestra instrucciones según el navegador (Chrome/Edge, Android, Samsung, iPhone/iPad, Safari en Mac, Firefox). Se oculta si la app ya está instalada.

### RF-16 · Revisar un link
- **Entrada:** una dirección web.
- **Proceso:** la misma verificación técnica de RF-02 (antigüedad, SSL, redirecciones, marca imitada), sin que el usuario abra el sitio.
- **Salida:** veredicto, qué llamó la atención, qué hacer ahora, datos del link y alerta para compartir. Se guarda en Mis análisis.

### RF-17 · Ya caí: guía para víctimas
- El usuario elige qué le pasó: transfirió plata, dio una clave o código, pasó datos de la tarjeta, pasó su DNI o datos personales, instaló una app o dio acceso remoto, o lo amenazan/extorsionan.
- Se muestra una guía paso a paso para ese caso más los pasos que aplican siempre (por ejemplo, guardar las pruebas), con opción de copiarla.
- **Regla:** se advierte que nunca hay que pagar para "recuperar" la plata.

### RF-18 · Manual dentro de la app
- Botón "¿Cómo se usa?" que abre la página /ayuda con este manual, con índice navegable y descarga del manual y de esta documentación en PDF.

### RF-19 · Pandi, el asistente
- Un osito panda de cuerpo entero (mascota original de la app) flota sobre la página: se asoma desde abajo, saluda y muestra un globito de ayuda la primera vez de cada visita. Tocarlo abre un chat para hacer preguntas sobre estafas, qué hacer si ya se cayó y cómo usar la app.
- **Se puede arrastrar:** con el mouse o el dedo (también con las flechas del teclado), sin salir nunca de la pantalla. Mientras se mueve muestra el globito «¡Wiii! ¡Me estás arrastrando!» y, cuando queda quieto menos de un segundo después de soltarlo, vuelve solo a su lugar (abajo a la derecha) con un saltito. Un toque sin arrastre abre el chat; un arrastre no lo abre.
- Respuestas generadas por la IA (Gemini) con instrucciones fijas: español rioplatense, respuestas cortas, temas limitados a estafas y a la app.
- **Reglas:** nunca pide ni acepta claves, códigos o datos personales; no asegura que algo sea 100 % seguro; no inventa teléfonos ni direcciones (solo menciona el 911); deriva a "Ya caí" y al 911 en emergencias.
- Conversación acotada (últimos 8 mensajes, preguntas de hasta 600 letras), con límite de uso por IP y mensajes amables ante sobrecarga. La conversación no se guarda.

### RF-20 · Llamar al 911 con la denuncia lista
- Botón rojo "Llamar al 911 · Policía" en el resultado (cuando es estafa o sospechoso) y en "Ya caí".
- Con un toque: en celulares y tablets abre el marcador del teléfono con el 911 (`tel:911`); en computadoras no usa `tel:` (lo tomaría Zoom, Teams u otro programa) y muestra el 911 en grande para marcarlo desde un teléfono. Además muestra un guion para leer en la llamada (fecha y hora, mensaje recibido, dominios de los links y señales detectadas) y copia la denuncia completa al portapapeles.
- **Limitación:** una llamada telefónica no transmite texto; la denuncia escrita se entrega aparte (WhatsApp, mail o en la comisaría). En "Ya caí" el guion es genérico para completar.

### RF-21 · Video "Cómo se usa"
- En /ayuda hay un video de unos 3 minutos y medio, con subtítulos en español y portada, que recorre todas las funciones. Se accede también desde el inicio ("▶ Mirá el video de cómo se usa").
- El video se genera automáticamente con un script de Playwright (`npm run demo:video`) que navega la app con cursor visible y carteles explicativos. Usa respuestas de ejemplo fijas para que la grabación sea siempre igual (opción `--real` para usar la IA). Se carga solo cuando el usuario lo reproduce.

### RF-22 · Motor propio sin IA (respaldo)
- Si no hay clave de Gemini, se agotó la cuota o la IA no responde, el análisis de texto sigue funcionando con reglas propias de las estafas argentinas (código o clave, datos de tarjeta, familiar con número nuevo, pedido de plata, urgencia, amenazas, premios, inversiones, acceso remoto, links acortados, validar datos y suplantación de marcas), combinadas con el chequeo técnico de links.
- El resultado avisa que se analizó "sin inteligencia artificial". Nunca da 0 ni 100 de riesgo. Las capturas solas no se pueden analizar sin IA.
- Pandi también responde sin IA: orienta según palabras clave (ya caí, códigos, links, transferencias) y manda a la sección de la app que corresponde.

### RF-23 · Marca blanca
- Con variables de entorno, cada empresa cliente tiene su copia de la app con "Un servicio de {empresa}", su logo y su contacto (WhatsApp o web) en el pie. Sin variables, se ve como AntiEstafa AR.

### RF-24 · API para bots (/api/v1/analizar)
- Para el bot de WhatsApp de tecnoros u otros sistemas. Requiere clave por cliente (`Authorization: Bearer`). Recibe texto o imagen y devuelve veredicto, puntaje, resumen, pasos, links y `texto_whatsapp` listo para responder.
- Límite de 60 consultas por minuto por cliente. Tope mensual opcional de análisis con IA: pasado el tope, sigue con el motor propio.

### RF-25 · Medidor de uso
- Cuenta los análisis de cada cliente por mes (Upstash Redis si está configurado; si no, en memoria). Sirve para cobrar la clave paga y aplicar el tope.

### RF-27 · Página "Para empresas" y "Privacidad y términos"
- /empresas presenta cómo les llega el servicio a los clientes (app con su nombre, WhatsApp), cuánto cuesta en lenguaje simple (gratis para los usuarios; la empresa elige "con la IA gratuita" o "con IA paga incluida") y cómo se contrata con tecnoros.ar.
- /privacidad explica qué se hace con lo que se pega, las condiciones de uso y que el responsable del servicio es tecnoros.ar.
- Todas las páginas dicen arriba "Un servicio de tecnoros.ar" (o "Empresa · un servicio de tecnoros.ar" si se configura una empresa, por ejemplo Tero Security).

### RF-28 · Revisar un audio
- Pestaña "Audio": subir una nota de voz de WhatsApp (.opus/.ogg), MP3, M4A, WAV, WEBM o AMR (hasta 25 MB; se revisan los primeros 2 minutos), o grabar con el micrófono hasta 2 minutos (MediaRecorder, formato según el navegador). Se puede escuchar antes de enviar.
- El servidor reconoce el formato por sus primeros bytes. Gemini escucha el audio, devuelve la transcripción (hasta 800 caracteres) y el análisis con el mismo formato que un mensaje; el prompt advierte sobre voces clonadas con IA.
- El resultado muestra "Lo que dice el audio" y el mismo panel de veredicto, alerta, denuncia (con la transcripción) y botón al 911. Se guarda en "Mis análisis".
- El navegador convierte el audio a WAV mono de 16 kHz (hasta 2 minutos) antes de mandarlo; si no puede leer el formato, manda el original.
- **Sin IA disponible también funciona:** el servidor transcribe el audio con un reconocedor de voz propio (Whisper tiny int8 con sherpa-onnx, en `modelos/voz`, sin servicios externos ni costo) y el motor propio lo analiza en "modo audio": corrige palabras clave mal transcriptas y suma reglas de voz (alguien conocido desde otro número, "le hablamos del banco / seguridad", "dictame el código que te llegó", montos en pesos) y la advertencia de voces clonadas con IA. El resultado lo aclara.
- **Limitación:** sin IA, la transcripción es menos precisa y necesita que el navegador haya convertido el audio a WAV (los navegadores actuales lo hacen; si no, se pide probar más tarde).

### RF-29 · Escanear un QR
- Pestaña "QR": sacar una foto o elegir una imagen. El QR se lee en el navegador (jsQR), sin subir la imagen.
- Si es un link, se revisa como en "Link". Si es un QR de pago (formato EMV), muestra comercio, ciudad y monto. Si es otra cosa (texto, teléfono, wifi), lo muestra para que la persona decida.

### RF-30 · Estafas del momento
- Pestaña "Del momento" en "Más ayuda": lista curada de modalidades que circulan en Argentina, de la más nueva a la más vieja, con fecha, resumen, señales, consejo y fuente verificable.
- Botón "Avisar a mi familia" que abre WhatsApp con un aviso corto y el link de la app.
- Se actualiza agregando entradas en `src/lib/tendencias.ts`.

### RF-31 · Practicá
- Pestaña "Practicá" en "Más ayuda": quiz de mensajes reales y estafas (dominios ficticios .example). Después de cada respuesta explica por qué y "qué mirar". Al final muestra el nivel y permite compartir el resultado.

### RF-32 · Conexión con TERO Security
- Con `TERO_SIEM_URL` y `TERO_API_KEY` configurados, cada resultado "estafa" o "sospechoso" (mensaje, captura, audio, link, QR y bot) se manda al SIEM de TERO como evento tipo ECS, después de responderle al usuario (no lo demora ni le muestra errores).
- El evento lleva veredicto, riesgo, canal, señales, dominios como indicadores, técnicas MITRE ATT&CK (T1566, T1566.002 link, T1566.004 voz, T1598 pedido de datos), organización y una huella del texto. El texto o la transcripción solo se mandan con `TERO_INCLUIR_TEXTO=true`.
- El usuario ve "Le avisamos al equipo de seguridad de {empresa}" y la página de privacidad lo explica.
- Incluye reglas Sigma (`integraciones/tero/sigma`), evento de ejemplo y `npm run tero:prueba` para probar la conexión. Guía: `docs/INTEGRACION_TERO.md`.

## 5. Flujos principales

**Analizar un mensaje**
```
Pegar texto o subir captura → (opcional) responder preguntas → "¿Es estafa? Analizar"
→ progreso por pasos → semáforo + puntaje → banderas, qué hacer, links revisados
→ (opcional) modo abuela / escuchar / alerta / WhatsApp / denuncia
```

**Antes de transferir**
```
Pestaña "Transferencia" → alias/CBU/CVU + mensaje → "Revisar antes de transferir"
→ riesgo bajo/medio/alto + señales + recomendación
```

**Revisar un link**
```
Pestaña "Link" → pegar dirección → "Revisar link" → veredicto + datos del link
```

**Si ya caí**
```
"Más ayuda" → "Ya caí" → elegir qué pasó → guía paso a paso → "Copiar guía"
```

**Pregunta a Pandi**
```
Panda (abajo a la derecha) → pregunta sugerida o propia → respuesta → seguir preguntando o cerrar (✕ / Escape)
```

**Denuncia rápida**
```
Resultado "estafa" o "Ya caí" → "Llamar al 911 · Policía" → marcador con 911 + guion en pantalla + denuncia copiada
```

**Comprobante recibido**
```
Pestaña "Comprobante" → subir captura → "Revisar comprobante"
→ parece real / sospechoso / probablemente falso + recomendación
```

## 6. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| **Privacidad** | No se guardan mensajes en el servidor. El historial vive solo en el dispositivo. Sin registro. |
| **Seguridad** | Protección SSRF, rate limit por IP, límite de 4 MB por imagen, claves solo en variables de entorno. |
| **Rendimiento** | Chequeos en paralelo, máximo 3 links, caché de 1 hora por dominio, timeouts de 4 s. |
| **Disponibilidad** | Reintentos y modelos alternativos ante sobrecarga de la IA (errores 429/503/504). Si la IA no está disponible, el motor propio sin IA analiza el texto: el servicio no se corta. |
| **Accesibilidad** | Mobile first, botones grandes, etiquetas para lectores de pantalla, navegación por teclado en las pestañas, foco en el resultado, modo abuela, lectura en voz alta. |
| **Experiencia de uso** | Transiciones suaves en pestañas y resultados (se desactivan si el usuario pidió reducir el movimiento), respuesta visual al tocar botones, desplazamiento automático al resultado, la pestaña elegida siempre visible en el celular y sin desbordes horizontales. |
| **Idioma** | Español rioplatense. |
| **Calidad** | Más de 100 tests automáticos, lint y verificación de tipos. |

## 7. Mensajes del sistema

| Situación | Mensaje |
|---|---|
| Se tocó Analizar sin cargar nada | "Pegá el mensaje o subí una captura para analizar." |
| Sin conexión | "No pudimos conectarnos. Revisá tu internet y probá de nuevo." |
| IA sobrecargada o límite de uso | Mensaje amable pidiendo reintentar en unos minutos. |
| Imagen muy grande o formato inválido | Aviso antes de enviar. |
| Copiado automático no disponible | "No pudimos copiar solo: mantené apretado el texto y elegí Copiar." |

## 8. Limitaciones conocidas

- El resultado es una **orientación**, no una certeza: la app puede equivocarse en ambos sentidos.
- La verificación de comprobantes es visual; no consulta al banco.
- La antigüedad de algunos dominios puede no estar disponible (RDAP); en ese caso se informa "Antigüedad desconocida".
- La instalación como app depende del navegador (Firefox en la compu no la permite).
- El servicio de IA puede estar sobrecargado en momentos puntuales; en ese caso el motor propio da un análisis más simple y no puede leer capturas.
- El medidor de uso sin Upstash se reinicia con cada despliegue.
- "Estafas del momento" es una lista curada: hay que actualizarla a mano.
- La lectura de QR depende de la calidad de la foto (luz, reflejos, distancia).

## 9. Glosario

| Término | Significado |
|---|---|
| **Phishing** | Mensaje que imita a una empresa u organismo para robar datos o dinero. |
| **Dominio** | La parte principal de una dirección web (por ejemplo `mercadopago.com.ar`). |
| **RDAP** | Servicio público que informa cuándo se registró un dominio. |
| **SSL** | Certificado que cifra la conexión (el candado del navegador). No garantiza que el sitio sea legítimo. |
| **Levenshtein** | Medida de cuántas letras difieren dos palabras; detecta imitaciones como `mercadopag0`. |
| **PWA** | Página web que se puede instalar como una app. |
| **CBU / CVU / alias** | Identificadores de cuentas bancarias y virtuales en Argentina. |
