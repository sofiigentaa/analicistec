#!/usr/bin/env node
/**
 * Graba el video "Cómo se usa AntiEstafa AR" recorriendo la app con Playwright.
 *
 * Uso:
 *   npm run dev                      (en otra terminal)
 *   npm run demo:video               → public/demo/demo.mp4, portada.jpg y demo.vtt
 *
 * Opciones:
 *   --url=https://antiestafa-ar-2.vercel.app   grabar otra dirección (por defecto http://localhost:3000)
 *   --real                                       usar las respuestas reales de la IA (por defecto usa ejemplos fijos)
 *   --salida=public/demo                         carpeta de salida
 *
 * Por defecto las respuestas de /api/* son ejemplos fijos: así el video sale siempre igual,
 * sin esperar a la IA ni gastar cuota. Para agregar una función nueva al video, sumá un paso
 * en la sección PASOS y, si llama a una API nueva, su respuesta de ejemplo en RESPUESTAS.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const URL_BASE = String(args.url ?? "http://localhost:3000").replace(/\/$/, "");
const REAL = Boolean(args.real);
const SALIDA = path.resolve(RAIZ, String(args.salida ?? "public/demo"));
const TEMP = path.join(SALIDA, ".grabacion");
const ANCHO = 1280;
const ALTO = 720;

// ---------- Respuestas de ejemplo de las APIs ----------
const LINK_TRUCHO = {
  url: "https://mercadopag0-seguridad.example/validar",
  dominio: "mercadopag0-seguridad.example",
  bloqueado: false,
  antiguedadDias: 3,
  fechaRegistro: null,
  ssl: false,
  redirecciones: [],
  urlFinal: null,
  marcaImitada: { marca: "Mercado Pago", distancia: 1 },
  dominioOficial: "mercadopago.com.ar",
  senales: ["El dominio se registró hace 3 días", "Imita a Mercado Pago", "No tiene candado (SSL)"],
};

const RESPUESTA_AUDIO = {
  veredicto: "estafa",
  score: 93,
  transcripcion:
    "Hola ma, soy yo, se me rompió el celu y te hablo desde este número. Necesito que me transfieras 120 mil ahora, es urgente, después te explico. No me llames que no puedo atender.",
  banderas: ["Dice ser tu hijo desde un número nuevo", "Pide plata con apuro", "Te pide que no lo llames", "La voz puede estar imitada con IA"],
  que_hacer: ["Llamá a tu hijo al número de siempre", "No transfieras nada hasta hablar con él", "Avisá a la familia"],
  resumen_abuela: "Es una estafa. Llamá a tu hijo al número de siempre antes de mandar plata.",
  detalle: { score_llm: 93, veredicto_llm: "estafa", score_tecnico: 0 },
  links: [],
};

const RESPUESTAS = {
  "/api/analyze": {
    veredicto: "estafa",
    score: 94,
    banderas: [
      "Se hace pasar por Mercado Pago",
      "Te apura con un plazo de 2 horas",
      "El link no es de Mercado Pago: imita la marca y se creó hace 3 días",
    ],
    que_hacer: [
      "No toques el link ni respondas el mensaje",
      "Entrá a la app oficial de Mercado Pago para revisar tu cuenta",
      "Avisale a tu familia para que no caiga",
    ],
    resumen_abuela: "Es una estafa. No toques el link: Mercado Pago nunca te pide datos por mensaje.",
    detalle: { score_llm: 92, veredicto_llm: "estafa", score_tecnico: 96 },
    links: [LINK_TRUCHO],
  },
  "/api/link": {
    veredicto: "estafa",
    score: 91,
    titulo: "Es estafa",
    bajada: "Este link imita a una marca conocida y es muy nuevo.",
    banderas: ["Imita a Mercado Pago (mercadopag0 con cero)", "El sitio se creó hace 3 días", "No tiene candado (SSL)"],
    que_hacer: ["No entres ni cargues datos", "Si querés pagar, hacelo desde la app oficial"],
    resumen_abuela: "No entres a ese link: imita a Mercado Pago.",
    links: [{ dominio: LINK_TRUCHO.dominio }],
    link: LINK_TRUCHO,
  },
  "/api/comprobante": {
    veredicto: "probablemente_falso",
    senales: [
      "El número de operación es todo ceros",
      "La tipografía del monto no coincide con la del resto",
      "No figura quién envía la plata",
    ],
    recomendacion: "No entregues nada hasta ver la plata acreditada en la app de tu banco o billetera.",
  },
  "/api/transferencia": {
    riesgo: "alto",
    senales: ["Te piden plata por un número nuevo", "Te piden que no llames", "Hay apuro"],
    recomendacion: "No transfieras. Llamá a tu familiar al número de siempre para confirmar antes de hacer nada.",
  },
  "/api/asistente": {
    respuesta:
      "¡No se lo pases a nadie! 🐼 Ese código es la llave de tu WhatsApp.\n- Si ya lo pasaste, volvé a registrar tu número en WhatsApp ahora.\n- Activá la verificación en dos pasos.\n- Avisá a tus contactos que no respondan pedidos de plata.",
  },
};

// ---------- Cursor visible, carteles y bloqueo del 911 durante la grabación ----------
const OVERLAY = () => {
  const montar = () => {
    if (document.getElementById("demo-cursor")) return;
    const estilo = document.createElement("style");
    estilo.textContent = `
      #demo-cursor{position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        background:rgb(11 90 104/.25);border:3px solid #0b5a68;z-index:2147483647;pointer-events:none;
        transition:transform .12s ease}
      #demo-cursor.click{transform:scale(.6);background:rgb(11 90 104/.55)}
      #demo-cartel{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:88%;
        background:rgb(10 54 64/.94);color:#fff;font:700 26px/1.3 system-ui,sans-serif;padding:14px 26px;
        border-radius:16px;z-index:2147483646;pointer-events:none;text-align:center;box-shadow:0 10px 30px rgb(0 0 0/.25);
        opacity:0;transition:opacity .25s}
      #demo-cartel.ver{opacity:1}`;
    document.head.appendChild(estilo);
    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    const cartel = document.createElement("div");
    cartel.id = "demo-cartel";
    document.body.append(cursor, cartel);
    addEventListener("mousemove", (e) => (cursor.style.transform = "", cursor.style.left = e.clientX + "px", cursor.style.top = e.clientY + "px"), true);
    addEventListener("mousedown", () => cursor.classList.add("click"), true);
    addEventListener("mouseup", () => cursor.classList.remove("click"), true);
    window.__cartel = (texto) => {
      cartel.textContent = texto || "";
      cartel.classList.toggle("ver", Boolean(texto));
    };
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();
  // En el video no llamamos de verdad al 911.
  addEventListener("click", (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href^='tel:']") : null;
    if (a) e.preventDefault();
  }, true);
};

// ---------- Grabación ----------
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const subtitulos = [];
let t0 = 0;
let page;

async function cartel(texto, ms = 2600) {
  const inicio = (Date.now() - t0) / 1000;
  await page.evaluate((t) => window.__cartel?.(t), texto);
  await espera(ms);
  subtitulos.push({ inicio, fin: (Date.now() - t0) / 1000, texto });
}

async function sinCartel() {
  await page.evaluate(() => window.__cartel?.(""));
}

async function moverA(x, y, pasos = 22) {
  await page.mouse.move(x, y, { steps: pasos });
}

async function apuntar(locator) {
  await locator.scrollIntoViewIfNeeded();
  await espera(250);
  const caja = await locator.boundingBox();
  if (!caja) throw new Error("No encontré el elemento para la demo");
  await moverA(caja.x + caja.width / 2, caja.y + caja.height / 2);
  return caja;
}

async function tocar(locator, pausa = 700) {
  await apuntar(locator);
  await espera(220);
  await locator.click();
  await espera(pausa);
}

async function escribir(locator, texto) {
  await tocar(locator, 200);
  await locator.pressSequentially(texto, { delay: 18 });
  await espera(400);
}

async function bajarHasta(locator) {
  await locator.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await espera(1100);
}

function pestana(nombre) {
  return page.getByRole("tab", { name: nombre, exact: true });
}

function panel(nombre) {
  return page.getByRole("tabpanel", { name: nombre, exact: true });
}

async function main() {
  rmSync(TEMP, { recursive: true, force: true });
  mkdirSync(TEMP, { recursive: true });

  const navegador = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const contexto = await navegador.newContext({
    viewport: { width: ANCHO, height: ALTO },
    recordVideo: { dir: TEMP, size: { width: ANCHO, height: ALTO } },
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await contexto.addInitScript(OVERLAY);
  if (!REAL) {
    for (const [ruta, json] of Object.entries(RESPUESTAS)) {
      await contexto.route(`**${ruta}`, async (r) => {
        await espera(ruta === "/api/analyze" ? 2800 : 1400);
        const esAudio = ruta === "/api/analyze" && (r.request().postDataBuffer()?.toString("latin1") ?? "").includes('name="audio"');
        await r.fulfill({ json: esAudio ? RESPUESTA_AUDIO : json });
      });
    }
  }

  page = await contexto.newPage();
  // Si un paso no encuentra lo que busca, que falle en 20 s en vez de quedarse esperando.
  page.setDefaultTimeout(20_000);
  t0 = Date.now();
  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await moverA(ANCHO / 2, ALTO / 2, 1);

  // ===================== PASOS =====================
  await cartel("AntiEstafa AR: revisá si un mensaje es una estafa", 3200);
  await cartel("Pandi, el osito de la app, te saluda abajo a la derecha", 2600);

  // 1. Mensaje con ejemplo, preguntas y análisis
  await cartel("1. Pegá el mensaje que te llegó (o tocá un ejemplo)", 1600);
  await tocar(page.getByRole("button", { name: "Falso Mercado Pago" }), 900);
  await cartel("Si querés, respondé estas preguntas para afinar el resultado", 1400);
  const preguntas = page.getByRole("group", { name: "¿Te pidieron plata o datos?" });
  await tocar(preguntas.getByRole("button", { name: "Sí" }), 400);
  await tocar(page.getByRole("group", { name: "¿Te apuran para hacerlo ya?" }).getByRole("button", { name: "Sí" }), 400);
  await cartel("Tocá «¿Es estafa? Analizar»", 1000);
  await tocar(page.getByRole("button", { name: "¿Es estafa? Analizar" }), 200);
  await cartel("Revisamos los links y analizamos el mensaje con IA…", 2400);

  // 2. Resultado
  await page.getByRole("heading", { level: 2, name: /estafa/i }).first().waitFor();
  await espera(900);
  await cartel("2. El resultado: semáforo, puntaje y por qué", 3000);
  const resultado = panel("Mensaje");
  await bajarHasta(resultado.getByText("Qué hacer ahora").first());
  await cartel("Qué hacer ahora y qué nos llamó la atención", 2600);
  const links = resultado.getByText(/Links revisados/);
  await tocar(links, 900);
  await cartel("Te marcamos la parte trucha del link y cuántos días tiene el sitio", 3000);
  await bajarHasta(resultado.getByText(/Así se ve el real/));
  await cartel("«Así se ve el real»: cómo se comunica de verdad la empresa", 2800);
  await bajarHasta(resultado.getByText("Modo abuela").first());
  const abuela = resultado.getByText("Modo abuela", { exact: true });
  await tocar(abuela, 600);
  await cartel("Modo abuela: letra grande y solo lo importante", 2400);
  await tocar(abuela, 400);

  // 3. Alerta, denuncia y 911
  await bajarHasta(resultado.getByRole("button", { name: /Generar alerta/ }));
  await tocar(resultado.getByRole("button", { name: /Generar alerta/ }), 800);
  await cartel("3. Avisá a tu familia: la alerta ya está escrita, mandala por WhatsApp", 2800);
  await bajarHasta(resultado.getByRole("button", { name: /Generar denuncia/ }));
  await tocar(resultado.getByRole("button", { name: /Generar denuncia/ }), 800);
  await cartel("La denuncia se arma sola: copiala, descargala o imprimila", 2800);
  // En el celular es un link (tel:911); en la compu, un botón que muestra el número grande.
  const llamar = resultado.getByText(/Llamar al 911 · Policía/).first();
  await bajarHasta(llamar);
  await tocar(llamar, 900);
  await cartel("¿Querés denunciar? Llamás al 911 con lo que tenés que decir en pantalla", 3200);
  await bajarHasta(resultado.getByText("Cuando te atiendan, leé esto:"));
  await cartel("En la compu te mostramos el 911 grande para marcarlo desde el celular", 2800);

  // 4. Otras pestañas
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await espera(900);
  await tocar(pestana("Link"), 500);
  await cartel("4. ¿Te mandaron solo un link? Revisalo sin abrirlo", 1600);
  await escribir(panel("Link").getByRole("textbox"), "mercadopag0-seguridad.example/validar");
  await tocar(panel("Link").getByRole("button", { name: "Revisar link" }), 200);
  await espera(1700);
  await cartel("Antigüedad, candado y marca imitada, sin entrar al sitio", 2600);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await espera(700);
  await tocar(pestana("Audio"), 500);
  await cartel("5. ¿Te llegó un audio raro? Subilo o grabalo con el micrófono", 1800);
  await panel("Audio").locator('input[type="file"]').first().setInputFiles(path.join(AQUI, "PTT-20261024-WA0007.opus"));
  await espera(700);
  await tocar(panel("Audio").getByRole("button", { name: /Analizar audio/ }), 200);
  await panel("Audio").getByText("Lo que dice el audio").waitFor();
  await espera(600);
  await bajarHasta(panel("Audio").getByText("Lo que dice el audio"));
  await cartel("Lo escuchamos, lo pasamos a texto y te decimos si es estafa", 2800);
  await cartel("Ojo: hoy las voces se pueden imitar con inteligencia artificial", 2600);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await espera(700);
  await tocar(pestana("QR"), 500);
  await cartel("6. ¿Vas a pagar con un QR? Sacale una foto antes", 1800);
  await panel("QR").locator('input[type="file"]').last().setInputFiles(path.join(AQUI, "qr-ejemplo.png"));
  await espera(2600);
  await bajarHasta(panel("QR").getByRole("heading").last());
  await cartel("Leemos el QR y revisamos a dónde te lleva", 2600);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await espera(700);
  await tocar(pestana("Comprobante"), 500);
  await cartel("7. ¿Te mandaron un comprobante? Revisá si es falso", 1800);
  await panel("Comprobante").locator('input[type="file"]').first().setInputFiles(path.join(AQUI, "comprobante-ejemplo.png"));
  await espera(600);
  await tocar(panel("Comprobante").getByRole("button", { name: "Revisar comprobante" }), 200);
  await espera(1800);
  await cartel("Entregá el producto solo cuando veas la plata en tu banco", 2600);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await espera(700);
  await tocar(pestana("Transferencia"), 500);
  await cartel("8. Antes de transferir, revisá el alias o CBU que te pasaron", 1800);
  await escribir(panel("Transferencia").getByLabel("Alias, CBU o CVU de destino"), "pago.rapido.mp");
  await escribir(
    panel("Transferencia").getByLabel("Mensaje que acompaña el pedido de transferencia"),
    "Hola ma, cambié de número. Pasame $85.000, no me llames que no puedo hablar",
  );
  await tocar(panel("Transferencia").getByRole("button", { name: "Revisar antes de transferir" }), 200);
  await espera(1800);
  await cartel("Riesgo alto: confirmá siempre por otro medio", 2400);

  // 5. Más ayuda
  await bajarHasta(pestana("Ya caí"));
  await tocar(pestana("Ya caí"), 500);
  await cartel("9. ¿Ya caíste? Elegí qué pasó y seguí los pasos", 1600);
  await tocar(page.getByRole("button", { name: /Transferí plata/ }), 900);
  await cartel("Lo urgente primero: llamar al banco ya", 2600);
  await bajarHasta(pestana("Del momento"));
  await tocar(pestana("Del momento"), 700);
  await cartel("10. Del momento: las estafas que circulan ahora, con su fuente", 2800);
  await bajarHasta(panel("Del momento").getByRole("link", { name: /Avisar a mi familia/ }).first());
  await cartel("Avisale a tu familia por WhatsApp con un toque", 2400);
  await bajarHasta(pestana("Practicá"));
  await tocar(pestana("Practicá"), 700);
  await cartel("11. Practicá: ¿es estafa o es real? Aprendé a darte cuenta", 2000);
  await tocar(panel("Practicá").getByRole("button", { name: /Es una estafa/ }), 1200);
  await bajarHasta(panel("Practicá").getByText("Qué mirar:"));
  await cartel("Te explicamos las pistas de cada mensaje", 2600);
  await bajarHasta(pestana("Mis análisis"));
  await tocar(pestana("Mis análisis"), 700);
  await cartel("12. Mis análisis: lo que revisaste, guardado solo en tu dispositivo", 2600);

  // 6. Pandi
  const pandi = page.getByRole("button", { name: /Pandi, el asistente/ });
  await cartel("13. Pandi responde tus dudas", 1200);
  await tocar(pandi, 800);
  await tocar(page.getByRole("button", { name: /código de WhatsApp/ }), 400);
  await page.getByText(/No se lo pases a nadie/).waitFor();
  await espera(1200);
  await cartel("Respuestas cortas y simples. Nunca te pide datos", 2600);
  await tocar(page.getByRole("button", { name: /Cerrar el chat/ }), 700);
  const caja = await apuntar(pandi);
  await page.mouse.down();
  await moverA(caja.x - 380, caja.y - 220, 30);
  await cartel("Si lo arrastrás dice «¡Wiii!»…", 1600);
  await page.mouse.up();
  await cartel("…y cuando lo soltás, vuelve solito a su lugar", 2600);

  // 7. Cierre
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await espera(900);
  await tocar(page.getByRole("link", { name: /Cómo se usa/ }).first(), 1500);
  await cartel("¿Dudas? Todo el manual está en «¿Cómo se usa?», también en PDF", 3000);
  await page.goto(`${URL_BASE}/empresas`, { waitUntil: "networkidle" });
  await espera(600);
  await cartel("¿Tenés una empresa? Ofrecelo a tus clientes con tu nombre. Un servicio de tecnoros.ar", 3200);
  await bajarHasta(page.getByRole("heading", { name: "¿Cuánto cuesta?" }));
  await cartel("Para tus clientes es gratis: la app con tu nombre y por WhatsApp", 3000);
  await cartel("AntiEstafa AR · antiestafa-ar-2.vercel.app", 3000);
  await sinCartel();
  // =================================================

  const video = page.video();
  await contexto.close();
  await navegador.close();
  const webm = await video.path();
  return webm;
}

function vtt(lineas) {
  const ts = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const seg = (s % 60).toFixed(3).padStart(6, "0");
    return `${h}:${m}:${seg}`;
  };
  return `WEBVTT\n\n${lineas.map((l, i) => `${i + 1}\n${ts(l.inicio)} --> ${ts(l.fin)}\n${l.texto}\n`).join("\n")}`;
}

try {
  console.log(`Grabando ${URL_BASE} ${REAL ? "(IA real)" : "(respuestas de ejemplo)"}…`);
  const webm = await main();
  const mp4 = path.join(SALIDA, "demo.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "4", "-i", mp4, "-frames:v", "1", "-q:v", "4", path.join(SALIDA, "portada.jpg")]);
  writeFileSync(path.join(SALIDA, "demo.vtt"), vtt(subtitulos));
  for (const f of readdirSync(TEMP)) rmSync(path.join(TEMP, f), { force: true });
  rmSync(TEMP, { recursive: true, force: true });
  console.log(`Listo: ${path.relative(RAIZ, mp4)}, portada.jpg y demo.vtt (${subtitulos.length} subtítulos)`);
} catch (err) {
  console.error("No se pudo grabar la demo:", err);
  // Cortamos acá: si no, el navegador queda abierto grabando.
  process.exit(1);
}
