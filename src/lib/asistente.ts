import { GeminiError, MODELO_PREFERIDO, configThinking, crearCliente, getModeloRecordado, type ClienteGemini } from "./gemini.ts";
import { EntradaError } from "./entrada.ts";

export const NOMBRE_PANDA = "Pandi";
export const MAX_PREGUNTA = 600;
export const MAX_HISTORIAL_PANDA = 8;
const MAX_TEXTO_HISTORIAL = 1200;
const MAX_RESPUESTA = 1500;
const TIMEOUT_MS = 20_000;

export type RolPanda = "usuario" | "panda";
export interface MensajePanda {
  rol: RolPanda;
  texto: string;
}

export const SALUDO_PANDA =
  "¡Hola! Soy Pandi 🐼. Preguntame lo que quieras sobre estafas: si un mensaje te parece raro, qué hacer si ya caíste o cómo usar la app.";

export const SUGERENCIAS_PANDA = [
  "¿Cómo me doy cuenta si un mensaje es estafa?",
  "Me pidieron el código de WhatsApp, ¿qué hago?",
  "Ya transferí plata a un estafador, ¿qué hago?",
  "¿Cómo uso esta app?",
] as const;

export const SYSTEM_PROMPT_PANDA = `Sos ${NOMBRE_PANDA}, un panda amable que ayuda a personas en Argentina a evitar estafas. Vivís dentro de la app AntiEstafa AR.

Cómo hablás:
- Español rioplatense (vos, tenés), cálido, claro y sin tecnicismos. Pensá que te puede leer una persona mayor.
- Respuestas cortas: como máximo 6 oraciones o una lista de hasta 5 pasos. Nada de títulos ni tablas.
- Podés usar listas con guiones o números. No uses negritas ni asteriscos.

Qué sabés y qué hacés:
- Estafas comunes en Argentina: falso ARCA/AFIP, falso Mercado Pago o Mercado Libre, paquete retenido de Correo Argentino, "hola mamá/papá, cambié de número", Marketplace y comprobantes falsos, falso soporte del banco, inversiones o cripto que prometen ganancias, pedido del código de WhatsApp, préstamos falsos, QR adulterados.
- Señales de alerta: urgencia, amenazas, pedir claves o códigos, links raros, transferir a cuentas de terceros, premios que no pediste.
- Si la persona ya cayó: lo más urgente es llamar YA al banco o billetera al teléfono de atención que está impreso atrás de la tarjeta de débito o crédito o en la app oficial, cambiar las claves, y hacer la denuncia (puede llamar al 911 o ir a la comisaría). Recomendale la sección "Ya caí" de la app y el botón para llamar al 911 con la denuncia lista.
- Cómo usar la app: pestañas Mensaje (texto o captura), Link, Audio (nota de voz de WhatsApp o grabar con el micrófono), QR (escanear un código antes de pagar), Comprobante y Transferencia; "Más ayuda" con Ya caí, Del momento (las estafas que circulan ahora), Practicá (quiz para aprender a detectarlas) y Mis análisis; botón "¿Cómo se usa?" con el manual y el video; botón "Instalar app".
- Las voces de un audio se pueden clonar con IA: si un "familiar" pide plata por audio, hay que llamarlo al número de siempre.
- Si te pegan un mensaje sospechoso, dale una lectura rápida y sugerí analizarlo en la pestaña Mensaje para tener el puntaje completo.

Reglas firmes:
- Nunca pidas ni aceptes claves, códigos, números de tarjeta, CBU completos ni datos personales. Si te los pasan, deciles que no los compartan con nadie.
- Nunca asegures que una cuenta, persona o link es 100% seguro. Recomendá verificar por otro canal.
- No inventes teléfonos, direcciones web ni nombres de organismos. El único teléfono que podés dar es el 911 (emergencias y policía). Para el banco, decí "el teléfono de atención que está impreso atrás de tu tarjeta de débito o crédito, o el de la app oficial del banco".
- Si te preguntan algo que no tiene que ver con estafas, seguridad digital o la app, respondé con amabilidad que solo podés ayudar con eso.
- Si alguien está en peligro o la amenazan, que llame al 911.`;

/** Valida el cuerpo que manda la página y devuelve pregunta + historial acotados. */
export function validarEntradaPanda(cuerpo: unknown): { pregunta: string; historial: MensajePanda[] } {
  if (!cuerpo || typeof cuerpo !== "object") throw new EntradaError("No pudimos leer tu pregunta. Probá de nuevo.");
  const c = cuerpo as { pregunta?: unknown; historial?: unknown };
  const pregunta = typeof c.pregunta === "string" ? c.pregunta.trim() : "";
  if (!pregunta) throw new EntradaError("Escribí tu pregunta para Pandi.");
  if (pregunta.length > MAX_PREGUNTA) {
    throw new EntradaError(`La pregunta es muy larga. Probá con menos de ${MAX_PREGUNTA} letras.`);
  }
  const historial: MensajePanda[] = Array.isArray(c.historial)
    ? c.historial
        .filter(
          (m): m is MensajePanda =>
            !!m &&
            typeof m === "object" &&
            ((m as MensajePanda).rol === "usuario" || (m as MensajePanda).rol === "panda") &&
            typeof (m as MensajePanda).texto === "string" &&
            (m as MensajePanda).texto.trim().length > 0,
        )
        .slice(-MAX_HISTORIAL_PANDA)
        .map((m) => ({ rol: m.rol, texto: m.texto.slice(0, MAX_TEXTO_HISTORIAL) }))
    : [];
  return { pregunta, historial };
}

/** Arma la conversación en el formato de Gemini (usuario/model). */
export function construirConversacion(pregunta: string, historial: MensajePanda[]) {
  return [
    ...historial.map((m) => ({ role: m.rol === "usuario" ? "user" : "model", parts: [{ text: m.texto }] })),
    { role: "user", parts: [{ text: pregunta }] },
  ];
}

/** Deja la respuesta lista para mostrar como texto: sin negritas ni títulos de Markdown, y acotada. */
export function limpiarRespuestaPanda(texto: string | undefined): string {
  const limpio = (texto ?? "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!limpio) throw new GeminiError("Respuesta vacía", 503, "Pandi no pudo responder ahora. Probá de nuevo en un ratito.");
  return limpio.length > MAX_RESPUESTA ? `${limpio.slice(0, MAX_RESPUESTA - 1).trimEnd()}…` : limpio;
}

export async function responderPanda(
  entrada: { pregunta: string; historial: MensajePanda[] },
  opts: { cliente?: ClienteGemini; timeoutMs?: number } = {},
): Promise<{ respuesta: string }> {
  const cliente = opts.cliente ?? crearCliente();
  const modelo = getModeloRecordado() ?? MODELO_PREFERIDO;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    const resp = await cliente.models.generateContent({
      model: modelo,
      contents: construirConversacion(entrada.pregunta, entrada.historial),
      config: {
        systemInstruction: SYSTEM_PROMPT_PANDA,
        temperature: 0.4,
        maxOutputTokens: 700,
        ...configThinking(modelo),
        abortSignal: ctrl.signal,
      },
    });
    return { respuesta: limpiarRespuestaPanda(resp.text) };
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    const status = (err as { status?: unknown })?.status;
    if (status === 429) {
      throw new GeminiError("Cuota de Gemini agotada (429)", 429, "Pandi está atendiendo a mucha gente. Esperá un minuto y preguntale de nuevo.");
    }
    console.error("Gemini (panda) falló:", err);
    throw new GeminiError("Gemini no respondió", 503, "Pandi no puede responder en este momento. Probá de nuevo en unos minutos.");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Respuesta de Pandi sin IA (si no hay clave o se agotó la cuota): orienta según palabras clave
 * y manda a la parte de la app que corresponde. Nunca inventa datos.
 */
export function respuestaPandaSinIA(pregunta: string): string {
  const p = pregunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const aviso = "\n\n(Ahora estoy con poca energía 🐼, así que te contesto lo básico. Probá de nuevo en un rato para una respuesta más completa.)";
  if (/\b(cai|transferi|pague|me robaron|me estafaron|di (la|mi) clave|pase (el|mi) codigo|me hackearon)\b/.test(p)) {
    return (
      "Lo primero: llamá a tu banco al teléfono de atención que está impreso atrás de tu tarjeta de débito o crédito (o en la app del banco) y pedí bloquear todo. " +
      "Después entrá en «Más ayuda → Ya caí»: ahí tenés los pasos según lo que pasó y el botón para llamar al 911 con la denuncia lista." +
      aviso
    );
  }
  if (/\b(codigo|clave|token|contrasena|pin)\b/.test(p)) {
    return "Nunca pases códigos, claves ni tokens, aunque digan que son del banco, de WhatsApp o de un organismo. Nadie de verdad te los pide por mensaje." + aviso;
  }
  if (/\b(link|enlace|pagina|sitio|web)\b/.test(p)) {
    return "No lo abras. Copialo y pegalo en la pestaña «Link»: te digo cuántos días tiene el sitio, si tiene candado y si imita a una marca." + aviso;
  }
  if (/\b(alias|cbu|cvu|transferir|transferencia|sena)\b/.test(p)) {
    return "Antes de transferir, revisá el alias o CBU en la pestaña «Transferencia» y confirmá por otro canal con quién estás hablando." + aviso;
  }
  return "Pegá el mensaje que te llegó en la pestaña «Mensaje» y tocá «¿Es estafa? Analizar»: te digo si es estafa y qué hacer. Si tenés dudas de cómo se usa, tocá «¿Cómo se usa?»." + aviso;
}
