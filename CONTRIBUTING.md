# Cómo contribuir

¡Gracias por tu interés en mejorar Fichaje! Este documento explica cómo preparar tu entorno, cuáles son las convenciones del proyecto y cómo enviar cambios.

Al participar aceptas el [Código de Conducta](CODE_OF_CONDUCT.md).

## Formas de ayudar

- **Reportar un bug:** abre un issue con la plantilla *Reporte de bug*.
- **Proponer una idea:** usa la plantilla *Propuesta de mejora*.
- **Agregar un diseño:** es la contribución más sencilla y la más útil. Ve a [Agregar un diseño](#agregar-un-diseño).
- **Mejorar la documentación** o traducirla.

## Entorno local

No hay dependencias ni paso de build.

```bash
git clone https://github.com/<tu-usuario>/generador-credenciales-futbol.git
cd generador-credenciales-futbol
```

Abre `index.html` en el navegador. Si prefieres un servidor local (por ejemplo, para probar desde el celular):

```bash
npx serve .
# o
python -m http.server 8000
```

## Convenciones

- **Sin dependencias nuevas** salvo que se discutan antes en un issue. La meta es que la app abra con doble clic.
- **JavaScript moderno sin framework:** `'use strict'`, `const`/`let` y funciones pequeñas.
- **Textos de la interfaz en español**; nombres de código en inglés o siguiendo el estilo del archivo que tocas.
- **Seguridad:** nunca uses `innerHTML` con datos del usuario; usa `textContent`. Todo lo que se importa (CSV, JSON) se valida antes de usarse.
- **Comentarios** cortos, solo donde el *por qué* no es obvio.
- **Tamaños dentro de la credencial en `em`**: el JS fija `font-size = lado corto / 18`, así la credencial escala con cualquier tamaño.

## Agregar un diseño

Un diseño es una combinación de piezas que ya existen. En la mayoría de los casos **solo hay que agregar una línea** en `designs.js`:

```js
{ id: 'mi-diseno', nombre: 'Mi diseño', hp: 'top', arr: 'fila', skin: 'solid', num: 'circle', bg: 'cancha', c: ['#0b3d91', '#f2b705'] },
```

| Campo | Valores |
|---|---|
| `id` | Único, en minúsculas y sin espacios. Se guarda en las configuraciones: **no cambies el id de un diseño existente**. |
| `nombre` | El que se ve en el selector. |
| `hp` | Posición del encabezado: `top`, `bottom`, `left`, `right` |
| `arr` | Acomodo: `fila`, `espejo`, `alto`, `alto-espejo`, `numtop`, `numtop-espejo`, `firmas-lado`, `firmas-izq` |
| `skin` | Estilo: `solid`, `gradient`, `stripes`, `outline`, `split`, `tinted`, `angled`, `ticket`, `corners`, `double`, `pill` |
| `num` | Forma del número: `box`, `circle`, `filled`, `shield`, `plain` |
| `bg` | Fondo: `none`, `cancha`, `balon`, `balones`, `red`, `pasto`, `pizarra`, `porteria`, `hex`, `trofeo`, `camiseta`, `banderin`, `estadio` |
| `c` | Colores `[principal, secundario]` |

**Reglas para que un diseño se acepte:**

1. La combinación `hp + arr + skin + num + bg` **no debe repetirse** con un diseño existente.
2. Nada tapa los datos: las decoraciones van en el encabezado o dentro del margen de la credencial.
3. Se ve bien en **horizontal y vertical**, con un nombre largo (por ejemplo, *Maximiliano Hernández Gutiérrez*) y con números de 1 y 2 dígitos.
4. Evita `firmas-lado` y `firmas-izq` con encabezado lateral (`left`/`right`): el espacio para los datos queda muy angosto.

### Piezas nuevas

- **Acomodo nuevo** (`arr`): agrega en `styles.css` la regla `.arr-<nombre> .main` con `grid-template-areas` y su versión `.ori-v.arr-<nombre> .main`. Las áreas disponibles son `photo`, `data`, `num` y `sign`.
- **Estilo nuevo** (`skin`): agrega reglas `.skin-<nombre>`. Si depende del lado donde está el encabezado, usa `.hp-top`, `.hp-bottom`, `.hp-left` y `.hp-right`.
- **Fondo nuevo** (`bg`): agrega un `case` en `patternStyle()` dentro de `designs.js`, que devuelva un SVG con `stroke-opacity`/`fill-opacity` igual a `PATTERN_OPACITY`, y su nombre en `PATTERN_NAMES`.

## Probar tus cambios

No hay pruebas automatizadas todavía. Antes de abrir un PR, revisa a mano:

- [ ] Vista previa en horizontal y vertical.
- [ ] Modo **Lista** con un CSV de `examples/` y modo **En blanco**.
- [ ] Exportar PDF (Chrome o Edge): tamaño real con escala 100 % y sin hojas en blanco extra.
- [ ] Guardar, cargar y exportar/importar una configuración.
- [ ] La consola del navegador sin errores.

## Enviar un pull request

1. Haz un fork y crea una rama: `git checkout -b feat/diseno-mi-diseno`.
2. Mensajes de commit en español y en formato [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `feat: agrega diseño Mi diseño`, `fix: corrige lectura de CSV UTF-16`.
3. Agrega tu cambio en `CHANGELOG.md`, sección **Sin publicar**.
4. Abre el PR y llena la plantilla. Incluye una captura si cambia algo visual.
