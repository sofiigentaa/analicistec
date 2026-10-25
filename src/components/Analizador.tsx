"use client";

import AvisoSeguridad from "./AvisoSeguridad";
import { useEffect, useRef, useState } from "react";
import type { AnalisisFinal } from "@/lib/score";
import EjemplosRapidos from "./EjemplosRapidos";
import DominioResaltado from "./DominioResaltado";
import LeerEnVozAlta from "./LeerEnVozAlta";
import GenerarDenuncia from "./GenerarDenuncia";
import LlamarPolicia from "./LlamarPolicia";
import ProgresoAnalisis from "./ProgresoAnalisis";
import PreguntasAfinar from "./PreguntasAfinar";
import AsiSeVeElReal from "./AsiSeVeElReal";
import type { ContextoUsuario } from "@/lib/preguntas";
import { Icono } from "./Iconos";
import { guardarEntrada } from "./historialStore";
import { textoParaLeer } from "@/lib/voz";
import { generarAlerta, infoSemaforo, mensajeError, urlWhatsApp, validarImagenCliente } from "@/lib/ui";

export type Resultado = AnalisisFinal & { modelo?: string; sinIA?: boolean; avisoSeguridad?: boolean };

// Tonos suaves: el color acompaña, pero el veredicto siempre se dice también con palabras e ícono.
export const TONOS = {
  rojo: { caja: "border-danger-200 bg-danger-50 text-danger-800", trazo: "stroke-danger-600", chapa: "bg-danger-600", icono: "alerta" },
  amarillo: { caja: "border-warn-200 bg-warn-50 text-warn-800", trazo: "stroke-warn-600", chapa: "bg-warn-600", icono: "alerta" },
  verde: { caja: "border-safe-200 bg-safe-50 text-safe-800", trazo: "stroke-safe-600", chapa: "bg-safe-600", icono: "escudo" },
} as const;

export default function Analizador() {
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [mensajeAnalizado, setMensajeAnalizado] = useState("");
  const [modoAbuela, setModoAbuela] = useState(false);
  const [contexto, setContexto] = useState<ContextoUsuario>({});
  const inputArchivo = useRef<HTMLInputElement>(null);
  const campoTexto = useRef<HTMLTextAreaElement>(null);
  const [puedePegar, setPuedePegar] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [avisoPegar, setAvisoPegar] = useState<string | null>(null);

  useEffect(() => {
    // Solo se ofrece el botón "Pegar" si el navegador permite leer el portapapeles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPuedePegar(typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function");
  }, []);

  async function pegarDelPortapapeles() {
    setAvisoPegar(null);
    try {
      const pegado = await navigator.clipboard.readText();
      if (!pegado.trim()) {
        setAvisoPegar("No hay texto copiado. Copiá el mensaje y volvé a tocar Pegar.");
        return;
      }
      setTexto(pegado.slice(0, 5000));
      setError(null);
      campoTexto.current?.focus();
    } catch {
      setAvisoPegar("No pudimos pegar solo: mantené apretado el cuadro y elegí Pegar.");
    }
  }

  /** Si pegan una imagen (Ctrl+V o mantener apretado → Pegar), la tomamos como captura. */
  function alPegar(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const archivo = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (archivo) {
      e.preventDefault();
      elegirImagen(archivo);
    }
  }

  function alSoltar(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setArrastrando(false);
    const archivo = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (archivo) elegirImagen(archivo);
    else setError("Soltá una imagen (captura de pantalla o foto).");
  }

  function alTeclear(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  function elegirImagen(archivo: File | undefined) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!archivo) {
      setImagen(null);
      setPreview(null);
      return;
    }
    const problema = validarImagenCliente(archivo);
    if (problema) {
      setError(problema);
      setImagen(null);
      setPreview(null);
      if (inputArchivo.current) inputArchivo.current.value = "";
      return;
    }
    setImagen(archivo);
    setPreview(URL.createObjectURL(archivo));
  }

  function quitarImagen() {
    elegirImagen(undefined);
    if (inputArchivo.current) inputArchivo.current.value = "";
  }

  async function analizar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() && !imagen) {
      setError("Pegá el mensaje o subí una captura para analizar.");
      return;
    }
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const datos = new FormData();
      if (texto.trim()) datos.append("texto", texto.trim());
      if (imagen) datos.append("imagen", imagen);
      if (Object.keys(contexto).length > 0) datos.append("contexto", JSON.stringify(contexto));
      const res = await fetch("/api/analyze", { method: "POST", body: datos });
      const cuerpo: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(mensajeError(res.status, cuerpo));
        return;
      }
      setResultado(cuerpo as Resultado);
      setMensajeAnalizado(texto.trim());
      guardarEntrada({
        tipo: "mensaje",
        veredicto: (cuerpo as Resultado).veredicto,
        score: (cuerpo as Resultado).score,
        texto: texto.trim() || "Captura de pantalla",
      });
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setResultado(null);
    setTexto("");
    setContexto({});
    quitarImagen();
    // Volvemos arriba con el cursor listo para el próximo mensaje.
    requestAnimationFrame(() => {
      campoTexto.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      campoTexto.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={analizar} className="flex flex-col gap-4" aria-busy={cargando}>
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-2">
            <label htmlFor="mensaje" className="text-lg font-bold text-ink">
              Pegá el mensaje que te llegó
            </label>
            <div className="flex gap-1">
              {texto && (
                <button
                  type="button"
                  onClick={() => {
                    setTexto("");
                    campoTexto.current?.focus();
                  }}
                  className="btn btn-ghost min-h-10 px-3 py-1.5 text-sm"
                >
                  Borrar
                </button>
              )}
              {puedePegar && (
                <button type="button" onClick={pegarDelPortapapeles} className="btn btn-secondary min-h-10 px-3 py-1.5 text-sm">
                  <Icono nombre="pegar" className="h-4 w-4" />
                  Pegar
                </button>
              )}
            </div>
          </div>
          {avisoPegar && (
            <p role="status" className="text-sm text-warn-800">
              {avisoPegar}
            </p>
          )}
          <textarea
            id="mensaje"
            ref={campoTexto}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onPaste={alPegar}
            onKeyDown={alTeclear}
            aria-describedby="ayuda-mensaje"
            maxLength={5000}
            rows={5}
            placeholder={'Ej: "Hola mamá, cambié de número, agendame este. ¿Me podés transferir?"'}
            className="field"
          />
          <p id="ayuda-mensaje" className="hidden text-sm text-ink-mute sm:block">
            También podés pegar una captura acá con Ctrl+V. Para analizar rápido: Ctrl+Enter.
          </p>
          <EjemplosRapidos
            onElegir={(t) => {
              setTexto(t);
              setError(null);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-bold text-ink">O subí una captura de WhatsApp</span>
          {preview ? (
            <div className="card flex items-center gap-3 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) */}
              <img src={preview} alt="Captura elegida" className="h-16 w-16 rounded-lg object-cover" />
              <span className="flex-1 truncate text-sm text-ink-soft">{imagen?.name}</span>
              <button type="button" onClick={quitarImagen} className="btn btn-ghost min-h-11 px-3 py-2 text-sm">
                Quitar
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={alSoltar}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
                arrastrando ? "border-brand-600 bg-brand-100" : "border-brand-200 bg-brand-50/60"
              } hover:border-brand-600 hover:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700">
                <Icono nombre="camara" className="h-6 w-6" />
              </span>
              <span className="flex flex-col">
                <span className="font-bold text-brand-800">Elegir una captura</span>
                <span className="text-sm text-ink-soft">
                  Hasta 4 MB. La leemos por vos.<span className="hidden sm:inline"> También podés arrastrarla acá.</span>
                </span>
              </span>
              <input
                ref={inputArchivo}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                className="sr-only"
                onChange={(e) => elegirImagen(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <PreguntasAfinar valor={contexto} onCambio={setContexto} />

        {error && (
          <p role="alert" className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-base text-danger-800">
            <Icono nombre="alerta" className="mt-0.5 h-5 w-5" />
            <span>{error}</span>
          </p>
        )}

        <button type="submit" disabled={cargando} className="btn btn-primary min-h-14 text-lg">
          {cargando ? (
            <>
              <Icono nombre="cargando" className="h-5 w-5" />
              Analizando…
            </>
          ) : (
            "¿Es estafa? Analizar"
          )}
        </button>
        {cargando && (
          <div className="flex flex-col gap-2">
            <ProgresoAnalisis texto={texto} />
            <p className="text-center text-sm text-ink-soft">Si hay mucha demanda puede tardar hasta un minuto.</p>
          </div>
        )}
      </form>

      {resultado && (
        <Veredicto resultado={resultado} mensaje={mensajeAnalizado} modoAbuela={modoAbuela} setModoAbuela={setModoAbuela} onNuevo={reiniciar} />
      )}
    </div>
  );
}

export function Medidor({ valor, trazo, grande }: { valor: number; trazo: string; grande: boolean }) {
  const radio = 40;
  const circunferencia = 2 * Math.PI * radio;
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const lado = grande ? 120 : 96;
  return (
    <div className="relative shrink-0" style={{ width: lado, height: lado }} role="img" aria-label={`Riesgo: ${v} de 100`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radio} fill="none" strokeWidth="9" className="stroke-white" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className={`medidor-trazo ${trazo}`}
          style={{ strokeDasharray: circunferencia, strokeDashoffset: circunferencia * (1 - v / 100), ["--circunferencia" as string]: circunferencia } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`titulo ${grande ? "text-5xl" : "text-4xl"}`}>{v}</span>
        <span className="mt-1 text-xs font-medium">de 100</span>
      </div>
    </div>
  );
}

export function Veredicto({
  resultado,
  mensaje,
  modoAbuela,
  setModoAbuela,
  onNuevo,
}: {
  resultado: Resultado;
  mensaje: string;
  modoAbuela: boolean;
  setModoAbuela: (v: boolean) => void;
  onNuevo: () => void;
}) {
  const info = infoSemaforo(resultado.veredicto);
  const tono = TONOS[info.luz];
  const titulo = useRef<HTMLHeadingElement>(null);
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    // En el celular el resultado queda abajo del formulario: lo traemos a la vista y le damos el foco
    // para que los lectores de pantalla lo anuncien.
    seccion.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titulo.current?.focus({ preventScroll: true });
  }, [resultado]);

  return (
    <section ref={seccion} aria-live="polite" className="aparecer flex scroll-mt-3 flex-col gap-4 border-t border-line pt-6">
      <div className={`flex items-center gap-4 rounded-2xl border-2 p-4 sm:gap-5 sm:p-5 ${tono.caja}`}>
        <span className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-white sm:flex ${tono.chapa}`}>
          <Icono nombre={tono.icono} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 ref={titulo} tabIndex={-1} className={`titulo focus:outline-none ${modoAbuela ? "text-4xl" : "text-3xl"}`}>
            {info.titulo}
          </h2>
          <p className={`mt-1 ${modoAbuela ? "text-xl" : "text-base"}`}>{info.bajada}</p>
        </div>
        <Medidor valor={resultado.score} trazo={tono.trazo} grande={modoAbuela} />
      </div>

      {resultado.avisoSeguridad && <AvisoSeguridad />}

      {resultado.sinIA && (
        <p className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
          {resultado.modelo?.startsWith("voz-propia")
            ? "La inteligencia artificial tiene mucha demanda, así que escuchamos el audio con nuestro propio reconocedor de voz y lo revisamos con nuestras reglas. Es un análisis más simple: si tenés dudas, probá de nuevo en un rato."
            : "Lo revisamos con nuestras reglas de estafas, sin inteligencia artificial, porque ahora tiene mucha demanda. Es un análisis más simple: si tenés dudas, probá de nuevo en un rato."}
        </p>
      )}

      <label className="card flex cursor-pointer items-center gap-3 p-4">
        <Icono nombre="textoGrande" className="h-6 w-6 text-brand-700" />
        <span className="flex-1">
          <span className="block font-bold text-ink">Modo abuela</span>
          <span className="block text-sm text-ink-soft">Letra grande y solo lo importante</span>
        </span>
        <input type="checkbox" role="switch" checked={modoAbuela} onChange={(e) => setModoAbuela(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden="true"
          className="relative h-7 w-12 shrink-0 rounded-full bg-ink-mute transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-700 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600"
        />
      </label>

      {modoAbuela ? (
        <div className="card flex flex-col gap-5 p-5">
          <p className="titulo text-3xl font-medium leading-snug text-ink">{resultado.resumen_abuela}</p>
          {resultado.que_hacer[0] && (
            <p className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-2xl font-bold leading-relaxed text-brand-900">
              <Icono nombre="check" className="mt-1.5 h-7 w-7 text-brand-700" />
              <span>{resultado.que_hacer[0]}</span>
            </p>
          )}
          <div>
            <LeerEnVozAlta texto={textoParaLeer([resultado.resumen_abuela, resultado.que_hacer[0]])} />
          </div>
        </div>
      ) : (
        <>
          <p className="titulo text-2xl font-medium leading-snug text-ink">{resultado.resumen_abuela}</p>

          {resultado.que_hacer.length > 0 && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <h3 className="titulo mb-3 text-2xl text-brand-900">Qué hacer ahora</h3>
              <ol className="flex flex-col gap-3">
                {resultado.que_hacer.map((q, i) => (
                  <li key={q} className="flex gap-3 text-brand-900">
                    <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {resultado.banderas.length > 0 && (
            <div className="card p-5">
              <h3 className="titulo mb-3 text-2xl text-ink">Qué nos llamó la atención</h3>
              <ul className="flex flex-col gap-3">
                {resultado.banderas.map((b) => (
                  <li key={b} className="flex gap-3 text-ink">
                    <Icono nombre="bandera" className="mt-0.5 h-5 w-5 text-danger-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.links.length > 0 && (
            <details className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-ink [&::-webkit-details-marker]:hidden">
                <Icono nombre="link" className="h-5 w-5 text-brand-700" />
                Links revisados ({resultado.links.length})
                <span aria-hidden="true" className="ml-auto text-ink-mute transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {resultado.links.map((l) => (
                  <li key={l.url} className="break-all rounded-xl bg-paper p-4">
                    <DominioResaltado link={l} />
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-soft">
                      <li>{l.antiguedadDias !== null ? `Dominio de hace ${l.antiguedadDias} días` : "Antigüedad desconocida"}</li>
                      <li>{l.ssl === true ? "Con candado (SSL)" : l.ssl === false ? "Sin SSL" : "SSL sin verificar"}</li>
                      {l.redirecciones.length > 0 && <li>{l.redirecciones.length} redirección(es)</li>}
                    </ul>
                    {l.senales.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-danger-800">
                        {l.senales.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <AsiSeVeElReal links={resultado.links} />

      <CompartirAlerta resultado={resultado} />

      <GenerarDenuncia datos={{ ...resultado, mensaje }} />

      {resultado.veredicto !== "seguro" && <LlamarPolicia datos={{ ...resultado, mensaje }} />}

      <button type="button" onClick={onNuevo} className="btn btn-ghost">
        Analizar otro mensaje
      </button>
    </section>
  );
}

function CompartirAlerta({ resultado }: { resultado: Resultado }) {
  const [alerta, setAlerta] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "copiado" | "error">("idle");
  const area = useRef<HTMLTextAreaElement>(null);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch {
      // Sin permiso de portapapeles (o http): dejamos el texto seleccionado para copiar a mano.
      area.current?.select();
      setEstado("error");
    }
  }

  function generar() {
    const texto = generarAlerta(resultado);
    setAlerta(texto);
    void copiar(texto);
  }

  if (!alerta) {
    return (
      <button type="button" onClick={generar} className="btn btn-primary min-h-14 text-lg">
        <Icono nombre="enviar" className="h-5 w-5" />
        Generar alerta para compartir
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-5">
      <h3 className="titulo text-2xl text-ink">Alerta para compartir</h3>
      <textarea
        ref={area}
        readOnly
        value={alerta}
        rows={10}
        aria-label="Texto de la alerta para compartir"
        onFocus={(e) => e.currentTarget.select()}
        className="field text-sm"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => copiar(alerta)} className="btn btn-primary flex-1">
          {estado === "copiado" ? "¡Copiado!" : "Copiar texto"}
        </button>
        <a href={urlWhatsApp(alerta)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1">
          Mandar por WhatsApp
        </a>
      </div>
      <p aria-live="polite" className="text-sm text-ink-soft">
        {estado === "copiado" && "Listo, pegalo en el grupo de la familia."}
        {estado === "error" && "No pudimos copiar solo: mantené apretado el texto y elegí Copiar."}
      </p>
    </div>
  );
}