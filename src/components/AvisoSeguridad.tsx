import { Icono } from "./Iconos";
import { MARCA } from "@/lib/marca";

/** Cartel que confirma que se le avisó al equipo de seguridad de la empresa (TERO Security). */
export default function AvisoSeguridad() {
  return (
    <p role="status" className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-base text-brand-800">
      <Icono nombre="escudo" className="mt-0.5 h-5 w-5" />
      <span>
        <strong>Le avisamos al equipo de seguridad{MARCA.empresa ? ` de ${MARCA.empresa}` : " de tu empresa"}.</strong> Van a revisar el caso. No
        hace falta que reenvíes el mensaje.
      </span>
    </p>
  );
}
