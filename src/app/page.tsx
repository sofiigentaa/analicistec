import Link from "next/link";
import Herramientas from "@/components/Herramientas";
import BotonInstalar from "@/components/BotonInstalar";
import Encabezado from "@/components/Encabezado";
import PiePagina from "@/components/PiePagina";
import AsistentePanda from "@/components/AsistentePanda";
import MasAyuda from "@/components/MasAyuda";
import { Icono, type NombreIcono } from "@/components/Iconos";

const GARANTIAS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: "link",
    titulo: "Revisamos el link de verdad",
    texto: "Miramos cuántos días tiene el sitio, si tiene candado y si imita a una marca conocida.",
  },
  {
    icono: "candado",
    titulo: "No guardamos tus mensajes",
    texto: "Lo que pegás se analiza con una IA de Google (Gemini) o con nuestras reglas, y no queda guardado en nuestro sitio.",
  },
  {
    icono: "check",
    titulo: "Gratis y sin registro",
    texto: "No hace falta crear una cuenta ni dejar datos personales.",
  },
];

export default function Home() {
  return (
    <>
      <Encabezado />

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-x-12 gap-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
        <section className="flex flex-col gap-4 lg:pt-4">
          <h1 className="titulo text-4xl text-ink sm:text-5xl">¿Te llegó un mensaje raro? Revisalo antes de responder.</h1>
          <p className="max-w-prose text-lg text-ink-soft">
            Pegá el mensaje o subí la captura. Te decimos si parece una estafa, por qué, y qué hacer ahora.
          </p>
          <div className="grid items-start gap-2 sm:grid-cols-2">
            <Link href="/ayuda" className="btn btn-primary">
              📘 ¿Cómo se usa?
            </Link>
            <BotonInstalar />
          </div>
          <Link href="/ayuda#video" className="w-fit font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-900">
            ▶ Mirá el video de cómo se usa (3 min)
          </Link>
        </section>

        <div className="lg:row-span-2 lg:row-start-1 lg:col-start-2">
          <div className="flex flex-col gap-8">
            <Herramientas />
            <MasAyuda />
          </div>
        </div>

        <ul className="flex flex-col divide-y divide-line border-y border-line lg:col-start-1 lg:row-start-2 lg:self-start">
          {GARANTIAS.map((g) => (
            <li key={g.titulo} className="flex gap-3 py-4">
              <Icono nombre={g.icono} className="mt-0.5 h-6 w-6 text-brand-700" />
              <div>
                <p className="font-bold text-ink">{g.titulo}</p>
                <p className="text-base text-ink-soft">{g.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <PiePagina />

      <AsistentePanda />
    </>
  );
}