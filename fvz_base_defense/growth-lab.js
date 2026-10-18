import {loadRigs,drawRig} from './library/art-directions/cartoon-v5/rig-renderer.js?v=production-15';
import {tierFor} from './library/art-directions/cartoon-v5/growth-style.js?v=production-15';
const $=s=>document.querySelector(s);
try{
 const [rigs,rules]=await Promise.all([loadRigs(),fetch('../../../data/rules.json?v=production-15').then(r=>r.json())]);
 function show(id){$('#growth').replaceChildren();for(const b of $('#classes').children)b.setAttribute('aria-pressed',String(b.dataset.id===id));for(let star=1;star<=10;star++){const card=document.createElement('article');card.className='card';const tier=tierFor(star);card.innerHTML=`<span class="rank">★ ${star}</span><canvas width="360" height="320" role="img" aria-label="${rigs[id].name} ${star}성 ${tier.name}"></canvas><b><i class="swatch" style="background:${tier.color}"></i>${tier.name}</b>`;drawRig(card.querySelector('canvas').getContext('2d'),rigs,id,155,285,240,{star,time:0,shadow:true});$('#growth').append(card);}}
 for(const [id,name]of [['poppy','CHILI'],['bellflower','ACORN'],['marigold','PINECONE'],['sunflower','SUNFLOWER']]){const b=document.createElement('button');b.textContent=name;b.dataset.id=id;b.onclick=()=>show(id);$('#classes').append(b);}show('poppy');
 for(const p of rules.plantRoadmap){const c=document.createElement('article');c.className='card';c.innerHTML=`<span class="rank">STAGE ${p.stage}</span><img src="../../../${p.art}" alt="${p.name} with starting weapon"><b>${p.name}</b><small>${p.role} · CONCEPT</small>`;$('#friends').append(c);}
}catch(e){$('#error').textContent='이미지를 불러오지 못했습니다. 새로고침해 주세요.';console.error(e);}
