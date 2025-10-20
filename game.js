/* ===== JUGADOS (ruleta + corona + duelo) ===== */
const canvas    = document.getElementById('wheel');
const ctx       = canvas.getContext('2d', {alpha:false});
const hubLabel  = document.getElementById('hubLabel');
const teamBadge = document.getElementById('teamBadge');
const hudRight  = document.getElementById('hudRight');

const modal     = document.getElementById('questionModal');
const catDot    = document.getElementById('catDot');
const catTitle  = document.getElementById('catTitle');
const qText     = document.getElementById('qText');
const optionsEl = document.getElementById('options');
const timerEl   = document.getElementById('timer');
const nextBtn   = document.getElementById('nextBtn');

const crownModal = document.getElementById('crownModal');
const cancelCrownBtn = document.getElementById('cancelCrown');

const duelModal  = document.getElementById('duelModal');
const duelInfo   = document.getElementById('duelInfo');
const startDuel  = document.getElementById('startDuel');
const cancelDuel = document.getElementById('cancelDuel');

let rotation = 0;        // rad
let spinning = false;
let currentTurn = 'A';
let lastNormalKey = null; // para alternar mejor
let timerRef = null;

/* --- Slices (incluye corona y duelo) --- */
const SLICES = [
  { type:'cat', key:'com', name:'Comunicación',   color:'#4f86ff', emoji:'💬' },
  { type:'cat', key:'obj', name:'Objetivo común', color:'#24d2a3', emoji:'🎯' },
  { type:'crown', key:'crown', name:'Corona',     color:'#8b5cf6', emoji:'👑' },
  { type:'cat', key:'res', name:'Resolución',     color:'#f7da43', emoji:'💡' },
  { type:'cat', key:'col', name:'Colaboración',   color:'#f29a07', emoji:'🤝' },
  { type:'duel', key:'duel', name:'Duelo',        color:'#1f2937', emoji:'⚔️' },
];

/* --- Score --- */
const score = {
  A:{ com:0, obj:0, res:0, col:0, icons:[], hasIcon:{com:false,obj:false,res:false,col:false} },
  B:{ com:0, obj:0, res:0, col:0, icons:[], hasIcon:{com:false,obj:false,res:false,col:false} }
};

/* --- Preguntas (recorte de ejemplo) --- */
const QUESTIONS = {
  com: [
    {q:'Si el receptor no la encuentra, es que no sirve. ¿Qué es?', opts:['La intención','La idea','La gramática','El volumen'], a:0},
    {q:'Cuanto más la escuchás, más crece. ¿Qué es?', opts:['La voz','El rumor','La opinión','La música'], a:2},
    {q:'Vive en la pausa y muere en la interrupción. ¿Qué es?', opts:['La escucha activa','El tiempo','El error','El silencio incómodo'], a:0},
    {q:'Si se dobla, se entiende. Si se rompe, se ofende. ¿Qué es?', opts:['Una promesa','Una regla','El mensaje','El documento'], a:2},
    {q:'Todos la dan, pero pocos la piden. ¿Qué es?', opts:['Una orden','La retroalimentación','Una opinión','El consejo'], a:1},
  ],
  col: [
    {q:'Si el mapa no funciona, ¿quién es el error?', opts:['La ruta','El líder','El caminante','El sol'], a:0},
    {q:'Es un músculo que se atrofia con el control excesivo. ¿Qué es?', opts:['La paciencia','La autonomía','La fuerza','La disciplina'], a:1},
    {q:'Si se reparte mucho, se diluye. Si se centraliza, se ahoga. ¿Qué es?', opts:['La responsabilidad','El trabajo','La tarea','El dinero'], a:0},
    {q:'Si el error es mío, pero la solución es nuestra, ¿qué hay?', opts:['Perdón','Soporte','Olvido','Liderazgo'], a:1},
    {q:'Se necesita para empezar y terminar, pero es difícil de mantener en el medio. ¿Qué es?', opts:['El esfuerzo','La idea','El plan','El compromiso'], a:3},
  ],
  res: [
    {q:'Si le tenés miedo, nunca lo usás. ¿Qué es?', opts:['La regla','El dinero','El riesgo','El tiempo'], a:2},
    {q:'Es un regalo envuelto en problemas. ¿Qué es?', opts:['Una oportunidad','Una deuda','Una queja','Una crítica'], a:0},
    {q:'Si no se discute, se convierte en norma. ¿Qué es?', opts:['La idea','El plan','El error','El miedo'], a:2},
    {q:'Se ve mejor cuando te alejás y mirás atrás. ¿Qué es?', opts:['La lección','La meta','El camino','La salida'], a:0},
    {q:'Cuanto más grande es la caja, más difícil de encontrar. ¿Qué es?', opts:['La idea','El límite','El error','El plan'], a:1},
  ],
  obj: [
    {q:'Si solo la celebrás pero no la entendés, no sirve. ¿Qué es?', opts:['La meta','La victoria','La estrategia','La regla'], a:2},
    {q:'Cuanto más la dividís, más precisa se vuelve. ¿Qué es?', opts:['La idea','La tarea','La meta','El tiempo'], a:2},
    {q:'Si te enfocás solo en ella, el equipo se quema. ¿Qué es?', opts:['La reunión','La fecha límite','La intensidad','El descanso'], a:1},
    {q:'Puede ser compartida, pero se alcanza individualmente. ¿Qué es?', opts:['La victoria','La excelencia','El plan','El esfuerzo'], a:1},
    {q:'Si mirás siempre arriba, tropezás cerca. ¿Qué es?', opts:['La ambición','El sueño','La meta','El líder'], a:0},
  ],
};
const used = { A:{com:new Set(),col:new Set(),res:new Set(),obj:new Set()},
               B:{com:new Set(),col:new Set(),res:new Set(),obj:new Set()} };

/* ======= Canvas size ======= */
function fitCanvas(){
  const wrap = document.querySelector('.wheel-wrap');
  const size = Math.min(400, Math.floor(wrap.clientWidth));
  canvas.width = size; canvas.height = size;
  drawWheel();
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

/* ======= Draw wheel ======= */
function drawWheel(){
  const n = SLICES.length;
  const arc = (2*Math.PI)/n;
  const R = canvas.width/2;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let i=0;i<n;i++){
    const start = i*arc + rotation;
    ctx.beginPath(); ctx.moveTo(R,R);
    ctx.arc(R,R,R, start, start+arc);
    ctx.fillStyle = SLICES[i].color; ctx.fill();
  }
  ctx.save(); ctx.translate(R,R); ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=2;
  for(let i=0;i<n;i++){ ctx.rotate(arc); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R,0); ctx.stroke(); }
  ctx.restore();
}

/* ======= Spin ======= */
canvas.addEventListener('click', spin);
function spin(){
  if(spinning) return;
  spinning = true;

  const spins = 6*360;
  const rand  = Math.random()*360;
  const targetDeg = spins + rand;

  const start = rotation;
  const end   = rotation + targetDeg*Math.PI/180;
  const dur   = 4200; let t0;

  function anim(t){
    if(!t0) t0 = t;
    const p = Math.min((t - t0)/dur,1);
    const ease = 1 - Math.pow(1-p,3);
    rotation = start + (end - start)*ease;
    drawWheel();
    if(p<1){ requestAnimationFrame(anim); }
    else{
      spinning = false;
      let slice = detectSlice();
      if(slice.type==='cat' && lastNormalKey && slice.key===lastNormalKey){
        slice = nextNormalSlice(slice);
      }
      handleSlice(slice);
    }
  }
  requestAnimationFrame(anim);
}

function detectSlice(){
  const deg = (360 - ((rotation*180/Math.PI) % 360) + 30 + 360) % 360;
  const idx = Math.floor(deg / 60) % SLICES.length;
  return SLICES[idx];
}
function nextNormalSlice(s){
  const normals = SLICES.filter(x=>x.type==='cat');
  const i = normals.findIndex(x=>x.key===s.key);
  return normals[(i+1)%normals.length];
}

/* ======= Slice handlers ======= */
function handleSlice(slice){
  if(slice.type==='cat'){
    lastNormalKey = slice.key;
    showQuestion(slice, {crownWin:false, duelMode:false});
  }else if(slice.type==='crown'){
    openCrown();   // <- corona filtrada
  }else if(slice.type==='duel'){
    openDuel();
  }
}

/* ======= Corona (filtrada por iconos faltantes) ======= */
function openCrown(){
  // Filtrar categorías donde el equipo ACTUAL NO tenga icono todavía
  const normals   = SLICES.filter(s=>s.type==='cat');
  const available = normals.filter(s=>!score[currentTurn].hasIcon[s.key]);

  // Si no queda ninguna para ganar, salteamos a pregunta normal
  if(available.length === 0){
    toast('👑 Ya ganaron todos los iconos: va una pregunta normal.', 'info');
    const slice = randomNormalSlice();
    showQuestion(slice, {crownWin:false, duelMode:false});
    return;
  }

  // Mostrar modal y habilitar solo las disponibles
  crownModal.classList.remove('hidden');

  // Hay botones .cChoice[data-cat="com|obj|res|col"] en el modal
  const btns = crownModal.querySelectorAll('.cChoice');
  let enabledCount = 0;

  btns.forEach(btn=>{
    const k = btn.dataset.cat; // com|obj|res|col
    const canChoose = !score[currentTurn].hasIcon[k];

    // estilo visual para los que no se pueden elegir
    btn.disabled = !canChoose;
    btn.classList.toggle('disabled', !canChoose);
    btn.style.opacity = canChoose ? '1' : '.35';
    btn.style.cursor  = canChoose ? 'pointer' : 'not-allowed';

    // limpiar handlers previos
    btn.onclick = null;

    if(canChoose){
      enabledCount++;
      btn.onclick = ()=>{
        crownModal.classList.add('hidden');
        const slice = SLICES.find(s=>s.type==='cat' && s.key===k);
        // Si acierta, gana el icono directo (sin duplicar)
        showQuestion(slice, {crownWin:true, duelMode:false});
      };
    }
  });

  // backup: si por alguna razón todos quedaron deshabilitados (no debería),
  // cerramos y vamos a pregunta normal
  if(enabledCount === 0){
    crownModal.classList.add('hidden');
    const slice = randomNormalSlice();
    showQuestion(slice, {crownWin:false, duelMode:false});
  }

  cancelCrownBtn.onclick = ()=> crownModal.classList.add('hidden');
}

/* ======= Duelo ======= */
let duel = null;
function openDuel(){
  duel = {
    rounds:4,
    r:1,
    scores:{A:0,B:0},
    team:'A',
  };
  duelInfo.textContent = `Mejor de 4. Responden alternado A/B.`;
  duelModal.classList.remove('hidden');

  startDuel.onclick = ()=>{
    duelModal.classList.add('hidden');
    askDuelRound();
  };
  cancelDuel.onclick = ()=>{
    duelModal.classList.add('hidden');
  };
}

function askDuelRound(){
  const cat = randomNormalSlice();
  showQuestion(cat, {crownWin:false, duelMode:true}, (correct)=>{
    if(correct) duel.scores[duel.team]++;
    duel.team = (duel.team==='A')?'B':'A';
    duel.r++;
    if(duel.r<=duel.rounds){
      askDuelRound();
    }else{
      if(duel.scores.A > duel.scores.B){
        toast(`⚔️ Duelo: ¡gana Equipo A (${duel.scores.A}-${duel.scores.B})!`, 'success');
      }else if(duel.scores.B > duel.scores.A){
        toast(`⚔️ Duelo: ¡gana Equipo B (${duel.scores.B}-${duel.scores.A})!`, 'success');
      }else{
        toast('⚔️ Empate: muerte súbita', 'info');
        suddenDeath();
      }
    }
  });
}
function suddenDeath(){
  const cat = randomNormalSlice();
  showQuestion(cat, {crownWin:false, duelMode:true}, (correct)=>{
    const winner = correct ? duel.team : (duel.team==='A'?'B':'A');
    toast(`⚔️ Muerte súbita: ¡gana Equipo ${winner}!`, 'success');
  });
}
function randomNormalSlice(){
  const normals = SLICES.filter(s=>s.type==='cat');
  let s = normals[Math.floor(Math.random()*normals.length)];
  if(lastNormalKey && s.key===lastNormalKey) s = nextNormalSlice(s);
  lastNormalKey = s.key;
  return s;
}

/* ======= Preguntas ======= */
function showQuestion(slice, opts={}, done){
  const key = slice.key;
  const color = slice.color;
  catDot.style.background = color;
  catTitle.textContent = `${slice.emoji} ${slice.name} — Turno Equipo ${currentTurn}`;

  const pool = QUESTIONS[key];
  if(!pool || pool.length===0){ toast('No hay preguntas en esta categoría.', 'warn'); return; }

  const u = used[currentTurn][key];
  if(u.size >= pool.length) u.clear();
  let idx; do { idx = Math.floor(Math.random()*pool.length); } while (u.has(idx));
  u.add(idx);

  const data = pool[idx];
  qText.textContent = data.q;
  optionsEl.innerHTML='';
  data.opts.forEach((txt, i)=>{
    const btn=document.createElement('button');
    btn.className='op'; btn.textContent=txt;
    btn.onclick=()=>{
      lockOptions();
      const correct = (i===data.a);
      if(correct){
        btn.classList.add('correct');
        if(opts.crownWin){
          grantIcon(currentTurn, key, slice.emoji); // sin duplicar
        }else if(!opts.duelMode){
          applyCorrect(key); // sube hasta 3/3 y solo da icono si no lo tenía
        }
      }else{
        btn.classList.add('wrong');
        const all=optionsEl.querySelectorAll('.op'); all[data.a].classList.add('correct');
      }
      clearInterval(timerRef);
      nextBtn.classList.remove('hidden');

      nextBtn.onclick=()=>{
        modal.classList.add('hidden');
        nextBtn.classList.add('hidden');
        if(opts.duelMode){
          done && done(i===data.a);
        }else{
          if(i!==data.a){
            currentTurn = (currentTurn==='A')?'B':'A';
            teamBadge.textContent = `Equipo ${currentTurn}`;
          }
        }
      };
    };
    optionsEl.appendChild(btn);
  });

  nextBtn.classList.add('hidden');
  modal.classList.remove('hidden');
  startTimer(60, ()=>{
    lockOptions();
    const all=optionsEl.querySelectorAll('.op'); all[data.a].classList.add('correct');
    nextBtn.classList.remove('hidden');
    if(!opts.duelMode){
      nextBtn.onclick=()=>{
        modal.classList.add('hidden'); nextBtn.classList.add('hidden');
        currentTurn = (currentTurn==='A')?'B':'A';
        teamBadge.textContent = `Equipo ${currentTurn}`;
      };
    }
  });
}

function lockOptions(){ optionsEl.querySelectorAll('.op').forEach(b=>b.disabled=true); }
function startTimer(sec,onEnd){
  clearInterval(timerRef); let t=sec; timerEl.textContent=t;
  timerRef=setInterval(()=>{ t--; timerEl.textContent=t; if(t<=0){ clearInterval(timerRef); onEnd&&onEnd(); }},1000);
}

/* ======= Marcador ======= */
function applyCorrect(key){
  if(score[currentTurn][key] < 3){
    score[currentTurn][key] += 1;
    updateScoreUI();
    if(score[currentTurn][key] === 3 && !score[currentTurn].hasIcon[key]){
      const slice = SLICES.find(s=>s.type==='cat' && s.key===key);
      grantIcon(currentTurn, key, slice.emoji);
    }
  }else{
    updateScoreUI(); // se mantiene 3/3, sin icono duplicado
  }
}

function grantIcon(team, key, emoji){
  if(score[team].hasIcon[key]){
    updateScoreUI();
    return;
  }
  if(score[team][key] < 3) score[team][key] = 3;
  score[team].hasIcon[key] = true;
  updateScoreUI();

  score[team].icons.push(emoji);
  const box=document.getElementById(`${team}-icons`);
  const b=document.createElement('div');
  b.className='badge'; b.textContent=emoji;
  box.appendChild(b);

  toast(`🏅 Equipo ${team} ganó el icono ${emoji}`, 'success');
}

function updateScoreUI(){
  document.getElementById('A-com').textContent = `${score.A.com}/3`;
  document.getElementById('A-obj').textContent = `${score.A.obj}/3`;
  document.getElementById('A-res').textContent = `${score.A.res}/3`;
  document.getElementById('A-col').textContent = `${score.A.col}/3`;
  document.getElementById('B-com').textContent = `${score.B.com}/3`;
  document.getElementById('B-obj').textContent = `${score.B.obj}/3`;
  document.getElementById('B-res').textContent = `${score.B.res}/3`;
  document.getElementById('B-col').textContent = `${score.B.col}/3`;
}

/* ======= HUD ======= */
function toast(msg,kind='info',ms=2200){
  const el=document.createElement('div'); el.className=`toast ${kind}`; el.textContent=msg;
  hudRight.appendChild(el);
  setTimeout(()=>{ el.style.opacity='.0'; el.style.transform='translateY(-6px)'; setTimeout(()=>el.remove(),260); },ms);
}

hubLabel.textContent = 'JUGADOS';
teamBadge.textContent = 'Equipo A';
updateScoreUI();