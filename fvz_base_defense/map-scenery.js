import {propPieces,propAtlas} from './stage-layout.js?v=production-21';
export const sandPalettes={
 dune:{base:'#e7b17b',light:'#f5cda0',edge:'#d89a64',dune:'#cc8e5c',grain:'#b58251',paving:'#bd9e70'},
 oasis:{base:'#e3d3a8',light:'#f3e4be',edge:'#ceba8b',dune:'#c7b181',grain:'#b49b69',paving:'#bba176'},
 noon:{base:'#eac593',light:'#f7ddb4',edge:'#d4ab77',dune:'#cda36b',grain:'#b89362',paving:'#bda27b'}
};
const terrainCache=new Map();
function randomFor(seed){let n=seed;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
export function paintSand(g,theme,width=1200,height=600){
 const palette=sandPalettes[theme]||sandPalettes.dune,key=theme+width+'x'+height;let cv=terrainCache.get(key);
 if(!cv){cv=document.createElement('canvas');cv.width=width;cv.height=height;const c=cv.getContext('2d'),rand=randomFor(theme==='oasis'?451:217),a=c.createRadialGradient(width*.46,height*.46,30,width*.46,height*.46,width*.68);a.addColorStop(0,palette.light);a.addColorStop(.5,palette.base);a.addColorStop(1,palette.edge);c.fillStyle=a;c.fillRect(0,0,width,height);
 c.fillStyle=palette.dune;c.globalAlpha=theme==='oasis'?.045:.11;for(let i=0;i<7;i++){const x=rand()*width,y=rand()*height;c.beginPath();c.moveTo(x-300,y-38);c.bezierCurveTo(x-100,y-58,x+25,y+25,x+240,y+45);c.bezierCurveTo(x+80,y+6,x-50,y+5,x-300,y-38);c.fill();}
 c.fillStyle=palette.grain;for(let i=0;i<210;i++){const x=rand()*width,y=rand()*height;c.globalAlpha=.1+rand()*.1;c.beginPath();c.ellipse(x,y,1.1+rand()*2.8,.7+rand()*1.4,0,0,Math.PI*2);c.fill();}
 if(theme==='oasis'){c.globalAlpha=.17;c.fillStyle=palette.paving;c.strokeStyle='#a18d64';c.lineWidth=1.5;for(const [x,y]of [[20,20],[102,18],[0,115],[74,117],[0,295],[75,301],[1100,50],[1160,125],[1085,130],[1110,470],[1180,450]]){c.save();c.translate(x,y);c.rotate(.2);c.beginPath();c.roundRect(-35,-19,67,36,5);c.fill();c.stroke();c.restore();}}
 c.globalAlpha=1;terrainCache.set(key,cv);}
 for(let row=-1;row<=1;row++)for(let col=-1;col<=1;col++){g.save();g.translate(col*width+(col?width:0),row*height+(row?height:0));g.scale(col?-1:1,row?-1:1);g.drawImage(cv,0,0,width,height);g.restore();}
}
export function paintMapProps(g,layout,atlases){for(const p of [...layout.props].filter(p=>p.visible).sort((a,b)=>a.y-b.y)){const [sx,sy,sw,sh]=propPieces[p.asset],w=p.height*sw/sh;g.save();g.globalAlpha=p.shadow.opacity;g.fillStyle=layout.theme==='oasis'?'#766a4d':'#835637';g.beginPath();g.ellipse(p.x+p.shadow.x,p.y+p.shadow.y,w*p.shadow.width/2,p.shadow.height/2,0,0,Math.PI*2);g.fill();g.restore();if(!atlases[propAtlas(p.asset)])continue;g.drawImage(atlases[propAtlas(p.asset)],sx,sy,sw,sh,p.x-w/2,p.y-p.height,w,p.height);}}
