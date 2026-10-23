// One interaction model for mouse, touch and keyboard; selection never changes progress.
export function installSquadInteraction({frame,surface,getProgress,onSquad}){
 let slot=-1,plant=-1,drag=null,suppressClick=false;
 const buttons=()=>surface.querySelectorAll('[data-slot],[data-plant]');
 function paint(){
  surface.classList.toggle('choosing-slot',plant>=0);
  surface.classList.toggle('choosing-plant',slot>=0);
  const currentPlant=slot>=0?getProgress().loadout[slot]:undefined;
  buttons().forEach(b=>{
   const selected=b.hasAttribute('data-slot')?Number(b.dataset.slot)===slot:Number(b.dataset.plant)===plant;
   b.classList.toggle('squad-selected',selected);b.setAttribute('aria-pressed',String(selected));
   b.classList.toggle('squad-current',slot>=0&&b.hasAttribute('data-plant')&&Number(b.dataset.plant)===currentPlant);
  });
 }
 function cancel(){slot=plant=-1;paint();}
 function commit(index,target){
  cancel();onSquad(index,target);
  const b=surface.querySelector(`[data-slot="${target}"]`);
  b?.classList.add('squad-landed');setTimeout(()=>b?.classList.remove('squad-landed'),450);
  const live=surface.querySelector('[role=status]');if(live)live.textContent=`Slot ${target+1} updated`;
 }
 surface.addEventListener('click',e=>{
  if(suppressClick){suppressClick=false;e.preventDefault();return;}
  const b=e.target.closest('[data-slot],[data-plant]');if(!b)return;
  if(b.hasAttribute('data-slot')){
   const n=Number(b.dataset.slot);if(plant>=0)commit(plant,n);
   else if(slot>=0&&slot!==n&&getProgress().loadout[slot]!==undefined)commit(getProgress().loadout[slot],n);
   else{slot=slot===n?-1:n;paint();}
  }else{
   const n=Number(b.dataset.plant);if(slot>=0){if(getProgress().loadout[slot]===n)cancel();else commit(n,slot);}else{plant=plant===n?-1:n;paint();}
  }
 });
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-menu-surface="squad"] [data-slot],[data-menu-surface="squad"] [data-plant]'))cancel();});
 document.addEventListener('keydown',e=>{suppressClick=false;if(e.key==='Escape'){cancel();finishDrag();}});
 function finishDrag(returnToSource=false){
  const ghost=drag?.ghost,button=drag?.button;
  if(ghost&&returnToSource&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const rect=button.querySelector('img').getBoundingClientRect();
   ghost.style.transition='left .22s ease-out, top .22s ease-out, opacity .22s ease-out';
   ghost.style.left=(rect.left+rect.width/2)+'px';ghost.style.top=(rect.top+rect.height*.6)+'px';ghost.style.opacity='0';
   setTimeout(()=>ghost.remove(),230);
  }else ghost?.remove();
  button?.classList.remove('squad-drag-source');surface.querySelectorAll('.squad-drop-target').forEach(b=>b.classList.remove('squad-drop-target'));
  surface.classList.remove('squad-dragging');drag=null;
 }
 surface.addEventListener('dragstart',e=>e.preventDefault());
 surface.addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-slot],[data-plant]');if(!b||e.button!==0)return;
  suppressClick=false;
  const index=b.hasAttribute('data-plant')?Number(b.dataset.plant):getProgress().loadout[Number(b.dataset.slot)];
  if(index===undefined)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,index,button:b,ghost:null};
 });
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<9)return;
  if(!drag.ghost){
   const img=drag.button.querySelector('img');if(!img){finishDrag();return;}
   drag.ghost=img.cloneNode();drag.ghost.className='squad-drag-ghost';drag.ghost.alt='';
   const rotation=parseFloat(getComputedStyle(document.querySelector('#game-shell')).getPropertyValue('--game-rotation'))||0;
   const rect=img.getBoundingClientRect(),size=Math.max(52,Math.min(180,Math.abs(rotation)>45?rect.height:rect.width));
   drag.ghost.style.width=size+'px';drag.ghost.style.height=size+'px';
   drag.ghost.style.transform=`translate(-50%,-60%) rotate(${rotation}deg)`;
   drag.button.classList.add('squad-drag-source');
   document.body.append(drag.ghost);surface.classList.add('squad-dragging');cancel();
  }
  e.preventDefault();drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');
  surface.querySelectorAll('[data-slot]').forEach(b=>b.classList.toggle('squad-drop-target',b===target));
 },{passive:false});
 document.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const {index,ghost}=drag;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-menu-surface="squad"] [data-slot]');
  finishDrag(!target);if(!ghost)return;
  suppressClick=true;
  if(target)commit(index,Number(target.dataset.slot));else cancel();
 });
 document.addEventListener('pointercancel',()=>{finishDrag();cancel();});
 window.addEventListener('blur',()=>{finishDrag();cancel();});
 return {reset(){finishDrag();cancel();},paint};
}
