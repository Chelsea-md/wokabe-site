// Shared modal shell: settings, pause, purchase and destructive confirmations.
const asset=name=>new URL('./assets/'+name,import.meta.url).href;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createGameDialogs({frame,skins,portrait,onFreeze,onResume,onRestart,onLeave,getBattle,onPreferences}){
 const defaults={sfx:85,reducedMotion:false,screenShake:true};let prefs={...defaults};
 try{const p=JSON.parse(localStorage.getItem('fvz-ui-settings')||'{}');prefs={sfx:Number.isFinite(p.sfx)?Math.max(0,Math.min(100,p.sfx)):85,reducedMotion:p.reducedMotion===true,screenShake:p.screenShake!==false};}catch{}
 const overlay=document.createElement('div');overlay.className='garden-dialog-overlay';overlay.hidden=true;frame.append(overlay);
 let cancel=null,origin=null,restore=null,busy=false;
 function apply(){document.documentElement.classList.toggle('reduce-game-motion',prefs.reducedMotion);onPreferences(prefs);try{localStorage.setItem('fvz-ui-settings',JSON.stringify(prefs));}catch{}}
 function hide(){overlay.hidden=true;overlay.replaceChildren();for(const [node,inert] of restore||[])node.inert=inert;restore=null;cancel=null;busy=false;if(origin?.isConnected)origin.focus({preventScroll:true});}
 function shell(title,body,footer,{book=false,onCancel=hide}={}){
  if(overlay.hidden){origin=document.activeElement;restore=[...frame.children].filter(n=>n!==overlay).map(n=>[n,n.inert]);for(const [n]of restore)n.inert=true;}
  cancel=onCancel;overlay.hidden=false;overlay.innerHTML=`<section class="garden-dialog ${book?'garden-book':''}" role="dialog" aria-modal="true" aria-labelledby="garden-dialog-title" tabindex="-1"><h2 id="garden-dialog-title">${esc(title)}</h2><button class="garden-close" aria-label="Close"><img src="${asset('close-button.png')}" alt=""></button><div class="garden-dialog-body">${body}</div><footer>${footer}</footer></section>`;
  overlay.querySelector('.garden-close').onclick=()=>{if(!busy)cancel?.();};overlay.querySelector('section').focus();
 }
 const button=(id,label,kind='gold')=>`<button class="garden-action ${kind}" data-dialog-action="${id}">${label}</button>`;
 const bind=(id,fn)=>overlay.querySelector(`[data-dialog-action="${id}"]`).onclick=fn;
 const img=name=>`<img class="garden-icon" src="${skins[name]}" alt="">`;
 function settings(fromPause=false){
  if(!fromPause)onFreeze();
  const close=()=>{if(fromPause)pause();else{hide();onResume(false);}};
  shell('SETTINGS',`<div class="garden-settings-list"><label class="garden-setting"><b>Music</b><input type="range" min="0" max="100" value="0" disabled aria-label="Music volume"><small>No music track yet</small></label><label class="garden-setting"><b>Sound FX</b><input id="garden-sfx" type="range" min="0" max="100" value="${prefs.sfx}" aria-label="Sound effects volume"><output>${prefs.sfx}%</output></label><div class="garden-setting"><b>Reduce Motion</b><button role="switch" aria-label="Reduce motion" aria-checked="${prefs.reducedMotion}" data-pref="reducedMotion">${prefs.reducedMotion?'ON':'OFF'}</button></div><div class="garden-setting"><b>Screen Shake</b><button role="switch" aria-label="Screen shake" aria-checked="${prefs.screenShake}" data-pref="screenShake">${prefs.screenShake?'ON':'OFF'}</button></div><label class="garden-setting"><b>Language</b><select aria-label="Language"><option>English</option></select></label></div>`,`<button class="garden-help" data-dialog-action="help">How to Play</button>${button('done','DONE')}`,{onCancel:close});
  ['music','sound','motion','shake','language'].forEach((key,i)=>{const icon=document.createElement('img');icon.src=asset('settings-'+key+'.png');icon.alt='';icon.className='garden-setting-icon';overlay.querySelectorAll('.garden-setting')[i].prepend(icon);});
  const slider=overlay.querySelector('#garden-sfx');slider.style.setProperty('--volume',prefs.sfx+'%');slider.oninput=()=>{prefs.sfx=Number(slider.value);slider.style.setProperty('--volume',prefs.sfx+'%');slider.nextElementSibling.textContent=prefs.sfx+'%';apply();};
  overlay.querySelectorAll('[data-pref]').forEach(b=>b.onclick=()=>{const key=b.dataset.pref;prefs[key]=!prefs[key];b.setAttribute('aria-checked',String(prefs[key]));b.textContent=prefs[key]?'ON':'OFF';apply();});
  overlay.querySelector('select').outerHTML='<button class="garden-language" aria-label="Language: English only" disabled>English</button>';
  const helpIcon=document.createElement('img');helpIcon.src=asset('settings-book.png');helpIcon.alt='';overlay.querySelector('.garden-help').prepend(helpIcon);
  bind('done',close);bind('help',()=>help(0,fromPause));
 }
 function help(step=0,fromPause=false){
  const pages=[
   {title:'PLANT YOUR DEFENDERS',copy:'Collect sunlight, then drag a plant from your hand onto an empty battle tile.',tag:'1 / 3 · DEPLOY',art:`<img src="${skins.sun||asset('sun.png')}" alt="Sunlight"><img class="help-plant" src="${portrait(0)}" alt="Chili defender">`},
   {title:'MATCH & GROW',copy:'Drag two identical plants of the same level together to make one stronger defender.',tag:'2 / 3 · MERGE',art:`<figure><img src="${portrait(0)}" alt="Chili"><figcaption>LEVEL 1</figcaption></figure><figure><img src="${portrait(0)}" alt="Matching Chili"><figcaption>LEVEL 1</figcaption></figure><figure class="help-grown"><img src="${portrait(0)}" alt="Stronger Chili"><figcaption>LEVEL 2</figcaption></figure>`},
   {title:'PROTECT YOUR GARDEN',copy:'Plants attack automatically. Keep your base safe and survive every wave to clear the chapter.',tag:'3 / 3 · DEFEND',art:`<img src="${portrait(1)}" alt="Acorn defender"><img class="help-base" src="${asset('journey-green.webp')}" alt="Your garden">`}
  ],p=pages[step];
  shell('HOW TO PLAY',`<div class="garden-guide"><span class="guide-step">${p.tag}</span><div class="guide-art">${p.art}</div><h3>${p.title}</h3><p>${p.copy}</p></div>`,`${button('back',step?'BACK':'SETTINGS','neutral')}${button('next',step===2?'GOT IT':'NEXT')}`,{onCancel:()=>settings(fromPause)});
  overlay.querySelector('.garden-dialog').classList.add('garden-help-dialog');
  bind('back',()=>step?help(step-1,fromPause):settings(fromPause));bind('next',()=>step===2?settings(fromPause):help(step+1,fromPause));
 }
 function pause(){
  onFreeze();const b=getBattle();
  shell('PAUSED',`<div class="garden-book-left"><img class="garden-chapter-art" src="${esc(b.image)}" alt="${esc(b.name)}"><h3>${esc(b.name)}</h3><p>Wave ${b.wave} / ${b.waves}</p></div><div class="garden-book-right">${button('resume','RESUME')}<div class="garden-pause-secondary">${button('restart','RESTART','neutral')}${button('settings','SETTINGS','neutral')}</div>${button('leave','LEAVE BATTLE','danger')}</div>`,'',{book:true,onCancel:resume});
  for(const [id,src]of [['resume',asset('pause-play.png')],['restart',asset('modal-restart.svg')],['settings',skins.gear],['leave',asset('modal-leave.svg')]]){const icon=document.createElement('img');icon.src=src;icon.alt='';icon.className='garden-icon';overlay.querySelector(`[data-dialog-action="${id}"]`).prepend(icon);}
  bind('resume',resume);bind('settings',()=>settings(true));
  bind('restart',()=>confirm({title:'RESTART?',message:'Restart this chapter from Wave 1? This battle’s unclaimed coins will be lost. Permanent upgrades are kept.',confirmLabel:'RESTART',danger:true}).then(ok=>{if(ok){hide();onRestart();}else pause();}));
  bind('leave',()=>confirm({title:'LEAVE BATTLE?',message:'Return to battle preparation? This battle’s progress and unclaimed coins will be lost. Permanent upgrades are kept.',confirmLabel:'LEAVE',danger:true}).then(ok=>{if(ok){hide();onLeave();}else pause();}));
 }
 function resume(){hide();onResume(true);}
 function confirm({title='CONFIRM PURCHASE',message='',image='',name='',cost=null,balance=null,confirmLabel='CONFIRM',danger=false}){
  return new Promise(resolve=>{
   const settle=value=>{hide();resolve(value);};
   shell(title,`${image?`<img class="garden-confirm-art" src="${esc(image)}" alt="">`:''}${name?`<h3>${esc(name)}</h3>`:''}<p class="garden-confirm-message">${esc(message)}</p>${cost!==null?`<div class="garden-cost">${img('coin')}<b>${cost.toLocaleString()}</b></div><small class="garden-balance">Balance: ${balance.toLocaleString()} → ${(balance-cost).toLocaleString()}</small>`:''}`,`${button('cancel','CANCEL','neutral')}${button('confirm',cost!==null?img('coin')+esc(confirmLabel)+' · '+cost:esc(confirmLabel),danger?'danger':'gold')}`,{onCancel:()=>settle(false)});
   if(danger){
    const b=getBattle(),restart=confirmLabel==='RESTART';
    overlay.querySelector('.garden-dialog').classList.add('garden-battle-confirm');
    overlay.querySelector('.garden-dialog-body').innerHTML=`<div class="confirm-chapter"><img src="${esc(b.image)}" alt="${esc(b.name)}"><div><span>CURRENT BATTLE</span><h3>${esc(b.name)}</h3><strong>Wave ${b.wave} / ${b.waves}</strong></div></div><p class="confirm-question">${restart?'Start again from Wave 1?':'Return to battle preparation?'}</p><div class="confirm-consequence lost">${img('coin')}<div><b>WILL BE LOST</b><p>Current battle progress &amp; unclaimed coins</p></div></div><div class="confirm-consequence kept"><img src="${asset('menu-book-full.png')}" alt=""><div><b>SAFE &amp; KEPT</b><p>Your plants &amp; permanent upgrades</p></div></div>`;
    overlay.querySelector('[data-dialog-action="cancel"]').textContent='STAY HERE';
   }
   bind('cancel',()=>settle(false));bind('confirm',()=>{if(busy)return;busy=true;settle(true);});
  });
 }
 function notice(title,message,back=hide){shell(title,`<p class="garden-confirm-message">${esc(message)}</p>`,button('ok','OK'),{onCancel:back});bind('ok',back);}
 overlay.addEventListener('click',e=>{if(e.target===overlay&&!busy)cancel?.();});
 window.addEventListener('keydown',e=>{
  if(overlay.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!busy)cancel?.();}
  if(e.key==='Tab'){const all=[...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')],first=all[0],last=all.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===overlay.querySelector('section'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 },true);
 apply();return {settings,pause,confirm,notice,hide,help:()=>{onFreeze();help();},get open(){return !overlay.hidden;},get preferences(){return prefs;}};
}
