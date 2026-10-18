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
// Weapon colours and highlights belong to the authored growth art; never tint a rectangular slice.
export function growthRegion(x,y,w,h,anchor,kind){if(kind!=='sunflower'&&y<h*.35)return 'sprout';return null;}
export function createGrowthSprite(image,star,kind,anchor=.5){
 const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const d=c.getImageData(0,0,cv.width,cv.height),w=cv.width,h=cv.height;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d.data[i+3]<15)continue;const rgb=[d.data[i],d.data[i+1],d.data[i+2]],region=growthRegion(x,y,w,h,anchor,kind);if(!region||Math.max(...rgb)<48)continue;if(region==='sprout'&&(kind==='poppy'||(kind==='bellflower'&&star===9)||star===1||rgb[1]<rgb[0]*1.1||rgb[1]<rgb[2]*1.1))continue;const next=materialColor(rgb,star);d.data[i]=next[0];d.data[i+1]=next[1];d.data[i+2]=next[2];}
 c.putImageData(d,0,0);return cv;
}
export function drawHeadSticker(c,x,y,width,star){const tier=tierFor(star),height=width*.27;c.save();c.translate(x,y);c.lineWidth=Math.max(4,width*.065);c.strokeStyle='#10171b';c.fillStyle=star===9?'#303b49':tier.color;c.lineJoin='round';c.lineCap='round';c.beginPath();if(tier.hat==='crown'){c.moveTo(-width*.5,height*.4);c.lineTo(-width*.53,-height*.8);c.lineTo(-width*.18,-height*.28);c.lineTo(0,-height*1.4);c.lineTo(width*.18,-height*.28);c.lineTo(width*.53,-height*.8);c.lineTo(width*.5,height*.4);c.closePath();}else if(tier.hat==='band'){c.roundRect(-width*.5,-height*.3,width,height*.65,height*.3);}else{c.moveTo(-width*.5,height*.35);c.quadraticCurveTo(-width*.6,-height*1.2,-width*.12,-height*1.35);c.quadraticCurveTo(width*.45,-height*(tier.hat==='beret'?1.8:1.25),width*.5,height*.15);c.closePath();}c.fill();c.stroke();if(tier.hat==='visor'){c.beginPath();c.moveTo(-width*.05,height*.25);c.lineTo(width*.7,height*.25);c.quadraticCurveTo(width*.65,height*.7,width*.3,height*.65);c.lineTo(-width*.05,height*.5);c.fill();c.stroke();}c.fillStyle=star===9?'#cbd5dc':'#fff0bf';c.beginPath();c.ellipse(-width*.17,-height*.12,width*.085,width*.085,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}

// Ten-star new allies use gold body materials. Work on complete ink-bounded colour
// regions, so side weapons are never cut by a rectangular recolouring boundary.
export function gildBodyPixels(pixels,w,h,anchor=.5){
 const out=pixels.slice(),seen=new Uint8Array(w*h),queue=new Int32Array(w*h),bodyRight=Math.min(.78,Math.max(.64,anchor+.30));
 const colored=k=>pixels[k*4+3]>15&&Math.max(pixels[k*4],pixels[k*4+1],pixels[k*4+2])>55;
 for(let seed=0;seed<w*h;seed++){if(seen[seed]||!colored(seed))continue;let head=0,tail=1,sx=0,sy=0,red=0,white=0;queue[0]=seed;seen[seed]=1;
  while(head<tail){const k=queue[head++],x=k%w,y=(k/w)|0,i=k*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];sx+=x;sy+=y;if(r>g*1.5&&r>b*1.25)red++;if(Math.min(r,g,b)>220&&Math.max(r,g,b)-Math.min(r,g,b)<35)white++;
   for(const next of [x?k-1:-1,x<w-1?k+1:-1,y?k-w:-1,y<h-1?k+w:-1])if(next>=0&&!seen[next]&&colored(next)){seen[next]=1;queue[tail++]=next;}}
  const cx=sx/tail/w,cy=sy/tail/h,eye=tail<w*h*.015&&white/tail>.7&&cy>.4&&cy<.74&&Math.abs(cx-anchor)<.17;
  if(cx>bodyRight||cy>.86||red/tail>.55||eye)continue;
  for(let n=0;n<tail;n++){const i=queue[n]*4,lum=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722,stops=[[0,[88,43,6]],[90,[174,100,9]],[170,[250,181,24]],[230,[255,227,110]],[255,[255,246,191]]];let upper=stops.findIndex(stop=>stop[0]>=lum);if(upper<1)upper=1;const a=stops[upper-1],b=stops[upper],t=(lum-a[0])/(b[0]-a[0]);for(let c=0;c<3;c++)out[i+c]=Math.round(a[1][c]+(b[1][c]-a[1][c])*t);}
 }
 return out;
}
export function createGoldGrowthSprite(image,anchor){const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const data=c.getImageData(0,0,cv.width,cv.height);data.data.set(gildBodyPixels(data.data,cv.width,cv.height,anchor));c.putImageData(data,0,0);return cv;}
