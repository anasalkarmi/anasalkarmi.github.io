/* Studio set — UI glue. Needs set3d.js (window.StudioSet). */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const sec=$('#set');if(!sec||!window.StudioSet)return;
let booted=false;
function start(){if(booted)return;booted=true;
const stage=$('#stage'),canvas=$('#studioGl'),labels=$('#stLabels');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE=matchMedia('(hover:hover) and (pointer:fine)').matches;
const MOB=!FINE||innerWidth<700;
let E=null;
try{E=StudioSet.create(canvas,{mobile:MOB})}catch(e){console.warn(e);E=null}
if(!E){sec.classList.add('nogl');const t=$('.st-load span');if(t)t.textContent='The live set needs WebGL 2. This is a frame from it.';return}
const FIX=StudioSet.FIX,PROPS=E.PROPS;
const CFG=window.SITE_SET||{};if(CFG.peopleBase)E.peopleBase=CFG.peopleBase;
const EYE0=1.2; // presets are authored for this eye height and shifted to the talent's real eye line

/* ---------- talent roster (Microsoft Rocketbox avatars, MIT) ---------- */
const PEOPLE=[
  {id:'m07',label:'Blazer, 30s',desc:'man, early 30s, short dark brown hair, clean-shaven, light skin, grey wool blazer over a rust shirt, jeans',c:'#8a6a52'},
  {id:'m03',label:'Tweed, 60s',desc:'man, 60s, short white hair, clean-shaven, light skin, tweed blazer, burgundy shirt, dark trousers',c:'#d8d2c8'},
  {id:'m05',label:'Grey beard, 50s',desc:'man, 50s, short greying hair, grey stubble beard, light skin, beige utility gilet over olive long-sleeve top',c:'#a39a86'},
  {id:'m04',label:'Curly hair, 20s',desc:'man, 20s, curly afro hair, short beard, brown skin, dark zip hoodie jacket over a bright t-shirt',c:'#3a2a1e'},
  {id:'m12',label:'Denim, 30s',desc:'man, 30s, very short black hair, clean-shaven, dark skin, denim jacket over a white t-shirt, jeans',c:'#2f4d6a'},
  {id:'m15',label:'Thobe & kufi',desc:'man, 30s, full black beard, brown skin, white kufi cap and white thobe (Gulf / Middle Eastern dress)',c:'#e8e4dc'},
  {id:'f07',label:'Brown jacket, 30s',desc:'woman, 30s, brown hair tied back, light skin, brown fitted jacket, jeans, boots',c:'#6b4a2e'},
  {id:'f09',label:'Cardigan, 40s',desc:'woman, 40s, light brown hair pinned back, light skin, grey cardigan over a white shirt, necklace',c:'#8a8d91'},
  {id:'f10',label:'Hijab & abaya',desc:'woman, 30s, black hijab and black abaya, light olive skin',c:'#1b1b1b'},
  {id:'f11',label:'Dark hair, 20s',desc:'woman, 20s, dark hair in a bun, tan skin, brown top and skirt, boots',c:'#3a2418'}
];
const PMAP=Object.fromEntries(PEOPLE.map(p=>[p.id,p]));

/* ---------- scenes & setups ---------- */
const L=(type,name,x,z,h,int,k,o)=>Object.assign({type,name,x,z,h,int,k},o||{});
const P_=(type,x,z,o)=>Object.assign({type,x,z},o||{});
const SETUPS={
  'Interview':{cam:{x:.42,z:1.95,h:1.18,f:85,T:2.8,wb:5000},haze:.12,
    lights:[L('octa','Key',-1.1,1.05,1.62,.8,5600,{soft:.8}),L('bounce','Fill',.9,.8,1.05,.6,5600,{reflect:.6}),L('fresnel','Hair',.8,-1.05,2.05,.5,3200,{beam:30}),L('bgspot','Background',-.5,-1.3,.35,.75,3200,{beam:24,target:'wall'}),L('tube','Kicker',-.95,-.85,1.25,.35,6500,{rgb:[.8,1,1]})]},
  'Rembrandt':{cam:{x:.2,z:1.95,h:1.18,f:85,T:2.8,wb:5600},haze:.08,
    lights:[L('softbox','Key',-1.25,.55,1.72,.95,5600,{soft:.45}),L('bounce','Fill',1.0,.9,1.05,.25,5600,{reflect:.35}),L('fresnel','Hair',.7,-1.1,2.1,.3,5600,{beam:26})]},
  'Butterfly':{cam:{x:0,z:1.9,h:1.15,f:100,T:4,wb:5600},haze:.05,
    lights:[L('octa','Key',0,1.05,1.95,.9,5600,{soft:.55}),L('bounce','Fill',0,.75,.55,.6,5600,{reflect:.55,target:'face'}),L('bgspot','Background',0,-1.4,.3,.6,5600,{beam:40,target:'wall'}),L('fresnel','Hair',0,-.95,2.2,.4,5600,{beam:30})]},
  'Split':{cam:{x:0,z:1.95,h:1.18,f:85,T:2.8,wb:5600},haze:.1,lights:[L('fresnel','Key',-1.45,0,1.3,.9,5600,{beam:40})]},
  'Noir':{cam:{x:.3,z:1.9,h:1.1,f:50,T:2,wb:4300},haze:.55,
    lights:[L('fresnel','Key',-1.3,-.35,1.6,.9,6500,{beam:22}),L('fresnel','Rim',1.1,-.9,1.9,.9,3200,{beam:20}),L('bgspot','Slash',.3,-1.25,.3,.9,6500,{beam:14,target:'wall'})]},
  'Silhouette':{cam:{x:0,z:2.2,h:1.18,f:50,T:2.8,wb:5600},haze:.35,
    lights:[L('softbox','Wall wash',0,-1.2,1.4,1,5600,{soft:1,target:'wall'}),L('fresnel','Rim',-.9,-1,1.9,.5,5600,{beam:26})]},
  'Window':{cam:{x:.3,z:2,h:1.18,f:65,T:2,wb:5600},haze:.1,
    lights:[L('window','Window',-3,-.2,1.35,.9,6000,{soft:1}),L('bounce','Fill',.95,.7,1.05,.4,5600,{reflect:.5})]}
};
const ROOM0={back:-2.35,left:-3.2,right:2.9,rightOn:false,wall:'#2a2622',fin:1,floor:0,floorCol:'#b3b3b3'};
const DEFAULT_SCENE={room:ROOM0,haze:.12,
  props:[P_('bookshelf',-1.45,-2.12),P_('floorlamp',1.25,-1.75,{k:2700,int:.9}),P_('sidetable',-.78,.05),P_('plant',.72,-1.9),P_('rug',0,.3),P_('art',.25,-2.3,{color:'#b8643c'})],
  people:[{pid:'m07',x:0,z:0,ry:0,seat:'armchair'}],setup:'Interview'};
const REFS=[
  {id:'alrihla',title:'Alrihla',img:'m/ref_alrihla.jpg',note:'Over-the-shoulder two-shot: soft key from camera left, a warm practical on the sideboard and warm light grazing the curtains behind.',
    scene:{room:{back:-2.3,left:-2.6,right:2.6,rightOn:false,wall:'#2b2c2e',fin:1,floor:0,floorCol:'#9a8a78'},haze:.1,
      props:[P_('curtain',-1.25,-2.3,{color:'#cfc3ad'}),P_('curtain',1.45,-2.3,{color:'#cfc3ad'}),P_('plant',.8,-1.55),P_('cabinet',-2.25,-.8,{ry:Math.PI/2,color:'#6b4a2e'}),P_('tablelamp',-2.3,-1.2,{k:2700,int:.9}),P_('books',-2.25,-.5),P_('rug',0,.4,{color:'#a39a86'}),P_('art',-2.55,.4,{y:1.5,color:'#b8643c'})],
      people:[{pid:'m05',x:0,z:0,ry:.75,seat:'chair',seatColor:'#1b1b1b'},{pid:'m07',x:1.05,z:1.0,ry:-2.35,seat:'chair',seatColor:'#1b1b1b'}],
      cam:{x:1.75,z:2.35,h:1.25,f:35,T:2.8,wb:4800},
      lights:[L('octa','Key',-1.2,1.0,1.85,.85,5200,{soft:.8}),L('bounce','Fill',.95,-.2,1.05,.4,5600,{reflect:.45}),L('bgspot','Curtain wash',.9,-1.6,.25,.95,3000,{beam:40,target:'wall'}),L('fresnel','Hair',-.7,-1.1,2.1,.35,3200,{beam:30})]}},
  {id:'jumblatt',title:'One on One',img:'m/ref_jumblatt.jpg',note:'Large soft key from camera left, warm practicals behind, a touch of warm hair light and a long lens for separation.',
    scene:{room:{back:-2.4,left:-3,right:2.4,rightOn:true,wall:'#1f2a2c',fin:4,floor:2,floorCol:'#5a3a2a'},haze:.1,
      props:[P_('cabinet',-1.1,-2.1,{color:'#3b2a1e'}),P_('tablelamp',-1.3,-2.1,{k:2600,int:1.2}),P_('vase',-.8,-2.1,{color:'#c9b28a'}),P_('bookshelf',1.35,-2.15,{color:'#3b2a1e'}),P_('art',.3,-2.35,{y:1.6,color:'#6a2f4d'})],
      people:[{pid:'m03',x:0,z:0,ry:-.2,seat:'armchair',seatColor:'#3a2418'}],
      cam:{x:.2,z:2.35,h:1.2,f:85,T:2,wb:4300},
      lights:[L('octa','Key',-1.3,.9,1.7,.8,4300,{soft:.95}),L('bounce','Fill',1.0,.8,1.0,.35,4300,{reflect:.35}),L('fresnel','Hair',.8,-1.05,2.05,.35,3200,{beam:30})]}},
  {id:'realtalk',title:'Real Talk',img:'m/ref_realtalk.jpg',note:'Podcast table: soft key from camera right, a cool rim from the left and warm practical glow in a dark, textured background.',
    scene:{room:{back:-1.9,left:-2.2,right:2.4,rightOn:false,wall:'#2b221c',fin:6,floor:1,floorCol:'#3a3530'},haze:.18,
      props:[P_('roundtable',.05,.62,{color:'#c9b28a'}),P_('mic',-.35,.6,{ry:.6}),P_('books',.25,.5),P_('shelf',-2.2,-1.1,{y:1.4,color:'#d8d2c8'}),P_('smallplant',-1.9,-1.4),P_('tablelamp',1.4,-1.7,{k:2500,int:.8}),P_('neon',.9,-1.9,{y:1.75,color:'#ffb13f',int:.5})],
      people:[{pid:'f11',x:0,z:0,ry:-.25,seat:'sofa',seatColor:'#7d7466'}],
      cam:{x:-.2,z:1.8,h:1.15,f:50,T:2,wb:4000},
      lights:[L('softbox','Key',.95,.9,1.55,.7,4000,{soft:.85}),L('fresnel','Rim',-.8,-1.0,2.0,.35,5600,{beam:28}),L('bgspot','Background',-1.2,-1.5,.3,.45,3000,{beam:30,target:'wall'})]}},
  {id:'gravedigger',title:'Gravedigger',img:'m/ref_gravedigger.jpg',note:'Bright, low-contrast daylight: big soft key camera left, strong bounce fill and an evenly washed patterned wall.',
    scene:{room:{back:-1.7,left:-3,right:2.4,rightOn:false,wall:'#b9b4ac',fin:6,floor:2,floorCol:'#6b5a48'},haze:0,
      props:[P_('sidetable',-.9,.2,{color:'#6b4a2e'})],
      people:[{pid:'f09',x:0,z:0,ry:-.3,seat:'armchair',seatColor:'#4a2a1e'}],
      cam:{x:.25,z:1.9,h:1.2,f:50,T:2.8,wb:5600},
      lights:[L('octa','Key',-.9,1.1,1.6,.75,5600,{soft:1}),L('bounce','Fill',1.0,.8,1.05,.55,5600,{reflect:.7}),L('softbox','Wall wash',.8,-1.2,1.8,.7,5600,{soft:1,target:'wall'})]}}
];

/* ---------- state ---------- */
let sel={kind:'light',id:null},curSetup='Interview',refActive=null,sceneBusy=false;
function eyeDelta(){return E.HEAD[1]-EYE0}
function lightH(l,dh){return (l.target==='wall'&&l.h<.8)||l.target==='down'?l.h:l.h+dh}
function applyLights(st){E.clearLights();const dh=eyeDelta();
  if(st.cam)Object.assign(E.S.cam,st.cam,{h:(st.cam.h||EYE0)+dh});if(st.haze!=null)E.S.haze=st.haze;
  st.lights.forEach(l=>{const o=Object.assign({},l);delete o.type;o.h=lightH(l,dh);E.addLight(l.type,o)});
  sel={kind:'light',id:E.lights[0]?E.lights[0].id:null};E.select(sel.id);E.selectProp(null);E.invalidateShadows();syncAll()}
async function applyScene(sc){sceneBusy=true;
  const r=Object.assign({},ROOM0,sc.room||{});Object.assign(E.room,r);E.buildRoom();
  E.clearProps();(sc.props||[]).forEach(p=>{const o=Object.assign({},p);delete o.type;E.addProp(p.type,o)});
  const ppl=(sc.people&&sc.people.length?sc.people:DEFAULT_SCENE.people).slice(0,2);
  if(ppl.length<2)E.removePerson(1);
  const jobs=ppl.map((p,i)=>E.setPerson(i,PMAP[p.pid]?p.pid:'m07',{x:p.x||0,z:p.z||0,ry:p.ry||0,seat:p.seat||'armchair',seatColor:p.seatColor}));
  try{await Promise.all(jobs)}catch(e){console.warn(e);toast('A person could not load.')}
  if(sc.lights)applyLights(sc);else if(sc.setup)applyLights(Object.assign({},SETUPS[sc.setup],sc.haze!=null?{haze:sc.haze}:{}));
  sceneBusy=false;syncAll();markBusy(300)}

/* ---------- canvas sizing & loop ---------- */
let ready=false,q=1,DPR=Math.min(devicePixelRatio||1,1.5),visible=false,busyUntil=0,lastT=0,needFinal=false;
function size(){const r=stage.getBoundingClientRect();sec.style.setProperty('--stH',Math.round(r.height)+'px');const w=Math.max(2,Math.round(r.width*DPR)),h=Math.max(2,Math.round(r.height*DPR));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;E.dirty=true}}
function markBusy(ms){busyUntil=performance.now()+(ms||180);E.dirty=true}
function loop(t){requestAnimationFrame(loop);if(!visible||document.hidden)return;const dt=t-lastT;lastT=t;const busy=t<busyUntil;
  if(E.dirty){E.render(busy?q:1);if(ready&&!sec.classList.contains('ready'))sec.classList.add('ready');needFinal=busy;placeLabels()}
  else if(needFinal&&!busy){E.render(1);needFinal=false;placeLabels()}
  if(busy&&dt>0){const fps=1000/dt;if(fps<40)q=Math.max(.45,q*.93);else if(fps>55)q=Math.min(1,q*1.03)}}
new IntersectionObserver(es=>es.forEach(e=>{visible=e.isIntersecting;if(visible){E.dirty=true;maybeIntro()}}),{rootMargin:'100px'}).observe(stage);
addEventListener('resize',()=>{size();placeLabels()});

/* ---------- labels / tags ---------- */
function esc(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function kcss(l){const c=StudioSet.kelvin(l.k||5600).map(v=>Math.pow(v,1/2.2));const m=Math.max(...c);let r=c.map(v=>v/m);if(l.rgb)r=r.map((v,i)=>v*l.rgb[i]);return `rgb(${r.map(v=>Math.round(v*255)).join(',')})`}
function tagPoint(tg){const d=tg.dataset;if(d.cam)return [E.S.cam.x,E.S.cam.h+.2,E.S.cam.z];
  if(d.kind==='light'){const l=E.lights.find(x=>x.id===+d.id);return l?[l.x,l.h+(FIX[l.type].wall?.95:l.type==='lantern'?.45:.35),l.z]:null}
  if(d.kind==='prop'){const p=E.props.find(x=>x.id===+d.id);if(!p)return null;const D=PROPS[p.type];const hh=D.wall?(p.y||0)+(p.type==='curtain'?2.85:.45):(p.y||0)+(p.type==='bookshelf'?2.0:p.type==='floorlamp'?1.7:p.type==='plant'?1.7:D.small?.4:.9);return [p.x,hh,p.z]}
  if(d.kind==='person'){const P=E.people[+d.id];return P?[P.x,1.6,P.z]:null}return null}
function placeLabels(){const lay=E.layout();if(!lay)return;const setMain=lay.mainKind==='set';labels.classList.toggle('on',setMain);if(!setMain)return;
  const r=canvas.getBoundingClientRect();const k=r.width/canvas.width;
  $$('.tag',labels).forEach(tg=>{const pt=tagPoint(tg);const p=pt&&E.project('set',pt);
    if(!p||p[0]<-40||p[1]<-40||p[0]>canvas.width+40||p[1]>canvas.height+40){tg.hidden=true;return}tg.hidden=false;tg.style.transform=`translate(${(p[0]*k).toFixed(1)}px,${(p[1]*k).toFixed(1)}px) translate(-50%,-100%)`})}
function buildTags(){labels.innerHTML='';
  E.lights.forEach(l=>{const t=document.createElement('button');t.type='button';t.className='tag'+(sel.kind==='light'&&l.id===sel.id?' sel':'')+(l.on?'':' off');t.dataset.kind='light';t.dataset.id=l.id;t.innerHTML=`<i style="--c:${kcss(l)}"></i>${esc(l.name)}`;t.title='Drag to move '+l.name;labels.appendChild(t)});
  E.props.forEach(p=>{const D=PROPS[p.type];const t=document.createElement('button');t.type='button';t.className='tag prop'+(sel.kind==='prop'&&p.id===sel.id?' sel':'');t.dataset.kind='prop';t.dataset.id=p.id;t.innerHTML=`<i style="--c:${p.color}"></i>${esc(D.label)}`;t.title='Drag to move the '+D.label.toLowerCase();labels.appendChild(t)});
  E.people.forEach((P,i)=>{if(!P)return;const t=document.createElement('span');t.className='tag person'+(sel.kind==='person'&&sel.id===i?' sel':'');t.tabIndex=0;t.setAttribute('role','button');t.dataset.kind='person';t.dataset.id=i;
    t.innerHTML=`<i style="--c:#ffc27a"></i>${i?'Talent B':'Talent A'}<button type="button" class="tw" data-turn="-1" aria-label="Turn left">&#8634;</button><button type="button" class="tw" data-turn="1" aria-label="Turn right">&#8635;</button>`;t.title='Drag to move this person';labels.appendChild(t)});
  const c=document.createElement('button');c.type='button';c.className='tag cam';c.dataset.cam='1';c.innerHTML='<i style="--c:#ff3b30"></i>CAM A';c.title='Drag to move the camera';labels.appendChild(c)}

/* ---------- stage interaction ---------- */
let drag=null;
function devXY(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height]}
function inPip(e){const lay=E.layout();if(!lay||!lay.pip)return false;const [x,y]=devXY(e);const [px,py,pw,ph]=lay.pip;const yy=canvas.height-y;return x>=px&&x<=px+pw&&yy>=py&&yy<=py+ph}
function tagObj(tg){const d=tg.dataset;if(d.cam)return {obj:E.S.cam,kind:'cam'};if(d.kind==='light')return {obj:E.lights.find(l=>l.id===+d.id),kind:'light'};if(d.kind==='prop')return {obj:E.props.find(p=>p.id===+d.id),kind:'prop'};if(d.kind==='person')return {obj:E.people[+d.id],kind:'person'};return {}}
function commit(kind,obj){if(kind==='light')E.touchLight(obj);else if(kind==='prop')E.touchProp(obj);else if(kind==='person'){E.movePerson(obj);E.lights.forEach(l=>E.touchLight(l))}else if(kind==='cam')syncCam();markCustom();markBusy();syncReadouts()}
labels.addEventListener('click',e=>{const b=e.target.closest('.tw');if(!b)return;e.stopPropagation();const tg=b.closest('.tag');const P=E.people[+tg.dataset.id];if(!P)return;P.ry+=(+b.dataset.turn)*Math.PI/12;commit('person',P)});
labels.addEventListener('pointerdown',e=>{if(e.target.closest('.tw'))return;const tg=e.target.closest('.tag');if(!tg)return;e.preventDefault();e.stopPropagation();
  const {obj,kind}=tagObj(tg);if(!obj)return;if(kind==='light')selectLight(obj.id);else if(kind==='prop')selectProp(obj.id);else if(kind==='person')selectPerson(+tg.dataset.id);
  const [x,y]=devXY(e);const hit=E.rayFloor(x,y,0);drag={kind:'tag',obj,tkind:kind,ox:hit?obj.x-hit[0]:0,oz:hit?obj.z-hit[2]:0};
  const nt=labels.querySelector(`.tag[data-kind="${kind}"][data-id="${tg.dataset.id}"]`)||labels.querySelector('.tag.cam');try{(kind==='cam'?labels.querySelector('.tag.cam'):nt).setPointerCapture(e.pointerId)}catch(_){}});
labels.addEventListener('pointermove',e=>{if(!drag||drag.kind!=='tag')return;const [x,y]=devXY(e);const hit=E.rayFloor(x,y,0);if(!hit)return;let nx=hit[0]+drag.ox,nz=hit[2]+drag.oz;
  const k=drag.tkind;nx=clamp(nx,E.room.left+.2,E.room.rightOn?E.room.right-.2:5);nz=clamp(nz,E.room.back+.15,k==='cam'?4.2:3.2);
  if(k==='cam'||k==='light'){const H=E.HEAD;const d=Math.hypot(nx-H[0],nz-H[2]);const mn=k==='cam'?.7:.45;if(d<mn){nx=H[0]+(nx-H[0])*mn/d;nz=H[2]+(nz-H[2])*mn/d}}
  drag.obj.x=nx;drag.obj.z=nz;commit(k,drag.obj);if(k==='prop')syncPropEd()});
labels.addEventListener('pointerup',()=>{if(drag&&drag.kind==='tag'){drag=null;buildLists();markBusy(60)}});labels.addEventListener('pointercancel',()=>{drag=null});
labels.addEventListener('keydown',e=>{const tg=e.target.closest('.tag');if(!tg)return;const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!k)return;e.preventDefault();
  const {obj,kind}=tagObj(tg);if(!obj)return;obj.x=clamp(obj.x+k[0]*.1,-4,5);obj.z=clamp(obj.z+k[1]*.1,E.room.back+.15,kind==='cam'?4.2:3.2);commit(kind,obj)});
stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,.tag,.st-ref,input,select'))return;if(inPip(e)){swapView();return}
  drag={kind:'orbit',x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,active:e.pointerType==='mouse',mouse:e.pointerType==='mouse'};if(drag.mouse)try{stage.setPointerCapture(e.pointerId)}catch(_){}});
stage.addEventListener('pointermove',e=>{if(!drag||drag.kind!=='orbit')return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.active){if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy))drag.active=true;else return}
  const mx=e.clientX-drag.lx,my=e.clientY-drag.ly;drag.lx=e.clientX;drag.ly=e.clientY;
  if(E.view.main==='monitor'){const c=E.S.cam,H=E.HEAD;const rx=c.x-H[0],rz=c.z-H[2];const r=Math.hypot(rx,rz);let a=Math.atan2(rx,rz)-mx*.005;const nx=H[0]+Math.sin(a)*r,nz=H[2]+Math.cos(a)*r;if(nz>E.room.back+.4){c.x=nx;c.z=nz}if(drag.mouse)c.h=clamp(c.h-my*.0025,.5,2.2);markCustom();syncCam();syncReadouts()}
  else{const s=E.setCam;s.yaw-=mx*.006;if(drag.mouse)s.pitch=clamp(s.pitch+my*.004,.08,1.45)}
  markBusy();hideHint()});
const endOrbit=()=>{if(drag&&drag.kind==='orbit'){drag=null;markBusy(60)}};stage.addEventListener('pointerup',endOrbit);stage.addEventListener('pointercancel',endOrbit);
stage.addEventListener('wheel',e=>{if(E.view.main!=='set'||!(e.ctrlKey||e.metaKey))return;e.preventDefault();E.setCam.dist=clamp(E.setCam.dist*(1+e.deltaY*.0015),2.2,11);markBusy()},{passive:false});
$('#stZoomIn').addEventListener('click',()=>{if(E.view.main==='monitor'){E.S.cam.f=clamp(Math.round(E.S.cam.f*1.25),18,135);syncCam();syncReadouts()}else E.setCam.dist=clamp(E.setCam.dist/1.2,2.2,11);markBusy(300)});
$('#stZoomOut').addEventListener('click',()=>{if(E.view.main==='monitor'){E.S.cam.f=clamp(Math.round(E.S.cam.f/1.25),18,135);syncCam();syncReadouts()}else E.setCam.dist=clamp(E.setCam.dist*1.2,2.2,11);markBusy(300)});
function setView(v){E.view.main=v;$$('#stSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)));stage.dataset.main=v;$('#stTop').hidden=v!=='set';$('#stPipLab').textContent=(v==='monitor'?'SET':'MONITOR')+' · tap to swap';markBusy(100);placeLabels();syncHud()}
function swapView(){setView(E.view.main==='monitor'?'set':'monitor');hideHint()}
$$('#stSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.v)));
$('#stTop').addEventListener('click',e=>{E.setCam.top=!E.setCam.top;e.currentTarget.setAttribute('aria-pressed',String(E.setCam.top));markBusy(100)});
const hint=$('#stHint');let hintGone=false;function hideHint(){if(!hintGone){hintGone=true;hint.style.opacity=0}}
setTimeout(hideHint,12000);

/* ---------- inspector tabs ---------- */
function showPane(name){labels.classList.toggle('props-on',name==='scene');$$('.insp-tabs button').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.pane===name)));$$('.insp-pane').forEach(p=>p.hidden=p.dataset.pane!==name)}
$$('.insp-tabs button').forEach(b=>b.addEventListener('click',()=>showPane(b.dataset.pane)));

/* ---------- lights ---------- */
const list=$('#lightList');
function selectLight(id){sel={kind:'light',id};E.select(id);E.selectProp(null);buildLists();buildTags();syncEditor();placeLabels()}
function buildLights(){list.innerHTML='';E.lights.forEach(l=>{const F=FIX[l.type];const row=document.createElement('div');row.className='lrow'+(sel.kind==='light'&&l.id===sel.id?' sel':'')+(l.on?'':' off');row.dataset.id=l.id;
  row.innerHTML=`<button type="button" class="lpick"><i style="--c:${kcss(l)}"></i><span class="nm">${esc(l.name)}</span><span class="ty">${F.label}</span><span class="va">${F.passive?Math.round(l.reflect*100)+'% bounce':Math.round(l.k)+'K · '+Math.round(l.int*100)+'%'}</span></button><button type="button" class="lsw" role="switch" aria-checked="${l.on}" aria-label="${esc(l.name)} on or off"></button>`;
  $('.lpick',row).addEventListener('click',()=>{selectLight(l.id);showPane('lights')});$('.lsw',row).addEventListener('click',()=>{l.on=!l.on;E.touchLight(l);E.invalidateShadows();markCustom();buildLights();buildTags();markBusy(80);syncReadouts()});list.appendChild(row)});
  $('#lightCount').textContent=E.lights.length+(E.lights.length===1?' light':' lights')}
const ed={type:$('#edType'),int:$('#edInt'),k:$('#edK'),soft:$('#edSoft'),beam:$('#edBeam'),h:$('#edH'),fea:$('#edFeather'),aim:$('#edAim'),hue:$('#edHue'),refl:$('#edRefl')};
Object.keys(FIX).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=FIX[k].label;ed.type.appendChild(o)});
function selL(){return sel.kind==='light'?E.lights.find(l=>l.id===sel.id):null}
function syncEditor(){const l=selL();$('#lightEd').hidden=!l;if(!l)return;const F=FIX[l.type];
  $('#edName').textContent=l.name;ed.type.value=l.type;ed.int.value=l.int;ed.k.value=l.k;ed.soft.value=l.soft;ed.beam.value=l.beam||30;ed.h.value=l.h;ed.fea.value=l.feather||0;ed.aim.value=l.target;ed.refl.value=l.reflect;
  $('#rowSoft').hidden=!F.soft;$('#rowBeam').hidden=!F.beam;$('#rowHue').hidden=!F.rgb;$('#rowRefl').hidden=!F.passive;$('#rowInt').hidden=!!F.passive;$('#rowK').hidden=!!F.passive;$('#rowFea').hidden=!!F.wall;
  ed.aim.querySelector('[value=face2]').disabled=!E.people[1];if(F.rgb)ed.hue.value=l.hueV==null?0:l.hueV;outs()}
function outs(){const l=selL();if(!l)return;$('#oInt').textContent=Math.round(l.int*100)+'%';$('#oK').textContent=Math.round(l.k/50)*50+'K';$('#oSoft').textContent=l.soft<.25?'Hard':l.soft<.55?'Medium':l.soft<.85?'Soft':'Very soft';$('#oBeam').textContent=Math.round(l.beam||30)+'°';
  $('#oH').textContent=l.h.toFixed(2)+' m';$('#oFea').textContent=(l.feather>0?'+':'')+Math.round(l.feather||0)+'°';$('#oRefl').textContent=Math.round(l.reflect*100)+'%';$('#oHue').textContent=l.hueV?hueName(l.hueV):'White'}
function hueName(v){return v<.08?'White':v<.25?'Amber':v<.45?'Green':v<.62?'Cyan':v<.8?'Blue':'Magenta'}
function hueRGB(v){if(v<.02)return null;const h=(v*360+20)%360,s=.85;const f=n=>{const k=(n+h/60)%6;return 1-s*Math.max(0,Math.min(k,4-k,1))};return [f(5),f(3),f(1)]}
function bind(el,fn){el.addEventListener('input',()=>{const l=selL();if(!l)return;fn(l,+el.value);E.touchLight(l);markCustom();outs();buildListVals();markBusy();syncReadouts()})}
bind(ed.int,(l,v)=>l.int=v);bind(ed.k,(l,v)=>l.k=v);bind(ed.soft,(l,v)=>l.soft=v);bind(ed.beam,(l,v)=>l.beam=v);bind(ed.h,(l,v)=>l.h=v);bind(ed.fea,(l,v)=>l.feather=v);bind(ed.refl,(l,v)=>l.reflect=v);bind(ed.hue,(l,v)=>{l.hueV=v;l.rgb=hueRGB(v)});
ed.aim.addEventListener('change',()=>{const l=selL();if(!l)return;l.target=ed.aim.value;E.touchLight(l);markCustom();markBusy(150)});
ed.type.addEventListener('change',()=>{const l=selL();if(!l)return;const keep={name:l.name,x:l.x,z:l.z,h:l.h,int:l.int,k:l.k,soft:l.soft,on:l.on,target:l.target,feather:l.feather};E.removeLight(l.id);const n=E.addLight(ed.type.value,Object.assign(keep,FIX[ed.type.value].beam?{beam:30}:{}));selectLight(n.id);markCustom();markBusy(150);syncReadouts()});
$('#edDel').addEventListener('click',()=>{const l=selL();if(!l)return;E.removeLight(l.id);selectLight(E.lights[0]?E.lights[0].id:null);markCustom();markBusy(150);syncReadouts()});
function buildListVals(){$$('.lrow',list).forEach(r=>{const l=E.lights.find(x=>x.id===+r.dataset.id);if(!l)return;const F=FIX[l.type];$('.va',r).textContent=F.passive?Math.round(l.reflect*100)+'% bounce':Math.round(l.k)+'K · '+Math.round(l.int*100)+'%';$('i',r).style.setProperty('--c',kcss(l))});$$('.tag[data-kind=light]',labels).forEach(t=>{const l=E.lights.find(x=>x.id===+t.dataset.id);if(l)$('i',t).style.setProperty('--c',kcss(l))})}
const addMenu=$('#addMenu'),propMenu=$('#propMenu');const LNAMES={octa:'Key',softbox:'Soft light',strip:'Strip',fresnel:'Fresnel',tube:'Tube',lantern:'Lantern',bounce:'Bounce',bgspot:'BG spot',window:'Window'};
Object.keys(FIX).forEach(k=>{const b=document.createElement('button');b.type='button';b.textContent=FIX[k].label;b.addEventListener('click',()=>{addMenu.hidden=true;if(E.lights.length>=9){toast('Nine lights is the limit on this set.');return}
  const H=E.HEAD;const ang=(Math.random()*.9+.35)*(Math.random()<.5?-1:1)*Math.PI*.55;const r=1.35;
  const n=E.addLight(k,{name:LNAMES[k]||FIX[k].short,x:H[0]+Math.sin(ang)*r,z:H[2]+Math.cos(ang)*r,h:k==='bgspot'?.35:k==='bounce'?H[1]-.2:k==='window'?1.4:H[1]+.45,int:.6,k:k==='window'?6000:5600,beam:FIX[k].beam?30:null,target:k==='bgspot'?'wall':'face'});
  if(k==='window'){n.x=E.room.left;n.z=0;E.touchLight(n)}selectLight(n.id);markCustom();markBusy(200);syncReadouts();if(E.view.main!=='set')toast('Added. Switch to the Set view to drag it into place.')});addMenu.appendChild(b)});
$('#addLight').addEventListener('click',e=>{addMenu.hidden=!addMenu.hidden;e.stopPropagation()});
document.addEventListener('click',e=>{if(!addMenu.hidden&&!e.target.closest('#addMenu,#addLight'))addMenu.hidden=true;if(!propMenu.hidden&&!e.target.closest('#propMenu,#addProp'))propMenu.hidden=true});

/* ---------- camera ---------- */
const cf={f:$('#cF'),T:$('#cT'),h:$('#cH'),wb:$('#cWB'),iso:$('#cISO')};const TSTOPS=[1.4,2,2.8,4,5.6,8,11];
function syncCam(){const c=E.S.cam;if(document.activeElement!==cf.f)cf.f.value=c.f;const ti=TSTOPS.indexOf(c.T);if(document.activeElement!==cf.T)cf.T.value=ti<0?2:ti;if(document.activeElement!==cf.h)cf.h.value=c.h;if(document.activeElement!==cf.wb)cf.wb.value=c.wb;cf.iso.value=c.iso;
  $('#oF').textContent=Math.round(c.f)+' mm';$('#oT').textContent='T'+c.T;$('#oCH').textContent=c.h.toFixed(2)+' m';$('#oWB').textContent=Math.round(c.wb/50)*50+'K';syncHud()}
cf.f.addEventListener('input',()=>{E.S.cam.f=+cf.f.value;markCustom();syncCam();syncReadouts();markBusy()});
cf.T.addEventListener('input',()=>{E.S.cam.T=TSTOPS[+cf.T.value];markCustom();syncCam();markBusy()});
cf.h.addEventListener('input',()=>{E.S.cam.h=+cf.h.value;markCustom();syncCam();markBusy()});
cf.wb.addEventListener('input',()=>{E.S.cam.wb=+cf.wb.value;markCustom();syncCam();markBusy()});
cf.iso.addEventListener('change',()=>{E.S.cam.iso=+cf.iso.value;markCustom();syncCam();markBusy()});
$('#cFocus').addEventListener('change',e=>{E.S.focus=+e.target.value;markBusy(100)});
$('#fcTog').addEventListener('click',e=>{E.S.fc=!E.S.fc;e.currentTarget.setAttribute('aria-pressed',String(E.S.fc));stage.classList.toggle('fc',E.S.fc);markBusy(60)});

/* ---------- talent ---------- */
function shiftForEye(old){const dh=E.HEAD[1]-old;if(Math.abs(dh)<.005)return;E.lights.forEach(l=>{if(!((l.target==='wall'&&l.h<.8)||l.target==='down'))l.h=clamp(l.h+dh,.2,2.7)});E.S.cam.h=clamp(E.S.cam.h+dh,.5,2.2);syncCam();syncEditor()}
function buildPick(el,slot){el.innerHTML='';PEOPLE.forEach(p=>{const b=document.createElement('button');b.type='button';b.dataset.pid=p.id;b.innerHTML=`<i style="--c:${p.c}"></i><span>${esc(p.label)}</span>`;b.title=p.desc;
  b.addEventListener('click',async()=>{const P=E.people[slot];if(P&&P.pid===p.id)return;const old=E.HEAD[1];$$('button',el).forEach(x=>x.disabled=true);
    try{await E.setPerson(slot,p.id,slot&&!P?{x:E.HEAD[0]-1.15,z:E.HEAD[2]+.45,ry:1.15}:{})}catch(err){console.warn(err);toast('That person could not load.')}
    $$('button',el).forEach(x=>x.disabled=false);if(slot===0)shiftForEye(old);E.lights.forEach(l=>E.touchLight(l));markCustom();syncTalent();buildTags();markBusy(300);syncReadouts()});el.appendChild(b)})}
buildPick($('#pickA'),0);buildPick($('#pickB'),1);
const SEATCOLS=['#3a2418','#23272e','#5a4632','#6b2e2a','#1b1b1b','#7d7466'];
const seatColEl=$('#seatColA');SEATCOLS.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='sw';b.style.setProperty('--c',c);b.setAttribute('aria-label','Seat colour '+c);b.addEventListener('click',()=>{if(!E.people[0])return;E.setPerson(0,null,{seatColor:c});markCustom();syncTalent();markBusy(150)});seatColEl.appendChild(b)});
$('#seatA').addEventListener('change',e=>{E.setPerson(0,null,{seat:e.target.value});markCustom();markBusy(150)});
$('#seatB').addEventListener('change',e=>{if(E.people[1]){E.setPerson(1,null,{seat:e.target.value});markCustom();markBusy(150)}});
$('#togB').addEventListener('click',async()=>{if(E.people[1]){E.removePerson(1);E.lights.forEach(l=>{if(l.target==='face2'){l.target='face';E.touchLight(l)}})}else{try{await E.setPerson(1,'f07',{x:E.HEAD[0]-1.15,z:E.HEAD[2]+.45,ry:1.15,seat:'chair'})}catch(err){toast('That person could not load.')}}markCustom();syncTalent();buildTags();markBusy(300)});
function selectPerson(i){sel={kind:'person',id:i};E.select(null);E.selectProp(null);buildTags();placeLabels();showPane('talent')}
function syncTalent(){const A=E.people[0],B=E.people[1];$$('#pickA button').forEach(b=>b.setAttribute('aria-pressed',String(!!A&&b.dataset.pid===A.pid)));$$('#pickB button').forEach(b=>b.setAttribute('aria-pressed',String(!!B&&b.dataset.pid===B.pid)));
  $('#seatA').value=A?A.seat:'armchair';$$('.sw',seatColEl).forEach((b,i)=>b.setAttribute('aria-pressed',String(!!A&&(A.seatColor||(PROPS[A.seat]&&PROPS[A.seat].color))===SEATCOLS[i])));
  $('#paneB').hidden=!B;$('#togB').setAttribute('aria-pressed',String(!!B));$('#togB').textContent=B?'Remove second person':'Add second person';if(B)$('#seatB').value=B.seat;
  $('#cFocus').querySelector('[value="1"]').disabled=!B;if(!B&&E.S.focus===1){E.S.focus=0;$('#cFocus').value='0'}}

/* ---------- room ---------- */
const FINS=['Paint','Panels','Brick','Concrete','Wood slats','Drapes','Wallpaper'],FLOORS=['Wood','Concrete','Carpet'];
const WALLS=[['Charcoal','#2a2622'],['Slate','#262c30'],['Teal','#1f3336'],['Oxblood','#3a1f1b'],['Sand','#6b5a48'],['Light grey','#8d8b87'],['Warm white','#c9c1b3'],['Navy','#1c2433']];
const FLOORCOLS={0:[['Oak','#b3b3b3'],['Light oak','#e6dccb'],['Walnut','#7a6a5a'],['Ebony','#4a4440']],1:[['Grey','#6b6862'],['Dark','#3a3530'],['Light','#a39f97']],2:[['Rust','#6b3322'],['Charcoal','#2b2826'],['Oatmeal','#8a7d68'],['Navy','#23304a']]};
const finEl=$('#sFin');FINS.forEach((n,i)=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=n;b.addEventListener('click',()=>{E.room.fin=i;markCustom();syncScene();markBusy(80)});finEl.appendChild(b)});
const wl=$('#sWalls');WALLS.forEach(([n,c])=>{const b=document.createElement('button');b.type='button';b.className='sw';b.style.setProperty('--c',c);b.title=n;b.setAttribute('aria-label',n+' walls');b.addEventListener('click',()=>{E.room.wall=c;syncScene();markCustom();markBusy(60)});wl.appendChild(b)});
const flEl=$('#sFloor');FLOORS.forEach((n,i)=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=n;b.addEventListener('click',()=>{E.room.floor=i;E.room.floorCol=FLOORCOLS[i][0][1];markCustom();syncScene();markBusy(80)});flEl.appendChild(b)});
const flc=$('#sFloorCol');
const hz=$('#sHaze');hz.addEventListener('input',()=>{E.S.haze=+hz.value;$('#oHaze').textContent=Math.round(E.S.haze*100)+'%';markBusy()});
const dep=$('#sDepth');dep.addEventListener('input',()=>{E.room.back=-(+dep.value);E.buildRoom();$('#oDepth').textContent=(+dep.value).toFixed(1)+' m';markCustom();markBusy()});
$('#sRight').addEventListener('click',()=>{E.room.rightOn=!E.room.rightOn;E.buildRoom();markCustom();syncScene();markBusy(100)});
function syncScene(){hz.value=E.S.haze;$('#oHaze').textContent=Math.round(E.S.haze*100)+'%';$$('.chip',finEl).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===E.room.fin)));$$('.sw',wl).forEach((b,i)=>b.setAttribute('aria-pressed',String(WALLS[i][1]===E.room.wall)));
  $$('.chip',flEl).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===E.room.floor)));flc.innerHTML='';(FLOORCOLS[E.room.floor]||[]).forEach(([n,c])=>{const b=document.createElement('button');b.type='button';b.className='sw';b.style.setProperty('--c',c);b.title=n;b.setAttribute('aria-label',n+' floor');b.setAttribute('aria-pressed',String(c===E.room.floorCol));b.addEventListener('click',()=>{E.room.floorCol=c;syncScene();markCustom();markBusy(60)});flc.appendChild(b)});
  dep.value=-E.room.back;$('#oDepth').textContent=(-E.room.back).toFixed(1)+' m';$('#sRight').setAttribute('aria-pressed',String(E.room.rightOn))}

/* ---------- props ---------- */
const plist=$('#propList');
const groups={};Object.keys(PROPS).forEach(k=>{const g=PROPS[k].group||'Other';(groups[g]=groups[g]||[]).push(k)});
Object.keys(groups).forEach(g=>{const h=document.createElement('span');h.className='grp';h.textContent=g;propMenu.appendChild(h);groups[g].forEach(k=>{const b=document.createElement('button');b.type='button';b.textContent=PROPS[k].label;
  b.addEventListener('click',()=>{propMenu.hidden=true;if(E.props.length>=24){toast('That is a full set. Remove something first.');return}const D=PROPS[k];const H=E.HEAD;
    const p=E.addProp(k,D.wall?{x:H[0]+(Math.random()-.5)*1.6,z:E.room.back}:{x:H[0]+(Math.random()<.5?-1:1)*(.8+Math.random()*.6),z:H[2]-(.4+Math.random()*1)});selectProp(p.id);markCustom();markBusy(200);if(E.view.main!=='set')toast('Added. Switch to the Set view to drag it into place.')});propMenu.appendChild(b)})});
$('#addProp').addEventListener('click',e=>{propMenu.hidden=!propMenu.hidden;e.stopPropagation()});
function selP(){return sel.kind==='prop'?E.props.find(p=>p.id===sel.id):null}
function selectProp(id){sel={kind:'prop',id};E.select(null);E.selectProp(id);buildLists();buildTags();syncPropEd();placeLabels();showPane('scene')}
function buildProps(){plist.innerHTML='';E.props.forEach(p=>{const D=PROPS[p.type];const row=document.createElement('div');row.className='lrow'+(sel.kind==='prop'&&p.id===sel.id?' sel':'');
  row.innerHTML=`<button type="button" class="lpick"><i style="--c:${p.color}"></i><span class="nm">${esc(D.label)}</span><span class="ty">${D.group||''}</span><span class="va">${D.lamp?(p.on?'On':'Off'):''}</span></button>`;
  $('.lpick',row).addEventListener('click',()=>selectProp(p.id));plist.appendChild(row)});$('#propCount').textContent=E.props.length+(E.props.length===1?' prop':' props')}
function syncPropEd(){const p=selP();$('#propEd').hidden=!p;if(!p)return;const D=PROPS[p.type];$('#pedName').textContent=D.label;
  const cols=$('#pedCols');cols.innerHTML='';(D.colors||[D.color]).forEach(c=>{const b=document.createElement('button');b.type='button';b.className='sw';b.style.setProperty('--c',c);b.setAttribute('aria-label','Colour '+c);b.setAttribute('aria-pressed',String(c===p.color));b.addEventListener('click',()=>{p.color=c;E.touchProp(p,true);markCustom();syncPropEd();buildProps();buildTags();markBusy(80)});cols.appendChild(b)});
  $('#pRowH').hidden=!D.wall||p.type==='curtain';$('#pedH').value=p.y||0;$('#opH').textContent=(p.y||0).toFixed(2)+' m';
  $('#pLamp').hidden=!D.lamp;$('#pedOn').setAttribute('aria-pressed',String(!!p.on));$('#pedOn').textContent=p.on?'Lamp on':'Lamp off';$('#pedInt').value=p.int==null?1:p.int;$('#opInt').textContent=Math.round((p.int==null?1:p.int)*100)+'%';
  $('#pRowK').hidden=!!(D.lamp&&D.lamp.neon);$('#pedK').value=p.k||2700;$('#opK').textContent=Math.round((p.k||2700)/50)*50+'K';$('.rot').hidden=!!D.wall}
$('#pedRotL').addEventListener('click',()=>{const p=selP();if(!p)return;p.ry=(p.ry||0)+Math.PI/12;E.touchProp(p);markCustom();markBusy(100)});
$('#pedRotR').addEventListener('click',()=>{const p=selP();if(!p)return;p.ry=(p.ry||0)-Math.PI/12;E.touchProp(p);markCustom();markBusy(100)});
$('#pedH').addEventListener('input',e=>{const p=selP();if(!p)return;p.y=+e.target.value;E.touchProp(p);$('#opH').textContent=p.y.toFixed(2)+' m';markCustom();markBusy()});
$('#pedOn').addEventListener('click',()=>{const p=selP();if(!p)return;p.on=!p.on;E.touchProp(p);markCustom();syncPropEd();buildProps();markBusy(80)});
$('#pedInt').addEventListener('input',e=>{const p=selP();if(!p)return;p.int=+e.target.value;p.on=true;E.touchProp(p);$('#opInt').textContent=Math.round(p.int*100)+'%';markCustom();markBusy()});
$('#pedK').addEventListener('input',e=>{const p=selP();if(!p)return;p.k=+e.target.value;E.touchProp(p);$('#opK').textContent=Math.round(p.k/50)*50+'K';markCustom();markBusy()});
$('#pedDel').addEventListener('click',()=>{const p=selP();if(!p)return;E.removeProp(p.id);sel={kind:'prop',id:null};E.selectProp(null);markCustom();buildProps();buildTags();syncPropEd();markBusy(150)});

/* ---------- setups & references ---------- */
const setupEl=$('#setupChips');
Object.keys(SETUPS).forEach(n=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=n;b.addEventListener('click',()=>{curSetup=n;refActive=null;showRef(null);applyLights(SETUPS[n]);markSetup();markBusy(250)});setupEl.appendChild(b)});
function markSetup(){$$('.chip',setupEl).forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===curSetup)));$$('.refcard').forEach(b=>b.setAttribute('aria-pressed',String(!!refActive&&b.dataset.id===refActive)))}
function markCustom(){if(sceneBusy)return;if(curSetup!=='Custom'){curSetup='Custom';markSetup()}}
const refEl=$('#refCards'),upB=$('#refUploadBtn');
let REFS_ALL=Array.isArray(CFG.refs)?CFG.refs:REFS;
function buildRefs(){$$('.refcard',refEl).forEach(b=>b.remove());REFS_ALL.forEach(r=>{const b=document.createElement('button');b.type='button';b.className='refcard';b.dataset.id=r.id;b.innerHTML=`<img src="${esc(r.img)}" alt="Reference frame: ${esc(r.title)}" loading="lazy"><span>${esc(r.title)}</span>`;
  b.addEventListener('click',async()=>{refActive=r.id;curSetup=r.title;showRef({src:r.img,title:r.title,note:r.note||''});markSetup();setView('monitor');await applyScene(r.scene||DEFAULT_SCENE);curSetup=r.title;markSetup();markBusy(300)});refEl.insertBefore(b,upB)});markSetup()}
buildRefs();
const refBox=$('#stRef'),refImg=$('#stRefImg'),refNote=$('#refNote'),cmpImg=$('#stCmpImg');
function showRef(r){if(!r){refBox.hidden=true;refNote.hidden=true;return}refImg.src=r.src;cmpImg.src=r.src;refBox.hidden=false;$('#stRefT').textContent=r.title;refNote.hidden=false;refNote.innerHTML=`<b>${esc(r.title)}</b> ${esc(r.note)}`}
refBox.addEventListener('pointerdown',e=>{e.stopPropagation();stage.classList.add('comparing')});
['pointerup','pointerleave','pointercancel'].forEach(ev=>refBox.addEventListener(ev,()=>stage.classList.remove('comparing')));
refBox.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();stage.classList.add('comparing')}});refBox.addEventListener('keyup',()=>stage.classList.remove('comparing'));

/* ---------- still ---------- */
const stillsEl=$('#stills');let shots=0;
$('#stSnap').addEventListener('click',()=>{const pm=E.view.main,pp=E.view.pip;E.view.main='monitor';E.view.pip=false;E.render(1);const lay=E.layout();const [x,y,w,h]=lay.main;
  const c=document.createElement('canvas');const sw=Math.min(w,1600);c.width=sw;c.height=Math.round(sw*h/w);c.getContext('2d').drawImage(canvas,x,canvas.height-y-h,w,h,0,0,c.width,c.height);
  E.view.main=pm;E.view.pip=pp;E.render(1);placeLabels();const url=c.toDataURL('image/jpeg',.9);shots++;
  const fl=$('#stFlash');fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');
  const cm=E.S.cam,label=`${Math.round(cm.f)}mm · T${cm.T} · ${curSetup}`,n=shots;const b=document.createElement('button');b.type='button';b.className='still';b.innerHTML=`<img src="${url}" alt="Still ${n}: ${esc(label)}"><span>#${String(n).padStart(2,'0')} · ${esc(label)}</span>`;
  b.addEventListener('click',()=>{if(window.__openLB)window.__openLB({src:url,k:'Still #'+n,c:label})});const em=$('.empty',stillsEl);if(em)em.remove();stillsEl.prepend(b);while(stillsEl.children.length>8)stillsEl.lastChild.remove()});

/* ---------- readouts / HUD ---------- */
function syncHud(){const c=E.S.cam;$('#hudLens').textContent=Math.round(c.f)+'MM · T'+c.T+' · ISO '+c.iso;$('#hudWB').textContent='WB '+Math.round(c.wb/50)*50+'K'}
function syncReadouts(){const key=E.lights.find(l=>l.on&&/key/i.test(l.name))||E.lights.find(l=>l.on&&!FIX[l.type].passive);const H=E.HEAD;
  const inc=l=>{if(!l||!l.on)return 0;const d2=(l.x-H[0])**2+(l.h-H[1])**2+(l.z-H[2])**2;return FIX[l.type].passive?0:l.int*FIX[l.type].power/d2};
  let r='';if(key){const Ek=inc(key);let Ef=0;const ka=Math.atan2(key.x-H[0],key.z-H[2]);E.lights.forEach(l=>{if(l===key||!l.on)return;const a=Math.atan2(l.x-H[0],l.z-H[2]);let dd=Math.abs(((a-ka)*180/Math.PI+540)%360-180);if(dd>60&&l.z>H[2]-.2){Ef+=FIX[l.type].passive?Ek*l.reflect*.35:inc(l)}});
    r=Ef<Ek*.02?'No fill':(()=>{const q=(Ek+Ef)/Ef;return `${q<10?q.toFixed(1):Math.round(q)}:1 · ${Math.log2(q).toFixed(1)} stops`})();
    const ca=Math.atan2(E.S.cam.x-H[0],E.S.cam.z-H[2]);let dg=(ka-ca)*180/Math.PI;dg=((dg+540)%360)-180;$('#roKey').textContent=`${key.name}: ${Math.abs(Math.round(dg))}° camera ${dg<0?'left':'right'}, ${(key.h-H[1]>=0?'+':'')+(key.h-H[1]).toFixed(2)} m`}else $('#roKey').textContent='No key light';
  $('#roRatio').textContent=r||'–';$('#hudRatio').textContent=r?'KEY:FILL '+r.split(' · ')[0].toUpperCase():'';
  const dist=Math.hypot(E.S.cam.x-H[0],E.S.cam.h-H[1],E.S.cam.z-H[2]),hf=2*Math.atan(18/E.S.cam.f)*180/Math.PI;$('#roCam').textContent=`${Math.round(E.S.cam.f)} mm at ${dist.toFixed(1)} m · ${Math.round(hf)}° horizontal view`}
function buildLists(){buildLights();buildProps()}
function syncAll(){buildLists();buildTags();syncEditor();syncPropEd();syncCam();syncScene();syncTalent();syncReadouts();markSetup()}

/* ---------- photo -> full scene (Claude) ---------- */
const up=$('#refUpload'),upNote=$('#refUpNote');let sample=null,imgLim=null;
(async()=>{try{if(!window.claude||!claude.use)throw 0;sample=await claude.use('sample');const lim=sample?await sample.limits().catch(()=>null):null;if(!sample||!lim||!lim.images)throw 0;imgLim=lim.images;
  up.accept=lim.images.mediaTypes.join(',');upB.hidden=false;upNote.textContent='Upload any still: Claude rebuilds the room, props, people, lens and lighting here, then you can change everything. Uses your Claude account.';}
  catch(_){upB.hidden=true;upNote.textContent=CFG.upNoteOff!=null?CFG.upNoteOff:''}})();
upB.addEventListener('click',()=>up.click());
const busyEl=$('#stBusy');let ctl=null;
const PCAT=Object.keys(PROPS).map(k=>`${k} (${PROPS[k].label}${PROPS[k].wall?', wall-mounted':''}${PROPS[k].small?', sits on a table':''})`).join('; ');
function scenePrompt(){return `You are a cinematographer's assistant rebuilding a film set. The image is a reference still. Work out the room, the furniture and objects, the people, the camera and the lighting so it can be recreated on a virtual set.
Coordinates (metres, seen from the camera): the main person (talent A) sits at x=0, z=0. x is left/right from the camera's view (negative = camera left). z is depth (negative = further from camera, behind the talent; positive = toward the camera). Light angles: azimuth measured around the talent from the camera position (0 = next to the camera, -45 = camera left, +90 = camera right, 180 = behind); elevation in degrees above the talent's eye line.
Available people (pick the closest match for each visible person): ${PEOPLE.map(p=>p.id+' = '+p.desc).join('; ')}.
Available props: ${PCAT}. Use only these type names; approximate anything else with the nearest one (a lamp on a desk = tablelamp, a picture or poster = art, a monitor = tv, a microphone = mic; for a visible window use a "window" light instead of a prop).
Reply with ONLY one JSON object, no prose, exactly these fields:
{"summary": string (2 short sentences on the look and the set),
 "camera": {"focal_mm": 18-135, "t_stop": 1.4-11, "height": "low"|"eye"|"high", "distance_m": 1-4, "wb_k": 3000-7500, "x_m": number (camera's sideways offset, usually -1..1)},
 "room": {"back_wall_distance_m": 1.2-4.5, "wall_finish": "paint"|"panels"|"brick"|"concrete"|"wood"|"drapes"|"wallpaper", "wall_hex": "#rrggbb" (as it appears), "side_walls": "none"|"left"|"right"|"both", "floor": "wood"|"concrete"|"carpet", "floor_hex": "#rrggbb", "haze": 0-1},
 "people": [ 1 or 2 objects {"match": person id, "x_m": number, "z_m": number, "facing_deg": number (0 = facing the camera, positive = turned toward camera right, 180 = back to camera), "seat": "armchair"|"chair"|"sofa"|"none", "seat_hex": "#rrggbb"} ] (talent A first, at 0,0),
 "props": [ up to 14 objects {"type": prop name, "x_m": number, "z_m": number, "rotation_deg": number, "hex": "#rrggbb" (main colour), "height_m": number (only for wall-mounted items: centre height), "lit": boolean (lamps and neon), "cct_k": number (lamps)} ],
 "lights": [ up to 6 objects {"role": "key"|"fill"|"hair"|"rim"|"kicker"|"background"|"bounce", "fixture": "octabox"|"softbox"|"strip"|"fresnel"|"tube"|"lantern"|"bounce"|"background_spot"|"window", "azimuth_deg": number, "elevation_deg": number, "distance_m": 0.6-3, "stops_below_key": 0-6, "cct_k": 2700-7500, "softness": 0-1, "beam_deg": 10-60, "aimed_at": "subject"|"wall"} ] }
Include only what is visible or clearly implied. Put wall-mounted props at the wall's depth. The key light comes first.`}
up.addEventListener('change',async()=>{const f=up.files&&up.files[0];if(!f||!sample)return;if(imgLim&&imgLim.maxInputBytes&&f.size>imgLim.maxInputBytes){toast('That file is too large. Try a smaller JPEG or PNG.');up.value='';return}const url=URL.createObjectURL(f);
  busyEl.hidden=false;busyEl.querySelector('span').textContent='Reading your still…';ctl=new AbortController();
  try{const j=await sample.json(scenePrompt(),{images:[f],signal:ctl.signal,onText:()=>{busyEl.querySelector('span').textContent='Building the set…'}});
    const sc=sceneFromJSON(j);refActive='upload';curSetup='Your still';showRef({src:url,title:'Your still',note:(j&&j.summary)||'Recreated from your reference.'});setView('monitor');await applyScene(sc);curSetup='Your still';markSetup();markBusy(300)}
  catch(e){const code=e&&e.code;const HIDE=['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed','images_unavailable'];
    if(HIDE.includes(code)){upB.hidden=true;upNote.textContent='Claude is not available to this page for you, so upload matching is off. The frames above still work.';toast('Claude access is off for this page, so the still could not be read.')}
    else if(code!=='cancelled'){toast(code==='image_rejected'?'That image could not be read. Try a JPEG or PNG.':code==='rate_limited'?'Too many requests just now. Try again in a minute.':code==='session_expired'?'Your Claude session expired. Sign in again, then retry.':code==='invalid_json'||code==='empty_completion'?'Could not turn that still into a set. Try again or use another frame.':code==='refused'?'Claude would not read that image. Try a different still.':'Could not read that still. Try again in a moment.')}
    URL.revokeObjectURL(url)}
  finally{busyEl.hidden=true;up.value='';ctl=null}});
$('#stBusyStop').addEventListener('click',()=>{if(ctl)ctl.abort()});
const num=v=>typeof v==='number'&&isFinite(v);const hex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:null;
function sceneFromJSON(j){j=j||{};const cam=j.camera||{},rm=j.room||{};
  const dist=clamp(num(cam.distance_m)?cam.distance_m:1.9,1,3.8),f=clamp(num(cam.focal_mm)?cam.focal_mm:50,18,135);const hh=cam.height==='high'?1.55:cam.height==='low'?.85:EYE0;
  const T=[1.4,2,2.8,4,5.6,8,11].reduce((a,b)=>Math.abs(b-(cam.t_stop||2.8))<Math.abs(a-(cam.t_stop||2.8))?b:a,2.8);
  const cx=clamp(num(cam.x_m)?cam.x_m:.15,-1.4,1.4);
  const sc={cam:{x:cx,z:dist,h:hh,f,T,wb:clamp(num(cam.wb_k)?cam.wb_k:5600,2800,7500)},haze:clamp(num(rm.haze)?rm.haze:.1,0,.8),lights:[],props:[],people:[]};
  const back=-clamp(num(rm.back_wall_distance_m)?rm.back_wall_distance_m:2.3,1.2,4.5);const sw=rm.side_walls||'left';
  const finMap={paint:0,panels:1,brick:2,concrete:3,wood:4,drapes:5,wallpaper:6},flMap={wood:0,concrete:1,carpet:2};
  sc.room={back,left:sw==='left'||sw==='both'?-2.4:-4.2,right:2.4,rightOn:sw==='right'||sw==='both',wall:hex(rm.wall_hex)||'#2a2622',fin:finMap[rm.wall_finish]!=null?finMap[rm.wall_finish]:0,floor:flMap[rm.floor]!=null?flMap[rm.floor]:0};
  sc.room.floorCol=sc.room.floor===0?'#b3b3b3':(hex(rm.floor_hex)||(sc.room.floor===1?'#6b6862':'#6b3322'));
  (Array.isArray(j.props)?j.props:[]).forEach(p=>{if(!p||!PROPS[p.type]||!PROPS[p.type].wall||!num(p.x_m))return;if(p.x_m<-1.5)sc.room.left=Math.max(-4.2,Math.min(sc.room.left,p.x_m-.05));if(p.x_m>1.5){sc.room.rightOn=true;sc.room.right=Math.min(4.5,Math.max(sc.room.right,p.x_m+.05))}});
  (Array.isArray(j.people)?j.people:[]).slice(0,2).forEach((p,i)=>{if(!p)return;const pid=PMAP[p.match]?p.match:'m07';const x=i?clamp(num(p.x_m)?p.x_m:-1.1,-3,3):0,z=i?clamp(num(p.z_m)?p.z_m:.4,back+.6,3):0;
    const face=num(p.facing_deg)?p.facing_deg:(i?-60:0);sc.people.push({pid,x,z,ry:face*Math.PI/180,seat:['armchair','chair','sofa','none'].includes(p.seat)?p.seat:'armchair',seatColor:hex(p.seat_hex)})});
  if(!sc.people.length)sc.people.push({pid:'m07',x:0,z:0,ry:0,seat:'armchair'});
  (Array.isArray(j.props)?j.props:[]).slice(0,16).forEach(p=>{if(!p||!PROPS[p.type])return;const D=PROPS[p.type];const o={x:clamp(num(p.x_m)?p.x_m:0,-4,4.4),z:clamp(num(p.z_m)?p.z_m:back+.3,back+.05,3),ry:num(p.rotation_deg)?p.rotation_deg*Math.PI/180:0};
    const c=hex(p.hex);if(c)o.color=c;if(D.wall&&num(p.height_m))o.y=clamp(p.height_m,.4,2.4);if(D.lamp){o.on=p.lit!==false;o.k=clamp(num(p.cct_k)?p.cct_k:2700,1900,6500);o.int=1}
    if(Math.hypot(o.x,o.z)<.45&&!D.wall&&!D.small&&!D.flat)return;sc.props.push(Object.assign({type:p.type},o))});
  const map={octabox:'octa',softbox:'softbox',strip:'strip',fresnel:'fresnel',tube:'tube',lantern:'lantern',bounce:'bounce',background_spot:'bgspot',window:'window'};
  const camAz=Math.atan2(cx,dist);const keyInt=.8;
  (Array.isArray(j.lights)?j.lights:[]).slice(0,6).forEach((l,i)=>{if(!l)return;const type=map[l.fixture]||(l.role==='bounce'?'bounce':l.role==='background'?'bgspot':'softbox');
    const az=(num(l.azimuth_deg)?l.azimuth_deg:(i?60:-45))*Math.PI/180+camAz,el=clamp(num(l.elevation_deg)?l.elevation_deg:20,-30,75)*Math.PI/180,d=clamp(num(l.distance_m)?l.distance_m:1.4,.6,2.8);
    let x=Math.sin(az)*d*Math.cos(el),z=Math.cos(az)*d*Math.cos(el),h=EYE0+Math.sin(el)*d;const wall=l.aimed_at==='wall'||type==='bgspot';
    if(wall){z=Math.min(z,-.9);h=type==='bgspot'?.35:clamp(h,.3,2.3)}
    if(type==='window'){if(Math.abs(x)>Math.abs(z-back)){x=x<0?sc.room.left:(sc.room.rightOn?sc.room.right:sc.room.left)}else z=back;h=clamp(h,1.1,1.7)}
    x=clamp(x,-4,4.4);z=clamp(z,back+.05,3);h=clamp(h,.25,2.6);
    const stops=clamp(num(l.stops_below_key)?l.stops_below_key:(i?2:0),0,7);const int=clamp(keyInt*Math.pow(2,-stops)*(i?1.25:1),.04,1);
    const names={key:'Key',fill:'Fill',hair:'Hair',rim:'Rim',kicker:'Kicker',background:'Background',bounce:'Bounce'};
    sc.lights.push(L(type,type==='window'?'Window':names[l.role]||('Light '+(i+1)),x,z,h,int,clamp(num(l.cct_k)?l.cct_k:5600,2700,7500),{soft:clamp(num(l.softness)?l.softness:.6,0,1),beam:clamp(num(l.beam_deg)?l.beam_deg:30,10,60),target:wall?'wall':'face',reflect:clamp(Math.pow(2,-stops)*2.4,.15,.95)}))});
  if(!sc.lights.length)sc.lights=SETUPS.Interview.lights;return sc}

/* ---------- toast ---------- */
const tst=$('#stToast');let tt=0;function toast(m){tst.textContent=m;tst.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>tst.classList.remove('on'),4200)}

/* ---------- intro: lights come up one by one ---------- */
let introDone=false,introWanted=false;
function maybeIntro(){introWanted=true;if(introDone||!ready)return;introDone=true;if(RM)return;
  const Ls=E.lights.slice();Ls.forEach(l=>{l.on=false});const lamps=E.props.filter(p=>PROPS[p.type].lamp&&p.on);lamps.forEach(p=>{p.on=false;E.touchProp(p)});E.invalidateShadows();buildLists();buildTags();
  let i=0;const step=()=>{if(i<Ls.length){Ls[i].on=true;E.touchLight(Ls[i]);i++}else if(i===Ls.length){lamps.forEach(p=>{p.on=true;E.touchProp(p)});i++}else return;
    E.invalidateShadows();buildLists();buildTags();markBusy(500);syncReadouts();setTimeout(step,420)};setTimeout(step,500)}

/* ---------- boot ---------- */
size();setView('monitor');requestAnimationFrame(loop);
(async()=>{try{await applyScene(CFG.scene||DEFAULT_SCENE)}catch(e){console.warn(e);toast('The set could not fully load.')}
  curSetup=(CFG.scene&&CFG.scene.title)||'Interview';markSetup();ready=true;E.dirty=true;if(introWanted&&visible)maybeIntro()})();
function snapshot(){const r=x=>Math.round(x*1000)/1000;return {room:Object.assign({},E.room),haze:E.S.haze,cam:Object.assign({},E.S.cam,{h:r(E.S.cam.h-eyeDelta())}),
  props:E.props.map(p=>({type:p.type,x:r(p.x),z:r(p.z),ry:r(p.ry||0),y:r(p.y||0),color:p.color,on:p.on,int:p.int,k:p.k})),
  people:E.people.filter(Boolean).map(P=>({pid:P.pid,x:r(P.x),z:r(P.z),ry:r(P.ry),seat:P.seat,seatColor:P.seatColor||null})),
  lights:E.lights.map(l=>({type:l.type,name:l.name,x:r(l.x),z:r(l.z),h:r(lightH(l,-eyeDelta())),int:l.int,k:l.k,soft:l.soft,beam:l.beam,target:l.target,feather:l.feather||0,rgb:l.rgb||null,hueV:l.hueV||0,reflect:l.reflect,on:l.on}))}}
async function matchStill(file){if(!sample)throw {code:'unavailable'};const j=await sample.json(scenePrompt(),{images:[file]});return {scene:sceneFromJSON(j),summary:(j&&j.summary)||''}}
window.__studio=E;window.__studioApp={applyScene,sceneFromJSON,snapshot,matchStill,PEOPLE,SETUPS,get REFS(){return REFS_ALL},setRefs(list){REFS_ALL=list;buildRefs()},get canMatch(){return !!sample&&!!imgLim}};
}
window.__bootSet=start;
const bio=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){bio.disconnect();start()}},{rootMargin:'1400px 0px'});bio.observe(sec);
})();
