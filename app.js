'use strict';
/* Public conceptual navigation and approved GitHub aggregates. Never imply concept labels are individual private repositories. */
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('treeCanvas');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const names = ['Audio Playground','Creative Engine','Motion Lab','Plugin Workshop','Research Garden','Release Pipeline','Community Space','Design Studio','Sample Library','Collaboration Hub','Prototype Station','Knowledge Base'];
  // Names belong to the conceptual tree layout and are NOT private repository names.
  // No synthetic per-project commits, issue counts, PR counts, or pretend activity.
  const areaDefinitions = [
    ['creative','Esplorazione e sperimentazione audio.'],
    ['creative','Ideazione e prototipazione creativa.'],
    ['creative','Animazione, movimento e interazione.'],
    ['technical','Sviluppo e progettazione di strumenti audio.'],
    ['creative','Ricerca, riferimenti e nuove idee.'],
    ['technical','Preparazione, verifica e distribuzione delle versioni.'],
    ['creative','Collaborazione e condivisione di conoscenza.'],
    ['creative','Design di interfacce e nuove esperienze.'],
    ['technical','Organizzazione dei campioni e delle risorse.'],
    ['technical','Coordinamento dei flussi di lavoro.'],
    ['technical','Esperimenti tecnici e prototipi.'],
    ['technical','Documentazione e consultazione delle conoscenze.']
  ];
  const repos = names.map((name, i) => ({
    name, category:areaDefinitions[i][0], description:areaDefinitions[i][1]
  }));
  let publicTotals = null;
  const state = {selected:repos[0].name,search:'',filter:'all',mode:'tree',ry:.52,rx:.20,zoom:1,drag:null,
    width:1,height:1,hits:[],tour:null};
  const number = x => new Intl.NumberFormat('it-IT').format(x);
  const create = (tag, cls, label) => {const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e;};
  const visible = () => repos.filter(r=>(r.name+' '+r.description).toLowerCase().includes(state.search) &&
      (state.filter==='all'||state.filter===r.category));
  const missions = () => publicTotals ? [
    ...((publicTotals.people||[]).flatMap(person => {
      const items=[];
      if(person.reviews_requested>0) items.push(`NEL GIARDINO DI ${person.name.toUpperCase()} CI SONO ${person.reviews_requested} REVIEW DA FARE. Una review accurata fa crescere il progetto!`);
      const assignments=person.assigned_open_issues+person.assigned_open_prs;
      if(assignments>0) items.push(`${person.name.toUpperCase()} HA ${assignments} ATTIVITÀ ASSEGNATE. Un piccolo passo alla volta: la foresta cresce!`);
      return items;
    })),
    `IL BOSCO HA ${publicTotals.open_pull_requests} PR APERTE! Una review utile può sbloccare un merge.`,
    `CRESCITA MISURABILE: ${publicTotals.default_branch_commits} commit sui branch principali. Meglio piccoli passi verificati.`,
    `SUPERVISORE: ${publicTotals.open_issues} Issue aperte. Individuate i blocchi prioritari, senza mettere pressione su chi fa ricerca.`,
    `${publicTotals.merged_pull_requests_all_time} PR UNITE NEL TEMPO. Ottimo quando un merge arriva con test e revisione.`,
    'CHI NON HA FATTO COMMIT? Non basta per misurare l’impegno: contano anche review, prove e documentazione.',
    'PROSSIMO PASSO: scegli una PR, verifica lo stato e concorda una piccola azione concreta.'
  ] : [
    'SUPERVISORE: dati aggregati in caricamento. Nessuna attività privata viene mostrata.',
    'RICORDA: review, prove e documentazione sono lavoro, anche senza commit.'
  ];
  let supervisorIndex=0;
  function supervisor() {
    const msg=$('supervisorMessage');
    if (!msg)return;
    msg.textContent=missions()[0];
    setInterval(()=>{const list=missions();supervisorIndex=(supervisorIndex+1)%list.length;msg.textContent=list[supervisorIndex];},7800);
  }
  function animateNumber(element, target) {
    if(reducedMotion){element.textContent=number(target);return;}
    const start=performance.now(), duration=850;
    const draw=now=>{const p=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-p,3);
      element.textContent=number(Math.round(target*eased));if(p<1)requestAnimationFrame(draw);};
    requestAnimationFrame(draw);
  }
  const activityDescriptions={commit:'Commit',push:'Push', 'pull request':'Pull request',
    'merge PR':'Merge PR',revisione:'Review',commento:'Commento',issue:'Issue',
    'commento review':'Commento review', 'creazione branch':'Branch creato'};
  function updatePeople(people) {
    const root=$('memberCards');
    root.replaceChildren();
    for(const person of people){
      const card=create('div','member-card');
      const top=create('div','member-top'),avatar=create('div','member-avatar',person.name==='Agostino'?'AG':'MR');
      const profile=create('div','');
      const githubLink=create('a','',person.name);githubLink.href='https://github.com/'+encodeURIComponent(person.github);
      githubLink.target='_blank';githubLink.rel='noopener noreferrer';
      profile.append(githubLink,create('small','',`@${person.github}`));top.append(avatar,profile);card.append(top);
      const metrics=create('div','member-grid');
      for(const [name,key] of [['COMMITS','commits'],['PR CREATE','prs_opened_all_time'],
        ['MERGE','prs_merged_all_time'],['PUSH 30G','push_events_observed_30d']]){
        const stat=create('div','member-stat'),value=create('strong','','0');
        stat.append(value,create('small','',name));metrics.append(stat);animateNumber(value,person[key]);
      }
      card.append(metrics);
      const work = create('div','member-work');
      const waiting=[
        ['REVIEWS IN ATTESA',person.reviews_requested,'review-leaf'],
        ['ISSUE ASSEGNATE',person.assigned_open_issues,'issue-leaf'],
        ['PR ASSEGNATE',person.assigned_open_prs,'pr-leaf']
      ];
      for(const [label,amount,leaf] of waiting){
        const pill=create('div','work-pill'+(amount>0?' needs-attention':' settled'));
        const visual=create('span','work-leaf '+leaf,amount>0?'❧':'✓');
        visual.setAttribute('aria-hidden','true');
        pill.append(visual,create('span','',label),create('strong','',String(amount)));
        work.append(pill);
      }
      card.append(work);
      const assigned=person.reviews_requested+person.assigned_open_issues+person.assigned_open_prs;
      const note=create('div','garden-note',assigned>0 ?
        `Nel giardino di ${person.name} ci sono ${assigned} foglie da seguire: nessuna urgenza inventata, soltanto richieste GitHub reali.` :
        `Il giardino di ${person.name} è in ordine: nessuna assegnazione o review individuale pendente.`);
      card.append(note);
      let dateText='Nessuna interazione rilevata';
      if(person.last_interaction_at){
        const when=new Date(person.last_interaction_at);
        if(!Number.isNaN(when.valueOf()))
          dateText=when.toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'});
      }
      const last=create('div','member-last','ULTIMA ATTIVITÀ: ');
      last.append(create('strong','',dateText));
      last.append(create('div','',activityDescriptions[person.last_interaction_type] || person.last_interaction_type || 'Evento non specificato'));
      card.append(last);root.append(card);
    }
  }
  async function loadPublicSnapshot() {
    try {
      const response=await fetch('./snapshot.json',{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const snapshot=await response.json();
      if(snapshot.schema_version!==2||snapshot.data_policy!=='public-authorized-team-summary')throw new Error('Schema non valido');
      const keys=['repository_count','default_branch_commits','open_issues','open_pull_requests','merged_pull_requests_all_time'];
      if(!keys.every(k=>Number.isSafeInteger(snapshot[k])&&snapshot[k]>=0))throw new Error('Aggregati non validi');
      if(!Array.isArray(snapshot.people)||snapshot.people.length!==2 ||
        !['ostinsolo','InnovateSN'].every(id=>snapshot.people.some(p=>p.github===id)))
        throw new Error('Profili collaboratori non disponibili');
      for(const person of snapshot.people){
        if(!['commits','prs_opened_all_time','prs_merged_all_time','push_events_observed_30d','assigned_open_issues','assigned_open_prs','reviews_requested'].every(
          k=>Number.isSafeInteger(person[k])&&person[k]>=0))throw new Error('Contatori profili non validi');
      }
      publicTotals=snapshot;
      updatePeople(snapshot.people);
      for(const [id,key] of [['metricRepos','repository_count'],['metricCommits','default_branch_commits'],
        ['metricIssues','open_issues'],['metricPrs','open_pull_requests'],['metricMerges','merged_pull_requests_all_time']]){
        animateNumber($(id),snapshot[key]);
      }
      const publishedAt=new Date(snapshot.updated_at);
      const publishedLabel=Number.isNaN(publishedAt.getTime())?'DATA NON DISPONIBILE':
        publishedAt.toLocaleString('it-IT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      $('publicDataHeading').textContent='GITHUB · SNAPSHOT '+publishedLabel;
      $('syncStatus').textContent='SNAPSHOT GITHUB · '+publishedLabel;
      $('lastSync').textContent='DATI PUBBLICATI IL '+publishedLabel;
      $('supervisorMessage').textContent=missions()[supervisorIndex%missions().length];
    } catch(err) {
      $('publicDataHeading').textContent='GITHUB · DATI NON DISPONIBILI';
      $('syncStatus').textContent='GITHUB · SNAPSHOT NON DISPONIBILE';
      $('lastSync').textContent='IN ATTESA DELLO SNAPSHOT';
      $('supervisorMessage').textContent='I dati aggregati non sono disponibili. La mappa tematica resta utilizzabile.';
      $('memberCards').replaceChildren(create('div','loading-list','I dati dei collaboratori non sono disponibili.'));
    }
  }

  function select(name){state.selected=name;renderSidebar();renderDetail();window.dispatchEvent(new CustomEvent('vstopia:select-changed',{detail:{name}}));}
  function renderSidebar(){const list=$('repoList');list.replaceChildren();const data=visible();window.dispatchEvent(new CustomEvent('vstopia:filters',{detail:{visible:data.map(r=>r.name)}}));$('repoCountLabel').textContent=String(data.length).padStart(2,'0');
    for(const r of data){const b=create('button','repo-item'+(r.name===state.selected?' selected':''));b.type='button';
      b.setAttribute('aria-pressed',String(r.name===state.selected));b.append(create('span','repo-glyph','⌁'));
      const copy=create('span','repo-copy');copy.append(create('strong','',r.name),create('small','',r.category==='creative'?'AREA CREATIVA':'AREA TECNICA'));
      b.append(copy,create('span','repo-chevron','›'));b.addEventListener('click',()=>select(r.name));list.append(b);}
    if(!data.length)list.append(create('div','loading-list','Nessun progetto corrisponde al filtro.'));
  }
  function renderDetail(){
    const r=repos.find(x=>x.name===state.selected);
    const root=$('selectedDetail');root.replaceChildren();
    $('selectedIndicator').textContent='AREA TEMATICA';
    if(!r)return;
    root.append(create('h3','detail-title',r.name),create('p','detail-desc',r.description));
    root.append(create('p','detail-meta','Percorso della mappa, non un repository specifico. I dati GitHub verificati sono nei contatori del team.'));
  }
  const hash = s=>{let n=2166136261;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return(n>>>0)/4294967295;};
  function world(){const rs=visible();const points=[{id:'root',x:0,y:-112,z:0,type:'root',radius:11}];
    rs.forEach((r,i)=>{const angle=i*Math.PI*(3-Math.sqrt(5))+.15,ring=Math.sqrt((i+.8)/Math.max(1,rs.length)),distance=54+ring*205;
      const x=Math.cos(angle)*distance,z=Math.sin(angle)*distance,y=25+ring*103+(hash(r.name)-.5)*52,id='repo:'+r.name;
      // Conceptual-only fallback: no synthetic commit/issue children.
      points.push({id,repo:r.name,parent:'root',x,y,z,type:'repo',radius:8.6});});return points;}
  function project(p,t){const drift=reducedMotion?0:Math.sin(t/4200+hash(p.id)*5.8)*(p.type==='root'?0:2.2);
    const x=p.x+drift,y=p.y+drift*.5,z=p.z,nx=x*Math.cos(state.ry)-z*Math.sin(state.ry),nz=x*Math.sin(state.ry)+z*Math.cos(state.ry);
    const ny=y*Math.cos(state.rx)-nz*Math.sin(state.rx),depth=y*Math.sin(state.rx)+nz*Math.cos(state.rx),perspective=850/(850-depth*.55);
    const scale=Math.min(state.width/710,state.height/590)*state.zoom;
    return{x:state.width/2+nx*scale*perspective,y:state.height*.59-ny*scale*perspective,r:p.radius*scale*perspective,depth};}
  const backCanvas=document.createElement('canvas');
  const backCtx=backCanvas.getContext('2d');
  let lastForestPaint=0;
  function frame(t){
    if(window.VstopiaEzTree?.ready){requestAnimationFrame(frame);return;}
    if(t-lastForestPaint<70){requestAnimationFrame(frame);return;}
    lastForestPaint=t;
    if(state.mode!=='tree'){requestAnimationFrame(frame);return;}
    const nodes=world(), projected=new Map();
    for(const node of nodes)projected.set(node.id,project(node,t));
    state.hits=[];
    window.VstopiaForest.draw(backCtx,{w:state.width,h:state.height,t:0,motion:false,
      world:nodes,projected,selected:state.selected,hits:state.hits});
    // Compositing is atomic: keep the previous complete tree until this one is ready.
    ctx.clearRect(0,0,state.width,state.height);
    ctx.drawImage(backCanvas,0,0,state.width,state.height);
    requestAnimationFrame(frame);
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);state.width=Math.max(1,r.width);state.height=Math.max(1,r.height);
    canvas.width=Math.round(state.width*d);canvas.height=Math.round(state.height*d);ctx.setTransform(d,0,0,d,0,0);
    backCanvas.width=canvas.width;backCanvas.height=canvas.height;backCtx.setTransform(d,0,0,d,0,0);}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;state.drag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(!state.drag)return;const d=state.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(e.clientX-d.sx)+Math.abs(e.clientY-d.sy)>5)d.moved=true;
    if(d.moved){state.ry+=dx*.009;state.rx=Math.max(-1.1,Math.min(1.1,state.rx+dy*.006));}d.x=e.clientX;d.y=e.clientY;});
  canvas.addEventListener('pointerup',e=>{const drag=state.drag;state.drag=null;canvas.classList.remove('dragging');if(!drag||drag.moved)return;
    const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hits=state.hits.filter(h=>Math.hypot(h.x-x,h.y-y)<h.r).sort((a,b)=>b.depth-a.depth);if(hits.length)select(hits[0].repo);});
  canvas.addEventListener('pointercancel',()=>{state.drag=null;canvas.classList.remove('dragging');});
  canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.5,Math.min(2.3,state.zoom*(e.deltaY>0?.92:1.08)));},{passive:false});
  canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')state.ry-=.15;else if(e.key==='ArrowRight')state.ry+=.15;
    else if(e.key==='ArrowUp')state.rx-=.15;else if(e.key==='ArrowDown')state.rx+=.15;else if(e.key==='+'||e.key==='=')state.zoom=Math.min(2.3,state.zoom*1.1);
    else if(e.key==='-')state.zoom=Math.max(.5,state.zoom/1.1);
    else if(e.key==='Enter'||e.key===' '){const rs=visible();if(rs.length)select(rs[(rs.findIndex(r=>r.name===state.selected)+1)%rs.length].name);}else return;e.preventDefault();});
  window.addEventListener('vstopia:select',event=>select(event.detail.name));
  $('repoSearch').addEventListener('input',e=>{state.search=e.target.value.toLowerCase().trim();renderSidebar();});
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('repoSearch').focus();}});
  for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{state.filter=b.dataset.filter;for(const n of document.querySelectorAll('[data-filter]')){n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b));}const items=visible();if(items.length&&!items.some(r=>r.name===state.selected)){select(items[0].name);}else renderSidebar();});
  $('clock').textContent='PUBLIC STATS';$('syncStatus').textContent='LOADING AGGREGATES';
  $('metricRepos').textContent='—';$('metricCommits').textContent='—';$('metricIssues').textContent='—';$('metricPrs').textContent='—';$('metricMerges').textContent='—';
  $('commitsFoot').textContent='Aggregato · branch principali';$('lastSync').textContent='IN ATTESA';
  const activity=$('activityFeed');activity.replaceChildren(create('div','activity-kicker','TEAM SUPERVISOR · PUBLIC TOTALS'));
  // Removed decorative clover: reserve visible height for both team profiles.

  activity.append(create('div','supervisor-speech',''));activity.lastChild.id='supervisorMessage';
  supervisor();loadPublicSnapshot();setInterval(loadPublicSnapshot,300000);renderSidebar();renderDetail();new ResizeObserver(resize).observe(canvas);requestAnimationFrame(frame);
})();
