const asset = name => new URL(`./assets/${name}`, import.meta.url).href;
const descriptions = [
  'A trusty ranged friend.\nKeeps the garden safe, one shot at a time.',
  'A patient long-range archer.\nPicks off enemies from a safe distance.',
  'A powerful close-range hitter.\nKeep this fragile friend protected.',
  'Bright bursts of area damage.\nHelps clear crowded paths.',
  'Chills enemies and slows their advance.\nGive your squad more time to attack.',
  'Poisons enemies over time.\nWear down the toughest invaders.',
  'Holds the front line.\nReturns damage to attackers.',
  'Heals nearby allies.\nKeep your garden friends in the fight.',
  'Pierces enemy armor.\nFind the weak spot in a tough defense.',
  'Lightning jumps between enemies.\nA sparkling answer to crowded waves.',
];
export function createPlantsShop({frame,rules,getProgress,portrait,onBuy,lockAsset,coinAsset}) {
  const shop=document.createElement('section');
  shop.className='plants-shop';shop.setAttribute('aria-label','Plant shop');frame.append(shop);
  let selected=-1, buying=false;
  const coin=()=>`<img src="${coinAsset}" alt="" class="shop-coin">`;
  const check=()=>`<img src="${asset('chapter-check.png')}" alt="" class="shop-check">`;
  shop.innerHTML=`<div class="shop-feature"><div class="shop-hero"><span class="shop-ground-shadow" aria-hidden="true"></span><img class="shop-hero-character" alt=""></div><div class="shop-detail"><h2></h2><div class="shop-role"></div><p></p><button type="button" class="shop-buy"></button><small class="shop-requirement" aria-live="polite"></small></div></div><div class="shop-browse"><button type="button" class="shop-arrow previous" aria-label="Previous plants"><img src="${asset('journey-page-arrow.png')}" alt=""></button><div class="shop-rail" role="group" aria-label="Browse plants"></div><button type="button" class="shop-arrow next" aria-label="More plants"><img src="${asset('journey-page-arrow.png')}" alt=""></button></div>`;
  const rail=shop.querySelector('.shop-rail');
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  function updateArrows(){
    shop.querySelector('.previous').disabled=rail.scrollLeft<3;
    shop.querySelector('.next').disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;
  }
  rail.addEventListener('scroll',updateArrows,{passive:true});new ResizeObserver(updateArrows).observe(rail);
  shop.querySelectorAll('.shop-arrow').forEach(button=>button.onclick=()=>rail.scrollBy({left:(button.classList.contains('next')?1:-1)*rail.clientWidth*.72,behavior:reduced()?'instant':'smooth'}));
  rail.addEventListener('click',event=>{const b=event.target.closest('[data-shop-plant]');if(!b)return;const index=Number(b.dataset.shopPlant);if(event.target.closest('[data-shop-buy]')){buyPlant(index);return;}selected=index;render();rail.querySelector(`[data-shop-plant="${selected}"] .shop-card-select`).focus({preventScroll:true});});
  rail.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const order=rules.plantDisplayOrder,pos=order.indexOf(selected);
    selected=order[event.key==='Home'?0:event.key==='End'?order.length-1:Math.max(0,Math.min(order.length-1,pos+(event.key==='ArrowRight'?1:-1)))];
    render();const b=rail.querySelector(`[data-shop-plant="${selected}"]`);b.querySelector('.shop-card-select').focus({preventScroll:true});const x=b.offsetLeft-rail.offsetLeft;if(x<rail.scrollLeft)rail.scrollLeft=x;else if(x+b.offsetWidth>rail.scrollLeft+rail.clientWidth)rail.scrollLeft=x+b.offsetWidth-rail.clientWidth;
  });
  // Translate touch drag into the game's rotated landscape coordinate system.
  let touch=null;
  rail.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;touch={id:e.pointerId,x:e.clientX,y:e.clientY,left:rail.scrollLeft};});
  rail.addEventListener('pointermove',e=>{if(!touch||touch.id!==e.pointerId)return;const rotated=Math.abs(parseFloat(getComputedStyle(document.querySelector('#game-shell')).getPropertyValue('--game-rotation')))>45;const delta=rotated?e.clientY-touch.y:e.clientX-touch.x;if(Math.abs(delta)>8){rail.setPointerCapture(e.pointerId);rail.scrollLeft=touch.left-delta;}});
  rail.addEventListener('pointerup',()=>{touch=null;});rail.addEventListener('pointercancel',()=>{touch=null;});
  async function buyPlant(index){
    const p=getProgress(),plant=rules.troops[index];
    if(buying||p.unlocks[index]||p.completedStages<plant.unlockStage||p.coins<plant.unlockCost)return;
    selected=index;buying=true;render();try{await onBuy(index);}finally{buying=false;render();}
  }
  shop.querySelector('.shop-buy').onclick=()=>buyPlant(selected);
  function render(){
    const progress=getProgress();
    if(selected<0)selected=rules.plantDisplayOrder.find(i=>!progress.unlocks[i]&&progress.completedStages>=rules.troops[i].unlockStage)??0;
    const p=rules.troops[selected],owned=progress.unlocks[selected],eligible=progress.completedStages>=p.unlockStage,enough=progress.coins>=p.unlockCost;
    shop.querySelector('.shop-hero').classList.toggle('locked',!owned&&!eligible);
    shop.querySelector('.shop-hero').dataset.actor=p.rigId||'';
    const hero=shop.querySelector('.shop-hero-character');hero.src=portrait(selected);hero.alt=p.name;
    shop.querySelector('h2').textContent=p.name;
    shop.querySelector('.shop-role').textContent=p.role||['RANGED','LONG RANGE','HEAVY HITTER','AREA DAMAGE'][selected]||'ATTACK';
    shop.querySelector('.shop-detail p').textContent=descriptions[selected];
    const buy=shop.querySelector('.shop-buy');buy.classList.toggle('is-owned',owned);buy.disabled=buying||owned||!eligible||!enough;
    buy.innerHTML=buying?'WELCOME…':owned?`${check()} OWNED`:`${coin()} ${p.unlockCost}`;
    buy.setAttribute('aria-label',owned?`${p.name} owned`:`Buy ${p.name} for ${p.unlockCost} coins`);
    shop.querySelector('.shop-requirement').textContent=owned?'Already in your garden':!eligible?`Clear Chapter ${p.unlockStage} to unlock`:!enough?'Not enough coins':'';
    const initial=rail.childElementCount===0, left=rail.scrollLeft;
    rail.innerHTML=rules.plantDisplayOrder.map(i=>{const plant=rules.troops[i],open=progress.unlocks[i],locked=!open&&progress.completedStages<plant.unlockStage,canBuy=!open&&!locked&&progress.coins>=plant.unlockCost;return `<div class="shop-card ${locked?'locked':''} ${selected===i?'selected':''}" data-shop-plant="${i}"><button type="button" class="shop-card-select" aria-pressed="${selected===i}" aria-label="Inspect ${plant.name}${open?', owned':locked?', locked':''}"><span class="shop-portrait"><span class="shop-ground-shadow" aria-hidden="true"></span><img class="shop-character" src="${portrait(i)}" alt="" draggable="false">${locked?`<img class="shop-lock" src="${lockAsset}" alt="">`:''}</span><strong>${plant.name}</strong></button>${open?`<span class="shop-card-state owned">${check()} OWNED</span>`:locked?`<span class="shop-card-state locked"><img src="${lockAsset}" alt=""> Clear Chapter ${plant.unlockStage}</span>`:`<button type="button" class="shop-card-state buyable" data-shop-buy="${i}" aria-label="Buy ${plant.name} for ${plant.unlockCost} coins" ${buying||!canBuy?'disabled':''}>${coin()} ${plant.unlockCost}</button>`}</div>`;}).join('');
    rail.scrollLeft=left;requestAnimationFrame(()=>{if(initial){const b=rail.querySelector(`[data-shop-plant="${selected}"]`),x=b.offsetLeft-rail.offsetLeft;if(x+b.offsetWidth>rail.clientWidth)rail.scrollLeft=x+b.offsetWidth-rail.clientWidth;}updateArrows();});
  }
  return {render};
}
