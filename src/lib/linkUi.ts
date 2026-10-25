import type { ResultadoLink } from "./links.ts";
import type { Veredicto } from "./gemini.ts";
import { combinarScore } from "./score.ts";
import { desactivarDominio } from "./ui.ts";

export interface EvaluacionLink {
  veredicto: Veredicto;
  score: number;
  titulo: string;
  bajada: string;
  banderas: string[];
  que_hacer: string[];
  resumen_abuela: string;
  links: { dominio: string }[];
}

export type RespuestaLink = EvaluacionLink & { link: ResultadoLink };

type UrlNormalizada = { ok: true; url: string } | { ok: false; error: string };

/** Acepta "mercadopago.com.ar/x" o "https://..." y devuelve una URL http(s) válida, o un mensaje de error en castellano. */
export function normalizarUrl(entrada: unknown): UrlNormalizada {
  if (typeof entrada !== "string" || !entrada.trim()) return { ok: false, error: "Pegá el link que querés revisar." };
  const crudo = entrada.trim();
  if (crudo.length > 2000) return { ok: false, error: "Ese link es demasiado largo para revisarlo." };
  if (/\s/.test(crudo)) return { ok: false, error: "El link no puede tener espacios. Pegá solo la dirección." };
  const conEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(crudo) ? crudo : `https://${crudo}`;
  let u: URL;
  try {
    u = new URL(conEsquema);
  } catch {
    return { ok: false, error: "Eso no parece un link. Probá con algo como mercadopago.com.ar." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, error: "Solo podemos revisar links de páginas web (http o https)." };
  }
  if (!u.hostname.includes(".") && !u.hostname.includes(":")) {
    return { ok: false, error: "Eso no parece un link. Probá con algo como mercadopago.com.ar." };
  }
  return { ok: true, url: u.toString() };
}

const NEUTRO = { veredicto: "seguro" as const, score: 0, banderas: [], que_hacer: [], resumen_abuela: "" };

/** Revisión técnica de un link solo (sin IA): usa el mismo puntaje y los mismos pisos que el análisis de mensajes. */
export function evaluarLink(link: ResultadoLink): EvaluacionLink {
  const final = combinarScore(NEUTRO, [link]);
  const { veredicto, score } = final;

  const info = {
    estafa: {
      titulo: "Muy probablemente es una estafa",
      bajada: "No entres a este link ni cargues datos ahí.",
      que_hacer: [
        "No abras el link ni cargues datos ahí.",
        "Si te lo mandó alguien por mensaje, no respondas y bloqueá el número.",
        "Si ya entraste y pusiste claves o datos de tarjeta, mirá la pestaña «Ya caí».",
        "Avisá a tu familia con el botón de alerta.",
      ],
    },
    sospechoso: {
      titulo: "Tiene señales raras",
      bajada: "No lo abras hasta confirmar por otro canal.",
      que_hacer: [
        "No lo abras todavía.",
        "Confirmá por otro canal: escribí vos la dirección oficial en el navegador o llamá al teléfono que está impreso atrás de tu tarjeta.",
        "Si no lo esperabas, ignoralo.",
      ],
    },
    seguro: {
      titulo: "No vimos señales técnicas de riesgo",
      bajada: "Esto no garantiza que sea seguro: si no esperabas este link, no entres igual.",
      que_hacer: [
        "Si no esperabas este link, no entres igual.",
        "Para entrar a tu banco o a ARCA, escribí vos la dirección en el navegador en vez de tocar links.",
      ],
    },
  }[veredicto];

  return {
    veredicto,
    score,
    titulo: info.titulo,
    bajada: info.bajada,
    banderas: final.banderas,
    que_hacer: info.que_hacer,
    resumen_abuela: info.bajada,
    links: [{ dominio: link.dominio }],
  };
}

/** Texto para mandar por WhatsApp. Devuelve null si el link no tiene señales (no hay nada para alertar). */
export function generarAlertaLink(ev: EvaluacionLink): string | null {
  if (ev.veredicto === "seguro") return null;
  const encabezado = ev.veredicto === "estafa" ? "\u{1F6A8} ALERTA: LINK DE ESTAFA \u{1F6A8}" : "\u26A0\uFE0F OJO: LINK SOSPECHOSO \u26A0\uFE0F";
  // WhatsApp convierte cualquier dominio en link tocable: lo desactivamos también dentro de las señales.
  const sinLinks = (t: string) => ev.links.reduce((acc, l) => acc.split(l.dominio).join(desactivarDominio(l.dominio)), t);
  const lineas = [encabezado, "", ev.bajada, "", `Riesgo: ${ev.score}/100`];
  const dominios = [...new Set(ev.links.map((l) => l.dominio))].slice(0, 3);
  if (dominios.length) lineas.push("", "No entres a:", ...dominios.map((d) => `• ${desactivarDominio(d)}`));
  const banderas = ev.banderas.slice(0, 4).map(sinLinks);
  if (banderas.length) lineas.push("", "Señales:", ...banderas.map((b) => `• ${b}`));
  lineas.push("", "Si te llega algo parecido, no toques el link y no pases datos ni códigos.", "", "Chequeado con AntiEstafa AR");
  return lineas.join("\n");
}