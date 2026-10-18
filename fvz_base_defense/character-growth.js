export const growthAtlases={"mint":"cartoon-v5-growth-mint-armed-v22.png","mushroom":"cartoon-v5-growth-mushroom-armed-v22.png","cactus":"cartoon-v5-growth-cactus-armed-v22.png","clover":"cartoon-v5-growth-clover-armed-v22.png","bamboo":"cartoon-v5-growth-bamboo-armed-v22.png","starfruit":"cartoon-v5-growth-starfruit-armed-v22.png"};
export const growthCharacters=[
 {id:'poppy',name:'CHILI'}, {id:'bellflower',name:'ACORN'}, {id:'marigold',name:'PINECONE'}, {id:'sunflower',name:'SUNFLOWER'},
 {id:'mint',name:'CRYSTAL',bounds:[29,71,283,341]}, {id:'mushroom',name:'MUSHROOM',bounds:[316,95,565,338]},
 {id:'cactus',name:'MOSS GOLEM',bounds:[594,51,859,340]}, {id:'clover',name:'LILY',bounds:[604,366,858,636]},
 {id:'bamboo',name:'LEAF',bounds:[44,372,272,632]}, {id:'starfruit',name:'HOLLY',bounds:[325,416,556,637]}
];
export const hatFrames=[[40,188,371,355],[436,183,778,359],[820,114,1157,357],[1199,136,1548,359],[1597,133,1948,359],[52,465,382,691],[427,471,777,688],[821,463,1165,694],[1218,468,1564,684],[1596,462,1945,683]];
export const hatNames=['브라운 밴드','연두 밴드','녹색 모자','파랑 모자','핑크 모자','보라 모자','주황 모자','빨강 모자','블랙·실버 왕관','골드 왕관'];
export function defaultGrowth(){return {schemaVersion:1,characters:Object.fromEntries(growthCharacters.map(p=>[p.id,Array.from({length:10},(_,i)=>({hat:i===0?-1:i,x:.5,y:p.id==='sunflower'?.25:p.id==='mushroom'?.14:.23,width:p.id==='cactus'?.6:.65,rotation:0}))]))};}
export function validateGrowth(input){
 if(!input||input.schemaVersion!==1||!input.characters)throw Error('성장 설정 형식이 올바르지 않습니다.');
 const out=defaultGrowth();
 for(const p of growthCharacters){const rows=input.characters[p.id];if(!Array.isArray(rows)||rows.length!==10)throw Error(p.name+'의 10단계 설정이 필요합니다.');
 out.characters[p.id]=rows.map((r,i)=>{if(!r||!Number.isInteger(r.hat)||r.hat< -1||r.hat>9)throw Error('모자 종류가 올바르지 않습니다.');for(const [k,min,max]of [['x',-1,2],['y',-1,2],['width',.05,2],['rotation',-180,180]])if(!Number.isFinite(r[k])||r[k]<min||r[k]>max)throw Error('모자 '+k+' 범위를 확인해 주세요.');return {hat:i===0?-1:r.hat,x:r.x,y:r.y,width:r.width,rotation:r.rotation};});}
 return out;
}
export async function loadGrowthAssets(){
 const image=async file=>{const im=new Image();im.src=new URL('./assets/'+file,import.meta.url);await im.decode();return im;};
 const [hats,characters]=await Promise.all([image('cartoon-v5-growth-hats-v18.png'),image('cartoon-v5-extra-characters-v18.png')]);
 let config=defaultGrowth();try{const r=await fetch(new URL('./data/character-growth.json?v=production-23',import.meta.url));if(r.ok)config=validateGrowth(await r.json());if(location.hostname.endsWith('.chatgpt.site')){const response=await fetch('/api/character-growth');if(response.ok)config=validateGrowth((await response.json()).config);}}catch(e){console.warn('성장 설정 기본값을 사용합니다.',e.message);}
 return {hats,characters,config};
}
// Body-space positions follow the same flip, breathing and attack transform as the character.
export function drawGrowthHat(c,growth,id,star,box){
 if(star<2||!growth)return;const r=growth.config.characters[id]?.[star-1];if(!r||r.hat<0)return;
 const b=hatFrames[r.hat],w=box.width*r.width,h=w*(b[3]-b[1])/(b[2]-b[0]);c.save();c.translate(box.x+box.width*r.x,box.y+box.height*r.y);c.rotate(r.rotation*Math.PI/180);c.drawImage(growth.hats,b[0],b[1],b[2]-b[0],b[3]-b[1],-w/2,-h/2,w,h);c.restore();
}
