(function(){
'use strict';

const STORAGE_COMPARE='dropmac-compare-v1';
const STORAGE_PASSPORT='dropmac-passport-v1';
const maxCompare=2;
const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const money=value=>Number.isFinite(value)?value.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}):'Sob consulta';
const qs=(selector,root=document)=>root.querySelector(selector);
const qsa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const safeParse=(raw,fallback)=>{try{return JSON.parse(raw);}catch{return fallback;}};
const storage={
  get(key,fallback){try{return safeParse(localStorage.getItem(key),fallback);}catch{return fallback;}},
  set(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}},
  remove(key){try{localStorage.removeItem(key);}catch{}}
};

function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}

ready(()=>{
  const catalog=window.DROPMAC_CATALOG||{};
  const ids=Object.keys(catalog);
  if(!ids.length)return;
  document.documentElement.classList.add('dropmac-experience');

  const progress=document.createElement('div');
  progress.className='dm-scroll-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML='<i></i>';
  document.body.prepend(progress);
  let scrollFrame=0;
  const updateProgress=()=>{
    scrollFrame=0;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    progress.style.setProperty('--dm-progress',Math.max(0,Math.min(1,scrollY/max)));
  };
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateProgress);},{passive:true});
  addEventListener('resize',updateProgress,{passive:true});
  updateProgress();

  const revealTargets=qsa('.section,.value-section,.closing,.principles,.hero');
  if(reduceMotion||!('IntersectionObserver' in window)){
    revealTargets.forEach(el=>el.classList.add('dm-reveal','is-visible'));
  }else{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.08,rootMargin:'0px 0px -7% 0px'});
    revealTargets.forEach(el=>{el.classList.add('dm-reveal');observer.observe(el);});
  }

  qsa('.product-card').forEach(card=>{
    card.classList.add('dm-product-card');
    const id=card.id;
    if(!catalog[id])return;
    if(!reduceMotion&&matchMedia('(pointer:fine)').matches){
      card.addEventListener('pointermove',event=>{
        const rect=card.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width;
        const y=(event.clientY-rect.top)/rect.height;
        card.style.setProperty('--dm-x',(x*100).toFixed(1)+'%');
        card.style.setProperty('--dm-y',(y*100).toFixed(1)+'%');
        card.style.setProperty('--dm-rx',((.5-y)*2.1).toFixed(2)+'deg');
        card.style.setProperty('--dm-ry',((x-.5)*2.1).toFixed(2)+'deg');
      });
      card.addEventListener('pointerleave',()=>{
        card.style.setProperty('--dm-rx','0deg');
        card.style.setProperty('--dm-ry','0deg');
      });
    }
  });

  const fromUrl=(()=>{try{return new URL(location.href).searchParams.get('compare')?.split(',').filter(id=>catalog[id]).slice(0,maxCompare)||[];}catch{return [];}})();
  let selected=(fromUrl.length?fromUrl:storage.get(STORAGE_COMPARE,[])).filter(id=>catalog[id]).slice(0,maxCompare);

  const dock=document.createElement('aside');
  dock.className='dm-compare-dock';
  dock.setAttribute('aria-label','Comparação de MacBooks');
  dock.innerHTML='<div class="dm-dock-copy"><span>COMPARE</span><strong>Monte seu duelo de MacBooks.</strong></div><div class="dm-dock-models" aria-live="polite"></div><button class="dm-dock-clear" type="button">Limpar</button><button class="dm-dock-open" type="button">Comparar agora <span>↗</span></button>';
  document.body.append(dock);

  const compareDialog=document.createElement('dialog');
  compareDialog.id='dm-compare-dialog';
  compareDialog.className='dm-compare-dialog';
  compareDialog.innerHTML='<button class="dm-dialog-close" type="button" aria-label="Fechar comparação">×</button><div class="dm-dialog-kicker">DROPMAC COMPARE</div><div class="dm-compare-content"></div>';
  document.body.append(compareDialog);
  qs('.dm-dialog-close',compareDialog).addEventListener('click',()=>compareDialog.close());
  compareDialog.addEventListener('click',event=>{if(event.target===compareDialog)compareDialog.close();});

  function syncUrl(){
    try{
      const url=new URL(location.href);
      if(selected.length)url.searchParams.set('compare',selected.join(','));else url.searchParams.delete('compare');
      history.replaceState(null,'',url);
    }catch{}
  }

  function saveCompare(){storage.set(STORAGE_COMPARE,selected);syncUrl();}

  function compareButton(card,id){
    let actions=qs('.dm-card-actions',card);
    if(!actions){
      actions=document.createElement('div');
      actions.className='dm-card-actions';
      const primary=qs('.product-button',card);
      if(primary)primary.insertAdjacentElement('afterend',actions);else card.append(actions);
    }
    let button=qs('.dm-compare-toggle',actions);
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='dm-compare-toggle';
      button.dataset.compare=id;
      button.addEventListener('click',event=>{event.stopPropagation();toggleCompare(id);});
      actions.append(button);
    }
    const active=selected.includes(id);
    button.classList.toggle('is-selected',active);
    button.setAttribute('aria-pressed',String(active));
    button.innerHTML=active?'<span>✓</span> Selecionado':'<span>＋</span> Comparar';
    card.classList.toggle('dm-in-compare',active);
  }

  function renderDock(){
    qsa('.product-card').forEach(card=>catalog[card.id]&&compareButton(card,card.id));
    const models=qs('.dm-dock-models',dock);
    models.replaceChildren();
    selected.forEach(id=>{
      const chip=document.createElement('button');
      chip.type='button';
      chip.className='dm-dock-chip';
      chip.setAttribute('aria-label','Remover '+catalog[id].name+' da comparação');
      chip.innerHTML='<span>'+catalog[id].name.replace('MacBook ','')+'</span><b>×</b>';
      chip.addEventListener('click',()=>toggleCompare(id));
      models.append(chip);
    });
    if(selected.length<maxCompare){
      const empty=document.createElement('span');
      empty.className='dm-dock-slot';
      empty.textContent=selected.length?'Escolha mais 1':'Escolha 2 modelos';
      models.append(empty);
    }
    dock.classList.toggle('is-visible',selected.length>0);
    dock.hidden=selected.length===0;
    const open=qs('.dm-dock-open',dock);
    open.disabled=selected.length<2;
    open.textContent=selected.length<2?'Falta '+(2-selected.length)+' modelo':'Comparar agora ↗';
  }

  function toggleCompare(id){
    if(!catalog[id])return;
    if(selected.includes(id))selected=selected.filter(item=>item!==id);
    else{
      if(selected.length>=maxCompare)selected.shift();
      selected.push(id);
    }
    saveCompare();
    renderDock();
  }

  qs('.dm-dock-clear',dock).addEventListener('click',()=>{selected=[];saveCompare();renderDock();});
  qs('.dm-dock-open',dock).addEventListener('click',()=>openCompare());

  function valueScore(model){return Number.isFinite(model.price)&&model.price>0?model.multi/model.price*1000:null;}
  function performanceWinner(a,b,key){
    if(!Number.isFinite(a[key])||!Number.isFinite(b[key])||a[key]===b[key])return null;
    return a[key]>b[key]?0:1;
  }
  function priceWinner(a,b){
    if(!Number.isFinite(a.price)||!Number.isFinite(b.price)||a.price===b.price)return null;
    return a.price<b.price?0:1;
  }
  function scoreWinner(a,b){
    const av=valueScore(a),bv=valueScore(b);
    if(!Number.isFinite(av)||!Number.isFinite(bv)||Math.abs(av-bv)<.01)return null;
    return av>bv?0:1;
  }

  function comparisonRow(label,aValue,bValue,winner=null,note=''){
    return '<div class="dm-compare-row"><div class="dm-compare-label"><span>'+label+'</span>'+(note?'<small>'+note+'</small>':'')+'</div><div class="'+(winner===0?'dm-winner':'')+'">'+aValue+'</div><div class="'+(winner===1?'dm-winner':'')+'">'+bValue+'</div></div>';
  }

  function openCompare(){
    if(selected.length<2)return;
    const [aId,bId]=selected;
    const a=catalog[aId],b=catalog[bId];
    const content=qs('.dm-compare-content',compareDialog);
    const priceWin=priceWinner(a,b),multiWin=performanceWinner(a,b,'multi'),singleWin=performanceWinner(a,b,'single'),valueWin=scoreWinner(a,b);
    const bestMulti=multiWin===null?'Desempenho muito próximo ou sem desempate':(multiWin===0?a.name:b.name)+' lidera em multicore nesta referência.';
    const bestPrice=priceWin===null?'Nem todos os preços estão disponíveis':(priceWin===0?a.name:b.name)+' exige menor desembolso.';
    content.innerHTML=
      '<div class="dm-compare-head"><div><h2>Dois Macs.<br><em>Uma decisão mais clara.</em></h2><p>Compare os dados desta seleção sem esconder as diferenças.</p></div><div class="dm-compare-actions"><button type="button" data-dm-copy-compare>Copiar comparação</button></div></div>'+ 
      '<div class="dm-compare-grid-head"><div></div>'+modelHead(a,aId)+modelHead(b,bId)+'</div>'+ 
      '<div class="dm-compare-table">'+
        comparisonRow('Preço',money(a.price),money(b.price),priceWin,'menor é melhor para o orçamento')+
        comparisonRow('Ano',String(a.year),String(b.year),a.year===b.year?null:(a.year>b.year?0:1),'geração do modelo')+
        comparisonRow('Tela',a.screen,b.screen)+
        comparisonRow('Processador',a.cpu,b.cpu)+
        comparisonRow('Memória',a.ram,b.ram)+
        comparisonRow('SSD',a.ssd,b.ssd)+
        comparisonRow('Geekbench multicore',a.multi.toLocaleString('pt-BR'),b.multi.toLocaleString('pt-BR'),multiWin,'média de referência usada no site')+
        comparisonRow('Geekbench single-core',a.single.toLocaleString('pt-BR'),b.single.toLocaleString('pt-BR'),singleWin)+
        comparisonRow('Pontos / R$ 1.000',valueScore(a)?Math.round(valueScore(a)).toLocaleString('pt-BR'):'—',valueScore(b)?Math.round(valueScore(b)).toLocaleString('pt-BR'):'—',valueWin,'só quando há preço informado')+
      '</div>'+ 
      '<div class="dm-compare-verdict"><div><span>PERFORMANCE</span><strong>'+bestMulti+'</strong></div><div><span>ORÇAMENTO</span><strong>'+bestPrice+'</strong></div></div>'+ 
      '<p class="dm-compare-note">Os destaques são relativos apenas aos dois modelos e aos dados exibidos. Estado da unidade, bateria, compatibilidade, garantia e configuração real continuam fazendo parte da decisão.</p>';

    qsa('[data-dm-open-model]',content).forEach(button=>button.addEventListener('click',()=>{
      compareDialog.close();
      openModel(button.dataset.dmOpenModel);
    }));
    qs('[data-dm-copy-compare]',content)?.addEventListener('click',event=>copyCompare(event.currentTarget));
    compareDialog.showModal();
  }

  function modelHead(model,id){
    return '<article class="dm-compare-model"><img src="'+model.image+'" alt=""><span>'+model.year+'</span><h3>'+model.name+'</h3><strong>'+money(model.price)+'</strong><button type="button" data-dm-open-model="'+id+'">Explorar modelo +</button></article>';
  }

  function openModel(id){
    if(typeof window.openProduct==='function'){window.openProduct(id,null);return;}
    const card=document.getElementById(id);
    card?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});
    setTimeout(()=>card?.querySelector('.product-button')?.click(),reduceMotion?0:350);
  }

  async function copyText(text){
    try{await navigator.clipboard.writeText(text);return true;}catch{
      try{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();return ok;}catch{return false;}
    }
  }

  async function copyCompare(button){
    const url=new URL(location.href);url.searchParams.set('compare',selected.join(','));
    const ok=await copyText(url.href);
    const old=button.textContent;button.textContent=ok?'Link copiado ✓':'Não foi possível copiar';
    setTimeout(()=>button.textContent=old,1800);
  }

  renderDock();

  const passportItems=[
    ['photos','Fotos reais da unidade','teclado, tela, laterais e marcas de uso'],
    ['health','Saúde da bateria','percentual exibido no macOS'],
    ['cycles','Número de ciclos','junto da condição da bateria'],
    ['warranty','Garantia e devolução','prazo e cobertura por escrito'],
    ['invoice','Nota fiscal / origem','documentação e identificação do vendedor']
  ];
  const productDialog=qs('#product-dialog');
  let passportModel=null;

  function identifyOpenModel(){
    const title=qs('#detail-title')?.textContent?.trim();
    return ids.find(id=>catalog[id].name===title)||null;
  }

  function passportState(id){
    const all=storage.get(STORAGE_PASSPORT,{});
    const row=all&&typeof all==='object'?all[id]:null;
    return row&&typeof row==='object'?row:{};
  }

  function savePassport(id,state){
    const all=storage.get(STORAGE_PASSPORT,{});
    storage.set(STORAGE_PASSPORT,{...(all&&typeof all==='object'?all:{}),[id]:state});
  }

  function ensurePassport(){
    if(!productDialog?.open)return;
    const id=identifyOpenModel();
    if(!id)return;
    let panel=qs('.dm-unit-passport',productDialog);
    if(id===passportModel&&panel)return;
    passportModel=id;
    if(!panel){
      panel=document.createElement('section');
      panel.className='dm-unit-passport';
      const purchase=qs('.purchase-box',productDialog);
      purchase?.insertAdjacentElement('afterend',panel);
    }
    renderPassport(panel,id);
  }

  function renderPassport(panel,id){
    const state=passportState(id);
    const done=passportItems.filter(([key])=>state[key]).length;
    const pct=Math.round(done/passportItems.length*100);
    panel.style.setProperty('--dm-passport-progress',pct+'%');
    panel.innerHTML='<div class="dm-passport-head"><div><span>PASSAPORTE DA UNIDADE</span><h3>Confira antes de fechar.</h3><p>Marque somente depois de receber e verificar cada informação.</p></div><div class="dm-passport-score"><strong>'+pct+'%</strong><span>'+done+'/'+passportItems.length+'</span></div></div><div class="dm-passport-list">'+passportItems.map(([key,title,desc])=>'<label><input type="checkbox" data-passport="'+key+'" '+(state[key]?'checked':'')+'><span><b>'+title+'</b><small>'+desc+'</small></span><i aria-hidden="true">✓</i></label>').join('')+'</div><div class="dm-passport-actions"><button type="button" data-passport-copy>Copiar perguntas para o vendedor</button><button type="button" data-passport-reset>Limpar</button></div>';
    qsa('[data-passport]',panel).forEach(input=>input.addEventListener('change',()=>{
      const next=passportState(id);next[input.dataset.passport]=input.checked;savePassport(id,next);renderPassport(panel,id);
    }));
    qs('[data-passport-reset]',panel).addEventListener('click',()=>{savePassport(id,{});renderPassport(panel,id);});
    qs('[data-passport-copy]',panel).addEventListener('click',event=>copyPassport(id,event.currentTarget));
  }

  async function copyPassport(id,button){
    const m=catalog[id];
    const text='Olá! Tenho interesse no '+m.name+'. Antes de fechar, poderia me enviar: fotos reais da unidade (tela, teclado, laterais e marcas de uso); saúde da bateria; número de ciclos; condições de garantia/devolução; e informação sobre nota fiscal/origem? Também gostaria de confirmar memória, SSD e acessórios da unidade. Obrigado!';
    const ok=await copyText(text);const old=button.textContent;button.textContent=ok?'Mensagem copiada ✓':'Não foi possível copiar';setTimeout(()=>button.textContent=old,1800);
  }

  if(productDialog){
    new MutationObserver(()=>requestAnimationFrame(ensurePassport)).observe(productDialog,{attributes:true,attributeFilter:['open'],subtree:true,childList:true,characterData:true});
    productDialog.addEventListener('close',()=>{passportModel=null;});
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-buy],[data-open],#hero-details,.product-visual,.product-title h3,[data-plan-model],[data-quiz-model]'))requestAnimationFrame(ensurePassport);
    },true);
  }

  const headerActions=qs('.header-actions');
  const commandTrigger=document.createElement('button');
  commandTrigger.type='button';
  commandTrigger.className='dm-command-trigger';
  commandTrigger.setAttribute('aria-label','Abrir navegação rápida');
  commandTrigger.innerHTML='<span aria-hidden="true">⌘</span><b>Atalhos</b><kbd>⌘K</kbd>';
  headerActions?.prepend(commandTrigger);

  const commandDialog=document.createElement('dialog');
  commandDialog.className='dm-command-dialog';
  commandDialog.id='dm-command-dialog';
  commandDialog.innerHTML='<div class="dm-command-shell"><div class="dm-command-search"><span aria-hidden="true">⌕</span><input type="search" autocomplete="off" placeholder="Onde você quer ir?" aria-label="Buscar ação"><kbd>Esc</kbd></div><div class="dm-command-list" role="listbox"></div><div class="dm-command-footer"><span>↑↓ navegar</span><span>Enter selecionar</span><span>⌘K abrir</span></div></div>';
  document.body.append(commandDialog);
  const commandInput=qs('input',commandDialog),commandList=qs('.dm-command-list',commandDialog);

  const actions=[
    {label:'Ver todos os MacBooks',meta:'Catálogo',keywords:'modelos produtos catálogo',run:()=>goTo('#modelos')},
    {label:'Planejar minha compra',meta:'Simulador',keywords:'orçamento comprar esperar planejamento',run:()=>goTo('#escolha')},
    {label:'Compra consciente',meta:'Checklist',keywords:'confiança bateria garantia usado',run:()=>goTo('#confianca')},
    {label:'Abrir comparação',meta:'Compare',keywords:'comparar duelo',run:()=>selected.length===2?openCompare():goTo('#modelos')},
    {label:'Alternar tema',meta:'Aparência',keywords:'dark claro escuro tema',run:()=>qs('#theme-toggle')?.click()},
    ...ids.map(id=>({label:'Explorar '+catalog[id].name,meta:String(catalog[id].year),keywords:(catalog[id].name+' '+catalog[id].cpu).toLowerCase(),run:()=>openModel(id)}))
  ];
  let filtered=actions.slice(),activeIndex=0;

  function renderCommands(){
    commandList.innerHTML=filtered.length?filtered.map((action,index)=>'<button type="button" role="option" aria-selected="'+(index===activeIndex)+'" data-command-index="'+index+'"><span><b>'+action.label+'</b><small>'+action.meta+'</small></span><i>↗</i></button>').join(''):'<div class="dm-command-empty">Nenhum atalho encontrado.</div>';
    qsa('[data-command-index]',commandList).forEach(button=>button.addEventListener('click',()=>runAction(Number(button.dataset.commandIndex))));
  }
  function runAction(index){const action=filtered[index];if(!action)return;commandDialog.close();action.run();}
  function openCommands(){commandInput.value='';filtered=actions.slice();activeIndex=0;renderCommands();commandDialog.showModal();setTimeout(()=>commandInput.focus(),20);}
  function goTo(selector){commandDialog.close();qs(selector)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});}
  function filterCommands(){const term=commandInput.value.trim().toLowerCase();filtered=actions.filter(action=>(action.label+' '+action.meta+' '+action.keywords).toLowerCase().includes(term));activeIndex=0;renderCommands();}
  commandTrigger.addEventListener('click',openCommands);
  commandInput.addEventListener('input',filterCommands);
  commandInput.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();activeIndex=Math.min(filtered.length-1,activeIndex+1);renderCommands();qsa('[data-command-index]',commandList)[activeIndex]?.scrollIntoView({block:'nearest'});}
    else if(event.key==='ArrowUp'){event.preventDefault();activeIndex=Math.max(0,activeIndex-1);renderCommands();qsa('[data-command-index]',commandList)[activeIndex]?.scrollIntoView({block:'nearest'});}
    else if(event.key==='Enter'){event.preventDefault();runAction(activeIndex);}
  });
  addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();commandDialog.open?commandDialog.close():openCommands();}
  });
  commandDialog.addEventListener('click',event=>{if(event.target===commandDialog)commandDialog.close();});

});
})();
