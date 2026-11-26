// Guarda la app en el celu para que abra sin internet.
// Al cambiar algo de la app, subir VERSION para que los celulares bajen la nueva.
const VERSION = "v8";
const APP_CACHE = "libreta-app-" + VERSION;
const FONT_CACHE = "libreta-fonts";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  // cache: "reload" saltea la caché del navegador (GitHub Pages la guarda 10 min), así la versión nueva entra completa.
  e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(APP_FILES.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("libreta-app-") && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Tipografías de Google: se guardan la primera vez y después salen del celu.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONT_CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok || res.type === "opaque") c.put(req, res.clone());
          return res;
        } catch (_) {
          return new Response("", { status: 504 });
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Archivos de la app: responde al instante con lo guardado y actualiza por detrás si hay internet.
  e.respondWith(
    caches.open(APP_CACHE).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("./index.html") : null);
      const net = fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" })).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || new Response("Sin conexión", { status: 503 });
    })
  );
});

/* ---------- Avisos (VTV, vencimientos y repuestos) ----------
   La app deja en la caché "libreta-avisos" las fechas y los km; el service worker no puede leer localStorage.
   Revisa cuando se abre la app (mensaje "revisar-avisos") y, si Chrome lo permite, una vez por día con la app cerrada (periodicsync).
   Manda una sola notificación con todo lo pendiente, y solo si hay algo nuevo o pasaron 7 días desde el último aviso de eso. */
const AVISOS_CACHE = "libreta-avisos";
const AVISO_DIAS = 30;
const REPETIR_DIAS = 7;
const isoHoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const diaNum = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
const fmtN = (n) => Number(n).toLocaleString("es-AR");

async function revisarAvisos() {
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") return;
  const c = await caches.open(AVISOS_CACHE);
  const r = await c.match("avisos-datos");
  if (!r) return;
  const d = await r.json();
  const hoy = isoHoy();
  const items = [];
  for (const v of d.vencimientos || []) {
    const dias = diaNum(v.fecha) - diaNum(hoy);
    if (dias > AVISO_DIAS) continue;
    items.push({ key: `v:${v.id}:${dias < 0 ? "bad" : "warn"}`,
      txt: dias < 0 ? `${v.nombre}: venció` : dias === 0 ? `${v.nombre}: vence hoy` : `${v.nombre}: vence en ${dias} ${dias === 1 ? "día" : "días"}` });
  }
  if (d.km != null) {
    // Kilometraje estimado: el último que cargaste + lo que hacés por mes desde ese día.
    const pasaron = d.kmFecha ? Math.max(0, diaNum(hoy) - diaNum(d.kmFecha)) : 0;
    const km = Math.round(d.km + pasaron / 30.4 * (d.kmPorMes || 0));
    for (const p of d.repuestos || []) {
      const rest = p.proximo - km;
      if (rest > p.umbral) continue;
      items.push({ key: `r:${p.id}:${p.proximo}:${rest <= 0 ? "bad" : "warn"}`,
        txt: rest <= 0 ? `${p.nombre}: toca cambiarlo` : `${p.nombre}: faltan ~${fmtN(Math.round(rest / 100) * 100)} km` });
    }
  }
  const sr = await c.match("avisos-enviados");
  const enviados = sr ? await sr.json() : {};
  const nuevos = items.filter((i) => !enviados[i.key] || diaNum(hoy) - diaNum(enviados[i.key]) >= REPETIR_DIAS);
  if (!nuevos.length) return;
  const lista = [...nuevos, ...items.filter((i) => !nuevos.includes(i))];
  await self.registration.showNotification(
    lista.length === 1 ? "Libreta del Voyage" : `Libreta del Voyage: ${lista.length} cosas para atender`,
    { body: lista.map((i) => i.txt).join("\n"), tag: "libreta-avisos", icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: "./" } }
  );
  const quedan = {};
  for (const i of items) quedan[i.key] = nuevos.includes(i) ? hoy : enviados[i.key];
  await c.put("avisos-enviados", new Response(JSON.stringify(quedan), { headers: { "Content-Type": "application/json" } }));
}

self.addEventListener("message", (e) => { if (e.data === "revisar-avisos") e.waitUntil(revisarAvisos().catch(() => {})); });
self.addEventListener("periodicsync", (e) => { if (e.tag === "libreta-avisos") e.waitUntil(revisarAvisos().catch(() => {})); });
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => {
    const w = l.find((c) => c.url.startsWith(self.registration.scope));
    return w ? w.focus() : self.clients.openWindow("./");
  }));
});
