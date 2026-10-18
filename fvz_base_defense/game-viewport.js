// Screen rectangles are axis aligned even when the landscape shell is rotated.
export function screenPoint(rect,x,y,width,height,rotated=false){
 return rotated?{x:(y-rect.top)*width/rect.height,y:(rect.right-x)*height/rect.width}:{x:(x-rect.left)*width/rect.width,y:(y-rect.top)*height/rect.height};
}
export function gamePoint(element,x,y,width,height){return screenPoint(element.getBoundingClientRect(),x,y,width,height,getComputedStyle(document.querySelector('#game-shell')).getPropertyValue('--game-rotation').trim()==='90deg');}
export function gameBounds(element,relative){const r=element.getBoundingClientRect(),width=relative.clientWidth,height=relative.clientHeight,a=gamePoint(relative,r.left,r.top,width,height),b=gamePoint(relative,r.right,r.bottom,width,height);return {left:Math.min(a.x,b.x),top:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)};}

// Capture feedback is visual only: native buttons, dragging and multi-touch keep
// their own pointer events. Positions use the same inverse rotation as gameplay.
export function installTapFeedback(){
 const shell=document.querySelector('#game-shell');if(!shell||shell.querySelector('.tap-feedback-layer'))return;
 const layer=document.createElement('div');layer.className='tap-feedback-layer';layer.setAttribute('aria-hidden','true');shell.append(layer);
 shell.addEventListener('pointerdown',event=>{
  if(event.button>0)return;
  const at=gamePoint(shell,event.clientX,event.clientY,shell.clientWidth,shell.clientHeight),pulse=document.createElement('i');
  pulse.className='tap-feedback';pulse.style.left=at.x+'px';pulse.style.top=at.y+'px';
  while(layer.childElementCount>=12)layer.firstElementChild.remove();layer.append(pulse);
  pulse.addEventListener('animationend',()=>pulse.remove(),{once:true});setTimeout(()=>pulse.remove(),650);
 },{capture:true,passive:true});
}
if(typeof document!=='undefined')installTapFeedback();
