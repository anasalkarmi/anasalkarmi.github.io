/* Site editor: change text, photos, videos and lists across the page, then save.
   On claude.ai it saves a new version of this artifact (content.json + uploaded files).
   Self-hosted, open the page with ?edit and "Save" downloads site-update.zip to unzip into the site folder. */
(()=>{
'use strict';
const SITE=window.SITE=window.SITE||{};SITE.text=SITE.text||{};SITE.media=SITE.media||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const NOEDIT='.set-grid,.st-controls,.hero-media,.hud,.frames,.monitor,.meta,.tl,.bay,.wall,.cases,.edl,.mq,#slate,.stills,.nav,.sheet,.lightbox,.btn,.btns,[data-noedit]';
const TEXTSEL='h1 span,h2,h3,h4,p,li,dt,dd,figcaption,.eyebrow>span:not(.bar):not(.tc),.stat b,.stat span,.hint,.dept-k,.best,.tag';
const ALLOW={B:1,STRONG:1,I:1,EM:1,MARK:1,BR:1,SUP:1,SUB:1,SMALL:1,SPAN:1};

/* ---------- 1. stamp editable slots and apply saved content ---------- */
function sanitize(html){const t=document.createElement('template');t.innerHTML=String(html);const out=document.createElement('div');
  (function walk(src,dst){src.childNodes.forEach(n=>{if(n.nodeType===3)dst.appendChild(document.createTextNode(n.nodeValue));else if(n.nodeType===1){if(ALLOW[n.tagName]){const e=document.createElement(n.tagName);if(n.className&&typeof n.className==='string'&&/^(out|tc|opt|r)$/.test(n.className))e.className=n.className;dst.appendChild(e);walk(n,e)}else walk(n,dst)}})})(t.content,out);return out.innerHTML}
function slotsIn(root){return $$(TEXTSEL,root).filter(el=>!el.closest(NOEDIT)&&!el.querySelector('[id],input,select,button,svg,img,video')&&!$$(TEXTSEL,el).some(x=>!x.closest(NOEDIT)))}
const areas=$$('main > section, body > footer');
areas.forEach((sec,si)=>{const id=sec.id||('s'+si);slotsIn(sec).forEach((el,i)=>{el.dataset.k=id+':'+i});
  $$('img,video',sec).filter(el=>!el.closest(NOEDIT)).forEach((el,i)=>{el.dataset.mk=id+':m'+i})});
const hv=$('#heroVid');if(hv)hv.dataset.mk='hero:video';const rp=$('.reel-poster');if(rp)rp.dataset.mk='showreel:poster';const pv=$('.pd-mon video');if(pv)pv.dataset.mk='pd:video';const gv=$('#gradeVid');if(gv)gv.dataset.mk='grade:video';
function applyText(el,html){el.innerHTML=sanitize(html);if(el.dataset.count!=null){const n=parseInt(el.textContent,10);if(!isNaN(n))el.dataset.count=n}}
function applyMedia(el,m){if(!m||!m.src)return;if(el.tagName==='VIDEO'){if(m.poster)el.poster=m.poster;el.src=m.src;try{el.load()}catch(_){}}else{el.src=m.src;el.removeAttribute('srcset')}}
Object.entries(SITE.text).forEach(([k,v])=>{const el=document.querySelector(`[data-k="${k}"]`);if(el)applyText(el,v)});
Object.entries(SITE.media).forEach(([k,v])=>{const el=document.querySelector(`[data-mk="${k}"]`);if(el)applyMedia(el,v)});

/* ---------- 2. who can edit ---------- */
let ART=null,DL=null,SAMPLE=null;const LOCAL=/[?&#]edit\b/.test(location.search+location.hash)&&!window.claude;

/* ---------- 3. UI ---------- */
const CSS=`
.cms-fab{position:fixed;left:16px;bottom:16px;z-index:120;display:inline-flex;align-items:center;gap:8px;font:500 13px/1 var(--f-body);background:var(--bone);color:var(--ink);border:0;border-radius:999px;padding:11px 16px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.cms-fab svg{width:14px;height:14px}
body.cms-on .cms-fab{display:none}
.cms-bar{position:fixed;left:50%;top:calc(var(--nav-h) + 10px);transform:translateX(-50%);z-index:130;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);background:rgba(17,15,13,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--tungsten);border-radius:12px;padding:8px 10px;box-shadow:0 18px 40px rgba(0,0,0,.5)}
.cms-bar b{font-family:var(--f-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tungsten-2);padding:0 6px}
.cms-bar button,.cms-btn{font:500 12.5px/1 var(--f-body);border:1px solid var(--line-2);background:var(--ink-2);color:var(--bone);border-radius:999px;padding:8px 12px;cursor:pointer}
.cms-bar button:hover,.cms-btn:hover{border-color:var(--bone)}
.cms-bar .go,.cms-btn.go{background:var(--tungsten);color:var(--ink);border-color:var(--tungsten)}
.cms-bar .n{font-family:var(--f-mono);font-size:11px;color:var(--ash)}
body.cms-on [data-k]{outline:1px dashed rgba(255,159,67,.55);outline-offset:3px;border-radius:2px;cursor:text}
body.cms-on [data-k]:hover,body.cms-on [data-k]:focus{outline:2px solid var(--tungsten);background:rgba(255,159,67,.06)}
body.cms-on [data-mk]{outline:2px dashed rgba(255,159,67,.8);outline-offset:-2px;cursor:copy}
.cms-drawer{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);z-index:140;background:var(--panel);border-left:1px solid var(--line-2);display:flex;flex-direction:column;box-shadow:-20px 0 50px rgba(0,0,0,.5);transform:translateX(105%);transition:transform .35s var(--ease)}
.cms-drawer.open{transform:none}
.cms-dh{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px;border-bottom:1px solid var(--line)}
.cms-dh h3{margin:0;font-family:var(--f-display);font-weight:800;font-size:24px;text-transform:uppercase;letter-spacing:.02em}
.cms-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line)}
.cms-tabs button{font:500 12px/1 var(--f-body);border:1px solid var(--line);background:none;color:var(--ash);border-radius:999px;padding:7px 10px;cursor:pointer}
.cms-tabs button[aria-pressed="true"]{background:var(--bone);color:var(--ink);border-color:var(--bone)}
.cms-body{flex:1;overflow:auto;padding:14px 16px 90px;display:grid;gap:12px;align-content:start}
.cms-body p.help{margin:0;font-size:12.5px;color:var(--ash)}
.cms-card{border:1px solid var(--line);border-radius:10px;background:var(--ink-2);padding:10px;display:grid;gap:8px}
.cms-card .row{display:flex;gap:8px;align-items:center}
.cms-card .grow{flex:1;min-width:0}
.cms-thumb{width:112px;flex:none;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#000;border:1px solid var(--line-2);position:relative;cursor:pointer;padding:0}
.cms-thumb img,.cms-thumb video{width:100%;height:100%;object-fit:cover;display:block}
.cms-thumb span{position:absolute;inset:auto 0 0 0;font:10px/1.4 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;background:rgba(0,0,0,.7);color:var(--bone);padding:2px 5px;text-align:center}
.cms-f{display:grid;gap:3px}
.cms-f label{font:10.5px/1 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.cms-f input,.cms-f textarea,.cms-f select{font:13px/1.4 var(--f-body);color:var(--bone);background:var(--ink);border:1px solid var(--line-2);border-radius:6px;padding:7px 9px;width:100%;min-width:0}
.cms-f textarea{min-height:120px;resize:vertical;font-family:var(--f-mono);font-size:12px}
.cms-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cms-icons{display:flex;gap:4px}
.cms-icons button{width:30px;height:30px;border-radius:50%;border:1px solid var(--line-2);background:var(--ink);color:var(--bone);cursor:pointer;font-size:13px;padding:0}
.cms-icons button:hover{border-color:var(--bone)}
.cms-icons .del:hover{border-color:var(--rec);color:var(--rec)}
.cms-foot{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line);background:var(--panel)}
.cms-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,10px);z-index:150;background:var(--bone);color:var(--ink);font:500 13px/1.4 var(--f-body);padding:9px 16px;border-radius:8px;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;max-width:min(92vw,520px);text-align:center}
.cms-toast.on{opacity:1;transform:translate(-50%,0)}
.cms-busy{position:fixed;inset:0;z-index:160;background:rgba(8,7,6,.7);display:grid;place-items:center;align-content:center;gap:12px;color:var(--bone);font:12px/1.5 var(--f-mono);letter-spacing:.1em;text-transform:uppercase;text-align:center;padding:20px}
.cms-busy::before{content:"";width:40px;height:40px;border-radius:50%;border:2px solid var(--line-2);border-top-color:var(--tungsten);animation:spin 1s linear infinite}
body.cms-drawer-open .cms-bar{left:calc((100vw - min(440px,100vw))/2)}
@media (max-width:700px){.cms-bar{top:auto;bottom:10px;left:8px;right:8px;transform:none;max-width:none;flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start}.cms-bar b,.cms-bar .n{display:none}.cms-bar button{flex:none}body.cms-drawer-open .cms-bar{display:none}.cms-toast{bottom:76px}.cms-grid2{grid-template-columns:1fr}}
`;
let st=null,fab=null,bar=null,drawer=null,toastEl=null,editing=false,dirty=false;
const pending=new Map();const objURLs=new Map();
function mountButton(){st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  fab=document.createElement('button');fab.type='button';fab.className='cms-fab';fab.innerHTML='<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9.5 1.5l3 3L5 12H2V9z"/></svg>Edit site';fab.addEventListener('click',startEdit);document.body.appendChild(fab);
  toastEl=document.createElement('div');toastEl.className='cms-toast';toastEl.setAttribute('role','status');document.body.appendChild(toastEl)}
let tt=0;function toast(m,ms){toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('on'),ms||4200)}
function busy(msg){const b=document.createElement('div');b.className='cms-busy';b.textContent=msg;document.body.appendChild(b);return {set:t=>b.textContent=t,done:()=>b.remove()}}
function markDirty(){dirty=true;if(bar)$('.n',bar).textContent='Unsaved changes'}
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

function startEdit(){if(editing)return;editing=true;document.body.classList.add('cms-on');
  bar=document.createElement('div');bar.className='cms-bar';bar.innerHTML=`<b>Editing</b><span class="n">Click any text to change it. Click a photo or video to replace it.</span><button type="button" data-p="media">Photos &amp; video</button><button type="button" data-p="projects">Projects</button><button type="button" data-p="more">Lists</button><button type="button" data-a="done">Close</button><button type="button" class="go" data-a="save">${ART?'Save':'Save (download)'}</button>`;
  document.body.appendChild(bar);bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.p)openDrawer(b.dataset.p==='more'?'clients':b.dataset.p);if(b.dataset.a==='save')save();if(b.dataset.a==='done')stopEdit()});
  $$('[data-k]').forEach(el=>{el.contentEditable='true';el.spellcheck=true;el.addEventListener('input',onText);el.addEventListener('keydown',onTextKey)});
  document.addEventListener('click',onMediaClick,true);toast('Edit mode is on. Changes stay in this browser until you press Save.')}
function stopEdit(){if(dirty&&!confirmLeave())return;editing=false;document.body.classList.remove('cms-on');$$('[data-k]').forEach(el=>{el.removeAttribute('contenteditable');el.removeEventListener('input',onText);el.removeEventListener('keydown',onTextKey)});
  document.removeEventListener('click',onMediaClick,true);if(bar){bar.remove();bar=null}closeDrawer()}
function confirmLeave(){return window.confirm?window.confirm('You have unsaved changes. Close the editor anyway? They stay on this page until you reload.'):true}
function onText(e){const el=e.currentTarget;SITE.text[el.dataset.k]=sanitize(el.innerHTML);if(el.dataset.count!=null){const n=parseInt(el.textContent,10);if(!isNaN(n))el.dataset.count=n}markDirty()}
function onTextKey(e){if(e.key==='Enter'&&!e.shiftKey&&!/^(LI|P|DD|FIGCAPTION)$/.test(e.currentTarget.tagName)){e.preventDefault();e.currentTarget.blur()}}
function onMediaClick(e){if(!editing)return;const el=e.target.closest('[data-mk]');if(!el||e.target.closest('.cms-drawer,.cms-bar'))return;e.preventDefault();e.stopPropagation();replaceSlot(el)}

/* ---------- media helpers ---------- */
const MAXV=14*1024*1024;
function pick(accept){return new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept=accept;i.style.display='none';document.body.appendChild(i);i.addEventListener('change',()=>{res(i.files&&i.files[0]||null);i.remove()});i.click()})}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function slug(n){return String(n||'file').toLowerCase().replace(/\.[a-z0-9]+$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'file'}
function once(el,ev){return new Promise((res,rej)=>{const ok=()=>{cl();res()},bad=()=>{cl();rej(new Error(ev))};const cl=()=>{el.removeEventListener(ev,ok);el.removeEventListener('error',bad)};el.addEventListener(ev,ok);el.addEventListener('error',bad)})}
async function prepImage(file,max){max=max||2000;const url=URL.createObjectURL(file);const im=new Image();im.src=url;await once(im,'load');const s=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
  const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.86));return {blob,w:c.width,h:c.height,ext:'jpg'}}
async function prepVideo(file,b){const url=URL.createObjectURL(file);const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=url;await once(v,'loadedmetadata');
  const w=v.videoWidth,h=v.videoHeight;v.currentTime=Math.min(1,(v.duration||2)/3);await once(v,'seeked');
  const pc=document.createElement('canvas');const ps=Math.min(1,1600/w);pc.width=Math.round(w*ps);pc.height=Math.round(h*ps);pc.getContext('2d').drawImage(v,0,0,pc.width,pc.height);
  const poster=await new Promise(r=>pc.toBlob(r,'image/jpeg',.82));
  if(file.size<=MAXV){URL.revokeObjectURL(url);const ext=/webm/.test(file.type)?'webm':'mp4';return {blob:file,poster,w,h,ext}}
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){URL.revokeObjectURL(url);throw new Error('big')}
  const mime=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime){URL.revokeObjectURL(url);throw new Error('big')}
  const W=Math.min(1280,w)&~1,H=Math.round(h*W/w)&~1;const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const stream=c.captureStream(25);
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});const chunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const dur=Math.min(v.duration||20,40);v.currentTime=0;await once(v,'seeked');rec.start(500);await v.play();
  await new Promise(res=>{const tick=()=>{g.drawImage(v,0,0,W,H);if(b)b.set('Optimising video '+Math.round(v.currentTime/dur*100)+'%');if(v.currentTime>=dur||v.ended){res();return}requestAnimationFrame(tick)};tick()});
  v.pause();rec.stop();await once(rec,'stop');URL.revokeObjectURL(url);const out=new Blob(chunks,{type:mime.split(';')[0]});if(out.size>MAXV)throw new Error('big');
  return {blob:out,poster,w:W,h:H,ext:/mp4/.test(mime)?'mp4':'webm'}}
function stage(blob,name,ext){const path=`u/${uid()}-${slug(name)}.${ext}`;pending.set(path,blob);const u=URL.createObjectURL(blob);objURLs.set(path,u);return {path,url:u}}
const liveURL=p=>objURLs.get(p)||p;
async function getMedia(kind){const f=await pick(kind==='image'?'image/*':kind==='video'?'video/*':'image/*,video/*');if(!f)return null;const b=busy('Preparing '+(f.type.startsWith('video')?'video':'image')+'…');
  try{if(f.type.startsWith('video')){const r=await prepVideo(f,b);const V=stage(r.blob,f.name,r.ext),Pp=stage(r.poster,f.name+'-poster','jpg');return {type:'video',src:V.path,poster:Pp.path,url:V.url,purl:Pp.url,ar:r.w/r.h}}
    const r=await prepImage(f);const I=stage(r.blob,f.name,'jpg');return {type:'image',src:I.path,url:I.url,ar:r.w/r.h}}
  catch(e){toast(e&&e.message==='big'?'That video is too large for this browser to shrink. Export it under 14 MB (720p, a short loop) and try again.':'That file could not be read. Try a JPEG, PNG or MP4.');return null}finally{b.done()}}
async function replaceSlot(el){const isV=el.tagName==='VIDEO';const m=await getMedia(isV?'video':'image');if(!m)return;
  if(isV&&m.type!=='video'){toast('This spot needs a video.');return}
  SITE.media[el.dataset.mk]=m.type==='video'?{src:m.src,poster:m.poster}:{src:m.src};applyMedia(el,m.type==='video'?{src:m.url,poster:m.purl}:{src:m.url});markDirty();if(drawer&&curTab==='media')renderTab()}

/* ---------- drawer ---------- */
let curTab='media';
const TABS=[['media','Photos & video'],['projects','Projects'],['wall','Design wall'],['clients','Clients'],['kit','Kit'],['credits','Credits'],['set','Set frames'],['contact','Contact']];
function openDrawer(tab){document.body.classList.add('cms-drawer-open');if(!drawer){drawer=document.createElement('aside');drawer.className='cms-drawer';drawer.setAttribute('aria-label','Site editor');
  drawer.innerHTML=`<div class="cms-dh"><h3>Edit site</h3><button type="button" class="cms-btn" data-x>Close</button></div><div class="cms-tabs">${TABS.map(([k,n])=>`<button type="button" data-t="${k}">${n}</button>`).join('')}</div><div class="cms-body"></div><div class="cms-foot"><button type="button" class="cms-btn" data-exp hidden>Download website</button><button type="button" class="cms-btn go" data-save>${ART?'Save':'Save (download)'}</button></div>`;
  document.body.appendChild(drawer);drawer.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.x!=null)closeDrawer();if(b.dataset.t){curTab=b.dataset.t;renderTab()}if(b.dataset.save!=null)save();if(b.dataset.exp!=null)exportSite()});
  if(ART&&DL)$('[data-exp]',drawer).hidden=false}
  curTab=tab||curTab;renderTab();requestAnimationFrame(()=>drawer.classList.add('open'))}
function closeDrawer(){document.body.classList.remove('cms-drawer-open');if(drawer)drawer.classList.remove('open')}
function renderTab(){$$('.cms-tabs button',drawer).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.t===curTab)));const body=$('.cms-body',drawer);body.innerHTML='';({media:tabMedia,projects:tabProjects,wall:tabWall,clients:tabClients,kit:tabKit,credits:tabCredits,set:tabSet,contact:tabContact})[curTab](body)}
function field(label,value,on,opts){opts=opts||{};const d=document.createElement('div');d.className='cms-f';const id='f'+uid();
  d.innerHTML=`<label for="${id}">${esc(label)}</label>`+(opts.area?`<textarea id="${id}"></textarea>`:opts.options?`<select id="${id}">${opts.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:`<input id="${id}" type="${opts.type||'text'}">`);
  const i=$('#'+id,d);i.value=value==null?'':value;i.addEventListener('input',()=>{on(i.value);markDirty()});i.addEventListener('change',()=>{on(i.value);markDirty()});return d}
function thumb(src,poster,label,onClick){const b=document.createElement('button');b.type='button';b.className='cms-thumb';b.innerHTML=(poster||/\.(jpe?g|png|webp|gif)$/i.test(src)||/^blob:/.test(src)&&!poster?`<img src="${esc(poster||src)}" alt="">`:`<video src="${esc(src)}" muted playsinline preload="metadata"></video>`)+`<span>${esc(label||'Replace')}</span>`;b.addEventListener('click',onClick);return b}
function icons(onUp,onDown,onDel){const d=document.createElement('div');d.className='cms-icons';d.innerHTML='<button type="button" aria-label="Move up">&#8593;</button><button type="button" aria-label="Move down">&#8595;</button><button type="button" class="del" aria-label="Remove">&#10005;</button>';
  const [u,dn,x]=$$('button',d);u.addEventListener('click',onUp);dn.addEventListener('click',onDown);x.addEventListener('click',onDel);return d}
function move(arr,i,d){const j=i+d;if(j<0||j>=arr.length)return false;[arr[i],arr[j]]=[arr[j],arr[i]];return true}
function help(body,t){const p=document.createElement('p');p.className='help';p.textContent=t;body.appendChild(p)}
function button(body,t,on,go){const b=document.createElement('button');b.type='button';b.className='cms-btn'+(go?' go':'');b.textContent=t;b.addEventListener('click',on);body.appendChild(b);return b}

function tabMedia(body){help(body,'Every photo and video slot on the page. Tap one to replace it. Big videos are shrunk to a 720p loop in your browser before saving.');
  $$('[data-mk]').forEach(el=>{const c=document.createElement('div');c.className='cms-card';const r=document.createElement('div');r.className='row';
    const sec=el.closest('section,footer');const name=(sec&&(sec.getAttribute('aria-label')||($('h2',sec)||{}).textContent||sec.id))||'Page';
    r.appendChild(thumb(el.currentSrc||el.src,el.poster,'Replace',()=>replaceSlot(el)));const t=document.createElement('div');t.className='grow';t.innerHTML=`<b style="font-size:13px">${esc(name.trim().slice(0,40))}</b><br><span style="font-size:12px;color:var(--ash)">${el.tagName==='VIDEO'?'Video loop':'Photo'}${el.dataset.mk==='hero:video'?' · showreel':''}${el.dataset.mk==='grade:video'?' · grade bay (log footage works best)':''}</span>`;r.appendChild(t);c.appendChild(r);body.appendChild(c)})}

const H=()=>window.__site||{};
const TYPES={'Documentary':'--lab-doc','Documentary series':'--lab-doc','Interview':'--lab-doc','Live music':'--lab-live','Event':'--lab-live','Studio series':'--lab-studio','Podcast':'--lab-studio','Commercial':'--lab-ad','Motion design':'--lab-gfx'};
function withLive(arr,keys,fn){const saved=arr.map(x=>keys.map(k=>x[k]));arr.forEach(x=>keys.forEach(k=>{if(x[k])x[k]=liveURL(x[k])}));try{fn()}finally{arr.forEach((x,i)=>keys.forEach((k,j)=>{if(saved[i][j]===undefined)delete x[k];else x[k]=saved[i][j]}))}}
function syncProjects(){const P=H().P;SITE.projects=P.map(p=>Object.assign({},p));withLive(P,['v','poster','img'],()=>H().edit&&H().edit());markDirty()}
function tabProjects(body){const P=H().P;if(!P){help(body,'Projects are not available.');return}
  help(body,'The clips on the edit timeline, in order. Each needs a video loop or a still, a title and a few lines. Changes show on the timeline straight away.');
  P.forEach((p,i)=>{const c=document.createElement('div');c.className='cms-card';const r=document.createElement('div');r.className='row';
    r.appendChild(thumb(p.v?liveURL(p.v):liveURL(p.img),p.v?liveURL(p.poster||p.v.replace(/\.(mp4|webm)$/,'.jpg')):null,'Replace',async()=>{const m=await getMedia();if(!m)return;
      if(m.type==='video'){p.v=m.src;p.poster=m.poster;delete p.img}else{p.img=m.src;delete p.v;delete p.poster}p.res=p.res||'';syncProjects();renderTab()}));
    const t=document.createElement('div');t.className='grow';t.innerHTML=`<b style="font-size:14px">${esc(p.t)}</b><br><span style="font-size:12px;color:var(--ash)">${esc(p.client||'')} · ${esc(p.year||'')}</span>`;r.appendChild(t);
    r.appendChild(icons(()=>{if(move(P,i,-1)){syncProjects();renderTab()}},()=>{if(move(P,i,1)){syncProjects();renderTab()}},()=>{if(P.length<2){toast('Keep at least one project.');return}P.splice(i,1);syncProjects();renderTab()}));c.appendChild(r);
    const g=document.createElement('div');g.className='cms-grid2';
    g.appendChild(field('Title',p.t,v=>{p.t=v;syncProjectsDeb()}));g.appendChild(field('Subtitle',p.sub,v=>{p.sub=v;syncProjectsDeb()}));
    g.appendChild(field('Client',p.client,v=>{p.client=v;syncProjectsDeb()}));g.appendChild(field('Year',p.year,v=>{p.year=v;syncProjectsDeb()}));
    g.appendChild(field('Type',p.type,v=>{p.type=v;p.c=TYPES[v]||'--lab-doc';syncProjectsDeb()},{options:Object.keys(TYPES).includes(p.type)?Object.keys(TYPES):[p.type,...Object.keys(TYPES)]}));
    g.appendChild(field('Role',p.role,v=>{p.role=v;syncProjectsDeb()}));c.appendChild(g);
    c.appendChild(field('Format line',p.fmt,v=>{p.fmt=v;syncProjectsDeb()}));c.appendChild(field('Note',p.note,v=>{p.note=v;syncProjectsDeb()},{area:true}));
    const g2=document.createElement('div');g2.className='cms-grid2';g2.appendChild(field('Clip file name',p.file,v=>{p.file=v;syncProjectsDeb()}));g2.appendChild(field('Seconds on timeline',p.dur,v=>{p.dur=Math.max(10,Math.min(240,+v||60));syncProjectsDeb()},{type:'number'}));c.appendChild(g2);
    body.appendChild(c)});
  button(body,'+ Add project',async()=>{const m=await getMedia();if(!m)return;const p={id:'p'+uid(),t:'New project',sub:'',client:'',year:String(new Date().getFullYear()),type:'Documentary',c:'--lab-doc',role:'',fmt:'',note:'',file:'NEW_PROJECT.mov',res:'1920×1080 · 25P',dur:60};
    if(m.type==='video'){p.v=m.src;p.poster=m.poster}else p.img=m.src;P.push(p);syncProjects();renderTab();$('.cms-body',drawer).scrollTop=1e6},true)}
let deb=0;function syncProjectsDeb(){clearTimeout(deb);deb=setTimeout(syncProjects,400);markDirty()}
function tabWall(body){const T=H().TILES;if(!T){help(body,'The design wall is not available.');return}
  help(body,'Thumbnails, posters and motion pieces on the draggable wall. The shape of each tile follows the image.');
  T.forEach((t,i)=>{const c=document.createElement('div');c.className='cms-card';const r=document.createElement('div');r.className='row';
    r.appendChild(thumb(t.vid?liveURL(t.vid):liveURL(t.src),t.vid?liveURL(t.poster):null,'Replace',async()=>{const m=await getMedia();if(!m)return;if(m.type==='video'){t.vid=m.src;t.poster=m.poster;delete t.src}else{t.src=m.src;delete t.vid;delete t.poster}t.ar=Math.round(m.ar*1000)/1000;syncWall();renderTab()}));
    const t2=document.createElement('div');t2.className='grow';t2.appendChild(field('Label',t.k,v=>{t.k=v;syncWallDeb()}));t2.appendChild(field('Caption',t.c,v=>{t.c=v;syncWallDeb()}));r.appendChild(t2);
    r.appendChild(icons(()=>{if(move(T,i,-1)){syncWall();renderTab()}},()=>{if(move(T,i,1)){syncWall();renderTab()}},()=>{if(T.length<4){toast('The wall needs at least four pieces.');return}T.splice(i,1);syncWall();renderTab()}));c.appendChild(r);body.appendChild(c)});
  button(body,'+ Add a piece',async()=>{const m=await getMedia();if(!m)return;const t={ar:Math.round(m.ar*1000)/1000,k:'New piece',c:'Caption'};if(m.type==='video'){t.vid=m.src;t.poster=m.poster}else t.src=m.src;T.unshift(t);syncWall();renderTab()},true)}
let wdeb=0;function syncWallDeb(){clearTimeout(wdeb);wdeb=setTimeout(syncWall,400);markDirty()}
function syncWall(){const T=H().TILES;SITE.tiles=T.map(x=>Object.assign({},x));withLive(T,['src','vid','poster'],()=>H().wall&&H().wall());markDirty()}

function lines(arr){return arr.join('\n')}
function tabClients(body){const h=H();if(!h.CLIENTS1)return;help(body,'The two rows of names that scroll under the About section. One client per line.');
  const upd=(arr,v)=>{arr.splice(0,arr.length,...v.split('\n').map(x=>x.trim()).filter(Boolean));SITE.clients1=h.CLIENTS1.slice();SITE.clients2=h.CLIENTS2.slice();h.clients&&h.clients()};
  body.appendChild(field('Top row',lines(h.CLIENTS1),v=>upd(h.CLIENTS1,v),{area:true}));body.appendChild(field('Bottom row',lines(h.CLIENTS2),v=>upd(h.CLIENTS2,v),{area:true}))}
function tabKit(body){const h=H();if(!h.KIT)return;help(body,'Each case in the kit room. One item per line; put a quantity or note after a | (for example "Sony FX6 | ×3").');
  const sync=()=>{SITE.kit=h.KIT.map(([a,b])=>[a,b.map(x=>x.slice())]);h.kit&&h.kit();markDirty()};
  h.KIT.forEach((cs,i)=>{const c=document.createElement('div');c.className='cms-card';const r=document.createElement('div');r.className='row';const t=document.createElement('div');t.className='grow';t.appendChild(field('Case',cs[0],v=>{cs[0]=v;sync()}));r.appendChild(t);
    r.appendChild(icons(()=>{if(move(h.KIT,i,-1)){sync();renderTab()}},()=>{if(move(h.KIT,i,1)){sync();renderTab()}},()=>{h.KIT.splice(i,1);sync();renderTab()}));c.appendChild(r);
    c.appendChild(field('Items',cs[1].map(([a,b])=>b?a+' | '+b:a).join('\n'),v=>{cs[1]=v.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const k=x.split('|');return [k[0].trim(),(k[1]||'').trim()]});sync()},{area:true}));body.appendChild(c)});
  button(body,'+ Add a case',()=>{h.KIT.push(['New case',[['Item','']]]);sync();renderTab()},true)}
function tabCredits(body){const h=H();if(!h.EDL)return;help(body,'The edit decision list of credits. One per line: reel name, a |, then the title (for example "MEE | UNDER FIRE · TRAILER").');
  body.appendChild(field('Credits',h.EDL.map(([a,b])=>a+' | '+b).join('\n'),v=>{h.EDL.splice(0,h.EDL.length,...v.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{const k=x.split('|');return k.length>1?[k[0].trim().toUpperCase(),k.slice(1).join('|').trim().toUpperCase()]:['AX',k[0].trim().toUpperCase()]}));SITE.edl=h.EDL.map(x=>x.slice());h.edl&&h.edl()},{area:true}))}
function tabContact(body){const h=H();help(body,'Your showreel link (Vimeo or YouTube) and the address the Copy email and Open email buttons use.');body.appendChild(field('Showreel link',SITE.reel||(document.querySelector('#reelLink')||{}).href||'',v=>{v=v.trim();if(!/^https:\/\/(www\.)?(vimeo\.com|youtu\.be|youtube\.com)\//i.test(v))return;SITE.reel=v;h.reel&&h.reel(v)},{type:'url'}));body.appendChild(field('Email address',SITE.email||($('#mailAddr')||{}).textContent,v=>{v=v.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))return;SITE.email=v;h.email&&h.email(v)},{type:'email'}))}
function tabSet(body){const A=window.__studioApp;if(!A){if(window.__bootSet&&!tabSet.tried){tabSet.tried=true;help(body,'Starting the live set…');window.__bootSet();setTimeout(()=>{if(curTab==='set')renderTab()},1500);return}help(body,'The live set is not running in this browser, so its frames cannot be edited here.');return}
  help(body,'The "Match a frame" stills under the live set. Each one loads a full set: room, props, people, camera and lights. Add a still and Claude builds its set, or set it up by hand first and press "Use the set as it is now".');
  const refs=A.REFS.map(r=>Object.assign({},r));const commit=()=>{SITE.set=SITE.set||{};SITE.set.refs=refs.map(r=>Object.assign({},r));A.setRefs(refs.map(r=>Object.assign({},r,{img:liveURL(r.img)})));markDirty()};
  refs.forEach((r,i)=>{const c=document.createElement('div');c.className='cms-card';const row=document.createElement('div');row.className='row';
    row.appendChild(thumb(liveURL(r.img),null,'Replace',async()=>{const m=await getMedia('image');if(!m)return;r.img=m.src;commit();renderTab()}));
    const t=document.createElement('div');t.className='grow';t.appendChild(field('Title',r.title,v=>{r.title=v;commit()}));row.appendChild(t);
    row.appendChild(icons(()=>{if(move(refs,i,-1)){commit();renderTab()}},()=>{if(move(refs,i,1)){commit();renderTab()}},()=>{refs.splice(i,1);commit();renderTab()}));c.appendChild(row);
    c.appendChild(field('Note',r.note,v=>{r.note=v;commit()},{area:true}));
    const bb=document.createElement('div');bb.className='row';button(bb,'Use the set as it is now',()=>{r.scene=A.snapshot();commit();toast('Saved the current set, lights and camera into "'+r.title+'".')});c.appendChild(bb);body.appendChild(c)});
  button(body,'+ Add a frame',async()=>{const f=await pick('image/*');if(!f)return;const b=busy('Reading the still…');try{const m=await prepImage(f,1280);const I=stage(m.blob,f.name,'jpg');let scene=null,note='';
      if(A.canMatch){try{b.set('Building its set with Claude…');const r=await A.matchStill(m.blob);scene=r.scene;note=r.summary}catch(e){toast('Claude could not read that still, so it starts from the current set.')}}
      if(!scene)scene=A.snapshot();refs.push({id:'r'+uid(),title:slug(f.name).replace(/-/g,' ').slice(0,24)||'New frame',img:I.path,note,scene});commit();renderTab();$('.cms-body',drawer).scrollTop=1e6}finally{b.done()}},true);
  const opening=document.createElement('div');opening.className='cms-card';opening.innerHTML='<b style="font-size:13px">Opening set</b><span style="font-size:12px;color:var(--ash)">What visitors see first when the page loads.</span>';
  button(opening,'Use the set as it is now as the opening set',()=>{SITE.set=SITE.set||{};SITE.set.scene=Object.assign(A.snapshot(),{title:'Custom'});markDirty();toast('The current set will open the page after you save.')});body.appendChild(opening)}

/* ---------- save & export ---------- */
function contentFiles(){const json=JSON.stringify(SITE,null,1);const files={'content.json':json};for(const [p,b] of pending)if(json.includes('"'+p+'"'))files[p]=b;return files}
async function save(){if(!dirty&&!pending.size){toast('Nothing to save yet.');return}
  if(ART){const b=busy('Saving a new version…');try{await ART.publish(contentFiles());pending.clear();dirty=false;if(bar)$('.n',bar).textContent='Saved';toast('Saved. Anyone who opens the page now gets this version.')}
    catch(e){const c=e&&e.code;toast(c==='too_large'?'That is more than one save can carry. Save after each big video instead.':c==='not_writer'||c==='not_granted'?'This view can look but not save. Open the page as its owner to edit.':c==='capability_disabled'?'Saving is off for this link (for example when the page is shared publicly). Your changes stay on the page until you reload.':c==='conflict'?'A newer version was saved elsewhere, so the page is reloading to it.':c==='rate_limited'?'Too many saves in a row. Wait a moment and save again.':'Could not save just now. Try again in a moment.',7000)}finally{b.done()}return}
  const b=busy('Packing your changes…');try{const zip=await makeZip(contentFiles());downloadBlob(zip,'site-update.zip');pending.clear();dirty=false;toast('Downloaded site-update.zip. Unzip it into the website folder and let it replace content.json.',7000)}finally{b.done()}}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
async function exportSite(){if(!DL){toast('Downloading is not available in this view.');return}const b=busy('Collecting the website…');
  try{const list=(await (await fetch('files.json')).json()).files||[];const files={};let n=0;
    for(const p of list){b.set('Collecting the website… '+(++n)+'/'+list.length);try{const r=await fetch(p);if(r.ok)files[p==='standalone.html'?'index.html':p]=await r.blob()}catch(_){}}
    const media=[];JSON.stringify(SITE).replace(/"(u\/[^"]+)"/g,(m,p)=>{media.push(p);return m});for(const p of media){if(files[p])continue;if(pending.has(p)){files[p]=pending.get(p);continue}try{const r=await fetch(p);if(r.ok)files[p]=await r.blob()}catch(_){}}
    files['content.json']=JSON.stringify(SITE,null,1);b.set('Zipping…');const zip=await makeZip(files);
    await DL.save({filename:'anas-alkarmi-site.zip',data:zip});toast('Website downloaded. Upload the unzipped folder to your web host.')}
  catch(e){const c=e&&e.code;if(c!=='declined')toast(c==='too_large'?'The website is too large to download here.':'Could not build the download just now.')}finally{b.done()}}
/* store-only zip writer */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
async function makeZip(files){const enc=new TextEncoder();const parts=[],central=[];let off=0;const now=new Date();const dt=((now.getFullYear()-1980)<<25)|((now.getMonth()+1)<<21)|(now.getDate()<<16)|(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  for(const [name,data] of Object.entries(files)){const u8=typeof data==='string'?enc.encode(data):new Uint8Array(await data.arrayBuffer());const nm=enc.encode(name);const crc=crc32(u8);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint32(10,dt,true);h.setUint32(14,crc,true);h.setUint32(18,u8.length,true);h.setUint32(22,u8.length,true);h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(h.buffer,nm,u8);const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint32(12,dt,true);c.setUint32(16,crc,true);c.setUint32(20,u8.length,true);c.setUint32(24,u8.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    central.push(c.buffer,nm);off+=30+nm.length+u8.length}
  const csize=central.reduce((a,b)=>a+(b.byteLength||b.length),0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);const n=Object.keys(files).length;e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,csize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...central,e.buffer],{type:'application/zip'})}
addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
window.__cms={SITE,save,startEdit};
(async()=>{let can=false;
  if(window.claude&&claude.use){try{const [a,u]=await Promise.all([claude.use('artifact'),claude.use('user')]);ART=a;can=!!(a&&u&&await u.canEdit())}catch(_){can=false}
    try{DL=await claude.use('downloads')}catch(_){DL=null}}
  if(can||LOCAL)mountButton()})();
})();
