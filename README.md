# Círculo Salud — 3 modelos de sitio web (vista previa)

Tres propuestas de diseño, con el mismo contenido, en HTML + CSS + JS puro (sin build).

| Carpeta | Modelo |
|---|---|
| `modelo-1/` | Elegante e institucional (azul del logo, serif) |
| `modelo-2/` | Moderno y animado (oscuro, video en el inicio, contadores, cinta de obras sociales) |
| `modelo-3/` | Cálido y cercano (claro, colores suaves, pasos para el turno y preguntas frecuentes) |

`index.html` (raíz) es el selector que se le muestra al dueño. Cada modelo tiene una barra abajo a la izquierda para volver al selector.

## Ver en local
```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```
También funciona abriendo `index.html` con doble clic, salvo el video en algunos navegadores.

## Publicar en Vercel
Subir esta carpeta a Git → Vercel: Add New → Project → Framework "Other", sin build command ni output directory.
`vercel.json` activa URLs limpias y cabeceras básicas. Es vista previa: todas las páginas llevan `noindex` y `robots.txt` bloquea buscadores.

## Cuando Nico elija
1. Dejar solo la carpeta elegida (ej. `modelo-2/`) y mover su contenido a la raíz; ajustar las rutas `../assets/` → `assets/` (buscar y reemplazar).
2. Quitar la barra "Ver otros modelos" (`.model-bar`), el `noindex` y reemplazar `robots.txt`.
3. Cargar dominio (og:url, og:image, canonical), fotos de las 3 odontólogas y revisar la política de privacidad con un asesor legal.
4. Formulario de turnos: hoy abre WhatsApp. Para PHP completar `CONFIG.turnosEndpoint` en `assets/js/main.js` (POST JSON; tabla sugerida `solicitudes_turno`).

## Datos a confirmar
- Contadores del inicio: "6 años" (desde 2020), 4 consultorios, 9 especialidades y "+60 obras sociales" son calculados a partir de los datos enviados; confirmar con Nico.
- Equipo: nombres, matrículas y especialidades cargados; faltan fotos de las odontólogas.
- Fotos de banco (consulta odontológica en Servicios): confirmar licencia o reemplazar.
- El video es vertical y de baja resolución; en el modelo 2 se reproduce solo, mudo y en bucle (pesa 5 MB).
