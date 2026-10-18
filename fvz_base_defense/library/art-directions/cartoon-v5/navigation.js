// World-space navigation remains independent from the overlaid game UI.
export function spawnOutside(index,width=1200,height=600,random=Math.random){
  const side=index%7===6?1:index%4,t=.12+random()*.76,pad=85;
  return side===0?{x:-pad,y:height*t}:side===1?{x:width+pad,y:height*t}:side===2?{x:width*t,y:-pad}:{x:width*t,y:height+pad};
}
export function stageObstacles(stage){
  // Full visible scenery bounds, not only the trunk or ground contact.
  if(stage==='moon')return [[367,135,77,76],[956,220,48,35],[446,449,55,28],[875,467,46,72]];
  if(['dune','oasis','noon'].includes(stage))return [[183,151,28,26],[1018,211,28,26],[263,506,28,26],[943,501,28,26]];
  return [[360,116,73,86],[970,225,60,43],[438,433,52,38],[865,497,53,66]];
}
export function blocked(x,y,obstacles,padding=14){return obstacles.some(([cx,cy,rx,ry])=>((x-cx)/(rx+padding))**2+((y-cy)/(ry+padding))**2<1);}
export function bodyObstacles(enemy,obstacles){const height=enemy.kind==='boss'?150:enemy.kind==='bruiser'?85:60,lift=height*.48;return obstacles.map(([x,y,rx,ry])=>[x,y+lift,rx,ry+lift]);}
export function segmentBlocked(from,to,obstacles,padding=14){const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/4));for(let i=0;i<=steps;i++){const t=i/steps;if(blocked(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t,obstacles,padding))return true;}return false;}
export function findRoute(from,to,obstacles,padding=14){
  const size=20,ox=-100,oy=-100,cols=71,rows=41;
  const cell=p=>[Math.max(0,Math.min(cols-1,Math.round((p.x-ox)/size))),Math.max(0,Math.min(rows-1,Math.round((p.y-oy)/size)))];
  const startCell=p=>{const[cx,cy]=cell(p);let best=null,distance=Infinity;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=cx+dx,y=cy+dy,q={x:ox+x*size,y:oy+y*size},d=Math.hypot(q.x-p.x,q.y-p.y);if(x<0||y<0||x>=cols||y>=rows||d>=distance||blocked(q.x,q.y,obstacles,padding)||segmentBlocked(p,q,obstacles,padding))continue;best=[x,y];distance=d;}return best||cell(p);};
  const [sx,sy]=startCell(from),[tx,ty]=cell(to),key=(x,y)=>y*cols+x,start=key(sx,sy),goal=key(tx,ty),open=[start],cost=new Map([[start,0]]),parent=new Map(),closed=new Set();
  const heuristic=k=>Math.hypot(k%cols-tx,Math.floor(k/cols)-ty);
  const isBlocked=(x,y)=>x<0||y<0||x>=cols||y>=rows||blocked(ox+x*size,oy+y*size,obstacles,padding);
  while(open.length){
    let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+heuristic(open[i])<cost.get(open[best])+heuristic(open[best]))best=i;
    const current=open.splice(best,1)[0];if(current===goal){const path=[];let k=goal;while(k!==start){path.push({x:ox+(k%cols)*size,y:oy+Math.floor(k/cols)*size});k=parent.get(k);}return [{x:ox+sx*size,y:oy+sy*size},...path.reverse()];}
    closed.add(current);const x=current%cols,y=Math.floor(current/cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);if(closed.has(k)||isBlocked(nx,ny)||(dx&&dy&&(isBlocked(x+dx,y)||isBlocked(x,y+dy)))||segmentBlocked({x:ox+x*size,y:oy+y*size},{x:ox+nx*size,y:oy+ny*size},obstacles,padding))continue;
      const next=cost.get(current)+Math.hypot(dx,dy);if(!cost.has(k)||next<cost.get(k)){cost.set(k,next);parent.set(k,current);if(!open.includes(k))open.push(k);}
    }
  }
  return [];
}
export function moveEnemy(enemy,target,dt,speed,stop,obstacles){
  const padding=enemy.kind==='boss'?25:enemy.kind==='bruiser'?20:14,solid=bodyObstacles(enemy,obstacles);
  // Recover safely if scenery changes or an earlier position was already obstructed.
  for(let pass=0;pass<4;pass++)for(const[cx,cy,rx,ry]of solid){const ax=rx+padding+1,ay=ry+padding+1,dx=enemy.x-cx,dy=enemy.y-cy,n=Math.hypot(dx/ax,dy/ay);if(n<1){enemy.x=cx+(n?dx/n:ax);enemy.y=cy+(n?dy/n:0);enemy.path=null;}}
  if(Math.hypot(target.x-enemy.x,target.y-enemy.y)<=stop)return false;
  enemy.navAge=(enemy.navAge||0)-dt;
  if(!enemy.path||enemy.navAge<=0||!enemy.navTarget||Math.hypot(enemy.navTarget.x-target.x,enemy.navTarget.y-target.y)>40){enemy.path=findRoute(enemy,target,solid,padding);enemy.navTarget={...target};enemy.navAge=1.5;while(enemy.path.length&&segmentBlocked(enemy,enemy.path[0],solid,padding)){if(enemy.path.length>1&&!segmentBlocked(enemy,enemy.path[1],solid,padding))enemy.path.shift();else{enemy.path=[];break;}}}
  while(enemy.path.length&&Math.hypot(enemy.path[0].x-enemy.x,enemy.path[0].y-enemy.y)<4)enemy.path.shift();
  if(!enemy.path.length)return false;
  const p=enemy.path[0],dx=p.x-enemy.x,dy=p.y-enemy.y,d=Math.hypot(dx,dy),step=Math.min(speed*dt,d);
  if(!d)return false;const next={x:enemy.x+dx/d*step,y:enemy.y+dy/d*step};if(segmentBlocked(enemy,next,solid,padding)){enemy.path=null;enemy.navAge=0;return false;}enemy.x=next.x;enemy.y=next.y;return true;
}
