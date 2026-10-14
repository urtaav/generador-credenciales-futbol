'use strict';

const PX_PER_MM = 96 / 25.4;
const SHEET_MARGIN = 8; // mm, safe for most home printers
const CARD_GAP = 4;     // mm between cards so scissors have room

const PAGES = {
  carta: { w: 215.9, h: 279.4 },
  oficio: { w: 215.9, h: 340 },
  a4: { w: 210, h: 297 },
};

const INE = { long: 85.6, short: 54 }; // ISO/IEC 7810 ID-1

const STORAGE_CONFIGS = 'credenciales.configs.v1';
const STORAGE_CURRENT = 'credenciales.actual.v1';
const STORAGE_FIRMAS = 'credenciales.firmas.v1';

// Player data stays out of saved configs so options can be compared with the same list
const DATA_FIELDS = ['modo', 'equipo', 'lista', 'blancos'];
const FIELDS = [
  'liga', 'anio', 'temporada', 'presidente', 'vicepresidente',
  'orientacion', 'diseno', 'color1', 'color2', 'fondo',
  'tamano', 'ancho', 'alto', 'hoja', 'porHoja', 'corte',
  ...DATA_FIELDS,
];
const CONFIG_FIELDS = FIELDS.filter(f => !DATA_FIELDS.includes(f));

const form = document.getElementById('form');
const tplCard = document.getElementById('tpl-card');
const muestra = document.getElementById('muestra');
const hojas = document.getElementById('hojas');
const hojasTitulo = document.getElementById('hojas-titulo');
const muestraTitulo = document.getElementById('muestra-titulo');
const layoutInfo = document.getElementById('layout-info');
const listaInfo = document.getElementById('lista-info');
const configInfo = document.getElementById('config-info');
const configLista = document.getElementById('config-lista');
const pageStyle = document.getElementById('page-style');

const firmas = { presidente: null, vicepresidente: null };
let activeConfigId = null;

// ---------- Storage ----------

function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---------- Settings ----------

function clampNum(value, min, max, fallback) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function findDesign(id) {
  return DESIGNS.find(d => d.id === id) || DESIGNS[0];
}

function readSettings() {
  const f = form.elements;
  const vertical = f.orientacion.value === 'v';
  const long = f.tamano.value === 'ine' ? INE.long : clampNum(f.ancho.value, 40, 200, INE.long);
  const short = f.tamano.value === 'ine' ? INE.short : clampNum(f.alto.value, 25, 150, INE.short);
  const design = findDesign(f.diseno.value);

  return {
    liga: f.liga.value.trim(),
    anio: f.anio.value.trim(),
    temporada: f.temporada.value,
    modo: f.modo.value,
    equipo: f.equipo.value.trim(),
    lista: f.lista.value,
    blancos: Math.round(clampNum(f.blancos.value, 1, 500, 10)),
    presidente: f.presidente.value.trim(),
    vicepresidente: f.vicepresidente.value.trim(),
    design,
    vertical,
    color1: f.color1.value,
    color2: f.color2.value,
    fondo: f.fondo.value === 'auto' ? design.bg : f.fondo.value,
    card: vertical ? { w: short, h: long } : { w: long, h: short },
    page: PAGES[f.hoja.value] || PAGES.carta,
    porHoja: parseInt(f.porHoja.value, 10),
    corte: f.corte.checked,
  };
}

function getFormValues(fields) {
  const out = {};
  for (const name of fields) {
    const el = form.elements[name];
    if (!el) continue;
    out[name] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return out;
}

function setFormValues(values) {
  for (const name of FIELDS) {
    if (!(name in values)) continue;
    const el = form.elements[name];
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = Boolean(values[name]);
    else el.value = String(values[name]);
  }
  if (!DESIGNS.some(d => d.id === form.elements.diseno.value)) form.elements.diseno.value = DESIGNS[0].id;
}

function computeLayout(page, card) {
  const usableW = page.w - SHEET_MARGIN * 2;
  const usableH = page.h - SHEET_MARGIN * 2;
  const cols = Math.floor((usableW + CARD_GAP) / (card.w + CARD_GAP));
  const rows = Math.floor((usableH + CARD_GAP) / (card.h + CARD_GAP));
  return { cols, rows, max: Math.max(0, cols * rows) };
}

function layoutKey(s) {
  return `${s.page.w}x${s.page.h}|${s.card.w}x${s.card.h}`;
}

// ---------- Player data ----------

function parseLine(line) {
  const parts = line.split(/\t|;|,/).map(s => s.trim());
  return { nombre: parts[0] || '', numero: parts[1] || '', equipo: parts[2] || '' };
}

function parsePlayers(text, defaultTeam) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(parseLine)
    .map(p => ({ ...p, equipo: p.equipo || defaultTeam }));
}

// Excel on Spanish Windows saves "CSV" as windows-1252 and "Texto Unicode" as UTF-16,
// so File.text() (always UTF-8) would mangle accents or the whole file
async function readTextFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0xFF && buf[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
  if (buf[0] === 0xFE && buf[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

// Minimal CSV parser: handles quoted fields; delimiter is guessed from the first line
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = (text.split(/\r?\n/, 1)[0] || '').replace(/"[^"]*"/g, '');
  const delim = ['\t', ';', ',', '|'].reduce(
    (best, d) => firstLine.split(d).length > firstLine.split(best).length ? d : best, ',');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delim) {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row);
      row = []; field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  return rows
    .map(r => r.map(c => c.trim()))
    .filter(r => r.some(Boolean));
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function csvToPlayers(rows) {
  if (!rows.length) return [];

  // Default column order when there is no header: nombre, numero, equipo
  let idx = { nombre: 0, numero: 1, equipo: 2 };
  const header = rows[0].map(normalize);
  const find = re => header.findIndex(h => re.test(h));
  const equipo = find(/equipo|club/);
  const numero = find(/numero|dorsal|^no\.?$|^#$/);
  const nombre = header.findIndex((h, i) => i !== equipo && /nombre|jugador/.test(h));
  // Lists often split "Apellido paterno" / "Apellido materno" into their own columns
  const apellidos = header.map((h, i) => /apellido/.test(h) ? i : -1).filter(i => i >= 0);

  if (nombre !== -1) {
    idx = { nombre, numero, equipo };
    rows = rows.slice(1);
  }

  const get = (r, i) => (i >= 0 && r[i]) || '';
  return rows.map(r => ({
    nombre: [get(r, idx.nombre), ...apellidos.map(i => get(r, i))].filter(Boolean).join(' '),
    numero: get(r, idx.numero),
    equipo: get(r, idx.equipo),
  }));
}

function playersToText(players) {
  // Commas inside a name would break the line format, so swap them out
  const clean = s => s.replace(/[,;\t]/g, ' ').trim();
  return players
    .filter(p => p.nombre)
    .map(p => [clean(p.nombre), clean(p.numero), clean(p.equipo)].join(', ').replace(/(, )+$/, ''))
    .join('\n');
}

// ---------- Rendering ----------

// Dark text on light header colors so the league name stays readable
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? '#1a1a1a' : '#ffffff';
}

function buildCard(s, player) {
  const d = s.design;
  const card = tplCard.content.firstElementChild.cloneNode(true);
  card.classList.add(`hp-${d.hp}`, `arr-${d.arr}`, `skin-${d.skin}`, `num-${d.num}`);
  if (s.vertical) card.classList.add('ori-v');

  card.style.width = `${s.card.w}mm`;
  card.style.height = `${s.card.h}mm`;
  // Everything inside is sized in em, so the card scales with its short side
  card.style.fontSize = `${Math.min(s.card.w, s.card.h) / 18}mm`;
  card.style.setProperty('--c1', s.color1);
  card.style.setProperty('--c2', s.color2);
  card.style.setProperty('--on-c1', readableOn(s.color1));

  const pattern = patternStyle(s.fondo, s.color1, s.vertical);
  if (pattern) {
    const bg = card.querySelector('.bg');
    bg.style.backgroundImage = pattern.image;
    bg.style.backgroundSize = pattern.size;
    bg.style.backgroundRepeat = pattern.repeat;
    bg.style.backgroundPosition = pattern.position;
  }

  const set = (sel, text) => { card.querySelector(sel).textContent = text; };
  set('.liga', s.liga || 'Liga de Fútbol');
  set('.anio', s.anio || '  ');
  set('.temp', s.temporada);
  set('.nombre', player.nombre || '');
  set('.equipo', player.equipo || '');
  set('.numero', player.numero || '');

  for (const rol of ['presidente', 'vicepresidente']) {
    const box = card.querySelector(`.sign[data-rol="${rol}"]`);
    box.querySelector('.sig-name').textContent = s[rol];
    if (firmas[rol]) {
      const img = document.createElement('img');
      img.src = firmas[rol];
      img.alt = '';
      box.querySelector('.sig-img').append(img);
    }
  }
  return card;
}

function render() {
  const s = readSettings();
  const layout = computeLayout(s.page, s.card);

  const porHojaInput = form.elements.porHoja;
  porHojaInput.max = layout.max || 1;
  let porHoja = Number.isNaN(s.porHoja) ? layout.max : s.porHoja;
  porHoja = Math.min(Math.max(1, porHoja), layout.max);

  // Page size for print: margins are handled by the sheet padding
  pageStyle.textContent = `@page { size: ${s.page.w}mm ${s.page.h}mm; margin: 0; }`;

  const players = s.modo === 'blanco'
    ? Array.from({ length: s.blancos }, () => ({}))
    : parsePlayers(s.lista, s.equipo);

  listaInfo.textContent = s.modo === 'lista' && players.length
    ? `${players.length} jugador${players.length === 1 ? '' : 'es'}`
    : '';

  muestraTitulo.textContent = `Vista previa — ${s.design.nombre}`;
  muestra.replaceChildren(buildCard(s, players[0] || { equipo: s.equipo }));
  fitMuestra(s.card);

  hojas.replaceChildren();

  if (layout.max === 0) {
    layoutInfo.textContent = 'La credencial no cabe en esta hoja. Reduce el tamaño o cambia de hoja.';
    layoutInfo.classList.add('error');
    hojasTitulo.textContent = 'Hojas';
    return;
  }
  layoutInfo.classList.remove('error');

  const total = players.length;
  const nHojas = Math.ceil(total / porHoja);
  layoutInfo.textContent =
    `Caben hasta ${layout.max} por hoja (${layout.cols} × ${layout.rows}). ` +
    (total ? `${total} credencial${total === 1 ? '' : 'es'} en ${nHojas} hoja${nHojas === 1 ? '' : 's'}.` : '');
  hojasTitulo.textContent = total ? `Hojas (${nHojas})` : 'Hojas — agrega jugadores para verlas';

  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i += porHoja) {
    const sheet = document.createElement('div');
    sheet.className = 'sheet' + (s.corte ? ' cut' : '');
    sheet.style.width = `${s.page.w}mm`;
    // A hair shorter than the page so rounding never spills a blank page
    sheet.style.height = `${s.page.h - 0.5}mm`;
    sheet.style.padding = `${SHEET_MARGIN}mm`;
    sheet.style.gap = `${CARD_GAP}mm`;
    sheet.style.gridTemplateColumns = `repeat(${layout.cols}, ${s.card.w}mm)`;
    for (const p of players.slice(i, i + porHoja)) sheet.append(buildCard(s, p));
    frag.append(sheet);
  }
  hojas.append(frag);
  fitSheets(s.page);
}

function fitMuestra(card) {
  const available = muestra.clientWidth - 48;
  const byWidth = available / (card.w * PX_PER_MM);
  const byHeight = 480 / (card.h * PX_PER_MM);
  const zoom = Math.min(2.4, byWidth, byHeight);
  muestra.firstElementChild.style.zoom = Math.max(0.5, zoom);
}

function fitSheets(page) {
  const zoom = Math.min(0.8, hojas.clientWidth / (page.w * PX_PER_MM));
  hojas.style.setProperty('--zoom', zoom.toFixed(3));
}

// Thumbnails always use each design's own colors and pattern
function renderDesignPicker() {
  const vertical = form.elements.orientacion?.value === 'v';
  const current = form.elements.diseno?.value || DESIGNS[0].id;
  const sample = { nombre: 'Jugador', equipo: 'Equipo', numero: '10' };
  const container = document.getElementById('designs');

  container.replaceChildren(...DESIGNS.map(d => {
    const label = document.createElement('label');
    label.className = 'design-opt';
    label.title = `${d.nombre} · fondo: ${PATTERN_NAMES[d.bg]}`;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'diseno';
    input.value = d.id;
    input.checked = d.id === current;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const card = vertical ? { w: INE.short, h: INE.long } : { w: INE.long, h: INE.short };
    thumb.append(buildCard({
      liga: 'Liga', anio: '2026', temporada: 'A', presidente: '', vicepresidente: '',
      design: d, vertical, color1: d.c[0], color2: d.c[1], fondo: d.bg, card,
    }, sample));
    if (vertical) thumb.querySelector('.card').style.zoom = '.19';

    const name = document.createElement('span');
    name.textContent = d.nombre;

    label.dataset.bg = d.bg;
    label.append(input, thumb, name);
    return label;
  }));
  filterDesigns();
}

function filterDesigns() {
  const bg = document.getElementById('filtro-fondo').value;
  for (const label of document.querySelectorAll('#designs .design-opt')) {
    label.hidden = bg !== 'todos' && label.dataset.bg !== bg;
  }
}

function renderFondoOptions() {
  const entries = Object.entries(PATTERN_NAMES);
  const toOptions = list => list.map(([value, text]) => new Option(text, value));
  document.getElementById('fondo').replaceChildren(...toOptions([['auto', 'Del diseño'], ...entries]));
  document.getElementById('filtro-fondo').replaceChildren(...toOptions([['todos', `Todos (${DESIGNS.length})`], ...entries]));
}

// ---------- Signatures ----------

// Downscale so several saved configs still fit in localStorage
function loadSignature(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 600 / img.width, 240 / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagen inválida')); };
    img.src = url;
  });
}

function updateFirmaUI() {
  for (const rol of Object.keys(firmas)) {
    const box = document.querySelector(`.firma[data-rol="${rol}"]`);
    const img = box.querySelector('.firma-drop img');
    if (firmas[rol]) img.src = firmas[rol];
    else img.removeAttribute('src');
    img.hidden = !firmas[rol];
    box.querySelector('[data-quitar]').hidden = !firmas[rol];
  }
}

async function setFirmaFromFile(rol, file) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    firmas[rol] = await loadSignature(file);
    updateFirmaUI();
    changed();
  } catch {
    configInfo.textContent = 'No se pudo leer la imagen de la firma.';
    configInfo.className = 'hint error';
  }
}

function isImageDataUrl(v) {
  return typeof v === 'string' && v.startsWith('data:image/');
}

// ---------- Saved configs ----------

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/*
  Signature images are the heavy part of a config, and most configs reuse the
  same two signatures. They live once in a shared pool keyed by a content hash;
  configs only keep the key.
*/
function getPool() {
  const pool = storageGet(STORAGE_FIRMAS, {});
  return pool && typeof pool === 'object' ? pool : {};
}

function firmaKey(dataUrl) {
  let h = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < dataUrl.length; i++) {
    h ^= dataUrl.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `f${(h >>> 0).toString(36)}${dataUrl.length.toString(36)}`;
}

function poolFirmas(images, pool) {
  const refs = {};
  for (const rol of Object.keys(firmas)) {
    const img = images?.[rol];
    if (isImageDataUrl(img)) {
      refs[rol] = firmaKey(img);
      pool[refs[rol]] = img;
    } else {
      refs[rol] = null;
    }
  }
  return refs;
}

function resolveFirmas(refs, pool) {
  const out = {};
  for (const rol of Object.keys(firmas)) {
    const v = refs?.[rol];
    // Configs saved before the pool existed still carry the image inline
    out[rol] = isImageDataUrl(v) ? v : (isImageDataUrl(pool[v]) ? pool[v] : null);
  }
  return out;
}

function getConfigs() {
  const list = storageGet(STORAGE_CONFIGS, []);
  if (!Array.isArray(list)) return [];

  // One-time migration of inline signatures into the pool
  if (list.some(c => Object.values(c.firmas || {}).some(isImageDataUrl))) {
    const pool = getPool();
    for (const c of list) c.firmas = poolFirmas(resolveFirmas(c.firmas, pool), pool);
    setConfigs(list, pool);
  }
  return list;
}

function setConfigs(list, pool = getPool()) {
  // Write the pool first so the list never points at a missing image
  if (storageSet(STORAGE_FIRMAS, pool) && storageSet(STORAGE_CONFIGS, list)) {
    const used = new Set(list.flatMap(c => Object.values(c.firmas || {})));
    storageSet(STORAGE_FIRMAS, Object.fromEntries(Object.entries(pool).filter(([k]) => used.has(k))));
    return true;
  }
  configInfo.textContent = 'No hay espacio en el navegador. Borra configuraciones o exporta y limpia.';
  configInfo.className = 'hint error';
  return false;
}

function updateUsage(count) {
  let chars = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('credenciales.')) chars += k.length + (localStorage.getItem(k) || '').length;
    }
  } catch { /* storage unavailable */ }
  document.getElementById('config-uso').textContent =
    `${count} configuraci${count === 1 ? 'ón' : 'ones'} · espacio usado ${(chars / 1048576).toFixed(2)} MB de ~5 MB`;
}

function snapshotConfig(nombre, id, pool) {
  return {
    id: id || newId(),
    nombre,
    fecha: new Date().toISOString(),
    settings: getFormValues(CONFIG_FIELDS),
    firmas: poolFirmas(firmas, pool),
  };
}

function applyConfig(cfg) {
  const settings = {};
  for (const k of CONFIG_FIELDS) if (cfg.settings && k in cfg.settings) settings[k] = cfg.settings[k];
  setFormValues(settings);
  Object.assign(firmas, resolveFirmas(cfg.firmas, getPool()));
  activeConfigId = cfg.id;
  syncVisibility();
  renderDesignPicker();
  updateFirmaUI();
  lastLayoutKey = layoutKey(readSettings());
  changed();
}

function renderConfigList() {
  const list = getConfigs();
  configLista.replaceChildren(...list.map(cfg => {
    const li = document.createElement('li');
    if (cfg.id === activeConfigId) li.classList.add('active');

    const name = document.createElement('span');
    name.className = 'config-name';
    name.textContent = cfg.nombre;
    const date = document.createElement('span');
    date.className = 'config-date';
    date.textContent = `${findDesign(cfg.settings?.diseno).nombre} · ${new Date(cfg.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`;
    name.append(date);

    const actions = document.createElement('div');
    actions.className = 'config-actions';
    const btn = (text, action, cls = '') => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.dataset.action = action;
      b.dataset.id = cfg.id;
      if (cls) b.className = cls;
      return b;
    };
    actions.append(
      btn('Cargar', 'cargar'),
      btn('Actualizar', 'actualizar'),
      btn('Borrar', 'borrar', 'danger'),
    );

    li.append(name, actions);
    return li;
  }));
  updateUsage(list.length);
}

function flash(text, cls = 'ok') {
  configInfo.textContent = text;
  configInfo.className = `hint ${cls}`;
}

configLista.addEventListener('click', e => {
  const b = e.target.closest('button[data-action]');
  if (!b) return;
  const list = getConfigs();
  const i = list.findIndex(c => c.id === b.dataset.id);
  if (i === -1) return;
  const cfg = list[i];

  if (b.dataset.action === 'cargar') {
    applyConfig(cfg);
    flash(`Cargada: ${cfg.nombre}`);
  } else if (b.dataset.action === 'actualizar') {
    if (!confirm(`¿Reemplazar "${cfg.nombre}" con lo que tienes ahora?`)) return;
    const pool = getPool();
    list[i] = snapshotConfig(cfg.nombre, cfg.id, pool);
    if (setConfigs(list, pool)) { activeConfigId = cfg.id; flash(`Actualizada: ${cfg.nombre}`); }
  } else if (b.dataset.action === 'borrar') {
    if (!confirm(`¿Borrar "${cfg.nombre}"? No se puede deshacer.`)) return;
    list.splice(i, 1);
    if (setConfigs(list)) {
      if (activeConfigId === cfg.id) activeConfigId = null;
      flash(`Borrada: ${cfg.nombre}`);
    }
  }
  renderConfigList();
});

document.getElementById('config-guardar').addEventListener('click', () => {
  const input = document.getElementById('config-nombre');
  const nombre = input.value.trim() || `Opción ${getConfigs().length + 1}`;
  const list = getConfigs();
  const pool = getPool();
  const cfg = snapshotConfig(nombre, null, pool);
  list.push(cfg);
  if (setConfigs(list, pool)) {
    activeConfigId = cfg.id;
    input.value = '';
    flash(`Guardada: ${nombre}`);
    renderConfigList();
  }
});

document.getElementById('config-exportar').addEventListener('click', () => {
  const list = getConfigs();
  if (!list.length) { flash('No hay configuraciones guardadas para exportar.', 'error'); return; }
  // Inline the signatures so the file is self-contained
  const pool = getPool();
  const configs = list.map(c => ({ ...c, firmas: resolveFirmas(c.firmas, pool) }));
  const blob = new Blob([JSON.stringify({ version: 1, configs }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `credenciales-configuraciones-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('config-importar').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incoming = Array.isArray(data?.configs) ? data.configs : [];
    const pool = getPool();
    // Only keep known fields; the file could come from anywhere
    const clean = incoming
      .filter(c => c && typeof c.nombre === 'string' && c.settings && typeof c.settings === 'object')
      .map(c => {
        const settings = {};
        for (const k of CONFIG_FIELDS) {
          const v = c.settings[k];
          if (typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number') settings[k] = v;
        }
        return {
          id: newId(),
          nombre: c.nombre.slice(0, 40),
          fecha: typeof c.fecha === 'string' ? c.fecha : new Date().toISOString(),
          settings,
          firmas: poolFirmas(c.firmas, pool),
        };
      });
    if (!clean.length) throw new Error('sin configuraciones');
    if (setConfigs([...getConfigs(), ...clean], pool)) {
      flash(`Importadas ${clean.length} configuraci${clean.length === 1 ? 'ón' : 'ones'}.`);
      renderConfigList();
    }
  } catch {
    flash('El archivo no es una exportación válida de configuraciones.', 'error');
  }
});

// ---------- UI wiring ----------

function syncVisibility() {
  const f = form.elements;
  document.querySelector('.modo-lista').hidden = f.modo.value !== 'lista';
  document.querySelector('.modo-blanco').hidden = f.modo.value !== 'blanco';
  document.querySelector('.tamano-custom').hidden = f.tamano.value !== 'custom';
}

function applyDesignDefaults() {
  const d = findDesign(form.elements.diseno.value);
  form.elements.color1.value = d.c[0];
  form.elements.color2.value = d.c[1];
  form.elements.fondo.value = 'auto';
}

// Keep the working state so a reload doesn't lose anything
function saveCurrent() {
  storageSet(STORAGE_CURRENT, { settings: getFormValues(FIELDS), firmas: { ...firmas } });
}

function changed() {
  render();
  saveCurrent();
  renderConfigList();
}

let lastLayoutKey = '';

form.addEventListener('input', e => {
  const name = e.target.name;
  if (e.target.type === 'file') return;
  if (e.target.id === 'filtro-fondo') { filterDesigns(); return; }
  if (name === 'diseno') applyDesignDefaults();
  if (name === 'modo' || name === 'tamano') syncVisibility();
  if (name === 'orientacion') renderDesignPicker();

  // When the page or card size changes, jump "por hoja" to the new maximum
  const s = readSettings();
  const key = layoutKey(s);
  if (key !== lastLayoutKey) {
    lastLayoutKey = key;
    form.elements.porHoja.value = computeLayout(s.page, s.card).max;
  }
  changed();
});

document.getElementById('reset-colores').addEventListener('click', () => {
  applyDesignDefaults();
  changed();
});

document.getElementById('csv').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const players = csvToPlayers(parseCSV(await readTextFile(file)));
    if (!players.length) throw new Error('vacío');
    form.elements.lista.value = playersToText(players);
    changed();
  } catch {
    listaInfo.textContent = 'No se pudo leer el CSV. Revisa que tenga columnas nombre, numero, equipo.';
  }
});

document.getElementById('csv-ejemplo').addEventListener('click', () => {
  const csv = 'nombre,numero,equipo\nJuan Pérez López,10,Deportivo San Juan\nCarlos Ramírez,7,Deportivo San Juan\nLuis Hernández,1,Atlético Norte\n';
  // BOM so Excel opens the accents correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jugadores-ejemplo.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.querySelectorAll('.firma').forEach(box => {
  const rol = box.dataset.rol;
  const drop = box.querySelector('.firma-drop');
  const input = box.querySelector('[data-firma]');

  input.addEventListener('change', () => {
    const file = input.files[0];
    input.value = '';
    setFirmaFromFile(rol, file);
  });

  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag');
    setFirmaFromFile(rol, e.dataTransfer.files[0]);
  });

  box.querySelector('[data-quitar]').addEventListener('click', () => {
    firmas[rol] = null;
    updateFirmaUI();
    changed();
  });
});

document.getElementById('imprimir').addEventListener('click', () => {
  if (!hojas.children.length) {
    layoutInfo.textContent = 'No hay credenciales para exportar.';
    layoutInfo.classList.add('error');
    return;
  }

  // The print dialog suggests document.title as the PDF file name
  const original = document.title;
  document.title = pdfFileName(readSettings());
  window.addEventListener('afterprint', () => { document.title = original; }, { once: true });
  window.print();
});

function slug(text) {
  return normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function pdfFileName(s) {
  const parts = ['Credenciales', slug(s.liga || 'liga'), slug(s.design.nombre)];
  if (s.modo === 'lista') {
    const equipos = new Set(parsePlayers(s.lista, s.equipo).map(p => p.equipo).filter(Boolean));
    if (equipos.size === 1) parts.push(slug([...equipos][0]));
  } else {
    parts.push('en-blanco');
  }
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  parts.push(`${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`);
  return parts.filter(Boolean).join('_');
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 120);
});

// ---------- Init ----------

function init() {
  renderFondoOptions();
  renderDesignPicker();
  form.elements.anio.value = new Date().getFullYear();
  applyDesignDefaults();

  const saved = storageGet(STORAGE_CURRENT, null);
  if (saved?.settings) {
    setFormValues(saved.settings);
    for (const rol of Object.keys(firmas)) {
      firmas[rol] = isImageDataUrl(saved.firmas?.[rol]) ? saved.firmas[rol] : null;
    }
    renderDesignPicker();
  }

  syncVisibility();
  updateFirmaUI();
  const s = readSettings();
  lastLayoutKey = layoutKey(s);
  if (!saved?.settings) form.elements.porHoja.value = computeLayout(s.page, s.card).max;
  changed();
}

init();
