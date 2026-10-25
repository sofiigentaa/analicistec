"use client";

import { useState, useSyncExternalStore } from "react";
import { generarDenuncia, type DatosDenuncia } from "@/lib/denuncia";
import { NUMERO_POLICIA, TEL_POLICIA, guionLlamada, puedeLlamarPorTelefono } from "@/lib/policia";

const sinSuscripcion = () => () => {};

const CLASE_BOTON =
  "btn min-h-16 w-full flex-col gap-0.5 border-danger-600 bg-danger-600 text-white hover:border-danger-800 hover:bg-danger-800";

/**
 * Botón rápido al 911. En un solo toque copia la denuncia (si la hay) y muestra qué decir.
 * En el celular abre el marcador del teléfono con el 911 listo. En la compu NO usa `tel:`
 * (lo abriría Zoom, Teams u otro programa): muestra el número grande para marcarlo desde el celu.
 */
export default function LlamarPolicia({ datos }: { datos?: DatosDenuncia }) {
  const [guion, setGuion] = useState<string[] | null>(null);
  const [copiado, setCopiado] = useState(false);
  // En el servidor asume celular (mobile first); en el navegador mira el dispositivo real.
  const esTelefono = useSyncExternalStore(
    sinSuscripcion,
    () => puedeLlamarPorTelefono(navigator.userAgent, navigator.maxTouchPoints),
    () => true,
  );

  async function preparar() {
    // El guion se arma al tocar (lleva la fecha y hora de ese momento).
    setGuion(guionLlamada(datos));
    if (!datos) return;
    try {
      await navigator.clipboard.writeText(generarDenuncia(datos));
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  const contenidoBoton = (
    <>
      <span className="text-lg">📞 Llamar al {NUMERO_POLICIA} · Policía</span>
      <span className="text-sm font-semibold text-white/90">Te dejamos listo lo que tenés que decir</span>
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {esTelefono ? (
        <a href={TEL_POLICIA} onClick={preparar} className={CLASE_BOTON}>
          {contenidoBoton}
        </a>
      ) : (
        <button type="button" onClick={preparar} className={CLASE_BOTON}>
          {contenidoBoton}
        </button>
      )}

      {guion && (
        <div role="region" aria-live="polite" aria-label="Qué decir en la llamada" className="aparecer card flex flex-col gap-3 border-danger-200 p-5">
          {!esTelefono && (
            <div className="rounded-2xl border-2 border-danger-600 bg-danger-50 p-4 text-center">
              <p className="font-bold text-danger-800">Desde la compu no se puede llamar por teléfono.</p>
              <p className="mt-1 text-ink">Agarrá tu celular o un teléfono fijo y marcá:</p>
              <p className="titulo my-1 text-6xl text-danger-800">
                {NUMERO_POLICIA}
              </p>
              <p className="text-sm text-ink-soft">Es gratis y atiende las 24 horas.</p>
            </div>
          )}
          <p className="font-bold text-ink">Cuando te atiendan, leé esto:</p>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-lg text-ink">
            {guion.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ol>
          {datos && (
            <p className="text-sm text-ink-soft">
              {copiado
                ? "La denuncia completa quedó copiada: si te piden mandarla por WhatsApp o mail, pegala."
                : "Si te piden la denuncia por escrito, generala más arriba y copiala."}
            </p>
          )}
          <p className="text-sm text-ink-soft">Si perdiste plata, llamá también a tu banco: usá el teléfono de atención al cliente que está impreso atrás de tu tarjeta de débito o crédito, o en la app oficial de tu banco.</p>
          {esTelefono && (
            <a href={TEL_POLICIA} className="btn btn-secondary">
              Volver a llamar al {NUMERO_POLICIA}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
