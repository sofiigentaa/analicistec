import type { Metadata } from "next";
import Encabezado from "@/components/Encabezado";
import PiePagina from "@/components/PiePagina";
import { MARCA, PROVEEDOR } from "@/lib/marca";
import { CONFIG_TERO } from "@/lib/tero";

export const metadata: Metadata = {
  title: "Privacidad y términos — AntiEstafa AR",
  description: "Qué hacemos con lo que pegás en AntiEstafa AR y las condiciones de uso del servicio.",
};

export default function Privacidad() {
  const responsable = MARCA.empresa ? `${PROVEEDOR.nombre}, que presta este servicio para ${MARCA.empresa}` : PROVEEDOR.nombre;
  return (
    <>
      <Encabezado enlazarInicio />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 text-lg text-ink-soft sm:px-6">
        <h1 className="titulo text-4xl text-ink">Privacidad y términos de uso</h1>

        <section className="flex flex-col gap-3">
          <h2 className="titulo text-2xl text-ink">Qué hacemos con lo que pegás</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>No pedimos registro ni datos personales.</li>
            <li>No guardamos en nuestros servidores los mensajes ni las capturas que revisás.</li>
            <li>
              Para analizarlos, el texto o la imagen se envían a la inteligencia artificial de Google (Gemini) o se revisan con nuestras
              reglas propias, sin IA. Google los procesa según sus propios términos. Con la versión gratuita de la IA, Google puede usar
              ese contenido para mejorar sus productos; por eso te pedimos que <strong>tapes datos personales</strong> (DNI, número de
              tarjeta, claves) antes de subir una captura.
            </li>
            <li>Para revisar un link consultamos datos públicos del dominio (antigüedad y certificado). Nunca abrimos el link con tus datos.</li>
            <li>“Mis análisis” guarda los últimos resultados solo en tu dispositivo. Lo podés apagar y borrar cuando quieras.</li>
            <li>Para evitar abusos contamos cuántas consultas llegan desde cada dirección IP durante un minuto, sin guardarlas.</li>
            {CONFIG_TERO && (
              <li>
                Esta versión es la de tu empresa: cuando algo da estafa o sospechoso, le avisamos a su equipo de seguridad (TERO Security) con el
                resultado, las señales y los dominios de los links.{" "}
                {CONFIG_TERO.incluirTexto
                  ? "Tu empresa eligió recibir también el texto del mensaje o lo que dice el audio."
                  : "No mandamos el texto del mensaje ni lo que dice el audio."}
              </li>
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="titulo text-2xl text-ink">Condiciones de uso</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>El servicio es gratuito y orientativo. Puede equivocarse: no reemplaza a tu banco, a la policía ni a un abogado.</li>
            <li>Si ya pagaste o pasaste datos, llamá a tu banco (el teléfono de atención al cliente que está impreso atrás de tu tarjeta de débito o crédito, o en la app oficial de tu banco) y hacé la denuncia.</li>
            <li>No uses el servicio para revisar contenido de terceros sin su permiso ni para fines ilegales.</li>
            <li>Podemos cambiar o pausar funciones sin aviso para mantener el servicio funcionando.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="titulo text-2xl text-ink">Responsable y contacto</h2>
          <p>
            Responsable del servicio: {responsable}. Para consultas,{" "}
            <a href={MARCA.contacto ?? PROVEEDOR.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 underline">
              escribinos
            </a>
            .
          </p>
          <p className="text-base text-ink-mute">
            Podés ejercer tus derechos de acceso, rectificación y supresión según la Ley 25.326 de Protección de Datos Personales. La
            Agencia de Acceso a la Información Pública es el órgano de control.
          </p>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
