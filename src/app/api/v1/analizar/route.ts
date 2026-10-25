import { after } from "next/server";
import { analizarConRespaldo } from "@/lib/analisisRespaldo";
import { avisarATero } from "@/lib/tero";
import { autenticar, leerClientes, textoParaWhatsApp } from "@/lib/apiClientes";
import { EntradaError, leerEntrada } from "@/lib/entrada";
import { GeminiError } from "@/lib/gemini";
import { verificarLinks } from "@/lib/links";
import { MARCA } from "@/lib/marca";
import { registrarUso } from "@/lib/medidor";
import { crearLimitador } from "@/lib/rateLimit";
import { combinarScore } from "@/lib/score";

export const maxDuration = 60;

/** 60 consultas por minuto por cliente: un bot atiende a mucha gente desde el mismo servidor. */
const limitador = crearLimitador(60);

const sinIA = async () => {
  throw new GeminiError("Tope mensual de IA alcanzado", 429, "Se alcanzó el tope de análisis con IA de este mes. Mandá el texto del mensaje en vez de la captura.");
};

/**
 * API para bots y sistemas de terceros (por ejemplo, el bot de WhatsApp de tecnoros).
 * POST con "Authorization: Bearer <clave>" y JSON { "texto": "...", "imagen"?: "<base64>", "audio"?: "<base64>" }.
 */
export async function POST(request: Request) {
  const cliente = autenticar(request.headers, leerClientes(process.env.ANTIESTAFA_API_CLIENTES));
  if (!cliente) {
    return Response.json({ error: "Falta la clave de la API o no es válida." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }
  const limite = limitador(cliente.nombre);
  if (!limite.permitido) {
    return Response.json(
      { error: `Demasiadas consultas. Probá en ${limite.reintentarEn} segundos.` },
      { status: 429, headers: { "Retry-After": String(limite.reintentarEn) } },
    );
  }
  try {
    const entrada = await leerEntrada(request);
    const usoMes = await registrarUso(cliente.nombre);
    const superoTope = cliente.tope !== null && usoMes > cliente.tope;
    const [{ analisis, modelo, sinIA: usoMotorPropio }, links] = await Promise.all([
      superoTope ? analizarConRespaldo(entrada, sinIA) : analizarConRespaldo(entrada),
      entrada.texto ? verificarLinks(entrada.texto).catch(() => []) : Promise.resolve([]),
    ]);
    const final = combinarScore(analisis, links);
    after(() =>
      avisarATero({
        veredicto: final.veredicto,
        score: final.score,
        banderas: final.banderas,
        dominios: [...new Set(final.links.map((l) => l.dominio))],
        canal: "bot",
        sinIA: usoMotorPropio,
        texto: entrada.texto,
        transcripcion: final.transcripcion,
      }),
    );
    return Response.json({
      veredicto: final.veredicto,
      score: final.score,
      resumen: final.resumen_abuela,
      banderas: final.banderas,
      que_hacer: final.que_hacer,
      links: final.links.map((l) => ({ dominio: l.dominio, senales: l.senales, antiguedad_dias: l.antiguedadDias })),
      texto_whatsapp: textoParaWhatsApp(final, MARCA.urlApp),
      ...(final.transcripcion ? { transcripcion: final.transcripcion } : {}),
      sin_ia: usoMotorPropio,
      modelo,
      uso: { cliente: cliente.nombre, mes: usoMes, tope: cliente.tope },
    });
  } catch (err) {
    if (err instanceof EntradaError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof GeminiError) return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    console.error("Error en /api/v1/analizar:", err);
    return Response.json({ error: "Algo salió mal. Probá de nuevo en un rato." }, { status: 500 });
  }
}

/** Ayuda rápida para quien integra la API. */
export function GET() {
  return Response.json({
    servicio: "AntiEstafa AR · API para bots",
    uso: 'POST /api/v1/analizar con "Authorization: Bearer <clave>" y JSON { "texto": "mensaje a revisar" }',
    respuesta: "veredicto (seguro | sospechoso | estafa), score 0-100, resumen, que_hacer, texto_whatsapp listo para responder",
    documentacion: "docs/INTEGRACION_TECNOROS.md",
  });
}
