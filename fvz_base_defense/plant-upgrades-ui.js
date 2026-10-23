import {tracks,upgradeQuote,upgradeLevel} from './plant-progression.js';
const labels={damage:'DAMAGE',interval:'FIRE INTERVAL',range:'RANGE',ability:'ABILITY'};
const symbols=Object.fromEntries(tracks.map((t,i)=>[t,`<i class="growth-stat-icon" style="--icon-position:${i*100/3}%" aria-hidden="true"></i>`]));
const descriptions={damage:'Stronger hits, one small step at a time.',interval:'Less time between attacks.',range:'Reach a little farther.',ability:'Strengthen this plant’s unique specialty.'};
const specialties=['Attack power','Attack power','Attack power','Area attack power','Slow duration','Poison potency','Thorns damage','Healing power','Piercing attack power','Chain attack power'];
const maxedBadge=`<img class="growth-maxed-trophy" src="${new URL('./assets/maxed-trophy-clean.png',import.meta.url).href}" alt=""><span class="growth-maxed-label">MAXED</span>`;
export function createUpgradeView({surface,rules,portrait,gemMarkup,onUpgrade,getProgress}){
 let selected=0,track='damage',quantity=1;
 function render(){
 const p=getProgress(),owned=rules.troops.map((plant,index)=>({plant,index})).filter(x=>p.unlocks[x.index]);
 if(!p.unlocks[selected])selected=owned[0]?.index||0;
 const complete=index=>tracks.every(t=>upgradeLevel(p,index,t)>=(t==='ability'?3:30));
 const q=upgradeQuote(p,selected,track,quantity),plant=rules.troops[selected];
 const percent=n=>(track==='interval'?'−':'+')+(n*(track==='ability'?4:track==='interval'?.1:.2)).toFixed(1)+'%';
 const actual=n=>track==='ability'?percent(n):track==='damage'?(plant.attack*(1+n*.002)*([0,1,2,3,8,9].includes(selected)?1+.04*upgradeLevel(p,selected,'ability'):1)).toFixed(3):track==='interval'?(plant.cooldown*(1-n*.001)).toFixed(4)+'s':(plant.range*(1+n*.002)).toFixed(2);
 const focus=document.activeElement?.dataset?.upgradeFocus;
 surface.innerHTML=`<div class="growth-hero"><img class="growth-plant" src="${portrait(selected)}" alt="${plant.name}"><img class="growth-pedestal" src="${new URL('./assets/upgrades-pedestal.png',import.meta.url).href}" alt=""><strong>${plant.name}</strong></div>
 <div class="growth-panel"><div class="growth-tabs" role="tablist" aria-label="Upgrade type">${tracks.map(t=>`<button role="tab" aria-selected="${t===track}" data-track="${t}" data-upgrade-focus="${t}"><span>${symbols[t]}</span><b>${labels[t]}</b><small>${upgradeLevel(p,selected,t)}/${t==='ability'?3:30}${upgradeLevel(p,selected,t)>=(t==='ability'?3:30)?' ✓':''}</small></button>`).join('')}</div>
 <div class="growth-body"><div class="growth-emblem" aria-hidden="true">${symbols[track]}</div><div class="growth-details"><h2>${track==='ability'?specialties[selected]:labels[track]}</h2><p>${descriptions[track]}</p><b>Lv. ${q.level} / ${q.cap}</b><div class="growth-progress" role="progressbar" aria-label="Upgrade level" aria-valuenow="${q.level}" aria-valuemin="0" aria-valuemax="${q.cap}"><i style="width:${q.level/q.cap*100}%"></i></div><div class="growth-change">${q.count?`${percent(q.level)} <span>→ ${percent(q.level+q.count)}</span>`:`${percent(q.level)} TOTAL BOOST`}</div><small>${q.count?`${actual(q.level)} → ${actual(q.level+q.count)}`:`FINAL · ${actual(q.level)}`}${track==='range'?' range':''}</small></div>
 <div class="growth-purchase ${!q.count?'is-maxed':''}"><div class="growth-quantities" ${!q.count?'hidden':''}>${[1,5].map(n=>`<button data-quantity="${n}" data-upgrade-focus="q${n}" aria-pressed="${quantity===n}">×${n}</button>`).join('')}</div><button class="growth-buy" data-upgrade-focus="buy" ${!q.count||p.gems<q.cost?'disabled':''}>${q.count?`${gemMarkup()}<b>${q.cost}</b><strong>UPGRADE${q.count>1?' ×'+q.count:''}</strong>`:maxedBadge}</button><small>${q.count?(p.gems<q.cost?'Not enough gems':'Permanent growth'):(complete(selected)?'ALL ABILITIES COMPLETE':'Track complete')}</small></div></div></div>
 <div class="growth-roster" aria-label="Choose a plant">${owned.map(({plant,index})=>`<button data-plant="${index}" data-upgrade-focus="p${index}" aria-pressed="${index===selected}" aria-label="${plant.name}"><img src="${portrait(index)}" alt=""><strong>${plant.name}${complete(index)?' <span class="growth-complete-mark" aria-label="Fully upgraded">✓</span>':''}</strong></button>`).join('')}</div>`;
 surface.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{track=b.dataset.track;render();});
 surface.querySelectorAll('[data-quantity]').forEach(b=>b.onclick=()=>{quantity=Number(b.dataset.quantity);render();});
 surface.querySelectorAll('[data-plant]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.plant);render();});
 surface.querySelector('.growth-buy').onclick=()=>{
   onUpgrade(selected,track,quantity);
   if(q.level<q.cap&&upgradeLevel(getProgress(),selected,track)===q.cap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
     surface.querySelector('.growth-buy')?.animate([{transform:'scale(.96)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:550,easing:'ease-out'});
   }
 };
 if(focus)surface.querySelector(`[data-upgrade-focus="${focus}"]`)?.focus({preventScroll:true});
 }
 return {render};
}
