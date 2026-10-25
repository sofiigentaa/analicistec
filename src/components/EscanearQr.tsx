"use client";

import { useState } from "react";
import { interpretarQr, type QrInterpretado } from "@/lib/qr";
import type { RespuestaLink } from "@/lib/linkUi";
import { mensajeError } from "@/lib/ui";
import { guardarEntrada } from "./historialStore";
import { Icono } from "./Iconos";
import { leerQrDeArchivo } from "./leerQr";
import TarjetaLink from "./TarjetaLink";

const MAX_BYTES = 15 * 1024 * 1024;
const ACCIONES = ["tel", "sms", "smsto", "mailto", "wifi", "geo"];

const ETIQUETA_BOTON =
  "flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-3 font-bold text-brand-800 transition-colors hover:border-brand-600 hover:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600";

export default function EscanearQr() {
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<QrInterpretado | null>(null);
  const [datos, setDatos] = useState<RespuestaLink | null>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setError(null);
    setQr(null);
    setDatos(null);
    if (!archivo.type.startsWith("image/")) return setError("Subí una foto o una captura de pantalla (imagen).");
    if (archivo.size > MAX_BYTES) return setError("La imagen pesa demasiado. Probá con una captura más liviana.");

    try {
      setCargando("Leyendo el QR…");
      let texto: string | null;
      try {
        texto = await leerQrDeArchivo(archivo);
      } catch {
        return setError("No pudimos abrir esa imagen. Probá con una captura de pantalla o una foto en JPG o PNG.");
      }
      if (!texto) return setError("No encontramos un código QR en la imagen. Probá con una foto más cerca, bien iluminada y sin reflejos.");

      const interpretado = interpretarQr(texto);
      setQr(interpretado);
      if (interpretado.tipo !== "url") return;

      setCargando("Revisando el link…");
      const res = await fetch("/api/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: interpretado.url, origen: "qr" }),
      });
      const cuerpo: unknown = await res.json().catch(() => null);
      if (!res.ok) return setError(mensajeError(res.status, cuerpo));
      const respuesta = cuerpo as RespuestaLink;
      setDatos(respuesta);
      guardarEntrada({ tipo: "link", veredicto: respuesta.veredicto, score: respuesta.score, texto: respuesta.link.dominio });
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y probá de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <section aria-labelledby="qr-titulo" className="flex flex-col gap-4">
      <div>
        <h2 id="qr-titulo" className="titulo text-3xl text-ink">
          ¿Un QR sospechoso?
        </h2>
        <p className="mt-1 text-ink-soft">
          Sacale una foto o subí la captura. Leemos el QR en tu dispositivo y revisamos a dónde te lleva antes de que entres.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row" aria-busy={cargando !== null}>
        <label className={ETIQUETA_BOTON}>
          <Icono nombre="camara" className="h-6 w-6" />
          Sacar una foto
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={alElegir} disabled={cargando !== null} />
        </label>
        <label className={ETIQUETA_BOTON}>
          <Icono nombre="qr" className="h-6 w-6" />
          Elegir una imagen
          <input type="file" accept="image/*" className="sr-only" onChange={alElegir} disabled={cargando !== null} />
        </label>
      </div>

      {cargando && (
        <p role="status" className="flex items-center justify-center gap-2 text-ink-soft">
          <Icono nombre="cargando" className="h-5 w-5" />
          {cargando}
        </p>
      )}

      {error && (
        <p role="alert" className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-800">
          <Icono nombre="alerta" className="mt-0.5 h-5 w-5" />
          <span>{error}</span>
        </p>
      )}

      {qr?.tipo === "url" && (
        <p className="card break-all p-4 text-sm text-ink-soft">
          El QR lleva a: <span className="font-mono font-semibold text-ink">{qr.url}</span>
        </p>
      )}

      {datos && <TarjetaLink datos={datos} />}

      {qr?.tipo === "pago" && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-warn-200 bg-warn-50 p-5 text-warn-800">
          <h3 className="titulo text-2xl">Es un QR de pago</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {qr.comercio && (
              <>
                <dt className="font-bold">Comercio</dt>
                <dd>{qr.comercio}</dd>
              </>
            )}
            {qr.ciudad && (
              <>
                <dt className="font-bold">Ciudad</dt>
                <dd>{qr.ciudad}</dd>
              </>
            )}
            {qr.monto && (
              <>
                <dt className="font-bold">Monto</dt>
                <dd>{qr.monto}</dd>
              </>
            )}
          </dl>
          <p>Antes de pagar, comprobá que el nombre del comercio sea el que esperás y que el monto sea el correcto.</p>
          <p className="text-sm font-bold">Desconfiá si el QR está pegado sobre otro, o si te lo mandó alguien por mensaje.</p>
        </div>
      )}

      {qr?.tipo === "texto" && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-warn-200 bg-warn-50 p-5 text-warn-800">
          <h3 className="titulo text-2xl">Este QR no es un link</h3>
          <p className="break-words rounded-xl bg-white p-3 font-mono text-sm text-ink">{qr.texto}</p>
          {qr.esquema && ACCIONES.includes(qr.esquema) ? (
            <p>Es una acción (llamar, mandar un mensaje o conectarte a una red). No la hagas si no la esperabas.</p>
          ) : (
            <p>No podemos revisarlo. Si no sabés qué es, no lo uses.</p>
          )}
        </div>
      )}
    </section>
  );
}