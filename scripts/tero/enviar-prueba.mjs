#!/usr/bin/env node
/**
 * Manda un evento de prueba al SIEM de TERO Security para comprobar la conexión.
 * Uso:  TERO_SIEM_URL=https://... TERO_API_KEY=... TERO_ORGANIZACION=acme npm run tero:prueba
 * También lee las variables de .env.local si existe.
 */
import { existsSync, readFileSync } from "node:fs";
import { construirEvento, enviarATero, leerConfigTero } from "../../src/lib/tero.ts";

if (existsSync(".env.local")) {
  for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^\s*(TERO_[A-Z_]+)\s*=\s*(.*)\s*$/.exec(linea);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const config = leerConfigTero(process.env);
if (!config) {
  console.error("Falta configurar TERO_SIEM_URL (https) y TERO_API_KEY.");
  process.exit(1);
}
const evento = construirEvento(
  {
    veredicto: "estafa",
    score: 90,
    banderas: ["[PRUEBA] Imita a Mercado Pago", "[PRUEBA] Te pide el código de verificación"],
    dominios: ["prueba-antiestafa.example"],
    canal: "mensaje",
    texto: "Evento de prueba de AntiEstafa AR",
  },
  config,
);
console.log(`Enviando evento de prueba a ${config.url} (organización ${config.organizacion})…`);
const ok = await enviarATero(evento, config);
console.log(ok ? "Listo: TERO lo recibió. Buscalo en SIEM → Alertas." : "TERO no lo aceptó. Revisá la URL, el token y que el siem-service esté levantado.");
process.exit(ok ? 0 : 1);
