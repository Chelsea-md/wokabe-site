export async function loadRigs(){
  const manifest=await fetch('rigs.json').then(r=>r.json());
  for(const rig of Object.values(manifest.characters)){const image=new Image();image.src=rig.atlas;await image.decode();rig.image=image;}
  return manifest.characters;
}
const labels={head:'머리',body:'몸통',rearArm:'뒷팔',frontArm:'앞팔',leftLeg:'왼발',rightLeg:'오른발',weapon:'새총',seed:'씨앗'};
function piece(g,rig,key,x,y,h,anchor=[.5,.5],angle=0,pins=false){
  anchor=rig.parts[key].pivot||anchor;
  const b=rig.parts[key].source,sw=b[2]-b[0],sh=b[3]-b[1],w=h*sw/sh;
  g.save();g.translate(x,y);g.rotate(angle);g.drawImage(rig.image,b[0],b[1],sw,sh,-w*anchor[0],-h*anchor[1],w,h);
  if(pins){g.beginPath();g.arc(0,0,1.4,0,Math.PI*2);g.fillStyle='#ffdc4a';g.fill();g.lineWidth=.6;g.strokeStyle='#243c31';g.stroke();}g.restore();
}
export function drawRig(g,rigs,id,x,y,height,{time=0,flip=false,attack=0,action='idle',pins=false,alpha=1}={}){
  const rig=rigs[id];g.save();g.translate(x,y);g.scale((flip?-1:1)*height/108,height/108);g.globalAlpha*=alpha;
  const hit=action==='hit'?Math.max(0,Math.sin(time*5))**5:0;
  g.translate(hit*(id==='poppy'?-4:4),0);g.rotate(hit*(id==='poppy'?-.08:.08));
  if(id==='poppy'){
    const pull=action==='attack'?(Math.sin(time*5)+1)/2:attack,breath=Math.sin(time*2)*.65;
    piece(g,rig,'leftLeg',-12,-25,28,[.5,.08],-.06,pins);
    piece(g,rig,'rightLeg',12,-25,28,[.5,.08],.06,pins);
    g.save();g.translate(0,-43+breath);g.rotate(-pull*.035);
    piece(g,rig,'rearArm',-18,-12,31,[.12,.13],-.95+pull*.42,pins);
    piece(g,rig,'body',0,0,43,[.5,.5],0,pins);
    piece(g,rig,'head',0,-29,50,[.5,.5],Math.sin(time*1.7)*.015-pull*.025,pins);
    const armAngle=-1.80+pull*.13;g.save();g.translate(17,-11);g.rotate(armAngle);
    piece(g,rig,'frontArm',0,0,32,[.84,.1],0,pins);
    const arm=rig.parts.frontArm.source,armWidth=32*(arm[2]-arm[0])/(arm[3]-arm[1]);
    g.translate((.27-.84)*armWidth,(.86-.1)*32);g.rotate(-armAngle+.12);
    piece(g,rig,'weapon',0,1,32,[.5,.92],0,pins);
    piece(g,rig,'seed',-pull*4,-25,7,[.5,.5],0,false);g.restore();g.restore();
  }else{
    const walk=action==='walk',phase=time*5,step=walk?Math.sin(phase):0,lift=walk?Math.abs(Math.cos(phase))*1.2:0,lunge=action==='attack'?Math.max(0,Math.sin(time*4))**3:0;
    piece(g,rig,'rightLeg',10,-29-lift*.3,34,[.43,.08],-step*.23,pins);
    piece(g,rig,'leftLeg',-11,-29-lift*.3,34,[.64,.08],step*.23,pins);
    g.save();g.translate(-lunge*3,-47-lift+Math.sin(time*2)*.3);g.rotate(step*.025-lunge*.06);
    piece(g,rig,'rearArm',18,-15,39,[.83,.1],step*.18+lunge*.45,pins);
    piece(g,rig,'body',0,0,43,[.5,.5],0,pins);
    piece(g,rig,'head',-6,-32,49,[.5,.5],-step*.02+lunge*.03,pins);
    piece(g,rig,'frontArm',-17,-14,38,[.83,.1],-step*.18+lunge*.65,pins);g.restore();
  }
  g.restore();
}
export function drawExploded(g,rigs,id,width,height,time){
  const rig=rigs[id],entries=Object.entries(rig.parts),cols=id==='poppy'?4:3,rows=2,cw=width/cols,ch=height/rows;
  entries.forEach(([name,p],i)=>{const b=p.source,sw=b[2]-b[0],sh=b[3]-b[1],s=Math.min((cw-38)/sw,(ch-55)/sh),x=(i%cols)*cw+cw/2,y=Math.floor(i/cols)*ch+ch/2-10;
    g.save();g.translate(x,y);g.rotate(Math.sin(time*1.2+i)*.025);g.drawImage(rig.image,b[0],b[1],sw,sh,-sw*s/2,-sh*s/2,sw*s,sh*s);g.restore();
    g.font='700 14px "Malgun Gothic",sans-serif';g.fillStyle='#45634a';g.textAlign='center';g.fillText(labels[name],x,(Math.floor(i/cols)+1)*ch-12);
  });
}
