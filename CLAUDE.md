# Libreta del Voyage

App para el auto de Agus (VW Voyage): https://agustincancilla.github.io/libreta-voyage/

- Pestañas, en este orden (lo pidió Agus): Mantenimiento, Marcas buenas, Contactos, Fallas/links/tips.
- Mantenimiento: cuentakilómetros arriba; cada repuesto tiene `cadaKm`, `ultimoKm`, `proximoKm`. Vencido / "pronto" (menos de 5.000 km) / al día; estima meses con `kmPorMes` (4.000). "Lo cambié" pide el km y recalcula el próximo.
- Marcas buenas: dentro de cada grupo se ordenan por `orden` (campo "Lugar en la lista"; 1 arriba) y después por nombre. Tren delantero (pedido de Agus): primero lo Nakata y lo que se rompe más seguido (rótulas, extremos, precaps, bieletas), después bujes VTH (barra, parrilla) y al final rulemanes. Se sacó "Bujes reforzados (De Bora)" (ya cubierto por los bujes de parrilla VTH); `arreglos` marca que ese cambio ya se aplicó.
- Contactos con copiar, llamar, WhatsApp (`wa.me/549…`) y Maps; los que hay que evitar van aparte en "No volver".
- Clave en el celu: `libreta-voyage-v1`.
- No poner links a APK "mod" (suelen traer malware); usar Play Store.

## Cómo trabajar con Agus

- Todo lo que se le muestre va en español rioplatense. Solo quedan en inglés nombres de comandos y archivos.
- Agus no es programador: explicar en pocas líneas qué se va a hacer antes de un cambio grande y esperar su OK; los pasos que tenga que hacer él, uno por uno.
- Muchas veces trabaja desde el celu (sesión en la nube): no hay acceso a sus datos ni a otros repos.

## Cómo está hecha

App web instalable (PWA) que anda sin internet, en GitHub Pages. Este repo es **público**: nunca subir datos personales (el `.gitignore` bloquea los `.json` salvo el manifest).

- `index.html` tiene todo el HTML, CSS y JS. `manifest.webmanifest`, `sw.js`, `icons/`.
- Rutas relativas (la app vive en `agustincancilla.github.io/<repo>/`).
- Los datos viven solo en el `localStorage` del celu. Botón "Datos y copias" para descargar/cargar copias. "Guardar en Drive o mail" (`shareBackup`) abre el menú de compartir del celu con la copia como `.txt` (Chrome no deja compartir `.json`); el botón "Hacer copia" del aviso de 30 días va directo ahí. Cargar datos acepta `.json` y `.txt`.
- Fechas con la fecha **local** (no `toISOString()`, que en Argentina después de las 21 h da el día siguiente).

## Al cambiar algo

1. Cambiar `index.html`.
2. **Subir `VERSION` en `sw.js`** (`v1` → `v2`…), si no el celu sigue mostrando la vieja. Subir también `APP_VERSION` en `index.html` (se muestra en "Datos y copias").
3. Si cambia la forma de los datos, que `normalize()` siga aceptando las copias viejas: Agus tiene datos cargados que no se pueden perder.
4. Commit (terminar el mensaje con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`) y push a `main`.
5. Avisarle: la app baja la versión nueva al abrirla con internet y **se recarga sola** para mostrarla (`controllerchange` en `index.html`; `sw.js` instala con `cache: "reload"` y busca actualizaciones con `no-cache`, porque GitHub Pages cachea 10 minutos).

