import type { AnalisisLLM } from "./gemini.ts";

/**
 * Motor propio, sin IA: reglas de las estafas más comunes en Argentina.
 * Es el respaldo gratuito cuando no hay clave de Gemini o se agotó la cuota,
 * así el servicio nunca se corta. Es más simple que la IA: por eso nunca dice
 * "seguro" con total confianza y siempre recomienda verificar por otro canal.
 */

export const MODELO_MOTOR_PROPIO = "motor-propio";

interface Regla {
  id: string;
  patrones: RegExp[];
  puntos: number;
  bandera: string;
  consejo?: string;
}

/** Pasa a minúsculas y saca acentos para que "Transferí" y "transferi" coincidan. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const MARCAS = /\b(arca|afip|anses|mercado ?pago|mercado ?libre|correo argentino|andreani|oca|banco|galicia|santander|bbva|macro|brubank|uala|naranja ?x|personal pay|modo|whatsapp|netflix|pami)\b/;

export const REGLAS: Regla[] = [
  {
    id: "codigo",
    patrones: [/\b(codigo|clave|contrasena|token|pin|password)\b.{0,40}\b(verificacion|seguridad|sms|que te (llego|llega|enviamos)|de 6|recibiste)\b/, /\b(pasame|mandame|enviame|decime|dictame|compart[ie]) (el|tu|la) (codigo|clave|token|pin)\b/, /\bcodigo de (6|seis) (digitos|numeros)\b/, /\b(codigo|clave|token)\b.{0,30}\b(que (te|le) (acaba de llegar|llego|llega|mandamos|enviamos)|por (sms|mensaje))\b/,
      /\b(el|la|los|ese) \w+ que (te|le) (acaba de llegar|acabamos de mandar|acabamos de enviar|llego|mandamos|enviamos) por (mensaje|sms|whatsapp)\b/, /\bcodigo\b.{0,60}\b(me lo|pasas|pasame|mandas|mandame|reenvia|reenviame)\b/],
    puntos: 55,
    bandera: "Te pide un código, una clave o un token. Nadie de verdad te los pide por mensaje.",
    consejo: "No pases ningún código ni clave, aunque digan que es para protegerte.",
  },
  {
    id: "tarjeta",
    patrones: [/\b(numero de (tu )?tarjeta|codigo de seguridad|cvv|cvc|fecha de vencimiento)\b/],
    puntos: 40,
    bandera: "Te pide datos de tu tarjeta.",
    consejo: "No cargues los datos de tu tarjeta en un link que te llegó por mensaje.",
  },
  {
    id: "familiar",
    patrones: [/\b(cambie|cambiamos) (de |el )?(numero|celular|cel)\b/, /\bagenda (este|mi nuevo)\b/, /\bmi nuevo numero\b/, /\bhola (ma|mama|pa|papa|abu|tia|tio)\b.{0,80}\b(numero|transfer|plata|apuro)\b/],
    puntos: 40,
    bandera: "Alguien dice ser un familiar con número nuevo. Es una de las estafas más comunes.",
    consejo: "Llamá a tu familiar al número de siempre antes de hacer nada.",
  },
  {
    id: "no-llames",
    patrones: [/\bno (me )?(llames|puedo hablar|puedo atender)\b/, /\bdespues te explico\b/],
    puntos: 15,
    bandera: "Te pide que no lo llames: así evitan que descubras el engaño.",
  },
  {
    id: "plata",
    patrones: [/\b(transferi|transferime|transferir|transferencia|depositame|deposita|depositar|sena|adelanto)\b/, /\b(alias|cbu|cvu)\b/],
    puntos: 20,
    bandera: "Te pide plata o una transferencia.",
    consejo: "No transfieras. Verificá por otro canal quién te lo pide.",
  },
  {
    id: "urgencia",
    patrones: [/\b(urgente|hoy mismo|de inmediato|inmediatamente|ultimo aviso|ultima oportunidad|antes de las|en las proximas|dentro de las)\b/, /\b24 ?(hs|horas)\b/, /\bapuro\b/],
    puntos: 15,
    bandera: "Te apura para que no pienses.",
  },
  {
    id: "amenaza",
    patrones: [/\b(embargo|embargar|bloquead[oa]|suspendid[oa]|inhabilitad[oa]|deuda|multa|intimacion|perdes|perderas|cancelaremos|daremos de baja)\b/],
    puntos: 20,
    bandera: "Usa amenazas (embargo, bloqueo, deuda) para asustarte.",
  },
  {
    id: "premio",
    patrones: [/\b(ganaste|ganador|sorteo|premio|fuiste seleccionad[oa]|beneficiari[oa] de)\b/],
    puntos: 25,
    bandera: "Promete un premio o beneficio que no pediste.",
  },
  {
    id: "inversion",
    patrones: [/\b(duplica|duplicar|triplica|ganancia garantizada|rendimiento (diario|asegurado)|sin riesgo|inverti|bitcoin|cripto|usdt|trading)\b/],
    puntos: 40,
    bandera: "Promete ganancias fáciles o garantizadas. Ninguna inversión real lo hace.",
    consejo: "No mandes plata a inversiones que llegan por mensaje.",
  },
  {
    id: "acceso-remoto",
    patrones: [/\b(anydesk|teamviewer|rustdesk|quick ?support|acceso remoto)\b/],
    puntos: 40,
    bandera: "Te pide instalar una app para controlar tu celular o tu compu.",
    consejo: "No instales ninguna app que te pidan por mensaje o por teléfono.",
  },
  {
    id: "acortador",
    patrones: [/\b(bit\.ly|tinyurl\.com|cutt\.ly|is\.gd|t\.co|shorturl\.at|rb\.gy|acortar\.link|s\.id)\//],
    puntos: 20,
    bandera: "Usa un link acortado que esconde a dónde te lleva.",
  },
  {
    id: "validar",
    patrones: [/\b(valida|validar|verifica|verificar|actualiza|actualizar|regulariza|regularizar|reactiva|reactivar|desbloquea|desbloquear) (tu|tus|la|los|su|sus)? ?(cuenta|identidad|datos|deuda|usuario)\b/],
    puntos: 20,
    bandera: "Te pide validar o actualizar datos desde un mensaje.",
    consejo: "Si querés revisar tu cuenta, entrá a la app oficial o escribí vos la dirección. Nunca desde el link del mensaje.",
  },
  {
    id: "voz-conocido",
    patrones: [
      /\bsoy yo\b.{0,80}\b(numero|celu|celular|telefono)\b/,
      /\bse me (rompio|perdio|cayo|mojo) el (celu|celular|telefono)\b/,
      /\b(te|le) (hablo|escribo|llamo) (desde|de) (este|otro|un) (numero|celu|celular|telefono)\b/,
      /\b(numero|celular|telefono) nuevo\b/,
    ],
    puntos: 40,
    bandera: "Dice ser alguien conocido que habla desde otro número.",
    consejo: "Cortá y llamá a esa persona al número de siempre antes de hacer nada.",
  },
  {
    id: "voz-banco",
    patrones: [
      /\b(le|te|les) (hablamos|llamamos|habla|llama|comunicamos)\b.{0,30}\b(banco|area de seguridad|seguridad|soporte|fraudes|prevencion)\b/,
      /\bmovimiento(s)? (sospechoso|inusual|extrano|no reconocido)/,
      /\b(dicte|dictame|dictar|digame|decime|dime|pasame|paseme|leame|leeme) (el|ese|los|la) (codigo|numero|clave|token)\b/,
    ],
    puntos: 45,
    bandera: "Dice llamar del banco o de “seguridad” por un movimiento raro. Es el engaño más común por teléfono.",
    consejo: "Cortá. Llamá vos al banco al teléfono que está impreso atrás de tu tarjeta o en la app oficial del banco.",
  },
  {
    id: "pedido-plata",
    patrones: [/\b\d[\d.]*\s*(mil )?pesos\b/, /\bnecesito que me (transf\w*|deposit\w*|mandes|pases|prestes|envies)\b/, /\b(mil|millon|millones) de pesos\b/],
    puntos: 15,
    bandera: "Pide una suma de plata concreta.",
  },
];

/** Palabras clave que la transcripción automática a veces escribe mal ("transiera", "códico"). */
const VOCABULARIO_VOZ = [
  "transfieras", "transferi", "transferime", "transferir", "transferencia", "depositame", "depositar",
  "codigo", "clave", "token", "urgente", "numero", "celular", "telefono", "banco", "cuenta", "tarjeta", "seguridad",
  "sospechoso", "bloquear", "bloquearlo", "dicte", "dictame", "pesos", "plata", "alias", "llames", "atender", "explico",
  "verificacion", "mensaje", "rompio", "nuevo", "necesito", "movimiento",
];

function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const actual = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = actual;
    }
  }
  return fila[b.length];
}

/** Corrige palabras clave mal transcriptas comparándolas con el vocabulario (texto ya normalizado). */
export function corregirTranscripcion(t: string): string {
  return t.replace(/[a-zñ]{4,}/g, (palabra) => {
    if (VOCABULARIO_VOZ.includes(palabra)) return palabra;
    const tope = palabra.length >= 8 ? 2 : 1;
    let mejor: string | null = null;
    let menor = tope + 1;
    for (const v of VOCABULARIO_VOZ) {
      if (Math.abs(v.length - palabra.length) > tope || v[0] !== palabra[0]) continue;
      const d = distancia(palabra, v);
      if (d < menor) {
        menor = d;
        mejor = v;
      }
    }
    return mejor ?? palabra;
  });
}

const HAY_LINK = /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(com|net|xyz|top|online|site|info|ar|app|link|click|shop)\b/;

export interface ResultadoMotor extends AnalisisLLM {
  reglas: string[];
}

/** Analiza un texto solo con reglas. No usa red ni IA, así que no cuesta nada. */
export function analizarSinIA(texto: string, opciones: { audio?: boolean } = {}): ResultadoMotor {
  const audio = Boolean(opciones.audio);
  const t = audio ? corregirTranscripcion(normalizar(texto)) : normalizar(texto);
  const cumplidas = REGLAS.filter((r) => r.patrones.some((p) => p.test(t)));
  let puntos = cumplidas.reduce((s, r) => s + r.puntos, 0);

  const hayLink = HAY_LINK.test(t);
  const imitaMarca = MARCAS.test(t);
  const banderas = cumplidas.map((r) => r.bandera);
  // Una marca conocida junto con un link o un pedido es la típica suplantación.
  if (imitaMarca && (hayLink || cumplidas.length > 0)) {
    puntos += hayLink ? 25 : 15;
    banderas.push("Nombra a una empresa u organismo conocido: puede ser una suplantación.");
  }
  if (hayLink && cumplidas.length > 0) puntos += 10;
  // Combinaciones típicas: "familiar con número nuevo" o "premio/inversión" que además piden plata.
  const ids = new Set(cumplidas.map((r) => r.id));
  const pidePlata = ids.has("plata") || ids.has("pedido-plata");
  if (pidePlata && (ids.has("familiar") || ids.has("voz-conocido") || ids.has("premio") || ids.has("inversion"))) puntos += 20;
  if (ids.has("voz-banco") && (ids.has("codigo") || ids.has("tarjeta") || ids.has("acceso-remoto"))) puntos += 20;

  // Sin IA no podemos estar seguros de nada: tope en 95 y piso en 10.
  const score = Math.min(95, Math.max(10, puntos));
  const veredicto = score >= 70 ? "estafa" : score >= 35 ? "sospechoso" : "seguro";

  const queHacer = cumplidas.map((r) => r.consejo).filter((c): c is string => Boolean(c));
  if (audio && veredicto !== "seguro") {
    banderas.push("Es un audio: hoy las voces se pueden imitar con inteligencia artificial, aunque suene igual a alguien que conocés.");
    queHacer.unshift("No hagas nada de lo que te pide el audio hasta hablar vos con la persona o el banco por el número de siempre.");
  }
  if (hayLink && veredicto !== "seguro") queHacer.unshift("No abras el link ni cargues datos ahí.");
  if (veredicto === "seguro") queHacer.push("Si algo te parece raro, consultá con alguien de confianza antes de responder.");
  queHacer.push("Ante la duda, comunicate con la empresa o la persona por un canal que vos conozcas.");

  const resumen = audio
    ? veredicto === "estafa"
      ? "Este audio tiene todas las señales de una estafa.\nNo mandes plata ni códigos: llamá vos a la persona."
      : veredicto === "sospechoso"
        ? "Este audio tiene señales raras.\nAntes de hacer nada, llamá vos a la persona."
        : "No escuchamos señales claras de estafa.\nIgual, nunca pases claves ni códigos."
    : veredicto === "estafa"
      ? "Esto tiene todas las señales de una estafa.\nNo respondas, no pagues y no abras links."
      : veredicto === "sospechoso"
        ? "Este mensaje tiene señales raras.\nAntes de hacer nada, confirmalo por otro lado."
        : "No vemos señales claras de estafa.\nIgual, nunca pases claves ni códigos.";

  return {
    veredicto,
    score,
    banderas,
    que_hacer: [...new Set(queHacer)].slice(0, 4),
    resumen_abuela: resumen,
    reglas: cumplidas.map((r) => r.id),
  };
}
