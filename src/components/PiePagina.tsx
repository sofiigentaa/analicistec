import Link from "next/link";
import Creditos from "./Creditos";
import { MARCA } from "@/lib/marca";

/** Pie de página común: aviso, links a la ayuda, a empresas y a privacidad, y créditos. */
export default function PiePagina() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-ink-mute sm:px-6">
        <p>
          Ante la duda, no respondas y llamá a tu banco: usá el teléfono de atención al cliente que está impreso atrás de tu tarjeta de débito o crédito, o en la app oficial de tu banco. Nunca llames a un número que te pasaron por mensaje. Esta herramienta orienta, pero no reemplaza una denuncia ni el consejo de tu banco.
        </p>
        {MARCA.empresa && MARCA.contacto && (
          <p>
            ¿Necesitás ayuda?{" "}
            <a href={MARCA.contacto} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 underline">
              Escribile a {MARCA.empresa}
            </a>
          </p>
        )}
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/ayuda" className="font-semibold text-brand-800 underline">
            Manual de usuario
          </Link>
          <a href="/docs/AntiEstafa-AR_Documentacion-funcional.pdf" download className="font-semibold text-brand-800 underline">
            Documentación funcional (PDF)
          </a>
          <Link href="/privacidad" className="font-semibold text-brand-800 underline">
            Privacidad y términos
          </Link>
          {!MARCA.empresa && (
            <Link href="/empresas" className="font-semibold text-brand-800 underline">
              Para empresas
            </Link>
          )}
        </p>
        <Creditos />
      </div>
    </footer>
  );
}
