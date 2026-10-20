import {publicationBar} from './publication-ui.js?v=production-46';
import {loadRigs,drawRig} from './library/art-directions/cartoon-v5/rig-renderer.js?v=production-46';
import {tierFor} from './library/art-directions/cartoon-v5/growth-style.js?v=production-46';
import {growthCharacters} from './character-growth.js?v=production-46';
const $=s=>document.querySelector(s);
try{
 const rigs=await loadRigs();
 function show(id){$('#growth').replaceChildren();for(const b of $('#classes').children)b.setAttribute('aria-pressed',String(b.dataset.id===id));for(let star=1;star<=10;star++){const card=document.createElement('article');card.className='card';const tier=tierFor(star);card.innerHTML=`<span class="rank">★ ${star}</span><canvas width="360" height="320" role="img" aria-label="${rigs[id].name} ${star}성 ${tier.name}"></canvas><b><i class="swatch" style="background:${tier.color}"></i>${tier.name}</b>`;drawRig(card.querySelector('canvas').getContext('2d'),rigs,id,180,280,220,{star,time:0,shadow:true});$('#growth').append(card);}}
 for(const p of growthCharacters){const b=document.createElement('button');b.textContent=p.name;b.dataset.id=p.id;b.onclick=()=>show(p.id);$('#classes').append(b);}show('poppy');
 for(const p of growthCharacters.filter(p=>p.bounds)){const c=document.createElement('article');c.className='card';c.innerHTML=`<canvas width="360" height="320" role="img" aria-label="${p.name}"></canvas><b>${p.name}</b>`;drawRig(c.querySelector('canvas').getContext('2d'),rigs,p.id,180,280,220,{star:1});$('#friends').append(c);}
}catch(e){$('#error').textContent='이미지를 불러오지 못했습니다. 새로고침해 주세요.';console.error(e);}

publicationBar({label:'성장 갤러리 · 편집 화면에서 저장·게시',editorUrl:()=>'character-studio.html'});
