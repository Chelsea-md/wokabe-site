import {bossNames} from './boss-names.js?v=production-35';
import {separateSprites} from './library/art-directions/cartoon-v5/rig-renderer.js?v=production-35';
import {propAtlas} from './stage-layout.js?v=production-35';
export const worldThemes={
 moon:{name:'Moonlight',subtitle:'Whispering Grove',boss:bossNames.moon,color:'#d9b6ff',projectile:'#f4dfae'},
 camp:{name:'Night Camp',subtitle:'Moonlit Clearing',boss:bossNames.camp,color:'#ffc75a',projectile:'#ffd56a'},
 dune:{name:'Dune Loop',subtitle:'Dusty Desert',boss:bossNames.dune,color:'#ffc364',projectile:'#ffe1a5'},
 oasis:{name:'Sun Temple',subtitle:'Ancient Sands',boss:bossNames.oasis,color:'#ffd34d',projectile:'#ffe289'},
 noon:{name:'Sunset Dunes',subtitle:'Sunset Sands',boss:bossNames.noon,color:'#ffae65',projectile:'#ffe1a5'},
 ember:{name:'Ember Valley',subtitle:'Volcanic Wastes',boss:bossNames.ember,color:'#ff822f',projectile:'#ff993d'},
 frost:{name:'Frost Garden',subtitle:'Frozen Fields',boss:bossNames.frost,color:'#78dbff',projectile:'#b9f0ff'},
 coral:{name:'Coral Coast',subtitle:'Sunlit Shore',boss:bossNames.coral,color:'#4ee1d1',projectile:'#64e4dd'},
 hollow:{name:'Blue Hollow',subtitle:'Cursed Graveyard',boss:bossNames.hollow,color:'#8d9aff',projectile:'#a8baff'}
};
// Body pixels remain unchanged. Each supplied weapon pivots independently at its grip.
export function drawEnemyLayers(ctx,row,x,y,height,{attack=0}={}){
 const body=row.image,w=height*body.width/body.height;
 ctx.drawImage(body,x-w/2,y-height,w,height);
 if(!row.weaponImage)return;
 const weapon=row.weaponImage,z=height*(row.weaponSize||.84)/Math.max(weapon.width,weapon.height),handX=x+w*.32,handY=y-height*.27;
 ctx.save();ctx.translate(handX,handY);ctx.rotate(Math.max(0,Math.min(1,attack))*1.15);
 ctx.drawImage(weapon,-weapon.width*z*.18,-weapon.height*z*.85,weapon.width*z,weapon.height*z);
 ctx.beginPath();ctx.arc(0,0,height*.058,0,Math.PI*2);ctx.fillStyle=row.handColor||'#c0edcf';ctx.strokeStyle='#050807';ctx.lineWidth=height*.021;ctx.fill();ctx.stroke();ctx.restore();
}
export function createWorldArt(art,props={}){
 const grounds={},pending=new Map();
 async function image(file){const im=new Image();im.src=new URL('./assets/'+file,import.meta.url);await im.decode();return im;}
 function once(key,fn){if(!pending.has(key))pending.set(key,fn().catch(e=>{pending.delete(key);throw e;}));return pending.get(key);}
 async function ensure(layout){const theme=layout.theme,ground=theme==='noon'?'dune':theme,tasks=[];
  if(['dune','oasis',...Object.keys(worldThemes)].includes(ground))tasks.push(once('ground-'+theme,async()=>{grounds[theme]=await image('cartoon-v5-'+ground+'-ground-'+(ground==='moon'?'v35':ground==='camp'?'v32':'v19')+'.png');}));
  for(const name of new Set(layout.props.map(p=>propAtlas(p.asset))))if(!props[name])tasks.push(once('props-'+name,async()=>{props[name]=await image(name==='desert'?'cartoon-v5-desert-props.png':name==='egypt'?'cartoon-v5-egypt-props-v16.png':'cartoon-v5-'+name+'-props-'+(name==='moon'?'v35':name==='camp'?'v32':'v19')+'.png');}));
  if(worldThemes[theme])tasks.push(once('enemies-'+theme,async()=>{const source=theme==='noon'?'dune':theme,[body,weapon]=await Promise.all(['monsters','weapons'].map(kind=>image('cartoon-v5-'+source+'-'+kind+'-user-'+(source==='moon'?'v35':source==='camp'?'v32':'v19')+'.png'))),frames=separateSprites(body,5),weapons=separateSprites(weapon,5);for(const [i,kind]of ['shambler','courier','bruiser','elite','boss'].entries()){const frame=frames[i];art['skin-'+theme+'-'+kind]={image:frame.image,weaponImage:weapons[i].image,handColor:['hollow','moon'].includes(theme)&&i===4?'#d9cbed':'#c0edcf',bounds:[0,0,frame.image.width,frame.image.height]};}art['skin-'+theme+'-boss-attack']=art['skin-'+theme+'-boss'];}));
  await Promise.all(tasks);
 }
 return {grounds,props,ensure};
}
