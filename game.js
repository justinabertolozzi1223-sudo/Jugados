// ========== CONFIG ==========
const canvas = document.getElementById('ruleta');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('btnGirar');
const turnoBadge = document.getElementById('turnoBadge');

let girando = false;
let ang = 0;        // ángulo actual
let turno = 'A';    // A | B

// 6 categorías (como las tenías)
const CATEGORIAS = [
  { key: 'com',    label: 'Comunicación',   color: '#4A90E2' }, // azul
  { key: 'obj',    label: 'Objetivo común', color: '#EF4B8B' }, // rosa
  { key: 'res',    label: 'Resolución',     color: '#F6D44B' }, // amarillo
  { key: 'col',    label: 'Colaboración',   color: '#2ECC71' }, // verde
  { key: 'corona', label: 'Corona',         color: '#F39C12' }, // naranja
  { key: 'resp',   label: 'Respina',        color: '#8E44AD' }, // violeta
];

// ========== DIBUJO ==========
function drawWheel() {
  const cx = canvas.width/2;
  const cy = canvas.height/2;
  const r  = (canvas.width/2) - 20;     // margen para borde
  const slice = (2*Math.PI)/CATEGORIAS.length;

  // fondo transparente
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // cada sección
  for (let i=0; i<CATEGORIAS.length; i++){
    const start = ang + i*slice;
    const end   = start + slice;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,start,end,false);
    ctx.closePath();
    ctx.fillStyle = CATEGORIAS[i].color;
    ctx.fill();
  }
}
drawWheel();

// ========== GIRO ==========
btn.addEventListener('click', ()=>{
  if (girando) return;
  girando = true;

  // giro total (al azar) con easing
  const extra = Math.random()*Math.PI*4 + Math.PI*6; // 3–5 vueltas
  const start = ang;
  const end   = ang + extra;

  const dur   = 2200;    // ms
  const t0    = performance.now();

  function animate(t){
    const p = Math.min(1, (t - t0) / dur);       // 0..1
    const ease = 1 - Math.pow(1-p, 3);           // fácil al final
    ang = start + (end - start) * ease;
    drawWheel();
    if (p < 1){
      requestAnimationFrame(animate);
    } else {
      girando = false;
      snappedStop();
    }
  }
  requestAnimationFrame(animate);
});

function snappedStop(){
  // normalizo el ángulo a 0..2π
  const TWO = 2*Math.PI;
  ang = (ang % TWO + TWO) % TWO;
  drawWheel();

  // ¿qué categoría quedó en la flecha?
  // la flecha está ARRIBA, pero nuestra flecha gráfica es un triángulo hacia abajo.
  // Eso significa que el "corte" que señala la flecha es el ÁNGULO = 0 en coordenadas del canvas,
  // así que usamos el ángulo actual para calcular el índice de la porción.
  const slice = TWO / CATEGORIAS.length;

  // el índice es cuántas porciones entran en (TWO - ang)
  // (porque la rueda gira, la flecha está arriba fija)
  const rawIndex = Math.floor(((TWO - ang) % TWO) / slice);
  const idx = (rawIndex + CATEGORIAS.length) % CATEGORIAS.length;

  const cat = CATEGORIAS[idx];

  // Acción según categoría (simple para exponer YA)
  if (cat.key === 'resp'){
    alert(`Respina — Turno ${turno}`);
    return;
  }
  if (cat.key === 'corona'){
    alert(`CORONA — Turno ${turno}`);
    // Aquí iría tu lógica de elegir categoría para la corona
    return;
  }

  alert(`Categoría: ${cat.label} — Turno ${turno}`);

  // Lógica de turnos básica: si querés alternar SOLO cuando falla,
  // dejá esto comentado. Si querés alternar siempre, descomentá:
  // turno = (turno === 'A') ? 'B' : 'A';
  // turnoBadge.textContent = `Equipo ${turno}`;
}
