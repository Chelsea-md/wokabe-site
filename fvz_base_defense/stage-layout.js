// Shared by the renderer, LIVE OPS editor and private persistence validator.
export const themes=['green','dune','camp','moon','oasis','noon'];
export const themeNames=['Garden','Dune Loop','Night Camp','Moonlight','Sun Temple','High Noon'];
export const propNames=['큰 선인장','꽃 선인장','야자수','바위 무리','사암 기둥','마른 풀','마른 가지','통나무','작은 돌','붉은 바위','피라미드','오벨리스크','유적 기둥','신전 문','스카라브 비석','푸른 띠 항아리','사암 상자','이집트 야자수','유적 돌무더기','푸른 연꽃'];
export const propPieces=[[40,85,295,410],[380,230,290,275],[705,95,360,415],[1070,220,380,290],[1460,100,290,415],[40,590,285,250],[385,580,270,265],[735,600,315,260],[1160,680,220,175],[1440,620,300,245]];
propPieces.push(...[[38, 165, 362, 241], [469, 17, 227, 405], [819, 92, 245, 315], [1174, 83, 379, 335], [1635, 122, 311, 290], [33, 489, 282, 271], [402, 508, 336, 237], [807, 434, 342, 327], [1206, 503, 360, 237], [1653, 498, 283, 257]]);
export const propAtlas=asset=>asset<10?'desert':'egypt';
const desertPositions=[[0,85,285,110],[2,210,145,120],[3,140,400,78],[4,1100,150,95],[1,320,165,58],[5,75,470,42],[6,495,485,58],[7,880,185,65],[8,275,470,23],[9,205,462,58]];
const templePositions=[[10,105,260,95],[11,320,140,130],[12,110,410,95],[13,1060,180,115],[14,560,490,75],[15,210,455,70],[16,1100,420,65],[17,180,135,125],[18,70,490,70],[19,430,480,55]];
function legacyProps(props){return Array.isArray(props)&&props.length===10&&props.every((p,i)=>{const [asset,x,y,height]=legacyPositions[i];return p.id==='prop-'+i&&p.asset===asset&&p.x===x&&p.y===y&&p.height===height&&p.visible===true&&p.solid===![5,8].includes(asset)&&p.shadow?.width===.74&&p.shadow?.height===10&&p.shadow?.opacity===.14&&p.shadow?.x===0&&p.shadow?.y===-2;});}
export function upgradeStage(input){if(input&&!input.layoutVersion&&['dune','oasis','noon'].includes(input.theme)&&input.theme===themes[(input.stage-1)%6]&&legacyProps(input.props)){return {...input,layoutVersion:2,props:defaultStage(input.stage).props};}return input;}

const legacyPositions=[[0,145,205,110],[2,1030,220,140],[3,260,480,75],[4,970,500,105],[1,80,380,45],[5,465,520,34],[6,1125,405,50],[7,825,125,40],[8,705,475,28],[9,315,95,36]];
export function defaultStage(stage=1){
 const theme=themes[(stage-1)%6],desert=['dune','oasis','noon'].includes(theme);
 return {schemaVersion:1,stage,theme,background:{scale:1,x:0,y:0,brightness:1},glow:{scale:1,opacity:1},actors:{plant:1,enemy:1,boss:1,base:1,shadowWidth:1,shadowHeight:1,shadowOpacity:1},layoutVersion:2,props:desert?(theme==='oasis'?templePositions:desertPositions).map(([asset,x,y,height],i)=>({id:'prop-'+i,asset,x,y,height,visible:true,solid:![5,8,19].includes(asset),shadow:{width:.74,height:10,opacity:.14,x:0,y:-2}})):[]};
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
 const ids=new Set();out.props=input.props.map(p=>{if(!/^[-a-zA-Z0-9]{1,70}$/.test(p.id)||ids.has(p.id))throw Error('장식 ID가 중복되거나 올바르지 않습니다.');ids.add(p.id);num(p.asset,0,propPieces.length-1,'장식');if(!Number.isInteger(p.asset))throw Error('장식 번호를 확인해 주세요.');return{id:p.id,asset:p.asset,x:num(p.x,-100,1300,'장식 X'),y:num(p.y,-100,700,'장식 Y'),height:num(p.height,10,300,'장식 높이'),visible:p.visible!==false,solid:!!p.solid,shadow:{width:num(p.shadow?.width,0,2,'그림자 폭'),height:num(p.shadow?.height,0,60,'그림자 높이'),opacity:num(p.shadow?.opacity,0,.8,'그림자 진하기'),x:num(p.shadow?.x,-100,100,'그림자 X'),y:num(p.shadow?.y,-100,100,'그림자 Y')}};});return out;
}
export function propBounds(p){const b=propPieces[p.asset],width=p.height*b[2]/b[3];return {x:p.x-width/2,y:p.y-p.height,width,height:p.height};}
export function layoutObstacles(layout,baked=[]){const b=layout.background;return [...baked.map(([x,y,rx,ry])=>[600+(x-600)*b.scale+b.x,300+(y-300)*b.scale+b.y,rx*b.scale,ry*b.scale]),...layout.props.filter(p=>p.visible&&p.solid).map(p=>{const r=propBounds(p);return[p.x,p.y-r.height/2,r.width/2,r.height/2];})];}
