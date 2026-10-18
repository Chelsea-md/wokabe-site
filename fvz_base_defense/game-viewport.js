// Screen rectangles are axis aligned even when the landscape shell is rotated.
export function screenPoint(rect,x,y,width,height,rotated=false){
 return rotated?{x:(y-rect.top)*width/rect.height,y:(rect.right-x)*height/rect.width}:{x:(x-rect.left)*width/rect.width,y:(y-rect.top)*height/rect.height};
}
export function gamePoint(element,x,y,width,height){return screenPoint(element.getBoundingClientRect(),x,y,width,height,getComputedStyle(document.querySelector('#game-shell')).getPropertyValue('--game-rotation').trim()==='90deg');}
export function gameBounds(element,relative){const r=element.getBoundingClientRect(),width=relative.clientWidth,height=relative.clientHeight,a=gamePoint(relative,r.left,r.top,width,height),b=gamePoint(relative,r.right,r.bottom,width,height);return {left:Math.min(a.x,b.x),top:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)};}
