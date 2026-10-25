# AntiEstafa AR · Guía de integración para tecnoros.ar

Cómo instalar AntiEstafa AR para un cliente de tecnoros, con su marca y su bot de WhatsApp. **Sin que nadie pague la IA**, salvo que el cliente quiera la clave paga.

---

## 1. Cómo funciona el modelo

| Plan | Qué recibe el cliente | Quién paga la IA |
|---|---|---|
| **Comunidad** (gratis) | La app pública: antiestafa-ar-2.vercel.app | Nadie: clave gratuita + motor propio |
| **Empresa** (abono) | La app con su marca, bot de WhatsApp y medidor de uso | Nadie: usa la clave **gratuita** del cliente + motor propio |
| **Empresa + IA** (abono mayor) | Todo lo anterior, con IA sin cortes | El cliente, **dentro del abono**: la clave paga la compra el servicio y se cobra el consumo más un margen |

**El servicio nunca se corta.** Si no hay clave, si se agota la cuota gratuita o si Google no responde, la app sigue funcionando con el **motor propio**: reglas de las estafas argentinas más el chequeo técnico de los links. Es más simple que la IA, y la app lo avisa.

> Ojo con la privacidad: en el plan gratuito de Gemini, Google puede usar el contenido para mejorar sus productos. Por eso la clave paga también se vende como "más privacidad". Revisar los términos y topes vigentes de Google antes de cada venta.

---

## 2. Instalar la app para un cliente nuevo (marca blanca)

Cada cliente tiene **su propia copia** en Vercel, con su marca y su clave. Así el consumo de uno no afecta al otro.

1. En Vercel: **Add New → Project →** importar el repositorio `Ridioortv/analicistec`.
2. Nombre del proyecto: `antiestafa-<cliente>` (por ejemplo `antiestafa-seguridad-sur`).
3. En **Environment Variables** cargar:

| Variable | Ejemplo | Para qué |
|---|---|---|
| `GEMINI_API_KEY` | (clave del cliente) | IA. Si se deja vacía, funciona con el motor propio. |
| `NEXT_PUBLIC_MARCA_NOMBRE` | `Seguridad Sur` | Aparece "Un servicio de Seguridad Sur" arriba. |
| `NEXT_PUBLIC_MARCA_LOGO` | `https://segsur.com.ar/logo.png` | Logo del cliente (link https). |
| `NEXT_PUBLIC_MARCA_CONTACTO` | `5493415551234` | WhatsApp del cliente (o un link https). |
| `NEXT_PUBLIC_URL_APP` | `https://antiestafa-seguridad-sur.vercel.app` | La dirección de esta copia. |
| `ANTIESTAFA_API_CLIENTES` | `seguridad-sur:<clave>:500` | Habilita la API para el bot (ver punto 4). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | (de Upstash) | Medidor de uso que no se borra (opcional). |

4. **Deploy.** Si el cliente quiere su propio dominio (por ejemplo `antiestafa.segsur.com.ar`), se agrega en **Settings → Domains**.

### Cómo saca el cliente su clave gratuita de Gemini

1. Entrar a **https://aistudio.google.com/apikey** con una cuenta de Google de la empresa.
2. **Create API key** y copiarla.
3. Pegarla en `GEMINI_API_KEY` del proyecto de Vercel y volver a desplegar.

La clave es del cliente: nunca va en el código ni en un mensaje.

---


## 3. Bot de WhatsApp (API para bots)

El bot de WhatsApp que arma tecnoros le manda el mensaje a la API y le contesta a la persona con `texto_whatsapp`.

**Generar la clave de la API** (una por cliente, mínimo 16 caracteres):

```bash
openssl rand -hex 24
```

y cargarla en Vercel: `ANTIESTAFA_API_CLIENTES=seguridad-sur:<la clave>:500`. El último número es el **tope mensual de análisis con IA**; pasado el tope, sigue con el motor propio hasta el mes siguiente. Sin número, no hay tope.

**Llamada:**

```bash
curl -X POST https://antiestafa-seguridad-sur.vercel.app/api/v1/analizar \
  -H "Authorization: Bearer <la clave>" \
  -H "Content-Type: application/json" \
  -d '{"texto": "Hola ma, cambié de número, transferime al alias pago.rapido.mp"}'
```

También acepta `"imagen": "<base64>"` para capturas y `"audio": "<base64>"` para **notas de voz** (el bot puede reenviar el audio de WhatsApp tal cual). En los audios la respuesta trae además `"transcripcion"` con lo que dice el audio. Las capturas necesitan IA. Los audios **también funcionan sin IA** (reconocedor de voz propio), pero en ese caso hay que mandarlos en **WAV** (ideal mono 16 kHz, hasta 2 minutos): el bot puede convertir la nota de voz con `ffmpeg -i nota.opus -ar 16000 -ac 1 audio.wav`.

**Respuesta:**

```json
{
  "veredicto": "estafa",
  "score": 80,
  "resumen": "Esto tiene todas las señales de una estafa.\nNo respondas, no pagues y no abras links.",
  "banderas": ["Alguien dice ser un familiar con número nuevo. Es una de las estafas más comunes.", "Te pide plata o una transferencia."],
  "que_hacer": ["Llamá a tu familiar al número de siempre antes de hacer nada.", "No transfieras. Verificá por otro canal quién te lo pide."],
  "links": [],
  "texto_whatsapp": "🔴 *Es una estafa* (riesgo 80/100)\n\n…",
  "sin_ia": true,
  "modelo": "motor-propio",
  "uso": { "cliente": "seguridad-sur", "mes": 37, "tope": 500 }
}
```

- `texto_whatsapp` ya viene listo para responder (con *negritas* de WhatsApp).
- `uso.mes` es lo que se usa para **facturar la clave paga**.
- Errores: `401` clave inválida, `429` demasiadas consultas (60 por minuto por cliente), `400`/`413`/`415` mensaje o imagen inválidos.

**Flujo del bot:** la persona reenvía el mensaje → el bot llama a `/api/v1/analizar` → responde con `texto_whatsapp` → si es estafa, ofrece el link de la app para hacer la denuncia.

---

## 4. Vender la clave paga dentro del abono

1. El servicio (tecnoros o el equipo) abre una cuenta de Google Cloud con facturación y crea una clave por cliente.
2. Se carga esa clave en `GEMINI_API_KEY` del proyecto del cliente y se pone su tope en `ANTIESTAFA_API_CLIENTES`.
3. Cada mes se mira el uso (`uso.mes`, o en Upstash la clave `uso:<cliente>:<AAAA-MM>`) y se cobra el consumo real más el margen acordado, dentro del abono.
4. El cobro mensual se puede hacer con una suscripción de Mercado Pago.

Si el cliente prefiere, puede traer su propia clave paga y pagarle a Google directo: el abono queda solo por el servicio.

---

## 5. Qué falta para la próxima etapa

- **Plan Familia** (un familiar recibe aviso si la persona analiza una estafa): necesita cuentas y una base de datos.
- **Panel de la empresa** con las estafas que circulan entre sus clientes (sin guardar mensajes).
- **Cobro automático** con Mercado Pago (suscripciones).
- **Alertas de estafas nuevas** por WhatsApp o mail.

---

Hecho por Manuel A. y María Sofía Genta.
