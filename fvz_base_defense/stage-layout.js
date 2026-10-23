// Shared by the renderer, LIVE OPS editor and private persistence validator.
import {addCampDecor} from './camp-decor.js';
export const themes=['green','dune','camp','moon','oasis','noon','ember','frost','coral','hollow'];
export const themeNames=['Garden','Dune Loop','Night Camp','Moonlight','Sun Temple','High Noon','Ember Valley','Frost Garden','Coral Coast','Blue Hollow'];
export const propNames=['큰 선인장','꽃 선인장','야자수','바위 무리','사암 기둥','마른 풀','마른 가지','통나무','작은 돌','붉은 바위','피라미드','오벨리스크','유적 기둥','신전 문','스카라브 비석','푸른 띠 항아리','사암 상자','이집트 야자수','유적 돌무더기','푸른 연꽃'];
export const propPieces=[[40,85,295,410],[380,230,290,275],[705,95,360,415],[1070,220,380,290],[1460,100,290,415],[40,590,285,250],[385,580,270,265],[735,600,315,260],[1160,680,220,175],[1440,620,300,245]];
propPieces.push(...[[38, 165, 362, 241], [469, 17, 227, 405], [819, 92, 245, 315], [1174, 83, 379, 335], [1635, 122, 311, 290], [33, 489, 282, 271], [402, 508, 336, 237], [807, 434, 342, 327], [1206, 503, 360, 237], [1653, 498, 283, 257]]);
propNames.push(...["용암 바위", "현무암 기둥", "불탄 나무", "용암 분화구", "용암 돌문", "그을린 그루터기", "용암 통나무", "화염 풀", "갈라진 용암석", "화로", "눈 덮인 전나무", "얼음 바위", "얼음 수정", "얼음 돌문", "이글루", "눈 그루터기", "눈 통나무", "설원 덤불", "얼음 풀", "눈 덮인 돌", "산호", "해초", "해안 바위", "조개", "해안 돌문", "소라", "유목", "닻", "난파선 상자", "불가사리", "달 비석", "깨진 비석", "묘지 고목", "묘지 울타리", "푸른 석등", "푸른 방울꽃", "묘지 들꽃", "납골당", "버섯 통나무", "돌 화분"]);
propPieces.push(...[[30, 138, 378, 293], [465, 81, 302, 340], [804, 54, 364, 392], [1193, 208, 357, 237], [1577, 105, 378, 317], [47, 526, 317, 207], [465, 514, 293, 229], [842, 488, 335, 249], [1219, 556, 332, 182], [1655, 444, 237, 306], [54, 93, 320, 364], [413, 172, 346, 283], [816, 106, 310, 350], [1169, 117, 409, 331], [1610, 178, 334, 285], [83, 520, 267, 227], [463, 524, 316, 233], [869, 498, 299, 248], [1255, 523, 304, 218], [1625, 565, 297, 185], [38, 86, 357, 343], [422, 60, 324, 360], [759, 136, 400, 301], [1186, 141, 349, 294], [1562, 99, 397, 330], [58, 492, 307, 252], [416, 511, 360, 248], [830, 443, 310, 315], [1192, 480, 353, 282], [1594, 526, 346, 229], [18, 200, 307, 320], [354, 220, 329, 306], [666, 54, 388, 467], [1068, 246, 412, 276], [1519, 164, 236, 364], [23, 567, 329, 287], [386, 605, 245, 258], [684, 519, 373, 351], [1088, 622, 361, 243], [1477, 566, 277, 306]]);
export const propAtlas=asset=>['desert','egypt','ember','frost','coral','hollow','camp','moon'][Math.floor(asset/10)];
propNames.push('야영지 전나무','야영지 텐트','모닥불','매달린 랜턴','야영지 바위','야영지 그루터기','장작 더미','침낭','상자와 물통','버섯 덤불');
propPieces.push(...[[33,92,292,356],[363,130,356,310],[762,152,280,307],[1152,120,194,305],[1434,193,307,235],[21,580,315,215],[388,560,286,231],[726,586,321,207],[1105,556,297,255],[1451,555,302,246]]);
propNames.push('달빛 고목','달 문양 바위','달빛 의식문','초승달 제단','달빛 랜턴','달빛 그루터기','달빛 통나무','달빛 방울꽃','달빛 우물','초승달 버섯');
propPieces.push(...[[36,87,347,432],[380,279,324,221],[713,171,377,331],[1138,173,288,337],[1491,143,241,364],[30,552,340,260],[394,605,309,196],[739,561,328,260],[1109,570,304,250],[1458,566,286,260]]);
const desertPositions=[[0,85,285,110],[2,210,145,120],[3,140,400,78],[4,1100,150,95],[1,320,165,58],[5,75,470,42],[6,495,485,58],[7,880,185,65],[8,275,470,23],[9,205,462,58]];
const templePositions=[[10,105,260,95],[11,320,140,130],[12,110,410,95],[13,1060,180,115],[14,560,490,75],[15,210,455,70],[16,1100,420,65],[17,180,135,125],[18,70,490,70],[19,430,480,55]];
function legacyProps(props){return Array.isArray(props)&&props.length===10&&props.every((p,i)=>{const [asset,x,y,height]=legacyPositions[i];return p.id==='prop-'+i&&p.asset===asset&&p.x===x&&p.y===y&&p.height===height&&p.visible===true&&!p.flipX&&p.solid===![5,8].includes(asset)&&p.shadow?.width===.74&&p.shadow?.height===10&&p.shadow?.opacity===.14&&p.shadow?.x===0&&p.shadow?.y===-2;});}
export function upgradeStage(input){if(input?.theme==='moon'&&(input.layoutVersion||0)<4&&input.props?.length===0)return {...input,layoutVersion:4,props:defaultStage(4).props};if(input?.theme==='camp'&&(input.layoutVersion||0)<3&&input.props?.length===0)return {...input,layoutVersion:3,props:defaultStage(3).props};if(input&&!input.layoutVersion&&['dune','oasis','noon'].includes(input.theme)&&input.theme===themes[(input.stage-1)%6]&&legacyProps(input.props)){return {...input,layoutVersion:2,props:defaultStage(themes.indexOf(input.theme)+1).props};}return input;}

const legacyPositions=[[0,145,205,110],[2,1030,220,140],[3,260,480,75],[4,970,500,105],[1,80,380,45],[5,465,520,34],[6,1125,405,50],[7,825,125,40],[8,705,475,28],[9,315,95,36]];
export function defaultStage(stage=1){
 const layout=baseStage(stage);
 // The old crate overlapped the upper-right spawn after the scenery camera transform.
 // Only fresh defaults change; published/custom layouts are never rewritten.
 if(layout.theme==='camp'){
  // Compact campsite clusters leave the central deployment area and all four approaches open.
  const positions=[[245,145,104],[180,285,82],[230,365,52],[125,245,68],[975,165,64],[155,410,45],[170,365,42],[205,305,36],[940,475,45],[920,500,48]];
  layout.props.forEach((p,i)=>{const [x,y,height]=positions[i];Object.assign(p,{x,y,height});p.shadow={width:.8,height:6,opacity:.22,x:0,y:-1};});
 }
 return addCampDecor(layout);
}
function baseStage(stage=1){
 const theme=themes[(stage-1)%themes.length],desert=['dune','oasis','noon'].includes(theme),extra=['ember','frost','coral','hollow'].indexOf(theme),extraPositions=[[0,110,255,100],[1,270,120,90],[2,90,415,120],[3,1100,160,100],[4,1020,490,90],[5,150,495,65],[6,850,145,65],[7,385,495,60],[8,765,500,45],[9,1120,350,65]];
 return {schemaVersion:1,stage,theme,background:{scale:1,x:0,y:0,brightness:1},glow:{scale:1,opacity:1},actors:{plant:1,enemy:1,boss:1,base:1,shadowWidth:1,shadowHeight:1,shadowOpacity:1},layoutVersion:theme==='moon'?4:theme==='camp'?3:2,props:(theme==='moon'?[[70,245,160,150],[71,475,120,105],[72,1110,140,125],[73,815,180,105],[74,870,345,110],[75,180,460,95],[76,275,495,75],[77,660,495,70],[78,165,335,100],[79,800,495,75]]:theme==='camp'?[[60,245,140,128],[61,190,270,115],[62,195,435,90],[63,780,155,105],[64,970,130,85],[65,180,535,80],[66,340,535,70],[67,195,320,65],[68,1100,115,80],[69,745,535,85]]:extra>=0?extraPositions.map(([asset,...r])=>[20+extra*10+asset,...r]):desert?(theme==='oasis'?templePositions:desertPositions):[]).map(([asset,x,y,height],i)=>({id:'prop-'+i,asset,x,y,height,visible:true,flipX:false,solid:![5,8,19,62,67,69,77,79].includes(asset),shadow:{width:.74,height:10,opacity:.14,x:0,y:-2}}))};
}
function num(v,min,max,label){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+' 범위를 확인해 주세요 ('+min+'–'+max+').');return v;}
export function validateStage(input,stage=input?.stage){
 input=upgradeStage(input);
 num(stage,1,999,'스테이지');if(!Number.isInteger(stage)||input?.schemaVersion!==1||input.stage!==stage||!themes.includes(input.theme))throw Error('스테이지 설정 형식이 올바르지 않습니다.');
 const b=input.background,g=input.glow,a=input.actors;
 const out={schemaVersion:1,layoutVersion:input.layoutVersion||2,stage,theme:input.theme,background:{scale:num(b?.scale,.7,1.6,'배경 크기'),x:num(b?.x,-300,300,'배경 X'),y:num(b?.y,-200,200,'배경 Y'),brightness:num(b?.brightness,.3,1.8,'배경 밝기')},glow:{scale:num(g?.scale,.3,2,'기지 빛 크기'),opacity:num(g?.opacity,0,2,'기지 빛 진하기')},actors:{},props:[]};
 for(const k of ['plant','enemy','boss','base'])out.actors[k]=num(a?.[k],.5,1.8,k+' 크기');
 for(const k of ['shadowWidth','shadowHeight'])out.actors[k]=num(a?.[k],.2,3,'캐릭터 그림자');
 out.actors.shadowOpacity=num(a?.shadowOpacity,0,2,'캐릭터 그림자 진하기');
 if(!Array.isArray(input.props)||input.props.length>60)throw Error('장식은 최대 60개까지 배치할 수 있습니다.');
 const ids=new Set();out.props=input.props.map(p=>{if(!/^[-a-zA-Z0-9]{1,70}$/.test(p.id)||ids.has(p.id))throw Error('장식 ID가 중복되거나 올바르지 않습니다.');ids.add(p.id);num(p.asset,0,propPieces.length-1,'장식');if(!Number.isInteger(p.asset))throw Error('장식 번호를 확인해 주세요.');if(p.flipX!==undefined&&typeof p.flipX!=='boolean')throw Error('좌우 반전 값이 올바르지 않습니다.');return{id:p.id,asset:p.asset,flipX:p.flipX===true,x:num(p.x,-100,1300,'장식 X'),y:num(p.y,-100,700,'장식 Y'),height:num(p.height,10,300,'장식 높이'),visible:p.visible!==false,solid:!!p.solid,shadow:{width:num(p.shadow?.width,0,2,'그림자 폭'),height:num(p.shadow?.height,0,60,'그림자 높이'),opacity:num(p.shadow?.opacity,0,.8,'그림자 진하기'),x:num(p.shadow?.x,-100,100,'그림자 X'),y:num(p.shadow?.y,-100,100,'그림자 Y')}};});return out;
}
export function propBounds(p){const b=propPieces[p.asset],width=p.height*b[2]/b[3];return {x:p.x-width/2,y:p.y-p.height,width,height:p.height};}
// Keep the authored home composition intact. Carry it with the board from
// home (345,315 at 1.08x) to battle (600,265 at 1x), rather than leaving props behind.
export function sceneryCamera(blend){const t=Math.max(0,Math.min(1,blend)),boardScale=1.08-.08*t,scale=1.06*boardScale/1.08,originX=345+255*t+(-78-345)*boardScale/1.08,originY=315-50*t+(-10-315)*boardScale/1.08;return {scale,x:originX-600+600*scale,y:originY-300+300*scale};}
export function sceneryPoint(x,y,blend=1){const c=sceneryCamera(blend);return {x:600+(x-600)*c.scale+c.x,y:300+(y-300)*c.scale+c.y};}
export function sceneryBounds(p,blend=1){const r=propBounds(p),at=sceneryPoint(r.x,r.y,blend),c=sceneryCamera(blend);return {...at,width:r.width*c.scale,height:r.height*c.scale};}
export function layoutObstacles(layout,baked=[]){const b=layout.background;return [...baked.map(([x,y,rx,ry])=>[600+(x-600)*b.scale+b.x,300+(y-300)*b.scale+b.y,rx*b.scale,ry*b.scale]),...layout.props.filter(p=>p.visible&&p.solid).map(p=>{const r=sceneryBounds(p);return[r.x+r.width/2,r.y+r.height/2,r.width/2,r.height/2];})];}
