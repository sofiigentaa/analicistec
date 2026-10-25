/**
 * Marca blanca: la misma app con el nombre, logo y contacto de la empresa que la ofrece.
 * Cada cliente tiene su propio despliegue en Vercel con estas variables (y su propia clave de Gemini).
 * Sin variables, la app se ve como AntiEstafa AR.
 */
export interface Marca {
  /** Empresa que ofrece el servicio a su gente, o null en la versión pública. */
  empresa: string | null;
  logo: string | null;
  /** Link de contacto de la empresa (WhatsApp, web o teléfono). */
  contacto: string | null;
  /** Dirección pública de la app, para los links que manda el bot. */
  urlApp: string;
  /** A dónde mandamos a las empresas interesadas en contratar el servicio. */
  ventas: string;
}

export const URL_APP_PUBLICA = "https://antiestafa-ar-2.vercel.app";
/** Quien presta el servicio y responde por él. */
export const PROVEEDOR = { nombre: "tecnoros.ar", url: "https://tecnoros.ar" } as const;
export const VENTAS_POR_DEFECTO = "https://tecnoros.ar";

const limpio = (v: string | undefined) => (v ?? "").trim() || null;

function soloHttps(v: string | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Un número de WhatsApp (solo dígitos) se convierte en link wa.me; un link https se deja igual. */
export function linkContacto(v: string | null): string | null {
  if (!v) return null;
  const digitos = v.replace(/[\s()+-]/g, "");
  if (/^\d{8,15}$/.test(digitos)) return `https://wa.me/${digitos}`;
  return soloHttps(v);
}

export function leerMarca(env: Record<string, string | undefined>): Marca {
  return {
    empresa: limpio(env.NEXT_PUBLIC_MARCA_NOMBRE)?.slice(0, 60) ?? null,
    logo: soloHttps(limpio(env.NEXT_PUBLIC_MARCA_LOGO)),
    contacto: linkContacto(limpio(env.NEXT_PUBLIC_MARCA_CONTACTO)),
    urlApp: (soloHttps(limpio(env.NEXT_PUBLIC_URL_APP)) ?? URL_APP_PUBLICA).replace(/\/$/, ""),
    ventas: linkContacto(limpio(env.NEXT_PUBLIC_CONTACTO_VENTAS)) ?? VENTAS_POR_DEFECTO,
  };
}

/**
 * Next reemplaza las NEXT_PUBLIC_* al compilar solo si se escriben completas,
 * por eso las listamos una por una.
 */
export const MARCA: Marca = leerMarca({
  NEXT_PUBLIC_MARCA_NOMBRE: process.env.NEXT_PUBLIC_MARCA_NOMBRE,
  NEXT_PUBLIC_MARCA_LOGO: process.env.NEXT_PUBLIC_MARCA_LOGO,
  NEXT_PUBLIC_MARCA_CONTACTO: process.env.NEXT_PUBLIC_MARCA_CONTACTO,
  NEXT_PUBLIC_URL_APP: process.env.NEXT_PUBLIC_URL_APP,
  NEXT_PUBLIC_CONTACTO_VENTAS: process.env.NEXT_PUBLIC_CONTACTO_VENTAS,
});
