import { createHash } from "node:crypto";
import type { Veredicto } from "./gemini.ts";

/**
 * Conexión con TERO Security (plataforma de ciberseguridad defensiva de tecnoros.ar).
 *
 * Cuando un empleado de una empresa cliente de TERO revisa algo en AntiEstafa y da estafa o
 * sospechoso, mandamos un evento al SIEM de TERO. Ahí una regla Sigma lo convierte en alerta,
 * el SOAR abre un caso y el Purple Team lo cuenta como detección de Phishing (MITRE ATT&CK T1566).
 *
 * Privacidad: por defecto NO mandamos el texto del mensaje ni la transcripción del audio, solo
 * el veredicto, las señales, los dominios y una huella (hash) para agrupar reportes repetidos.
 *
 * Variables de entorno (solo servidor):
 *   TERO_SIEM_URL        URL https donde el siem-service de TERO recibe eventos (obligatoria para activar)
 *   TERO_API_KEY         token que entrega TERO (va como "Authorization: Bearer …")
 *   TERO_ORGANIZACION    id o nombre de la organización (empresa cliente) en TERO
 *   TERO_INCLUIR_TEXTO   "true" para mandar también el texto o la transcripción (por defecto no)
 */

export type Canal = "mensaje" | "captura" | "audio" | "link" | "qr" | "bot";

export interface ConfigTero {
  url: string;
  apiKey: string;
  organizacion: string;
  incluirTexto: boolean;
}

export function leerConfigTero(env: Record<string, string | undefined>): ConfigTero | null {
  const url = (env.TERO_SIEM_URL ?? "").trim();
  const apiKey = (env.TERO_API_KEY ?? "").trim();
  if (!url || !apiKey) return null;
  try {
    const u = new URL(url);
    // Solo https, salvo localhost (pruebas en la misma máquina donde corre TERO).
    if (u.protocol !== "https:" && !(u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname))) return null;
  } catch {
    return null;
  }
  return {
    url,
    apiKey,
    organizacion: (env.TERO_ORGANIZACION ?? "").trim() || "sin-organizacion",
    incluirTexto: (env.TERO_INCLUIR_TEXTO ?? "").trim().toLowerCase() === "true",
  };
}

export interface DatosAnalisis {
  veredicto: Veredicto;
  score: number;
  banderas: string[];
  dominios: string[];
  canal: Canal;
  sinIA?: boolean;
  texto?: string;
  transcripcion?: string;
}

interface Tecnica {
  id: string;
  name: string;
  subtechnique?: { id: string; name: string }[];
}

/** Qué técnica de MITRE ATT&CK corresponde, para que TERO la cuente en su cobertura (Purple Team). */
export function tecnicasMitre(d: Pick<DatosAnalisis, "canal" | "dominios" | "banderas">): Tecnica[] {
  const sub: { id: string; name: string }[] = [];
  if (d.canal === "audio") sub.push({ id: "T1566.004", name: "Spearphishing Voice" });
  if (d.dominios.length > 0 || d.canal === "link" || d.canal === "qr") sub.push({ id: "T1566.002", name: "Spearphishing Link" });
  const tecnicas: Tecnica[] = [{ id: "T1566", name: "Phishing", ...(sub.length ? { subtechnique: sub } : {}) }];
  // Si busca sacarle datos a la persona (claves, códigos, tarjeta), también es "Phishing for Information".
  if (d.banderas.some((b) => /c[oó]digo|clave|token|tarjeta|datos/i.test(b))) {
    tecnicas.push({ id: "T1598", name: "Phishing for Information" });
  }
  return tecnicas;
}

const huella = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex").slice(0, 16);

/**
 * Evento en formato tipo ECS (el que usan OpenSearch/Elastic y entienden las reglas Sigma),
 * con los campos propios de AntiEstafa bajo "antiestafa".
 */
export function construirEvento(d: DatosAnalisis, config: Pick<ConfigTero, "organizacion" | "incluirTexto">, ahora = new Date()) {
  const tecnicas = tecnicasMitre(d);
  const ids = tecnicas.flatMap((t) => [t.id, ...(t.subtechnique ?? []).map((s) => s.id)]);
  const textoBase = d.transcripcion ?? d.texto ?? "";
  return {
    "@timestamp": ahora.toISOString(),
    event: {
      kind: "alert",
      category: ["threat"],
      type: ["indicator"],
      module: "antiestafa",
      dataset: "antiestafa.analisis",
      provider: "AntiEstafa AR",
      severity: d.score,
      outcome: d.veredicto,
    },
    log: { level: d.veredicto === "estafa" ? "error" : "warning" },
    rule: {
      id: `antiestafa-${d.veredicto}`,
      name: d.veredicto === "estafa" ? "AntiEstafa: estafa detectada" : "AntiEstafa: mensaje sospechoso",
      category: "phishing",
    },
    message: `AntiEstafa: ${d.veredicto} (riesgo ${d.score}/100) en ${d.canal}${d.dominios.length ? ` · ${d.dominios.join(", ")}` : ""}`,
    organization: { id: config.organizacion },
    threat: {
      framework: "MITRE ATT&CK",
      tactic: { id: "TA0001", name: "Initial Access" },
      technique: tecnicas,
      indicator: d.dominios.map((dominio) => ({ type: "domain-name", url: { domain: dominio } })),
    },
    tags: ["antiestafa", "attack.initial_access", ...ids.map((i) => `attack.${i.toLowerCase()}`)],
    labels: { producto: "AntiEstafa AR", proveedor: "tecnoros.ar" },
    antiestafa: {
      veredicto: d.veredicto,
      score: d.score,
      canal: d.canal,
      banderas: d.banderas.slice(0, 10),
      dominios: d.dominios,
      sin_ia: Boolean(d.sinIA),
      ...(textoBase ? { huella: huella(textoBase) } : {}),
      ...(config.incluirTexto && d.texto ? { texto: d.texto.slice(0, 2000) } : {}),
      ...(config.incluirTexto && d.transcripcion ? { transcripcion: d.transcripcion.slice(0, 2000) } : {}),
    },
  };
}

export type EventoTero = ReturnType<typeof construirEvento>;

/** ¿Hay que avisarle a TERO? Solo estafas y sospechosos, y solo si está configurado. */
export function debeAvisar(veredicto: Veredicto, config: ConfigTero | null): config is ConfigTero {
  return config !== null && veredicto !== "seguro";
}

/** Manda el evento. Nunca tira error: si TERO no responde, el usuario igual ve su resultado. */
export async function enviarATero(evento: EventoTero, config: ConfigTero, fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchFn(config.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}`, "user-agent": "AntiEstafa-AR/1.0" },
      body: JSON.stringify(evento),
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) console.warn(`[tero] El SIEM respondió ${res.status}`);
    return res.ok;
  } catch (err) {
    console.warn("[tero] No se pudo avisar al SIEM:", err);
    return false;
  }
}

export const CONFIG_TERO = leerConfigTero({
  TERO_SIEM_URL: process.env.TERO_SIEM_URL,
  TERO_API_KEY: process.env.TERO_API_KEY,
  TERO_ORGANIZACION: process.env.TERO_ORGANIZACION,
  TERO_INCLUIR_TEXTO: process.env.TERO_INCLUIR_TEXTO,
});

/** Para las rutas: arma el evento y lo manda (se llama dentro de after(), después de responder). */
export async function avisarATero(d: DatosAnalisis, config: ConfigTero | null = CONFIG_TERO): Promise<void> {
  if (!debeAvisar(d.veredicto, config)) return;
  await enviarATero(construirEvento(d, config), config);
}
