// Runtime character materials: original silhouettes stay intact; face/body colours are protected.
export const growthTiers=[
 {name:'WALNUT',color:'#9e805f',hat:'none'},
 {name:'SPROUT',color:'#b8ca82',hat:'band'},
 {name:'LEAF',color:'#699c77',hat:'cap'},
 {name:'SKY',color:'#779fc5',hat:'beret'},
 {name:'ROSE',color:'#cb8fa9',hat:'visor'},
 {name:'VIOLET',color:'#a78ac2',hat:'cap'},
 {name:'AMBER',color:'#cf9b65',hat:'beret'},
 {name:'CRIMSON',color:'#c67572',hat:'visor'},
 {name:'ONYX / SILVER',color:'#a7b5bf',hat:'crown'},
 {name:'GOLD',color:'#dfbb5c',hat:'crown'}
];
export function tierFor(star){return growthTiers[Math.max(0,Math.min(9,Math.round(star)-1))];}
export function materialColor(rgb,star){const color=tierFor(star).color,r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16),light=(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)/170,shade=Math.max(.56,Math.min(1.22,light));if(star===9&&light<1.08)return [43,53,65].map(v=>Math.round(v*Math.max(.8,shade)));return[r,g,b].map(v=>Math.min(255,Math.round(v*shade)));}
export function growthRegion(x,y,w,h,anchor,kind){const head=anchor*w;if(kind!=='sunflower'&&y<h*.35)return 'sprout';if(y>h*.48&&y<h*.86&&x>head+h*(kind==='sunflower'?.35:.23))return 'weapon';return null;}
export function createGrowthSprite(image,star,kind,anchor=.5){
 const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const d=c.getImageData(0,0,cv.width,cv.height),w=cv.width,h=cv.height;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d.data[i+3]<15)continue;const rgb=[d.data[i],d.data[i+1],d.data[i+2]],region=growthRegion(x,y,w,h,anchor,kind);if(!region||Math.max(...rgb)<48)continue;if(region==='sprout'&&(star===1||rgb[1]<rgb[0]*1.1||rgb[1]<rgb[2]*1.1))continue;const next=materialColor(rgb,star);d.data[i]=next[0];d.data[i+1]=next[1];d.data[i+2]=next[2];}
 c.putImageData(d,0,0);return cv;
}
export function drawHeadSticker(c,x,y,width,star){const tier=tierFor(star),height=width*.27;c.save();c.translate(x,y);c.lineWidth=Math.max(4,width*.065);c.strokeStyle='#10171b';c.fillStyle=star===9?'#303b49':tier.color;c.lineJoin='round';c.lineCap='round';c.beginPath();if(tier.hat==='crown'){c.moveTo(-width*.5,height*.4);c.lineTo(-width*.53,-height*.8);c.lineTo(-width*.18,-height*.28);c.lineTo(0,-height*1.4);c.lineTo(width*.18,-height*.28);c.lineTo(width*.53,-height*.8);c.lineTo(width*.5,height*.4);c.closePath();}else if(tier.hat==='band'){c.roundRect(-width*.5,-height*.3,width,height*.65,height*.3);}else{c.moveTo(-width*.5,height*.35);c.quadraticCurveTo(-width*.6,-height*1.2,-width*.12,-height*1.35);c.quadraticCurveTo(width*.45,-height*(tier.hat==='beret'?1.8:1.25),width*.5,height*.15);c.closePath();}c.fill();c.stroke();if(tier.hat==='visor'){c.beginPath();c.moveTo(-width*.05,height*.25);c.lineTo(width*.7,height*.25);c.quadraticCurveTo(width*.65,height*.7,width*.3,height*.65);c.lineTo(-width*.05,height*.5);c.fill();c.stroke();}c.fillStyle=star===9?'#cbd5dc':'#fff0bf';c.beginPath();c.ellipse(-width*.17,-height*.12,width*.085,width*.085,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}
