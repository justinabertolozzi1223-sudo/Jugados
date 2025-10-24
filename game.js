/* ==========================
   CONFIG BÁSICA / ESTADO
   ========================== */

const canvas = document.getElementById('wheel');
const ctx     = canvas.getContext('2d');
const btnSpin = document.getElementById('btnSpin');
const toast   = document.getElementById('toast');
const badge   = document.getElementById('badge-turno');

// Modal
const modal   = document.getElementById('modal');
const cardCatDot   = document.getElementById('cardCatDot');
const cardCatName  = document.getElementById('cardCatName');
const cardTurno    = document.getElementById('cardTurno');
const cardTimer    = document.getElementById('cardTimer');
const cardQuestion = document.getElementById('cardQuestion');
const cardOptions  = document.getElementById('cardOptions');
const btnCerrar    = document.getElementById('btnCerrar');

// Progreso UI
const trackMap = {
  A: {
    com: document.getElementById('a-com'),
    col: document.getElementById('a-col'),
    res: document.getElementById('a-res'),
    obj: document.getElementById('a-obj'),
    icons: {
      com: document.getElementById('a-com-icons'),
      col: document.getElementById('a-col-icons'),
      res: document.getElementById('a-res-icons'),
      obj: document.getElementById('a-obj-icons'),
    }
  },
  B: {
    com: document.getElementById('b-com'),
    col: document.getElementById('b-col'),
    res: document.getElementById('b-res'),
    obj: document.getElementById('b-obj'),
    icons: {
      com: document.getElementById('b-com-icons'),
      col: document.getElementById('b-col-icons'),
      res: document.getElementById('b-res-icons'),
      obj: document.getElementById('b-obj-icons'),
    }
  }
};

// Segmentos SIN DUELO
const SEGMENTS = [
  { key: 'com',     label: 'Comunicación',   color: getCss('--com')     },
  { key: 'obj',     label: 'Objetivo común', color: getCss('--obj')     },
  { key: 'res',     label: 'Resolución',     color: getCss('--res')     },
  { key: 'col',     label: 'Colaboración',   color: getCss('--col')     },
  { key: 'corona',  label: 'Corona',         color: getCss('--corona')  },
  { key: 'respina', label: 'Reintenta',      color: getCss('--re')      }
];

const CENTER = { x: canvas.width/2, y: canvas.height/2, r: canvas.width/2 - 20 };

let angle = 0;            // ángulo actual (rad)
let spinning = false;
let currentTeam = 'A';    // A o B
let timerId = null;

const progress = {
  A: { com:0, col:0, res:0, obj:0, crowns:[] },
  B: { com:0, col:0, res:0, obj:0, crowns:[] }
};

// Control para no repetir categoría a lo loco
const recentCats = [];     // últimos 3 keys
const maxRecent  = 3;

// Preguntas (15 por categoría). Sumá/edita las tuyas si querés.
const QA = {
  com: [
    { q: 'Si el receptor no la encuentra, es que no sirve. ¿Qué es?', a: ['La intención','La idea','La gramática','El volumen'], ok:0 },
    { q: 'Cuanto más la escuchás, más crece. ¿Qué es?', a: ['La voz','El rumor','La opinión','La música'], ok:2 },
    { q: 'Vive en la pausa y muere en la interrupción. ¿Qué es?', a: ['La escucha activa','El tiempo','El error','El silencio incómodo'], ok:0 },
    { q: 'Si se dobla, se entiende. Si se rompe, se ofende. ¿Qué es?', a: ['Una promesa','Una regla','El mensaje','El documento'], ok:2 },
    { q: 'Todos la dan, pero pocos la piden. ¿Qué es?', a: ['Una orden','La retroalimentación (feedback)','Una opinión','El consejo'], ok:1 },
    { q: 'Cuanto más claro es el canal, más... ¿qué?', a: ['Ruido','Contexto','Ruido útil','Se entiende'], ok:3 },
    { q: 'El mejor mensaje es aquel que... ¿qué hace?', a: ['Sorprende','Se recuerda','Se comparte','Llega'], ok:3 },
    { q: '¿Qué muere con la ambigüedad?', a: ['El humor','El acuerdo','El mensaje','La escucha'], ok:2 },
    { q: 'Si no hay feedback, no hay...', a: ['Mejora','Conversación','Acuerdo','Canal'], ok:0 },
    { q: 'El ruido es al mensaje lo que...', a: ['Nubes al sol','Freno al auto','Polvo al vidrio','Todo lo anterior'], ok:3 },
    { q: 'En una reunión, hablar claro es...', a: ['Explicar mucho','Ser directo','Usar jergas','Hablar alto'], ok:1 },
    { q: '¿Cuál mejora la comprensión?', a: ['Acrónimos','Ejemplos','Anglicismos','Ironía'], ok:1 },
    { q: 'La escucha activa incluye...', a: ['Asentir','Interrumpir','Mirar el celular','Opinar rápido'], ok:0 },
    { q: '¿Qué hace el contexto?', a: ['Agrega ruido','Aclara el mensaje','Lo empeora','Nada'], ok:1 },
    { q: 'El mejor canal para una aclaración urgente es...', a: ['Email','Chat lento','Cara a cara o llamada','Documento'], ok:2 }
  ],
  col: [
    { q:'Es un músculo que se atrofia con el control excesivo. ¿Qué es?', a:['La paciencia','La autonomía','La fuerza','La disciplina'], ok:1 },
    { q:'Si el mapa no funciona, ¿quién es el error?', a:['La ruta','El líder','El caminante','El sol'], ok:0 },
    { q:'Si se reparte mucho, se diluye. Si se centraliza, se ahoga. ¿Qué es?', a:['La responsabilidad','El trabajo','La tarea','El dinero'], ok:0 },
    { q:'Si el error es mío, pero la solución es nuestra, ¿qué hay?', a:['Perdón','Soporte','Olvido','Liderazgo'], ok:1 },
    { q:'Se necesita para empezar y para terminar, pero cuesta en el medio. ¿Qué es?', a:['El esfuerzo','La idea','El plan','El compromiso'], ok:3 },
    { q:'Una daily efectiva debe ser...', a:['Larga','Con todos','Corta y enfocada','Con PPT'], ok:2 },
    { q:'Para delegar bien, hace falta...', a:['Confianza y claridad','Más control','Más reportes','Micromanagement'], ok:0 },
    { q:'Un equipo fuerte tiene...', a:['Roles claros','Una sola voz','Competencia interna','Rutina rígida'], ok:0 },
    { q:'“Asumir buena intención” reduce...', a:['Velocidad','Confianza','Conflictos innecesarios','Resultados'], ok:2 },
    { q:'¿Qué se retroalimenta?', a:['Errores','Éxitos','Aprendizajes','Todo lo anterior'], ok:3 },
    { q:'¿Qué mejora la cooperación?', a:['Metas compartidas','Metas aisladas','Ranking interno','Silencio'], ok:0 },
    { q:'Para coordinar, sirve...', a:['Calendario claro','Silencio','Más burocracia','Reuniones sin objetivo'], ok:0 },
    { q:'¿Qué rompe la confianza?', a:['Coherencia','Transparencia','Prometer y no cumplir','Cuidar al equipo'], ok:2 },
    { q:'En una retros, buscamos...', a:['Culpables','Aprender','Confrontar','Demorar'], ok:1 },
    { q:'¿Qué potencia al equipo?', a:['Feedback útil','Crítica vacía','Quejas','Chismes'], ok:0 }
  ],
  res: [
    { q:'Si le tenés miedo, nunca lo usás. ¿Qué es?', a:['La regla','El dinero','El riesgo','El tiempo'], ok:2 },
    { q:'Es un regalo envuelto en problemas. ¿Qué es?', a:['Una oportunidad','Una deuda','Una queja','Una crítica'], ok:0 },
    { q:'Si no se discute, se convierte en norma. ¿Qué es?', a:['La idea','El plan','El error','El miedo'], ok:2 },
    { q:'Se ve mejor cuando te alejás y mirás atrás. ¿Qué es?', a:['La lección','La meta','El camino','La salida'], ok:0 },
    { q:'Cuanto más grande es la caja, más difícil de encontrar. ¿Qué es?', a:['La idea','El límite','El error','El plan'], ok:1 },
    { q:'Para resolver, primero...', a:['Reunirse','Entender el problema','Buscar culpables','Cambiar todo'], ok:1 },
    { q:'Un buen MVP...', a:['Se lanza tarde','Evita feedback','Valida hipótesis','Suma burocracia'], ok:2 },
    { q:'Cuando hay bloqueo, probá...', a:['Otra mirada','Insistir igual','Culpar','Ignorar'], ok:0 },
    { q:'¿Qué acelera decisiones?', a:['Datos','Rumores','Intuiciones sueltas','Reuniones largas'], ok:0 },
    { q:'¿Qué reduce la ambigüedad?', a:['Buenas preguntas','Más gente','Silencio','Más canales'], ok:0 },
    { q:'Un límite sano...', a:['Frena todo','Aclara foco','Molesta','Divide'], ok:1 },
    { q:'Prototipar ayuda a...', a:['Validar y aprender','Demorar','Gastar más','Confundir'], ok:0 },
    { q:'La priorización evita...', a:['Colas','Enfoque','Retrasos','Dispersión'], ok:3 },
    { q:'Fail fast significa...', a:['Rendirse','Iterar rápido','Culpar menos','Plan eterno'], ok:1 },
    { q:'Un problema bien definido está...', a:['A medias resuelto','Más difícil','Igual','Peor'], ok:0 }
  ],
  obj: [
    { q:'Si solo la celebrás, pero no la entendés, no sirve de nada. ¿Qué es?', a:['La meta','La victoria','La estrategia','La regla'], ok:2 },
    { q:'Cuanto más la dividís, más precisa se vuelve. ¿Qué es?', a:['La idea','La tarea','La meta','El tiempo'], ok:2 },
    { q:'Si te enfocás solo en ella, el equipo se quema. ¿Qué es?', a:['La reunión','La fecha límite','La intensidad','El descanso'], ok:1 },
    { q:'Puede ser compartida, pero se alcanza individualmente. ¿Qué es?', a:['La victoria','La excelencia','El plan','El esfuerzo'], ok:1 },
    { q:'Si siempre mirás arriba, tropezás con lo cercano. ¿Qué es?', a:['La ambición','El sueño','La meta','El líder'], ok:0 },
    { q:'Para que el objetivo motive debe ser...', a:['Vago','Imposible','Claro y alcanzable','Secreto'], ok:2 },
    { q:'OKR sirve para...', a:['Controlar personas','Alinear y medir impacto','Hacer más reuniones','Nada'], ok:1 },
    { q:'Un buen KPI...', a:['Es medible','Depende de otros','Es vago','Cambia siempre'], ok:0 },
    { q:'La alineación reduce...', a:['Foco','Desvíos','Resultados','Aprendizajes'], ok:1 },
    { q:'El propósito da...', a:['Confusión','Rumbo','Ruido','Conflicto'], ok:1 },
    { q:'“Qué no” también...', a:['Resta','Aclara estrategia','Demora','Divide'], ok:1 },
    { q:'Un objetivo sin plan es...', a:['Sueño','Camino','Proceso','Entrega'], ok:0 },
    { q:'Para sostener objetivos, hace falta...', a:['Resistencia','Autocracia','Aislamiento','Silencio'], ok:0 },
    { q:'La cadencia (ritmo) permite...', a:['Mejorar constante','Perder foco','Quemarse','Nada'], ok:0 },
    { q:'Sin métricas no hay...', a:['Control','Mejoras','Resultados','Evaluación real'], ok:3 }
  ]
};

/* ==========================
   DIBUJO DE RULETA
   ========================== */

function drawWheel(){
  const parts = SEGMENTS.length;
  const step = (Math.PI * 2) / parts;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let i=0;i<parts;i++){
    const start = angle + i * step;
    const end   = start + step;

    // porción
    ctx.beginPath();
    ctx.moveTo(CENTER.x, CENTER.y);
    ctx.arc(CENTER.x, CENTER.y, CENTER.r, start, end);
    ctx.closePath();
    ctx.fillStyle = SEGMENTS[i].color;
    ctx.fill();

    // texto
    ctx.save();
    ctx.translate(CENTER.x, CENTER.y);
    ctx.rotate(start + step/2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 22px Montserrat, Arial';
    ctx.fillText(SEGMENTS[i].label.toUpperCase(), CENTER.r - 24, 10);
    ctx.restore();
  }
}

function animate(){
  drawWheel();
  requestAnimationFrame(animate);
}
animate();

/* ==========================
   GIRO
   ========================== */

btnSpin.addEventListener('click', spinWheel);

function spinWheel(){
  if (spinning) return;

  // “antipicado”: evitá caer en la misma cat de los últimos 3 si se puede
  const chosenIndex = pickSmartIndex();
  const parts = SEGMENTS.length;
  const step = (Math.PI * 2) / parts;

  // Queremos que la flecha marque el límite entre porciones,
  // por lo que centramos el ángulo al medio del segmento elegido.
  const finalAngle = ((Math.PI * 3/2) - (chosenIndex * step) - step/2) % (Math.PI*2);

  const turns = Math.PI * 2 * (4 + Math.floor(Math.random()*3)); // 4-6 vueltas
  const target = normalizeAngle(finalAngle) + turns;
  const duration = 2200 + Math.random()*800;

  const start = performance.now();
  const fromA = angle;

  spinning = true;
  btnSpin.disabled = true;

  function frame(now){
    const t = Math.min(1, (now - start)/duration);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
    angle = fromA + (target - fromA) * ease;

    if (t < 1){
      requestAnimationFrame(frame);
    } else {
      spinning = false;
      btnSpin.disabled = false;

      const idx = getIndexFromAngle(angle);
      const seg = SEGMENTS[idx];
      afterSpin(seg);
    }
  }
  requestAnimationFrame(frame);
}

function normalizeAngle(a){
  let r = a % (Math.PI*2);
  if (r < 0) r += Math.PI*2;
  return r;
}

function getIndexFromAngle(a){
  const parts = SEGMENTS.length;
  const step = (Math.PI * 2) / parts;

  // top pointer = 90° (3π/2). Tomamos el ángulo relativo a ese punto.
  const rel = normalizeAngle((Math.PI * 3/2) - normalizeAngle(a));
  let idx = Math.floor(rel / step);
  if (idx < 0) idx = 0;
  if (idx >= parts) idx = parts - 1;
  return idx;
}

function pickSmartIndex(){
  const available = SEGMENTS.map((_,i)=>i);

  // Evitá repetir segs recientes si hay otras opciones
  const filtered = available.filter(i => !recentCats.includes(SEGMENTS[i].key) || SEGMENTS[i].key === 'respina' || SEGMENTS[i].key === 'corona');
  const pool = filtered.length ? filtered : available;

  return pool[Math.floor(Math.random()*pool.length)];
}

/* ==========================
   LÓGICA POST-GIRO
   ========================== */

function afterSpin(seg){
  pushRecent(seg.key);

  switch(seg.key){
    case 'respina':
      notify('↻ Reintenta el giro', 1300);
      setTimeout(spinWheel, 550);
      break;
    case 'corona':
      handleCorona();
      break;
    default:
      askQuestion(seg.key);
      break;
  }
}

function pushRecent(key){
  recentCats.push(key);
  if (recentCats.length > maxRecent) recentCats.shift();
}

/* ==========================
   PREGUNTAS
   ========================== */

function askQuestion(catKey){
  const catName = getCatName(catKey);
  const color   = getCatColor(catKey);
  const turno   = currentTeam;

  // Elegimos una pregunta que no se haya usado demasiado: mezclamos y buscamos
  const q = pickRandom(QA[catKey]);

  openCard({
    catKey, catName, color, turno,
    question: q.q,
    options: q.a,
    okIndex: q.ok,
    onResult: (correct) => {
      closeCard();

      if (correct) {
        addProgress(turno, catKey);
        // Si ya tiene icono de esa cat, no gana extra; solo mantiene 3/3.
      } else {
        // cambia de equipo
        changeTurn();
      }
      checkWinner();
    }
  });
}

function handleCorona(){
  const turno = currentTeam;
  const missing = getMissingCats(turno); // categorías sin icono

  if (missing.length === 0){
    notify('👑 ¡Ya tienen todos los iconos! Elegí cualquier categoría.', 1800);
    // cualquier cat
    openPicker(['com','obj','res','col'], (picked)=> askQuestion(picked));
    return;
  }
  notify('👑 CORONA: elegí una categoría sin icono', 2200);
  openPicker(missing, (picked)=> askQuestion(picked));
}

/* ==========================
   UI MODAL / PICKER / TOAST
   ========================== */

function openCard({catKey, catName, color, turno, question, options, okIndex, onResult}){
  // set UI
  cardCatDot.className = 'dot';
  cardCatDot.classList.add(catKeyToDot(catKey));
  cardCatName.textContent = catName;
  cardTurno.textContent   = `— Turno ${turno}`;
  cardQuestion.textContent= question;

  cardOptions.innerHTML = '';
  options.forEach((txt, i)=>{
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = txt;
    b.addEventListener('click', ()=>{
      clearInterval(timerId);
      const correct = i === okIndex;
      if (correct){
        b.classList.add('correct');
      }else{
        b.classList.add('wrong');
        // marcar correcta
        [...cardOptions.children][okIndex].classList.add('correct');
      }
      setTimeout(()=> onResult(correct), 700);
    });
    cardOptions.appendChild(b);
  });

  // Timer 60s
  let t = 60;
  cardTimer.textContent = t;
  clearInterval(timerId);
  timerId = setInterval(()=>{
    t--; cardTimer.textContent = t;
    if (t<=0){
      clearInterval(timerId);
      // tiempo agotado -> incorrecta
      const okB = [...cardOptions.children][okIndex];
      okB.classList.add('correct');
      setTimeout(()=>{ onResult(false) }, 650);
    }
  },1000);

  modal.classList.remove('hidden');
}

btnCerrar.addEventListener('click', ()=>{
  closeCard();
});

function closeCard(){
  clearInterval(timerId);
  modal.classList.add('hidden');
}

function openPicker(keys, cb){
  // picker simple usando prompt (si querés reemplazar por tu UI, acá va)
  const names = keys.map(k=>getCatName(k)).join(' / ');
  const ans = prompt(`Elegí una categoría: ${names}\nEscribí: ${keys.join(' / ')}`);
  if (!ans) return;
  const key = ans.trim().toLowerCase();
  if (!keys.includes(key)) {
    notify('⚠️ Opción inválida',1400);
    return;
  }
  cb(key);
}

function notify(msg, ms=1600){
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(()=> toast.style.display='none', ms);
}

/* ==========================
   PROGRESO / GANADOR
   ========================== */

function addProgress(team, catKey){
  if (progress[team][catKey] >= 3) {
    // ya llegó al 3/3 y probablemente ya tiene icono; no suma más
    notify(`✔ Respuesta correcta (sin sumar): ${getCatName(catKey)}.`, 1500);
    return;
  }

  progress[team][catKey]++;

  // UI
  trackMap[team][catKey].textContent = `${progress[team][catKey]}/3`;

  if (progress[team][catKey] === 3) {
    // gana icono si no lo tenía
    const targetIcons = trackMap[team].icons[catKey];
    if (!targetIcons.querySelector('.won')) {
      const i = document.createElement('div');
      i.className='won';
      i.textContent='🏅';
      targetIcons.appendChild(i);
      notify(`🏅 ${team} ganó el icono de ${getCatName(catKey)}. ¡Seguí jugando!`, 2000);
    }
  }
}

function getMissingCats(team){
  const out = [];
  ['com','col','res','obj'].forEach(k=>{
    const hasIcon = !!trackMap[team].icons[k].querySelector('.won');
    if (!hasIcon) out.push(k);
  });
  return out;
}

function checkWinner(){
  const Aok = ['com','col','res','obj'].every(k => !!trackMap.A.icons[k].querySelector('.won'));
  const Bok = ['com','col','res','obj'].every(k => !!trackMap.B.icons[k].querySelector('.won'));
  if (Aok || Bok){
    notify(`🏆 ¡Ganó Equipo ${Aok?'A':'B'}!`, 4000);
    // bloquear giros
    btnSpin.disabled = true;
  }
}

function changeTurn(){
  currentTeam = (currentTeam === 'A') ? 'B' : 'A';
  badge.textContent = `Equipo ${currentTeam}`;
}

/* ==========================
   HELPERS
   ========================== */

function getCss(varName){
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}
function getCatName(k){
  switch(k){
    case 'com': return 'Comunicación';
    case 'col': return 'Colaboración';
    case 'res': return 'Resolución';
    case 'obj': return 'Objetivo común';
  }
  return k;
}
function getCatColor(k){
  switch(k){
    case 'com': return getCss('--com');
    case 'col': return getCss('--col');
    case 'res': return getCss('--res');
    case 'obj': return getCss('--obj');
    case 'corona': return getCss('--corona');
    case 'respina': return getCss('--re');
  }
  return '#ccc';
}
function catKeyToDot(k){
  switch(k){
    case 'com': return 'dot-com';
    case 'col': return 'dot-col';
    case 'res': return 'dot-res';
    case 'obj': return 'dot-obj';
    default: return 'dot';
  }
}
function pickRandom(arr){
  // desordena y toma uno
  return arr[Math.floor(Math.random()*arr.length)];
}

/* init */
drawWheel();
badge.textContent = 'Equipo A';
