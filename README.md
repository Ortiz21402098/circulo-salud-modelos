# Círculo Salud — sitio web (modelo 1)

Sitio estático en HTML + CSS + JS puro (sin build). Versión actualizada del **modelo 1**.

```
index.html          → redirige a modelo-1/index.html
modelo-1/           → las páginas del sitio (index, nosotros, servicios, obras-sociales, contacto, turnos, privacidad)
  assets/css/style.css
  assets/js/main.js       (menú, animaciones, pestañas, buscador de obras sociales, galería)
  assets/js/chatbot.js    (asistente de turnos que abre WhatsApp)
assets/img, assets/video  → imágenes y videos compartidos
```

## Qué cambió en esta versión
- Equipo: apellido **Llugdar**; Dra. Lourdes Mercau suma **Odontopediatría**; Lic. Karina Pavón con *Traumatología general · Rehabilitación de lesiones · Drenaje linfático manual*.
- Kinesiología: nueva foto del consultorio y video del consultorio (en Servicios → Kinesiología).
- **Ubicación** con tarjeta con foto, dirección y botón "Ver en mapa" (Inicio y Contacto).
- **Turnos sin formulario**: se pide por WhatsApp. El ícono de WhatsApp (arriba a la derecha y flotante) abre un **asistente** que pregunta servicio, motivo, obra social, día, horario y nombre, y al final abre WhatsApp con el mensaje ya escrito. También se puede escribir directo.
- Logo con fondo transparente; se quitó la barra "Ver otros modelos".

## Actualización 10/11/2026
- **Equipo**: fotos nuevas de la Dra. Florencia Santolino y la Dra. Agustina Llugdar (`assets/img/florencia-santolino.webp`, `agustina-llugdar.webp`). Se corrigió el recorte de las fotos del equipo (ahora se ve la cara completa).
- **Recepción**: foto nueva con el cartel negro (reemplaza a `recepcion-logo.webp` en todo el sitio, incluida la portada). **Consultorio 1**: foto nueva (`consultorio-1.webp`).
- **Video del recorrido** reemplazado por el nuevo, con música de fondo (`assets/video/recorrido.mp4`, vertical) y su portada. **Consultorio 3**: foto nueva (`consultorio-3.webp`).
- **Instalaciones (Inicio)**: segunda fila con el rincón de ingreso (buda), la puertita del ratón y el consultorio 3.
- **Menú "Clientes felices"** (`modelo-1/clientes-felices.html`), en el menú y el pie de todas las páginas. Hoy muestra **tarjetas de ejemplo** (con el cartel "Ejemplo", fotos de la clínica de relleno) para mostrar el diseño; hay que borrar el bloque marcado `DEMO-INICIO … DEMO-FIN` cuando se carguen pacientes reales (en ese comentario queda el cartel "Estamos preparando esta sección" por si hace falta). También borrar las fotos de ejemplo `assets/img/clientes/demo-*.webp`. Para cargar pacientes: en el HTML hay un comentario con el bloque para copiar (foto + opinión + nombre). Las fotos van en `assets/img/clientes/` (webp, ~800 px de ancho).
  - Publicar foto y opinión de un paciente requiere su **autorización por escrito**.
- **Instagram** `@circulosalud_`: botón en el encabezado (escritorio) y en "Clientes felices", además del pie y Contacto.

## Ver en local
```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```

## Si ya subiste la versión anterior al repo
Borrar las carpetas `modelo-2/` y `modelo-3/` (y `assets/img/preview-*.webp`) y reemplazar el resto con estos archivos.

## Publicar
- **GitHub Pages**: queda en `https://<usuario>.github.io/<repo>/modelo-1/index.html`.
- **Vercel**: Add New → Project → Framework "Other", sin build command. `vercel.json` redirige la raíz y activa cabeceras básicas.

## Asistente de turnos (chatbot)
- Funciona en el navegador, sin servidor ni IA: es un flujo de preguntas con botones.
- Configuración en `assets/js/chatbot.js` (arriba): `whatsapp` (número) y `turnosEndpoint`.
- Hoy **no guarda nada**: arma el mensaje y abre WhatsApp. Con el backend PHP, completar `turnosEndpoint` (ej. `api/turnos.php`) y se enviará un POST JSON (tabla sugerida `solicitudes_turno`) antes de abrir WhatsApp.
- Los motivos de consulta y las listas de obras sociales del asistente están dentro de `chatbot.js`; las de la página de Obras sociales están en `obras-sociales.html`. Si cambian, actualizar ambos lugares.
- Para abrir el asistente desde otro botón: agregarle el atributo `data-chat-open` (y opcionalmente `data-chat-service="odontologia"` o `"kinesiologia"`). La URL `...#turno` también lo abre.

## Antes de publicar con dominio
1. Quitar `noindex` (meta en cada HTML) y reemplazar `robots.txt`.
2. Cargar dominio: `og:url`, `og:image` (`assets/img/og-image.jpg`) y `canonical`.
3. Fotos de las 3 odontólogas (hoy avatar) y fotos extra de kinesiología.
4. Revisar la política de privacidad con un asesor legal (Ley 25.326).
5. Confirmar la ubicación en el mapa y el estado de la foto de banco de "Odontología" (licencia) en Servicios.
