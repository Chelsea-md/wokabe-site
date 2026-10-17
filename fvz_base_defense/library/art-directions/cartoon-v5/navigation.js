// World-space navigation remains independent from the overlaid game UI.
export function spawnOutside(index,width=1200,height=600,random=Math.random){
  const side=index%7===6?1:index%4,t=.12+random()*.76,pad=85;
  return side===0?{x:-pad,y:height*t}:side===1?{x:width+pad,y:height*t}:side===2?{x:width*t,y:-pad}:{x:width*t,y:height+pad};
}
export function stageObstacles(stage){
  if(stage==='dune'||stage==='oasis')return [[185,151,28,34],[1020,211,28,34],[265,505,28,34],[945,500,28,34]];
  return [[360,143,43,43],[970,226,65,29],[437,445,43,25],[875,490,30,42]];
}
export function blocked(x,y,obstacles,padding=14){return obstacles.some(([cx,cy,rx,ry])=>((x-cx)/(rx+padding))**2+((y-cy)/(ry+padding))**2<1);}
export function findRoute(from,to,obstacles,padding=14){
  const size=20,ox=-100,oy=-100,cols=71,rows=41;
  const cell=p=>[Math.max(0,Math.min(cols-1,Math.round((p.x-ox)/size))),Math.max(0,Math.min(rows-1,Math.round((p.y-oy)/size)))];
  const [sx,sy]=cell(from),[tx,ty]=cell(to),key=(x,y)=>y*cols+x,start=key(sx,sy),goal=key(tx,ty),open=[start],cost=new Map([[start,0]]),parent=new Map(),closed=new Set();
  const heuristic=k=>Math.hypot(k%cols-tx,Math.floor(k/cols)-ty);
  const isBlocked=(x,y)=>x<0||y<0||x>=cols||y>=rows||blocked(ox+x*size,oy+y*size,obstacles,padding);
  while(open.length){
    let best=0;for(let i=1;i<open.length;i++)if(cost.get(open[i])+heuristic(open[i])<cost.get(open[best])+heuristic(open[best]))best=i;
    const current=open.splice(best,1)[0];if(current===goal){const path=[];let k=goal;while(k!==start){path.push({x:ox+(k%cols)*size,y:oy+Math.floor(k/cols)*size});k=parent.get(k);}return path.reverse();}
    closed.add(current);const x=current%cols,y=Math.floor(current/cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);if(closed.has(k)||isBlocked(nx,ny)||(dx&&dy&&(isBlocked(x+dx,y)||isBlocked(x,y+dy))))continue;
      const next=cost.get(current)+Math.hypot(dx,dy);if(!cost.has(k)||next<cost.get(k)){cost.set(k,next);parent.set(k,current);if(!open.includes(k))open.push(k);}
    }
  }
  return [];
}
export function moveEnemy(enemy,target,dt,speed,stop,obstacles){
  if(Math.hypot(target.x-enemy.x,target.y-enemy.y)<=stop)return false;
  enemy.navAge=(enemy.navAge||0)-dt;
  if(!enemy.path||enemy.navAge<=0||!enemy.navTarget||Math.hypot(enemy.navTarget.x-target.x,enemy.navTarget.y-target.y)>40){enemy.path=findRoute(enemy,target,obstacles,enemy.kind==='boss'?25:enemy.kind==='bruiser'?20:12);enemy.navTarget={...target};enemy.navAge=1.5;}
  while(enemy.path.length&&Math.hypot(enemy.path[0].x-enemy.x,enemy.path[0].y-enemy.y)<4)enemy.path.shift();
  if(!enemy.path.length)return false;
  const p=enemy.path[0],dx=p.x-enemy.x,dy=p.y-enemy.y,d=Math.hypot(dx,dy),step=Math.min(speed*dt,d);
  enemy.x+=dx/d*step;enemy.y+=dy/d*step;return true;
}
