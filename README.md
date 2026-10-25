# AntiEstafa AR 🛡️

**¿Te llegó un mensaje raro? Pegalo o subí la captura y en segundos te decimos si es una estafa, por qué, y qué hacer.**

👉 **Probalo:** https://antiestafa-ar-2.vercel.app — gratis, sin registro, desde el celu o la compu. También se puede **instalar como app**.

> Proyecto de hackatón · Next.js + TypeScript + Tailwind + Gemini · Deploy en Vercel

---

## El problema

En Argentina las estafas por WhatsApp y SMS son moneda corriente: el falso ARCA/AFIP que amenaza con un embargo, el "Mercado Pago" que te bloqueó la cuenta, el paquete retenido de Correo Argentino, el clásico "hola ma, cambié de número", el vendedor trucho de Marketplace, el "soporte del banco" que te pide la clave y las inversiones cripto que duplican la plata.

Los mensajes son cada vez más creíbles (hoy también los escriben con IA) y los más expuestos son justamente quienes menos herramientas tienen para darse cuenta: las personas mayores.

## La solución

**AntiEstafa AR te protege en tres momentos: antes, durante y después de una estafa.**

| Momento | Qué hace |
|---|---|
| **Antes de pagar** | Revisa el alias/CBU que te pidieron y detecta comprobantes de transferencia falsos. |
| **Durante el análisis** | Combina IA con verificación técnica real de los links y te muestra la parte trucha. |
| **Después** | Arma la denuncia, avisa a tu familia por WhatsApp y te lo lee en voz alta. |

---

## Funcionalidades

### 🔍 Análisis del mensaje
- **Texto o captura de pantalla.** Pegás el mensaje o subís la imagen de WhatsApp; la IA la lee con visión.
- **IA entrenada en estafas argentinas.** Gemini detecta las señales de manipulación: urgencia falsa, suplantación de organismos, pedidos de plata o datos.
- **Verificación técnica de links.** Antigüedad del dominio (RDAP), certificado SSL, a dónde redirige y si imita a una marca conocida (distancia de Levenshtein).
- **Puntaje y semáforo.** Combina las señales técnicas con el veredicto de la IA en un puntaje 0-100: 🟢 seguro · 🟡 sospechoso · 🔴 estafa.
- **Dominio engañoso resaltado.** Marca la parte trucha del link (`mercadopag0` vs `mercadopago`) y cuántos días tiene el sitio.
- **"Así se ve el real".** Si el mensaje imita a una empresa, muestra cómo se comunica de verdad (por ejemplo, "nunca te pide claves por mensaje").
- **Preguntas para afinar.** Tres preguntas opcionales (¿te pidieron plata?, ¿conocés a quien te lo mandó?, ¿te apuran?) que hacen el análisis más preciso.
- **Ejemplos de un toque.** Mensajes de ejemplo para probar la app sin tener que pegar nada.
- **Carga sin esfuerzo:** botón "Pegar", pegar una captura con Ctrl+V, arrastrar y soltar la imagen, Ctrl+Enter para analizar, y la pantalla baja sola hasta el resultado.
- **Revisar un link** sin abrirlo: antigüedad, candado y marca imitada.
- **Revisar un audio:** la nota de voz de WhatsApp (o grabada con el micrófono) se transcribe y se analiza. Avisa sobre voces clonadas con IA. **Funciona aunque no haya IA:** tiene su propio reconocedor de voz (Whisper tiny, corre en el servidor, gratis).
- **Escanear un QR** antes de pagar: se lee en el celular y muestra a dónde lleva o a quién le pagás.

### 💸 Antes de transferir
- **Chequeo de alias/CBU/CVU.** Valida el formato (incluidos los dígitos verificadores del CBU/CVU) y evalúa con IA si el pedido es sospechoso. Nunca afirma que una cuenta es segura: siempre recomienda verificar por otro canal.
- **Detector de comprobante falso.** Subís la captura de una "transferencia" que te mandaron (típico en Marketplace) y la IA señala lo que no cierra.

### 🆘 Si ya caíste
- **Ya caí:** guía paso a paso según lo que pasó (transferiste plata, diste una clave, pasaste datos de la tarjeta o el DNI, instalaste una app, te extorsionan), con los pasos urgentes primero.

### 📚 Aprender y estar al día
- **Estafas del momento:** las modalidades que circulan ahora en Argentina, con fuente y botón para avisar a la familia.
- **Practicá:** un quiz de "¿es estafa o es real?" con las pistas de cada mensaje.

### 🐼 Pandi, el asistente
- Un **osito panda** que se asoma, saluda y responde preguntas sobre estafas y sobre cómo usar la app, en lenguaje simple. **Se puede arrastrar**: dice «¡Wiii!» y, cuando lo soltás, vuelve solito a su lugar. Nunca pide datos y no inventa teléfonos.

### 📣 Después de detectar una estafa
- **Qué hacer ahora.** Pasos concretos según el caso.
- **Generar denuncia.** Arma un texto formal con el mensaje, los links, las señales detectadas, el veredicto y la fecha; se copia, se descarga o se imprime/guarda como PDF.
- **Alerta para compartir** y **envío directo por WhatsApp** al grupo de la familia.
- **Llamar al 911 con la denuncia lista:** un toque abre el marcador con el 911, muestra el guion de lo que hay que decir y copia la denuncia completa.

### 👵 Accesibilidad
- **Modo abuela.** El resultado en dos líneas, con letra grande y una sola acción.
- **Leer en voz alta.** Botón que lee el resumen con la voz del navegador (es-AR).
- **App instalable (PWA).** Botón "Instalar app" visible en cualquier navegador: instala con un clic donde se puede y, si no, explica cómo hacerlo (Chrome, Edge, Android, iPhone, Mac, Firefox).
- **Manual dentro de la app:** botón "¿Cómo se usa?" con la guía completa y descarga en PDF.
- **Mobile first**, español rioplatense, sin registro.

### 🏢 Para empresas (listo para vender con tecnoros.ar)
- **Funciona sin pagar IA:** si no hay clave o se agota la cuota gratuita, sigue con el **motor propio** (reglas de estafas argentinas + chequeo de links). Pandi también responde lo básico.
- **Marca blanca:** cada cliente con su nombre, logo y contacto, configurado con variables de entorno.
- **API para bots de WhatsApp** (`/api/v1/analizar`) con clave por cliente, tope mensual de IA y respuesta lista para WhatsApp.
- **Medidor de uso** por cliente y por mes, para cobrar la clave paga dentro del abono.
- **Conexión con TERO Security:** cuando un empleado detecta una estafa, se avisa al SIEM de TERO (evento ECS con MITRE T1566, sin mandar el texto) y el SOAR abre el caso. Reglas Sigma incluidas.
- Páginas **Para empresas** (cuánto cuesta y cómo se contrata) y **Privacidad y términos**. Un servicio de **tecnoros.ar**.
- 👉 Guía paso a paso: **[Integración con tecnoros.ar](docs/INTEGRACION_TECNOROS.md)**.

### 🔒 Privacidad y seguridad
- **No guardamos tus mensajes.** **Mis análisis** (los últimos 10 mensajes, audios, links y QR) queda solo en tu dispositivo; se puede apagar y borrar.
- **Anti-SSRF:** el chequeo de links bloquea IPs privadas y localhost, con timeouts.
- **Rate limit por IP**, límite de 4 MB por imagen y reintentos ante sobrecarga de Gemini, con mensajes amables al usuario.

### ⚡ Rendimiento
- Chequeos de links e IA **en paralelo**, máximo 3 links por mensaje, **caché de 1 hora** por dominio, timeouts de 4 s y "thinking" bajo del modelo.
- **Progreso visible por pasos** ("Revisando links…", "Analizando el mensaje…", "Calculando el riesgo…").
- Medido: el chequeo de links bajó de ~0,8 s a ~0,3 s con caché, y las redirecciones lentas ya no frenan el análisis (antes hasta 5 s).

---

## Video de demostración

▶ **[Mirá cómo se usa en 3 minutos](https://antiestafa-ar-2.vercel.app/ayuda#video)** (con subtítulos).

El video se graba solo con Playwright, recorriendo todas las funciones:

```bash
npm install
npx playwright install chromium   # la primera vez
npm run dev                       # en otra terminal
npm run demo:video                # genera public/demo/demo.mp4, portada.jpg y demo.vtt
```

Usa respuestas de ejemplo fijas para que el video salga siempre igual. Opciones: `--url=https://antiestafa-ar-2.vercel.app` para grabar la versión publicada y `--real` para usar la IA de verdad. Para sumar una función nueva al video, agregá un paso en `scripts/demo/grabar-demo.mjs`. Necesita `ffmpeg` instalado.

## Documentación

- 📘 **[Manual de usuario](docs/MANUAL_DE_USUARIO.md):** cómo usar cada funcionalidad, paso a paso, y preguntas frecuentes.
- 🛡️ **[AntiEstafa dentro de TERO Security](docs/INTEGRACION_TERO.md):** los empleados reportan estafas y TERO abre la alerta y el caso (SIEM, reglas Sigma T1566, SOAR).
- 🏢 **[Integración con tecnoros.ar](docs/INTEGRACION_TECNOROS.md):** instalar la app para un cliente, bot de WhatsApp y cobro de la clave paga.
- 📗 **[Documentación funcional](docs/DOCUMENTACION_FUNCIONAL.md):** usuarios, alcance, requisitos funcionales y no funcionales, flujos, mensajes del sistema y limitaciones.
- 📄 **Versiones en PDF:** [Manual de usuario](public/docs/AntiEstafa-AR_Manual-de-usuario.pdf) · [Documentación funcional](public/docs/AntiEstafa-AR_Documentacion-funcional.pdf)

---

## Demo en 5 mensajes

Copiá y pegá cada uno en la app (o usá los **ejemplos de un toque**). Los dominios son inventados.

**1. Falso ARCA con embargo → 🔴 estafa**
```
ARCA INFORMA: Registrás una deuda de $187.430 en Ganancias. Para evitar el embargo de tus cuentas regularizá HOY en https://arca-regularizacion.com/pago antes de las 24 hs.
```
Suplantación de ARCA, urgencia y amenaza, link que no es `arca.gob.ar`.

**2. Falso Mercado Pago → 🔴 estafa**
```
Mercado Pago: tu cuenta fue BLOQUEADA por actividad inusual. Validá tu identidad en http://mercadopag0-seguridad.xyz/validar o perdés tu saldo.
```
`mercadopag0` (con cero) resaltado, sin SSL, y el recuadro "Así se ve el real".

**3. "Hola ma, cambié de número" → 🔴 estafa**
```
Hola ma, cambié de número, agendá este. Estoy en un apuro, ¿me podés transferir $85.000 al alias pago.rapido.mp? Después te explico, no me llames que no puedo hablar.
```
Estafa sin links, detectada por ingeniería social. Probá el **modo abuela**, **Escuchar** y **Compartir por WhatsApp**; y pegá el alias en **"¿Te pidieron que transfieras?"**.

**4. Falso Correo Argentino → 🔴 estafa**
```
Correo Argentino: tu paquete está retenido por falta de pago de $1.250 de aduana. Abonalo en https://correoargentlno-envios.com/pago para recibirlo mañana.
```
`correoargentlno` (una "l" en vez de "i"). Probá **Generar denuncia**.

**5. Mensaje legítimo → 🟢 seguro**
```
Hola! Te confirmo el turno con la Dra. Gómez el martes 28 a las 10:30 en el consultorio de siempre. Si no podés venir, avisanos por este medio. Gracias!
```
No todo es alarma.

---

## Cómo funciona

```
texto / imagen / audio ──► /api/analyze ──┬─► links ─► RDAP · SSL · redirecciones · marcas  (en paralelo, con caché)
                                  └─► Gemini (JSON con responseSchema)
                                           │
                                score combinado + veredicto ─► UI

link ──► /api/link ──► RDAP · SSL · redirecciones · marcas
alias/CBU + mensaje ──► /api/transferencia ──► validación de formato + Gemini
captura de comprobante ──► /api/comprobante ──► Gemini con visión
pregunta a Pandi ──► /api/asistente ──► Gemini (respuestas cortas, reglas fijas)
```

| Archivo | Qué hace |
|---|---|
| `src/lib/links.ts` | Extracción y chequeo de links, Levenshtein contra marcas, anti-SSRF, timeouts. |
| `src/lib/gemini.ts` | Prompt con contexto de estafas argentinas, salida JSON validada, fallback de modelos y reintentos. |
| `src/lib/score.ts` | Combina señales técnicas con el veredicto de la IA. |
| `src/lib/transferencia.ts` | Validación de alias, CBU y CVU (dígitos verificadores). |
| `src/lib/comprobante.ts` | Análisis de comprobantes de transferencia. |
| `src/lib/denuncia.ts` | Texto formal de la denuncia. |
| `src/lib/pwa.ts` | Manifest y detección de navegador para instalar la app. |
| `src/components/` | UI: analizador, semáforo, modo abuela y cada funcionalidad. |

**Stack:** Next.js (App Router) · TypeScript · Tailwind · `@google/genai` (Gemini con visión y audio) · Whisper tiny + sherpa-onnx (voz sin IA paga) · RDAP · Vercel.
**Calidad:** más de 100 tests automáticos (con Gemini y red simulados, no gastan cuota), lint y build en cada cambio.

---

## Correrlo local

```bash
npm install
cp .env.example .env.local   # completá GEMINI_API_KEY (sin clave anda con el motor propio)
npm run dev                  # http://localhost:3000
npm test
```

En Windows (PowerShell), usá `Copy-Item .env.example .env.local` en lugar de `cp`.

---

## Equipo

| Integrante | GitHub | Aporte |
|---|---|---|
| Manuel A. | [@Ridioortv](https://github.com/Ridioortv) | Programa base: análisis con IA y visión, chequeo de links, score, rate limit y deploy en Vercel; rediseño con pestañas, revisar link, "Ya caí" y "Mis análisis". |
| María Sofía Genta | [@sofiigentaa](https://github.com/sofiigentaa) | Mejoras: alias/CBU, comprobante falso, denuncia, WhatsApp, voz, ejemplos, dominio resaltado, "así se ve el real", preguntas para afinar, historial, app instalable y optimización de velocidad. |

**Hecho por Manuel A. y María Sofía Genta.**

_Construido en una hackatón con ayuda de agentes de IA (Claude Code) trabajando en paralelo sobre el mismo repositorio._
