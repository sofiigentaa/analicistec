import type { Metadata } from "next";
import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import PiePagina from "@/components/PiePagina";
import { Icono, type NombreIcono } from "@/components/Iconos";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = {
  title: "Para empresas — AntiEstafa AR",
  description:
    "AntiEstafa AR para empresas: tus clientes revisan mensajes, audios y links antes de caer en una estafa. Gratis para ellos. Un servicio de tecnoros.ar.",
};

const CANALES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "escudo", titulo: "La app con tu nombre", texto: "Tus clientes la usan desde el celu o la compu, con tu nombre, tu logo y tu contacto." },
  { icono: "mensaje", titulo: "Por WhatsApp", texto: "Reenvían el mensaje o el audio raro a un número y les contesta al toque si es estafa y qué hacer." },
  { icono: "candado", titulo: "Nunca se corta", texto: "Si la inteligencia artificial está saturada, sigue funcionando con nuestro análisis propio." },
];

const OPCIONES: { nombre: string; destacado?: boolean; texto: string; items: string[] }[] = [
  {
    nombre: "Con la IA gratuita",
    texto: "La opción más económica.",
    items: [
      "Usa la inteligencia artificial gratuita de Google",
      "Si se satura, sigue con nuestro análisis propio (más simple)",
      "Ideal para empezar o para pocos usuarios",
    ],
  },
  {
    nombre: "Con IA paga incluida",
    destacado: true,
    texto: "La opción más completa.",
    items: [
      "Análisis completo siempre, sin cortes",
      "Más privacidad: Google no usa los mensajes",
      "tecnoros.ar contrata la IA y la incluye en el precio",
    ],
  },
];

const PASOS = [
  "Pedí el diagnóstico gratuito a tecnoros.ar.",
  "Te mostramos una demo con mensajes que les llegaron a tus clientes.",
  "Elegís la opción y nos pasás tu logo y tu número de WhatsApp.",
  "Lo dejamos andando con tu nombre y te damos soporte.",
];

export default function Empresas() {
  return (
    <>
      <Encabezado enlazarInicio />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-4 py-10 sm:px-6 sm:py-14">
        <section className="flex max-w-3xl flex-col gap-5">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-700">Para empresas · un servicio de tecnoros.ar</p>
          <h1 className="titulo text-4xl text-ink sm:text-5xl">Cuidá a tus clientes de las estafas.</h1>
          <p className="text-lg text-ink-soft">
            Tus clientes revisan mensajes, audios y links antes de caer. Para ellos es gratis: vos lo ofrecés como un beneficio y cuidás tu
            nombre.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={MARCA.ventas} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Quiero ofrecerlo a mis clientes
            </a>
            <Link href="/" className="btn btn-secondary">
              Probar la app
            </Link>
          </div>
        </section>

        <section aria-labelledby="canales" className="flex flex-col gap-6">
          <h2 id="canales" className="titulo text-3xl text-ink">
            Cómo les llega a tus clientes
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {CANALES.map((c) => (
              <li key={c.titulo} className="card flex flex-col gap-2 p-5">
                <Icono nombre={c.icono} className="h-7 w-7 text-brand-700" />
                <p className="font-bold text-ink">{c.titulo}</p>
                <p className="text-base text-ink-soft">{c.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="opciones" className="flex flex-col gap-6">
          <div>
            <h2 id="opciones" className="titulo text-3xl text-ink">
              ¿Cuánto cuesta?
            </h2>
            <p className="mt-2 max-w-3xl text-lg text-ink-soft">
              Para tus clientes, <strong className="text-ink">siempre es gratis</strong>. A tu empresa, tecnoros.ar le pasa un precio
              mensual según cuántos clientes tengas y cuál de estas dos opciones elijas:
            </p>
          </div>
          <ul className="grid gap-4 lg:grid-cols-2">
            {OPCIONES.map((o) => (
              <li key={o.nombre} className={`card flex flex-col gap-3 p-6 ${o.destacado ? "border-2 border-brand-700" : ""}`}>
                <p className="titulo text-2xl text-ink">{o.nombre}</p>
                <p className="font-bold text-brand-800">{o.texto}</p>
                <ul className="flex flex-col gap-2">
                  {o.items.map((i) => (
                    <li key={i} className="flex gap-2 text-base text-ink-soft">
                      <Icono nombre="check" className="mt-0.5 h-5 w-5 text-safe-600" />
                      {i}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contratar" className="flex flex-col gap-6">
          <h2 id="contratar" className="titulo text-3xl text-ink">
            Cómo se contrata
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p, i) => (
              <li key={p} className="card flex flex-col gap-2 p-5">
                <span className="titulo text-3xl text-brand-700">{i + 1}</span>
                <p className="text-base text-ink">{p}</p>
              </li>
            ))}
          </ol>
          <a href={MARCA.ventas} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-fit">
            Pedir el diagnóstico gratuito
          </a>
        </section>
      </main>

      <PiePagina />
    </>
  );
}
