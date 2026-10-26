// World-space navigation remains independent from the overlaid game UI.
export function spawnOutside(index,width=1200,height=600,random=Math.random){
  const side=index%7===6?1:index%4,t=.12+random()*.76,pad=85;
  return side===0?{x:-pad,y:height*t}:side===1?{x:width+pad,y:height*t}:side===2?{x:width*t,y:-pad}:{x:width*t,y:height+pad};
}
export function stageObstacles(stage){
  // Full visible scenery bounds, not only the trunk or ground contact.
  if(stage==='moon')return [[367,135,77,76],[956,220,48,35],[446,449,55,28],[875,467,46,72]];
  if(['dune','oasis','noon'].includes(stage))return [[145,150,40,55],[1030,150,60,70],[260,445,67,40],[970,450,42,55],[80,358,25,23],[1125,380,27,27],[825,105,27,22],[315,77,23,20]];
  return [[360,116,73,86],[970,225,60,43],[438,433,52,38],[865,497,53,66]];
}
// Choose a clear, connected off-screen entry before an actor is introduced.
export function navigableSpawn(index,enemy,target,stop,obstacles,width=1200,height=600,random=Math.random){
 const padding=enemy.kind==='boss'?25:enemy.kind==='bruiser'?20:14,solid=bodyObstacles(enemy,obstacles);
 for(let n=0;n<48;n++){const p=spawnOutside(index+n,width,height,n===0?random:()=>((n*7)%47)/47);if(!blocked(p.x,p.y,solid,padding)&&(!segmentBlocked(p,target,solid,padding)||findRoute(p,target,solid,padding,stop).length))return p;}
 return null; // Invalid, sealed authoring must not create an enemy inside scenery.
}
export function blocked(x,y,obstacles,padding=14){return obstacles.some(([cx,cy,rx,ry])=>((x-cx)/(rx+padding))**2+((y-cy)/(ry+padding))**2<1);}
export function bodyObstacles(enemy,obstacles){const height=(enemy.kind==='boss'?150:enemy.kind==='bruiser'?85:60)*(enemy.visualScale||1),lift=height*.48;return obstacles.map(([x,y,rx,ry])=>[x,y+lift,rx,ry+lift]);}
export function segmentBlocked(from,to,obstacles,padding=14){const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/4));for(let i=0;i<=steps;i++){const t=i/steps;if(blocked(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t,obstacles,padding))return true;}return false;}
export function findRoute(from,to,obstacles,padding=14,stop=0){
  const size=20,ox=-300,oy=-300,cols=91,rows=61;
  const cell=p=>[Math.max(0,Math.min(cols-1,Math.round((p.x-ox)/size))),Math.max(0,Math.min(rows-1,Math.round((p.y-oy)/size)))];
  const startCell=p=>{const[cx,cy]=cell(p);let best=null,distance=Infinity;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=cx+dx,y=cy+dy,q={x:ox+x*size,y:oy+y*size},d=Math.hypot(q.x-p.x,q.y-p.y);if(x<0||y<0||x>=cols||y>=rows||d>=distance||blocked(q.x,q.y,obstacles,padding)||segmentBlocked(p,q,obstacles,padding))continue;best=[x,y];distance=d;}return best||cell(p);};
  const [sx,sy]=startCell(from),[tx,ty]=cell(to),key=(x,y)=>y*cols+x,start=key(sx,sy),goal=key(tx,ty),open=[start],cost=new Map([[start,0]]),parent=new Map(),closed=new Set();
  const heuristic=k=>Math.hypot(k%cols-tx,Math.floor(k/cols)-ty);
  const isBlocked=(x,y)=>x<0||y<0||x>=cols||y>=rows||blocked(ox+x*size,oy+y*size,obstacles,padding);
  while(open.length){
    let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+heuristic(open[i])<cost.get(open[best])+heuristic(open[best]))best=i;
    const current=open.splice(best,1)[0],at={x:ox+(current%cols)*size,y:oy+Math.floor(current/cols)*size};if((current===goal&&stop===0)||Math.hypot(at.x-to.x,at.y-to.y)<=stop){const path=[];let k=current;while(k!==start){path.push({x:ox+(k%cols)*size,y:oy+Math.floor(k/cols)*size});k=parent.get(k);}return [{x:ox+sx*size,y:oy+sy*size},...path.reverse()];}
    closed.add(current);const x=current%cols,y=Math.floor(current/cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);if(closed.has(k)||isBlocked(nx,ny)||(dx&&dy&&(isBlocked(x+dx,y)||isBlocked(x,y+dy)))||segmentBlocked({x:ox+x*size,y:oy+y*size},{x:ox+nx*size,y:oy+ny*size},obstacles,padding))continue;
      const next=cost.get(current)+Math.hypot(dx,dy);if(!cost.has(k)||next<cost.get(k)){cost.set(k,next);parent.set(k,current);if(!open.includes(k))open.push(k);}
    }
  }
  return [];
}
// Prefer low-health defenders in acquisition range; otherwise approach the base.
export function selectEnemyTarget(enemy,units,position){
 const candidates=units.filter(u=>u.hp>0&&(enemy.avoidTarget==null||u.id!==enemy.avoidTarget)).map(u=>({u,p:position(u.slot)})).filter(t=>enemy.kind==='courier'||Math.hypot(t.p.x-enemy.x,t.p.y-enemy.y)<140);
 return candidates.sort((a,b)=>a.u.hp-b.u.hp||Math.hypot(a.p.x-enemy.x,a.p.y-enemy.y)-Math.hypot(b.p.x-enemy.x,b.p.y-enemy.y))[0]||null;
}
export function moveEnemy(enemy,target,dt,speed,stop,obstacles){
 const padding=enemy.kind==='boss'?25:enemy.kind==='bruiser'?20:14,solid=bodyObstacles(enemy,obstacles);
 const distance=Math.hypot(target.x-enemy.x,target.y-enemy.y);
 if(distance<=stop+.01){enemy.navStalled=0;enemy.navRecovery=false;enemy.navWatch=null;return false;}
 const direct=()=>{const amount=Math.min(speed*dt,Math.max(0,distance-stop));if(amount<=0)return false;enemy.x+=(target.x-enemy.x)/distance*amount;enemy.y+=(target.y-enemy.y)/distance*amount;return true;};
 // Never bypass collision: even recovery follows validated world-space segments.
 const approach={x:target.x+(enemy.x-target.x)/distance*stop,y:target.y+(enemy.y-target.y)/distance*stop};
 if(!segmentBlocked(enemy,approach,solid,padding)){enemy.path=null;enemy.navStalled=0;enemy.navWatch=null;return direct();}
 enemy.navAge=(enemy.navAge||0)-dt;
 if(!enemy.path||(enemy.path.length===0&&enemy.navAge<=0)||!enemy.navTarget||Math.hypot(enemy.navTarget.x-target.x,enemy.navTarget.y-target.y)>10||enemy.navStop!==stop){
  enemy.path=findRoute(enemy,target,solid,padding,stop);enemy.navTarget={...target};enemy.navStop=stop;enemy.navAge=1.5;
 }
 while(enemy.path.length&&Math.hypot(enemy.path[0].x-enemy.x,enemy.path[0].y-enemy.y)<.1)enemy.path.shift();
 const before={x:enemy.x,y:enemy.y},p=enemy.path[0];
 if(p){const dx=p.x-enemy.x,dy=p.y-enemy.y,d=Math.hypot(dx,dy),step=Math.min(speed*dt,d),next={x:enemy.x+dx/d*step,y:enemy.y+dy/d*step};if(!segmentBlocked(enemy,next,solid,padding)){enemy.x=next.x;enemy.y=next.y;}else{enemy.path=null;enemy.navAge=0;}}
 const moved=Math.hypot(enemy.x-before.x,enemy.y-before.y)>.001;
 enemy.navStalled=moved?0:(enemy.navStalled||0)+dt;
 if(!enemy.navWatch)enemy.navWatch={x:enemy.x,y:enemy.y,age:0};
 enemy.navWatch.age+=dt;
 if(enemy.navWatch.age>=4){enemy.navWatch={x:enemy.x,y:enemy.y,age:0};}
 if(enemy.navStalled>=2){enemy.navStalled=0;enemy.navAge=0;enemy.path=null;}
 return moved;
}
