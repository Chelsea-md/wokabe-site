// Two-touch camera ownership lasts until every participating finger is lifted.
export function createPinch({getZoom,setZoom,cancelDrag}) {
 const touches=new Map(); let locked=false,baseline=0,startZoom=1;
 const distance=()=>{const [a,b]=[...touches.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};
 return {
  get active(){return locked;},
  down(id,x,y){touches.set(id,{x,y});if(touches.size===2&&!locked){locked=true;cancelDrag();baseline=distance();startZoom=getZoom();}return locked;},
  move(id,x,y){if(touches.has(id))touches.set(id,{x,y});if(locked&&touches.size===2&&baseline>0)setZoom(Math.max(.96,Math.min(1.12,startZoom*distance()/baseline)));return locked;},
  up(id){const consumed=locked;touches.delete(id);if(!touches.size){locked=false;baseline=0;}else if(locked&&touches.size===2){baseline=distance();startZoom=getZoom();}return consumed;},
  reset(){touches.clear();locked=false;baseline=0;}
 };
}
