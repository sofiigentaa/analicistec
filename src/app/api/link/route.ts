import { after } from "next/server";
import { verificarLink } from "@/lib/links";
import { avisarATero, CONFIG_TERO, debeAvisar } from "@/lib/tero";
import { evaluarLink, normalizarUrl, type RespuestaLink } from "@/lib/linkUi";
import { crearLimitador, ipDe } from "@/lib/rateLimit";

// Revisión técnica de un link solo: no usa IA, así que no gasta la cuota de Gemini.
export const maxDuration = 30;

const limitador = crearLimitador();

export async function POST(request: Request) {
  const limite = limitador(ipDe(request.headers));
  if (!limite.permitido) {
    return Response.json(
      { error: `Hiciste muchas consultas seguidas. Esperá ${limite.reintentarEn} segundos y probá de nuevo.` },
      { status: 429, headers: { "Retry-After": String(limite.reintentarEn) } },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "No pudimos leer lo que mandaste. Probá de nuevo." }, { status: 400 });
  }

  const url = normalizarUrl((cuerpo as { url?: unknown } | null)?.url);
  if (!url.ok) return Response.json({ error: url.error }, { status: 400 });

  try {
    const link = await verificarLink(url.url);
    const respuesta: RespuestaLink = { ...evaluarLink(link), link };
    const avisoSeguridad = debeAvisar(respuesta.veredicto, CONFIG_TERO);
    if (avisoSeguridad) {
      const origen = (cuerpo as { origen?: unknown } | null)?.origen === "qr" ? "qr" : "link";
      after(() =>
        avisarATero({ veredicto: respuesta.veredicto, score: respuesta.score, banderas: respuesta.banderas, dominios: [link.dominio], canal: origen }),
      );
    }
    return Response.json({ ...respuesta, avisoSeguridad });
  } catch (err) {
    console.error("Error en /api/link:", err);
    return Response.json({ error: "No pudimos revisar ese link. Probá de nuevo en un rato." }, { status: 500 });
  }
}