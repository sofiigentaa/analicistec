"use client";

import { useState } from "react";
import { generarAlertaLink, type RespuestaLink } from "@/lib/linkUi";
import { infoSemaforo, urlWhatsApp } from "@/lib/ui";
import { Medidor, TONOS } from "./Analizador";
import DominioResaltado from "./DominioResaltado";
import { Icono } from "./Iconos";
import AvisoSeguridad from "./AvisoSeguridad";

export default function TarjetaLink({ datos }: { datos: RespuestaLink }) {
  const tono = TONOS[infoSemaforo(datos.veredicto).luz];
  const { link } = datos;
  const alerta = generarAlertaLink(datos);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!alerta) return;
    try {
      await navigator.clipboard.writeText(alerta);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section aria-live="polite" className="flex flex-col gap-4 border-t border-line pt-6">
      <div className={`flex items-center gap-4 rounded-2xl border-2 p-4 sm:gap-5 sm:p-5 ${tono.caja}`}>
        <span className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-white sm:flex ${tono.chapa}`}>
          <Icono nombre={tono.icono} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="titulo text-2xl sm:text-3xl">{datos.titulo}</h3>
          <p className="mt-1 text-base">{datos.bajada}</p>
        </div>
        <Medidor valor={datos.score} trazo={tono.trazo} grande={false} />
      </div>
      {datos.avisoSeguridad && <AvisoSeguridad />}

      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h4 className="titulo mb-3 text-2xl text-brand-900">Qué hacer ahora</h4>
        <ol className="flex flex-col gap-3">
          {datos.que_hacer.map((q, i) => (
            <li key={q} className="flex gap-3 text-brand-900">
              <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {i + 1}
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>

      {datos.banderas.length > 0 && (
        <div className="card p-5">
          <h4 className="titulo mb-3 text-2xl text-ink">Qué nos llamó la atención</h4>
          <ul className="flex flex-col gap-3">
            {datos.banderas.map((b) => (
              <li key={b} className="flex gap-3 text-ink">
                <Icono nombre="bandera" className="mt-0.5 h-5 w-5 text-danger-600" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card break-all p-5">
        <h4 className="titulo mb-3 text-2xl text-ink">Datos del link</h4>
        <DominioResaltado link={link} />
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          {link.antiguedadDias === null && <li>Antigüedad desconocida</li>}
          <li>{link.ssl === true ? "Con candado (SSL)" : link.ssl === false ? "Sin SSL" : "SSL sin verificar"}</li>
          {link.redirecciones.length > 0 && <li>{link.redirecciones.length} redirección(es)</li>}
        </ul>
        {link.urlFinal && link.urlFinal !== link.url && (
          <p className="mt-3 text-sm text-ink-soft">
            Termina en: <span className="font-mono">{link.urlFinal}</span>
          </p>
        )}
        <p className="mt-3 text-sm text-ink-mute">
          Es una revisión técnica: no abrimos la página ni leemos su contenido. Un sitio sin señales raras igual puede ser peligroso.
        </p>
      </div>

      {alerta && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={copiar} className="btn btn-primary flex-1">
            <Icono nombre="enviar" className="h-5 w-5" />
            {copiado ? "¡Alerta copiada!" : "Copiar alerta para compartir"}
          </button>
          <a href={urlWhatsApp(alerta)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1">
            Mandar por WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}