import type { ResultadoLink } from "@/lib/links";

export interface ReglasMarca {
  marca: string;
  reglas: string[];
}

const REGLAS_BANCO = [
  "Un banco nunca te pide la clave, el token ni el código por mensaje, llamada o WhatsApp.",
  "Nunca te pide que \"valides\" o \"desbloquees\" la cuenta desde un link que te llegó.",
  "Si dudás, entrá a la app del banco que ya tenés instalada o llamá al teléfono de atención que está impreso atrás de tu tarjeta.",
];

const REGLAS_POR_MARCA: Record<string, string[]> = {
  "Mercado Pago": [
    "Mercado Pago nunca te pide claves ni códigos de verificación por mensaje.",
    "Para cobrar o recibir plata no hace falta que pagues nada antes ni que mandes un código.",
    "Revisá tus movimientos desde la app oficial, no desde un link que te mandaron.",
  ],
  "Mercado Libre": [
    "Mercado Libre nunca te pide claves ni códigos por mensaje.",
    "Las compras y los reclamos se gestionan dentro de la app o del sitio, no por chats externos.",
    "Desconfiá de quien te pide salir de la plataforma para cobrar o pagar.",
  ],
  ARCA: [
    "ARCA (ex AFIP) nunca te pide la clave fiscal por mensaje, mail o llamada.",
    "No te amenaza con multas o embargos inmediatos por WhatsApp.",
    "Para hacer trámites, escribí vos la dirección oficial en el navegador en lugar de tocar links.",
  ],
  Correo: [
    "El Correo Argentino no te pide datos de tarjeta ni claves para entregarte un paquete.",
    "Los costos de envío se informan en la compra, no aparecen de golpe por mensaje.",
    "Para seguir un envío, usá el código de seguimiento escribiendo vos la página oficial.",
  ],
};

function claveDeMarca(marca: string): string | null {
  if (marca === "ARCA" || marca === "AFIP") return "ARCA";
  if (marca === "Correo Argentino") return "Correo";
  if (marca in REGLAS_POR_MARCA) return marca;
  return null;
}

/** Reglas generales de cómo se comunica de verdad la marca imitada (sin datos ni URLs específicos). */
export function reglasDeMarca(marca: string): ReglasMarca {
  const clave = claveDeMarca(marca);
  return { marca, reglas: clave ? REGLAS_POR_MARCA[clave] : REGLAS_BANCO };
}

/** Marcas imitadas en los links analizados, sin repetir (AFIP y ARCA se unifican). */
export function marcasImitadas(links: Pick<ResultadoLink, "marcaImitada">[]): ReglasMarca[] {
  const vistas = new Set<string>();
  const res: ReglasMarca[] = [];
  for (const l of links) {
    if (!l.marcaImitada) continue;
    const nombre = l.marcaImitada.marca;
    const clave = claveDeMarca(nombre) ?? nombre;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    res.push(reglasDeMarca(nombre));
  }
  return res;
}
