import { after } from "next/server";
import { GeminiError } from "@/lib/gemini";
import { avisarATero, CONFIG_TERO, debeAvisar } from "@/lib/tero";
import { analizarConRespaldo } from "@/lib/analisisRespaldo";
import { EntradaError, leerEntrada } from "@/lib/entrada";
import { verificarLinks, type ResultadoLink } from "@/lib/links";
import { combinarScore } from "@/lib/score";
import { crearLimitador, ipDe } from "@/lib/rateLimit";

export const maxDuration = 60;

const limitador = crearLimitador();

export async function POST(request: Request) {
  const limite = limitador(ipDe(request.headers));
  if (!limite.permitido) {
    return Response.json(
      { error: `Hiciste muchas consultas seguidas. Esperá ${limite.reintentarEn} segundos y probá de nuevo.` },
      { status: 429, headers: { "Retry-After": String(limite.reintentarEn) } },
    );
  }
  try {
    const entrada = await leerEntrada(request);
    const inicio = Date.now();
    const tiempos: Record<string, number> = {};
    const medido = <T,>(nombre: string, p: Promise<T>) => p.finally(() => (tiempos[nombre] = Date.now() - inicio));
    const chequeoLinks: Promise<ResultadoLink[]> = entrada.texto
      ? verificarLinks(entrada.texto).catch((err) => {
          console.warn("Chequeo de links falló:", err);
          return [];
        })
      : Promise.resolve([]);
    const [{ analisis, modelo, sinIA }, links] = await Promise.all([
      medido("gemini", analizarConRespaldo(entrada)),
      medido("links", chequeoLinks),
    ]);
    console.info(`[analyze] gemini ${tiempos.gemini}ms, links ${tiempos.links}ms, total ${Date.now() - inicio}ms`);
    const final = combinarScore(analisis, links);
    // Si la app está conectada a TERO Security, avisamos al equipo de seguridad después de responder.
    const avisoSeguridad = debeAvisar(final.veredicto, CONFIG_TERO);
    if (avisoSeguridad) {
      after(() =>
        avisarATero({
          veredicto: final.veredicto,
          score: final.score,
          banderas: final.banderas,
          dominios: [...new Set(final.links.map((l) => l.dominio))],
          canal: entrada.audio ? "audio" : entrada.imagen && !entrada.texto ? "captura" : "mensaje",
          sinIA,
          texto: entrada.texto,
          transcripcion: final.transcripcion,
        }),
      );
    }
    return Response.json({ ...final, modelo, sinIA, avisoSeguridad });
  } catch (err) {
    if (err instanceof EntradaError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GeminiError) {
      return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    }
    console.error("Error en /api/analyze:", err);
    return Response.json({ error: "Algo salió mal. Probá de nuevo en un rato." }, { status: 500 });
  }
}
