# Libreta del Voyage

App para el auto de Agus (VW Voyage): https://agustincancilla.github.io/libreta-voyage/

- Pestañas, en este orden (lo pidió Agus): Mantenimiento, Marcas buenas, Multas, Contactos, Fallas/links/tips.
- Multas: botones fijos (en el HTML, sin datos) que abren el sitio oficial de consulta de infracciones: Nacional (SINAI), Provincia de Buenos Aires, Lanús, Avellaneda, Lomas de Zamora, CABA, Córdoba, Santa Fe y Mar del Plata. Copiado del estilo de la app "Rinde" que mostró Agus.
- Mantenimiento: cuentakilómetros arriba; cada repuesto tiene `cadaKm`, `ultimoKm`, `proximoKm`. Vencido / "pronto" (según el `aviso` de cada repuesto, ver Avisos) / al día; estima meses con `kmPorMes` (4.000). "Lo cambié" pide el km y recalcula el próximo.
- Marcas buenas: dentro de cada grupo se ordenan por `orden` (campo "Lugar en la lista"; 1 arriba) y después por nombre. Tren delantero (pedido de Agus): primero lo Nakata y lo que se rompe más seguido (rótulas, extremos, precaps, bieletas), después bujes VTH (barra, parrilla) y al final rulemanes. Se sacó "Bujes reforzados (De Bora)" (ya cubierto por los bujes de parrilla VTH); `arreglos` marca que ese cambio ya se aplicó.
- **Vencimientos** (arriba de Mantenimiento, `store.vencimientos`: `nombre`, `fecha` ISO, `cadaMeses`, `nota`): VTV, oblea de GNC, seguro (póliza) y licencia, que arrancan sin fecha (la carga Agus; no van fechas en el repo). Pronto = 30 días antes. "La hice" propone fecha + `cadaMeses`. "Agendar en Calendar" abre Google Calendar con un evento un mes antes (lo único que avisa seguro con la app cerrada).
- **Avisos** (pedido de Agus, nov/2026): repuestos con `aviso` "caro" (amortiguadores, correa, embrague, cubiertas, bobina, batería: 1 mes antes = `kmPorMes` km) o "barato" (el resto: 15 días = `kmPorMes`/2). Cartel "Para tener en cuenta" arriba y botón "Activar avisos en el celu". La app guarda en la caché `libreta-avisos` (`avisos-datos`) lo que necesita `sw.js`, que manda una sola notificación al abrir la app (mensaje `revisar-avisos`) y, si Chrome lo permite, con la app cerrada (`periodicsync`, km estimado con `kmPorMes`). Repite cada 7 días (`avisos-enviados`). `arreglos: 2` agrega los vencimientos y el `aviso` a datos viejos.
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


## Guardia

`.claude/hooks/guardia.py` corre solo (hook en `.claude/settings.json`) antes de cada `git commit`/`git push` de Claude: frena si hay claves, `.env` o `.json` de datos, si cambió `index.html` sin subir `VERSION` en `sw.js`, si `APP_VERSION` ≠ `VERSION`, o si el JavaScript tiene errores de sintaxis. Falso positivo: `guardia:ok` en esa línea. Es copia del de `Personal` (mismo archivo en todas las apps).
