// Shared economy contract for gameplay, UI and operations. No repeat-clear gems.
export const progression = Object.freeze({ firstClearGems:1000, cap:30, prices:[20,25,35], abilityPrices:[200,300,400], steps:{damage:.002,interval:.001,range:.002} });
export const tracks=['damage','interval','range','ability'];
export function normalizeTraining(progress,count){
 const old=Array.isArray(progress.plantTraining)?progress.plantTraining:[];
 const level=v=>Number.isFinite(v)?Math.max(0,Math.min(30,Math.floor(v))):0;
 progress.plantTraining=Array.from({length:count},(_,i)=>({damage:level(old[i]?.damage),interval:level(old[i]?.interval),range:level(old[i]?.range)}));
}
export function upgradeLevel(p,index,track){return track==='ability'?(p.plantUpgrades?.[index]||0):(p.plantTraining?.[index]?.[track]||0);}
export function upgradeQuote(p,index,track,quantity=1){
 if(!tracks.includes(track)||![1,5].includes(quantity)||!Number.isInteger(index)||index<0)return {count:0,cost:0,level:0,cap:0};
 const cap=track==='ability'?3:30,level=upgradeLevel(p,index,track),count=Math.max(0,Math.min(quantity,cap-level));
 let cost=0;for(let n=level;n<level+count;n++)cost+=track==='ability'?progression.abilityPrices[n]:progression.prices[Math.floor(n/10)];
 return {level,cap,count,cost};
}
export function purchaseUpgrade(p,index,track,quantity=1){
 const q=upgradeQuote(p,index,track,quantity);
 if(!q.count||!p.unlocks?.[index]||p.unlocks.filter(Boolean).length<6||!Number.isFinite(p.gems)||p.gems<q.cost)return false;
 normalizeTraining(p,p.unlocks.length);
 p.gems-=q.cost;
 if(track==='ability'){p.plantUpgrades ||= [];p.plantUpgrades[index]=q.level+q.count;}
 else p.plantTraining[index][track]=q.level+q.count;
 return true;
}
export function statMultiplier(p,index,track){const n=upgradeLevel(p,index,track);return 1+(track==='interval'?-1:1)*(progression.steps[track]||0)*n;}
export function clearGemReward(win,stage,completed){return win&&stage>completed?progression.firstClearGems:0;}
