import { test } from "node:test";
import assert from "node:assert/strict";
import { construirEvento, debeAvisar, enviarATero, leerConfigTero, tecnicasMitre, type DatosAnalisis } from "../src/lib/tero.ts";

const config = { url: "https://tero.empresa.com.ar/api/siem/ingest", apiKey: "tok_123", organizacion: "acme", incluirTexto: false };
const base: DatosAnalisis = {
  veredicto: "estafa",
  score: 92,
  banderas: ["Te pide el código de verificación", "Imita a Mercado Pago"],
  dominios: ["mercadopag0-seguridad.example"],
  canal: "mensaje",
  texto: "Mercado Pago: validá tu cuenta en http://mercadopag0-seguridad.example y pasame el código",
};

test("config de TERO: solo se activa con URL https y token", () => {
  assert.equal(leerConfigTero({}), null);
  assert.equal(leerConfigTero({ TERO_SIEM_URL: "https://x.ar/in" }), null);
  assert.equal(leerConfigTero({ TERO_SIEM_URL: "http://x.ar/in", TERO_API_KEY: "t" }), null);
  assert.ok(leerConfigTero({ TERO_SIEM_URL: "http://localhost:8005/ingest", TERO_API_KEY: "t" }));
  const c = leerConfigTero({ TERO_SIEM_URL: "https://x.ar/in", TERO_API_KEY: " t ", TERO_INCLUIR_TEXTO: "TRUE" });
  assert.deepEqual(c, { url: "https://x.ar/in", apiKey: "t", organizacion: "sin-organizacion", incluirTexto: true });
});

test("solo avisa estafas y sospechosos, y si está configurado", () => {
  assert.equal(debeAvisar("estafa", config), true);
  assert.equal(debeAvisar("sospechoso", config), true);
  assert.equal(debeAvisar("seguro", config), false);
  assert.equal(debeAvisar("estafa", null), false);
});

test("técnicas MITRE: link → T1566.002, audio → T1566.004, pedido de datos → T1598", () => {
  const conLink = tecnicasMitre(base);
  assert.equal(conLink[0].id, "T1566");
  assert.deepEqual(conLink[0].subtechnique?.map((s) => s.id), ["T1566.002"]);
  assert.equal(conLink[1].id, "T1598");
  const audio = tecnicasMitre({ canal: "audio", dominios: [], banderas: ["Pide plata"] });
  assert.deepEqual(audio, [{ id: "T1566", name: "Phishing", subtechnique: [{ id: "T1566.004", name: "Spearphishing Voice" }] }]);
});

test("el evento no lleva el texto por defecto, pero sí una huella para agrupar", () => {
  const e = construirEvento(base, config, new Date("2026-10-25T19:00:00Z"));
  assert.equal(e["@timestamp"], "2026-10-25T19:00:00.000Z");
  assert.equal(e.event.module, "antiestafa");
  assert.equal(e.organization.id, "acme");
  assert.equal(e.rule.name, "AntiEstafa: estafa detectada");
  assert.ok(e.tags.includes("attack.t1566.002"));
  assert.deepEqual(e.threat.indicator, [{ type: "domain-name", url: { domain: "mercadopag0-seguridad.example" } }]);
  assert.equal("texto" in e.antiestafa, false);
  assert.match(String(e.antiestafa.huella), /^[0-9a-f]{16}$/);
  assert.equal(JSON.stringify(e).includes("pasame el código"), false);
  const conTexto = construirEvento(base, { ...config, incluirTexto: true });
  assert.match(String(conTexto.antiestafa.texto), /pasame el código/);
});

test("envío: manda JSON con el token y no se cae si TERO no responde", async () => {
  let pedido: { url: string; init: RequestInit } | null = null;
  const ok = (async (url: string, init: RequestInit) => {
    pedido = { url, init };
    return new Response("{}", { status: 202 });
  }) as unknown as typeof fetch;
  const evento = construirEvento(base, config);
  assert.equal(await enviarATero(evento, config, ok), true);
  assert.equal(pedido!.url, config.url);
  assert.equal((pedido!.init.headers as Record<string, string>).authorization, "Bearer tok_123");
  assert.equal(JSON.parse(String(pedido!.init.body)).event.dataset, "antiestafa.analisis");
  const roto = (async () => {
    throw new Error("caído");
  }) as unknown as typeof fetch;
  assert.equal(await enviarATero(evento, config, roto), false);
});
