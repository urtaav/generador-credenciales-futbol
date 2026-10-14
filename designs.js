'use strict';

/*
  Each design is a combination of independent pieces:
  - hp:   header position  (top | bottom | left | right)
  - arr:  body arrangement (fila | espejo | alto | alto-espejo | numtop | numtop-espejo | firmas-lado | firmas-izq)
  - skin: header/card look (solid | gradient | stripes | outline | split | tinted | angled | ticket | corners | double | pill)
  - num:  number badge     (box | circle | filled | shield | plain)
  - bg:   football background pattern, see PATTERNS
*/
const DESIGNS = [
  { id: 'clasico', nombre: 'Clásico', hp: 'top', arr: 'fila', skin: 'solid', num: 'box', bg: 'none', c: ['#0b3d91', '#f2b705'] },
  { id: 'deportivo', nombre: 'Deportivo', hp: 'top', arr: 'espejo', skin: 'angled', num: 'filled', bg: 'red', c: ['#c8102e', '#1c1c1c'] },
  { id: 'minimal', nombre: 'Minimal', hp: 'bottom', arr: 'alto', skin: 'outline', num: 'plain', bg: 'none', c: ['#1f6f4a', '#9bc53d'] },
  { id: 'lateral', nombre: 'Lateral', hp: 'left', arr: 'fila', skin: 'solid', num: 'circle', bg: 'none', c: ['#5b2a86', '#f5c518'] },
  { id: 'boleto', nombre: 'Boleto', hp: 'left', arr: 'alto', skin: 'ticket', num: 'plain', bg: 'none', c: ['#e8590c', '#1b2a4a'] },
  { id: 'escudo', nombre: 'Escudo', hp: 'top', arr: 'numtop', skin: 'split', num: 'shield', bg: 'none', c: ['#7a1f2b', '#d4a017'] },
  { id: 'cancha', nombre: 'Cancha', hp: 'top', arr: 'fila', skin: 'gradient', num: 'box', bg: 'cancha', c: ['#2d7a3a', '#ffffff'] },
  { id: 'estadio', nombre: 'Estadio', hp: 'bottom', arr: 'espejo', skin: 'solid', num: 'circle', bg: 'porteria', c: ['#1d3557', '#e63946'] },
  { id: 'balon', nombre: 'Balón', hp: 'right', arr: 'alto-espejo', skin: 'solid', num: 'filled', bg: 'balon', c: ['#222222', '#f2b705'] },
  { id: 'red', nombre: 'La Red', hp: 'top', arr: 'alto', skin: 'stripes', num: 'box', bg: 'red', c: ['#00509d', '#fdc500'] },
  { id: 'pasto', nombre: 'Pasto', hp: 'left', arr: 'espejo', skin: 'gradient', num: 'plain', bg: 'pasto', c: ['#38761d', '#b6d7a8'] },
  { id: 'pizarra', nombre: 'Pizarra', hp: 'top', arr: 'firmas-lado', skin: 'outline', num: 'circle', bg: 'pizarra', c: ['#264653', '#2a9d8f'] },
  { id: 'hexagono', nombre: 'Hexágono', hp: 'bottom', arr: 'numtop', skin: 'tinted', num: 'shield', bg: 'hex', c: ['#6a040f', '#ffba08'] },
  { id: 'porteria', nombre: 'Portería', hp: 'right', arr: 'fila', skin: 'split', num: 'box', bg: 'porteria', c: ['#003049', '#f77f00'] },
  { id: 'balones', nombre: 'Balones', hp: 'top', arr: 'alto-espejo', skin: 'tinted', num: 'filled', bg: 'balones', c: ['#0077b6', '#90e0ef'] },
  { id: 'capitan', nombre: 'Capitán', hp: 'left', arr: 'numtop', skin: 'angled', num: 'shield', bg: 'none', c: ['#9d0208', '#ffd166'] },
  { id: 'mediocampo', nombre: 'Medio campo', hp: 'bottom', arr: 'fila', skin: 'stripes', num: 'circle', bg: 'cancha', c: ['#14532d', '#facc15'] },
  { id: 'tribuna', nombre: 'Tribuna', hp: 'top', arr: 'espejo', skin: 'split', num: 'plain', bg: 'hex', c: ['#4a4e69', '#c9ada7'] },
  { id: 'penal', nombre: 'Penal', hp: 'right', arr: 'numtop', skin: 'outline', num: 'box', bg: 'balon', c: ['#c1121f', '#003049'] },
  { id: 'tirolibre', nombre: 'Tiro libre', hp: 'top', arr: 'alto-espejo', skin: 'outline', num: 'shield', bg: 'pizarra', c: ['#3a0ca3', '#f72585'] },
  { id: 'derbi', nombre: 'Derbi', hp: 'left', arr: 'alto-espejo', skin: 'stripes', num: 'filled', bg: 'red', c: ['#111111', '#e5383b'] },
  { id: 'nocturno', nombre: 'Nocturno', hp: 'top', arr: 'firmas-lado', skin: 'gradient', num: 'filled', bg: 'balones', c: ['#14213d', '#fca311'] },
  { id: 'mundialista', nombre: 'Mundialista', hp: 'bottom', arr: 'alto-espejo', skin: 'gradient', num: 'circle', bg: 'balon', c: ['#006847', '#ce1126'] },
  { id: 'barrio', nombre: 'Barrio', hp: 'right', arr: 'espejo', skin: 'tinted', num: 'plain', bg: 'pasto', c: ['#bc4749', '#386641'] },
  { id: 'leyenda', nombre: 'Leyenda', hp: 'top', arr: 'numtop', skin: 'solid', num: 'plain', bg: 'cancha', c: ['#000000', '#c5a028'] },
  { id: 'copa', nombre: 'Copa', hp: 'left', arr: 'fila', skin: 'ticket', num: 'box', bg: 'hex', c: ['#b8860b', '#3d2b1f'] },
  { id: 'silbatazo', nombre: 'Silbatazo', hp: 'bottom', arr: 'firmas-lado', skin: 'split', num: 'filled', bg: 'red', c: ['#ff6b00', '#1f1f1f'] },
  { id: 'tiempoextra', nombre: 'Tiempo extra', hp: 'right', arr: 'alto', skin: 'angled', num: 'circle', bg: 'pizarra', c: ['#2b2d42', '#ef233c'] },
  { id: 'final', nombre: 'Final', hp: 'top', arr: 'alto', skin: 'gradient', num: 'shield', bg: 'porteria', c: ['#5a189a', '#ffd60a'] },
  { id: 'amistoso', nombre: 'Amistoso', hp: 'bottom', arr: 'espejo', skin: 'outline', num: 'filled', bg: 'balones', c: ['#0096c7', '#ffb703'] },
  { id: 'trofeo', nombre: 'Trofeo', hp: 'top', arr: 'numtop-espejo', skin: 'pill', num: 'shield', bg: 'trofeo', c: ['#8a6d1d', '#1a1a1a'] },
  { id: 'camiseta', nombre: 'Camiseta', hp: 'top', arr: 'firmas-izq', skin: 'double', num: 'filled', bg: 'camiseta', c: ['#d62828', '#003049'] },
  { id: 'banderin', nombre: 'Banderín', hp: 'bottom', arr: 'numtop-espejo', skin: 'corners', num: 'circle', bg: 'banderin', c: ['#2b9348', '#f9c74f'] },
  { id: 'luces', nombre: 'Luces', hp: 'top', arr: 'fila', skin: 'corners', num: 'box', bg: 'estadio', c: ['#03045e', '#00b4d8'] },
  { id: 'tiroesquina', nombre: 'Tiro de esquina', hp: 'right', arr: 'numtop-espejo', skin: 'double', num: 'plain', bg: 'banderin', c: ['#6d597a', '#e56b6f'] },
  { id: 'campeon', nombre: 'Campeón', hp: 'left', arr: 'alto', skin: 'pill', num: 'filled', bg: 'trofeo', c: ['#7f5539', '#ddb892'] },
  { id: 'dorsal', nombre: 'Dorsal', hp: 'top', arr: 'numtop-espejo', skin: 'gradient', num: 'plain', bg: 'camiseta', c: ['#1b4332', '#95d5b2'] },
  { id: 'cantera', nombre: 'Cantera', hp: 'bottom', arr: 'firmas-izq', skin: 'pill', num: 'box', bg: 'pasto', c: ['#386641', '#a7c957'] },
  { id: 'vintage', nombre: 'Vintage', hp: 'top', arr: 'espejo', skin: 'double', num: 'box', bg: 'hex', c: ['#5e503f', '#c6ac8f'] },
  { id: 'golazo', nombre: 'Golazo', hp: 'right', arr: 'fila', skin: 'corners', num: 'filled', bg: 'red', c: ['#e63946', '#1d3557'] },
  { id: 'aficion', nombre: 'Afición', hp: 'top', arr: 'alto-espejo', skin: 'pill', num: 'circle', bg: 'estadio', c: ['#ff006e', '#3a86ff'] },
  { id: 'liguilla', nombre: 'Liguilla', hp: 'left', arr: 'numtop-espejo', skin: 'split', num: 'filled', bg: 'trofeo', c: ['#240046', '#ff9e00'] },
  { id: 'portero', nombre: 'Portero', hp: 'bottom', arr: 'alto', skin: 'double', num: 'shield', bg: 'porteria', c: ['#f77f00', '#003049'] },
  { id: 'delantero', nombre: 'Delantero', hp: 'top', arr: 'firmas-izq', skin: 'stripes', num: 'circle', bg: 'balones', c: ['#0a9396', '#ee9b00'] },
  { id: 'defensa', nombre: 'Defensa', hp: 'right', arr: 'alto', skin: 'corners', num: 'shield', bg: 'hex', c: ['#343a40', '#adb5bd'] },
  { id: 'volante', nombre: 'Volante', hp: 'left', arr: 'espejo', skin: 'double', num: 'circle', bg: 'pizarra', c: ['#4361ee', '#4cc9f0'] },
  { id: 'arbitro', nombre: 'Árbitro', hp: 'top', arr: 'numtop', skin: 'corners', num: 'plain', bg: 'banderin', c: ['#111111', '#ffd60a'] },
  { id: 'goleador', nombre: 'Goleador', hp: 'bottom', arr: 'numtop-espejo', skin: 'gradient', num: 'filled', bg: 'balon', c: ['#9b2226', '#e9d8a6'] },
  { id: 'titular', nombre: 'Titular', hp: 'top', arr: 'alto', skin: 'pill', num: 'box', bg: 'camiseta', c: ['#005f73', '#94d2bd'] },
  { id: 'campeonato', nombre: 'Campeonato', hp: 'right', arr: 'alto-espejo', skin: 'pill', num: 'shield', bg: 'estadio', c: ['#3c096c', '#e0aaff'] },
];

const PATTERN_NAMES = {
  none: 'Sin fondo',
  cancha: 'Cancha',
  balon: 'Balón',
  balones: 'Balones',
  red: 'Red de portería',
  pasto: 'Pasto',
  pizarra: 'Pizarra táctica',
  porteria: 'Portería',
  hex: 'Hexágonos',
  trofeo: 'Trofeo',
  camiseta: 'Camiseta',
  banderin: 'Banderines de esquina',
  estadio: 'Estadio',
};

// Low opacity so the pattern never competes with the data or pencil lines
const PATTERN_OPACITY = 0.13;

function svgUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function polygonPoints(cx, cy, r, sides, rotation = -90) {
  return Array.from({ length: sides }, (_, i) => {
    const a = (rotation + (360 / sides) * i) * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function ballSvg(color, op) {
  const outer = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + 36 + 72 * i) * Math.PI / 180;
    return `<polygon points="${polygonPoints(50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a), 11, 5, -90 + 36 + 72 * i + 180)}"/>`;
  }).join('');
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + 72 * i) * Math.PI / 180;
    return `<line x1="${50 + 14 * Math.cos(a)}" y1="${50 + 14 * Math.sin(a)}" x2="${50 + 30 * Math.cos(a)}" y2="${50 + 30 * Math.sin(a)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><clipPath id="c"><circle cx="50" cy="50" r="47"/></clipPath></defs>
    <g stroke="${color}" stroke-opacity="${op}" stroke-width="2" fill="none">
      <circle cx="50" cy="50" r="47"/>
      ${spokes}
    </g>
    <g fill="${color}" fill-opacity="${op}" clip-path="url(#c)">
      <polygon points="${polygonPoints(50, 50, 14, 5)}"/>
      ${outer}
    </g>
  </svg>`;
}

function patternStyle(name, color, vertical) {
  const op = PATTERN_OPACITY;
  const stroke = `stroke="${color}" stroke-opacity="${op}" fill="none"`;

  switch (name) {
    case 'cancha': {
      const field = `<g ${stroke} stroke-width="0.8">
        <rect x="2" y="2" width="101" height="64"/>
        <line x1="52.5" y1="2" x2="52.5" y2="66"/>
        <circle cx="52.5" cy="34" r="9.15"/>
        <rect x="2" y="13.84" width="16.5" height="40.32"/>
        <rect x="86.5" y="13.84" width="16.5" height="40.32"/>
        <rect x="2" y="24.84" width="5.5" height="18.32"/>
        <rect x="97.5" y="24.84" width="5.5" height="18.32"/>
        <path d="M18.5 26.7 A9.15 9.15 0 0 1 18.5 41.3"/>
        <path d="M86.5 26.7 A9.15 9.15 0 0 0 86.5 41.3"/>
      </g>
      <circle cx="52.5" cy="34" r="0.9" fill="${color}" fill-opacity="${op}"/>`;
      const svg = vertical
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 105" preserveAspectRatio="none"><g transform="translate(68 0) rotate(90)">${field}</g></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 68" preserveAspectRatio="none">${field}</svg>`;
      return { image: svgUrl(svg), size: '100% 100%', repeat: 'no-repeat', position: 'center' };
    }
    case 'balon':
      return { image: svgUrl(ballSvg(color, op)), size: 'auto 115%', repeat: 'no-repeat', position: 'right -3em bottom -3em' };
    case 'balones': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <g ${stroke} stroke-width="1"><circle cx="10" cy="10" r="6"/><circle cx="30" cy="30" r="6"/></g>
        <g fill="${color}" fill-opacity="${op}">
          <polygon points="${polygonPoints(10, 10, 2.6, 5)}"/>
          <polygon points="${polygonPoints(30, 30, 2.6, 5)}"/>
        </g></svg>`;
      return { image: svgUrl(svg), size: '3.2em 3.2em', repeat: 'repeat', position: '0 0' };
    }
    case 'red': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
        <g ${stroke} stroke-width="0.5"><path d="M0 0L10 10M10 0L0 10"/></g></svg>`;
      return { image: svgUrl(svg), size: '1.1em 1.1em', repeat: 'repeat', position: '0 0' };
    }
    case 'pasto': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10" preserveAspectRatio="none">
        <rect width="10" height="10" fill="${color}" fill-opacity="${op * 0.6}"/></svg>`;
      return vertical
        ? { image: svgUrl(svg.replace('width="10" height="10"', 'width="20" height="5"')), size: '100% 4em', repeat: 'repeat-y', position: '0 0' }
        : { image: svgUrl(svg), size: '4em 100%', repeat: 'repeat-x', position: '0 0' };
    }
    case 'pizarra': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
        <g ${stroke} stroke-width="1.6" stroke-linecap="round">
          <circle cx="18" cy="18" r="4"/><circle cx="22" cy="44" r="4"/><circle cx="48" cy="30" r="4"/>
          <path d="M64 12l6 6M70 12l-6 6M78 38l6 6M84 38l-6 6M60 46l6 6M66 46l-6 6"/>
          <path d="M22 18 C40 4 60 8 72 26" stroke-dasharray="3 3"/>
          <path d="M68 22l4 4 1-6"/>
          <path d="M26 44 C40 54 56 50 76 42" stroke-dasharray="3 3"/>
        </g></svg>`;
      return { image: svgUrl(svg), size: vertical ? '100% auto' : 'auto 100%', repeat: 'no-repeat', position: 'center' };
    }
    case 'porteria': {
      const net = Array.from({ length: 11 }, (_, i) => `<line x1="${15 + i * 7}" y1="8" x2="${15 + i * 7}" y2="40"/>`).join('') +
        Array.from({ length: 5 }, (_, i) => `<line x1="15" y1="${8 + i * 8}" x2="85" y2="${8 + i * 8}"/>`).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
        <g ${stroke} stroke-width="0.6">${net}</g>
        <g ${stroke} stroke-width="2.4"><path d="M12 40V5H88V40"/></g></svg>`;
      return { image: svgUrl(svg), size: '95% auto', repeat: 'no-repeat', position: 'center bottom' };
    }
    case 'hex': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 52">
        <g ${stroke} stroke-width="1">
          <path d="M15 0l15 8.66v17.32L15 34.64 0 25.98V8.66z"/>
          <path d="M15 34.64V52M0 25.98l-15 8.66M30 25.98l15 8.66"/>
        </g></svg>`;
      return { image: svgUrl(svg), size: '2.2em auto', repeat: 'repeat', position: '0 0' };
    }
    case 'trofeo': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80">
        <g ${stroke} stroke-width="2" stroke-linejoin="round">
          <path d="M14 6h32v14c0 12-7 21-16 21S14 32 14 20z"/>
          <path d="M14 11H5c0 11 5 16 11 17M46 11h9c0 11-5 16-11 17"/>
          <path d="M30 41v12M22 53h16v6H22zM16 59h28v8H16z"/>
        </g>
        <path d="M30 13l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="${color}" fill-opacity="${op}"/>
      </svg>`;
      return { image: svgUrl(svg), size: 'auto 88%', repeat: 'no-repeat', position: 'right 1em center' };
    }
    case 'camiseta': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90">
        <g ${stroke} stroke-width="2" stroke-linejoin="round">
          <path d="M36 4c3 6 8 9 14 9s11-3 14-9l22 10 12 22-16 8-6-10v52H24V34l-6 10-16-8 12-22z"/>
          <path d="M36 4c2 9 8 14 14 14s12-5 14-14"/>
        </g>
      </svg>`;
      return { image: svgUrl(svg), size: 'auto 90%', repeat: 'no-repeat', position: 'center' };
    }
    case 'banderin': {
      // Corner arc + flag in each corner of the card
      const flag = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">
        <path d="M0 14A14 14 0 0 0 14 0" ${stroke} stroke-width="1"/>
        <path d="M5 5V20" ${stroke} stroke-width="1.2"/>
        <path d="M5 20l10-3.5L5 13z" fill="${color}" fill-opacity="${op}"/></g>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 64" preserveAspectRatio="none">
        ${flag(0, 0, 1, 1)}${flag(100, 0, -1, 1)}${flag(0, 64, 1, -1)}${flag(100, 64, -1, -1)}
      </svg>`;
      return { image: svgUrl(svg), size: '100% 100%', repeat: 'no-repeat', position: 'center' };
    }
    case 'estadio': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
        <g ${stroke} stroke-width="1.2">
          <path d="M4 58C20 34 100 34 116 58M14 58C28 42 92 42 106 58M26 58C38 48 82 48 94 58"/>
          <path d="M10 46V6M110 46V6"/>
          <rect x="4" y="2" width="12" height="6" rx="1"/><rect x="104" y="2" width="12" height="6" rx="1"/>
          <path d="M6 10l-4 6M10 10v7M14 10l4 6M106 10l-4 6M110 10v7M114 10l4 6" stroke-dasharray="1.5 1.5"/>
        </g></svg>`;
      return { image: svgUrl(svg), size: '100% auto', repeat: 'no-repeat', position: 'center bottom' };
    }
    default:
      return null;
  }
}
