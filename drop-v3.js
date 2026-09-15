(function(){
'use strict';

const data=window.DROPMAC_DROP_DATA;
const catalog=window.DROPMAC_CATALOG||{};
if(!data||!Array.isArray(data.units))return;
const featured=data.units.find(unit=>unit.id===data.drop?.featuredUnit)||data.units.find(unit=>unit.status==='available')||data.units[0];
const money=value=>Number.isFinite(value)?value.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}):'Sob consulta';
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function removeLegacyPlanner(){
  document.querySelector('.decision-lab')?.remove();
}

function enhanceHeader(){
  const nav=document.querySelector('body>header nav');
  if(!nav)return;
  const links=[...nav.querySelectorAll('a')];
  if(links[0]){links[0].textContent='Drops';links[0].href='#drop-room';}
  if(links[1]){links[1].textContent='Comparar';links[1].href='#comparar';}
  if(links[2]){links[2].textContent='Qualidade';links[2].href='#confianca';}
}

function heroModelMarkup(){
  const model=catalog[featured.modelKey]?.model;
  const poster=featured.photos?.[0]||catalog[featured.modelKey]?.image||'';
  const embed=model?.uid?`https://sketchfab.com/models/${model.uid}/embed?autostart=1&preload=1&ui_theme=dark&ui_infos=0&ui_inspector=0&ui_stop=0&transparent=1`:'';
  return `<div class="dm3-model-shell" id="dm3-model-shell">
    <img class="dm3-model-poster" src="${poster}" alt="${featured.name} ${featured.id}">
    ${embed?`<iframe class="dm3-model-frame" src="${embed}" title="Modelo 3D interativo de ${featured.name}" loading="eager" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>`:''}
    <div class="dm3-model-topline"><span class="dm3-model-badge"><i class="dm3-live-dot"></i>${featured.id} · Grade ${featured.grade}</span><span class="dm3-model-badge">${featured.ram} · ${featured.ssd}</span></div>
    <div class="dm3-model-caption">${model?`Modelo 3D · Sketchfab · ${model.author}`:'Visual da unidade'}</div>
    <div class="dm3-model-hud"><small id="dm3-hud-kicker">${data.drop.label}</small><strong id="dm3-hud-value">NOVO DROP</strong><span id="dm3-hud-note">role para revelar</span></div>
    ${embed?'<button class="dm3-interact" id="dm3-interact" type="button">Explorar em 3D ↗</button>':''}
  </div>`;
}

function enhanceHero(){
  const launch=document.querySelector('.dm2-launch');
  if(!launch||launch.dataset.v3==='true')return;
  launch.dataset.v3='true';
  const copy=launch.querySelector('.dm2-launch-copy');
  const device=launch.querySelector('.dm2-device-wrap');
  if(!copy||!device)return;
  const kicker=copy.querySelector('.dm2-kicker');
  const title=copy.querySelector('h1');
  const paragraph=copy.querySelector(':scope > p');
  if(kicker)kicker.textContent=`${data.drop.label} · EDIÇÃO LIMITADA`;
  if(title)title.innerHTML='Não é estoque.<br><em>É um drop.</em>';
  if(paragraph)paragraph.textContent='Macs reais, selecionados um a um. Cada unidade tem identidade, bateria, ciclos, condição e preço próprios — com tudo claro antes da compra.';

  const actions=document.createElement('div');
  actions.className='dm3-hero-actions';
  actions.innerHTML='<a class="dm3-primary" href="#drop-room">Ver Macs deste drop <span>↓</span></a><button class="dm3-secondary" type="button" id="dm3-how">Como funciona <span>▶</span></button>';
  const meta=copy.querySelector('.dm2-launch-meta');
  if(meta)meta.insertAdjacentElement('beforebegin',actions);else copy.append(actions);

  const proof=document.createElement('div');
  proof.className='dm3-hero-proof';
  const available=data.units.filter(unit=>unit.status==='available').length;
  proof.innerHTML=`<div class="dm3-proof"><strong>${available}</strong><span>Macs disponíveis agora</span></div><div class="dm3-proof"><strong>100%</strong><span>unidades com passaporte técnico</span></div><div class="dm3-proof"><strong>1 a 1</strong><span>cada Mac tratado como unidade única</span></div>`;
  if(meta)meta.insertAdjacentElement('afterend',proof);else copy.append(proof);

  actions.querySelector('#dm3-how')?.addEventListener('click',()=>document.querySelector('#confianca')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'}));

  device.innerHTML=heroModelMarkup();
  const shell=device.querySelector('#dm3-model-shell');
  const interact=device.querySelector('#dm3-interact');
  if(shell&&interact){
    interact.addEventListener('click',event=>{
      event.stopPropagation();
      const active=shell.classList.toggle('is-interactive');
      interact.textContent=active?'Sair do 3D ×':'Explorar em 3D ↗';
      interact.setAttribute('aria-pressed',String(active));
    });
  }

  if(shell&&!reduceMotion){
    device.addEventListener('pointermove',event=>{
      if(shell.classList.contains('is-interactive'))return;
      const rect=device.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width;
      const y=(event.clientY-rect.top)/rect.height;
      shell.style.setProperty('--dm3-ry',`${(x-.5)*6}deg`);
      shell.style.setProperty('--dm3-rx',`${(.5-y)*4}deg`);
      shell.style.setProperty('--dm3-shine',`${(x*150)-75}%`);
    });
    device.addEventListener('pointerleave',()=>{
      shell.style.setProperty('--dm3-ry','0deg');
      shell.style.setProperty('--dm3-rx','0deg');
    });
  }

  const hudKicker=device.querySelector('#dm3-hud-kicker');
  const hudValue=device.querySelector('#dm3-hud-value');
  const hudNote=device.querySelector('#dm3-hud-note');
  const states=[
    [data.drop.label,'NOVO DROP','uma edição, poucas unidades'],
    [featured.id,featured.name,`${featured.ram} · ${featured.ssd}`],
    ['BATERIA',`${featured.batteryHealth}%`,'saúde declarada da unidade'],
    ['CICLOS',String(featured.cycles),'histórico de carga'],
    ['PREÇO',money(featured.price),'unidade em destaque']
  ];
  let active=-1;
  const updateHud=()=>{
    const rect=launch.getBoundingClientRect();
    const travel=Math.max(1,launch.offsetHeight-window.innerHeight);
    const progress=Math.min(1,Math.max(0,-rect.top/travel));
    const step=Math.min(states.length-1,Math.floor(progress*states.length));
    if(step===active)return;
    active=step;
    const state=states[step];
    if(hudKicker)hudKicker.textContent=state[0];
    if(hudValue)hudValue.textContent=state[1];
    if(hudNote)hudNote.textContent=state[2];
  };
  window.addEventListener('scroll',updateHud,{passive:true});
  updateHud();
}

function enhanceRoom(){
  const room=document.querySelector('.dm2-room');
  if(!room||room.dataset.v3==='true')return;
  room.dataset.v3='true';
  const available=data.units.filter(unit=>unit.status==='available').length;
  const title=room.querySelector('.dm2-room-head h2');
  const copy=room.querySelector('.dm2-room-head p');
  if(title)title.innerHTML=`${available} Macs <span class="dm3-accent">disponíveis.</span>`;
  if(copy)copy.innerHTML='Cada código representa uma unidade real do drop. Compare bateria, ciclos, configuração e estado antes de abrir o passaporte completo. <strong>Sem ficha genérica: cada Mac tem sua própria história.</strong>';

  room.querySelectorAll('.dm2-unit-card').forEach(card=>{
    card.setAttribute('role','button');
    card.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      card.querySelector('[data-open-unit]')?.click();
    });
  });
}

function polishLegacyCopy(){
  const value=document.querySelector('.value-section');
  if(value){
    const eyebrow=value.querySelector('.eyebrow');
    const title=value.querySelector('h2');
    const copy=value.querySelector('p');
    if(eyebrow)eyebrow.textContent='ESCOLHER BEM MUDA TUDO';
    if(title)title.innerHTML='Mais Mac.<br>Menos dúvida.';
    if(copy)copy.innerHTML='Compare unidades reais, entenda a condição e escolha pelo que realmente importa — <strong>não apenas pelo ano do modelo.</strong>';
  }
}

function boot(){
  removeLegacyPlanner();
  enhanceHeader();
  enhanceHero();
  enhanceRoom();
  polishLegacyCopy();
  document.documentElement.classList.add('dropmac-v3');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
