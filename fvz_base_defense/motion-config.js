export const motionCharacters=['poppy','bellflower','marigold','sunflower','mint','mushroom','cactus','clover','bamboo','starfruit'];
export const motionActions=['idle','walk','attack'];
export const motionFrameLimits={x:[-24,24,1],y:[-24,24,1],rotation:[-35,35,1],scaleX:[.65,1.35,.01],scaleY:[.65,1.35,.01]};
export function motionFrame(t,values={}){return {t,x:0,y:0,rotation:0,scaleX:1,scaleY:1,...values};}
export function defaultMotions(){return {schemaVersion:1,motions:[
 {id:'gentle',name:'가벼운 숨쉬기',duration:2.4,loop:true,easing:'smooth',frames:[motionFrame(0),motionFrame(.5,{y:-1,scaleY:1.025,scaleX:.985}),motionFrame(1)]},
 {id:'bounce',name:'통통 걷기',duration:.65,loop:true,easing:'smooth',frames:[motionFrame(0),motionFrame(.25,{y:-7,rotation:-5,scaleX:.94,scaleY:1.08}),motionFrame(.5,{scaleX:1.1,scaleY:.9}),motionFrame(.75,{y:-7,rotation:5,scaleX:.94,scaleY:1.08}),motionFrame(1)]},
 {id:'strike',name:'무기 반동',duration:.7,loop:true,easing:'smooth',frames:[motionFrame(0),motionFrame(.25,{x:-5,y:-2,rotation:-10}),motionFrame(.45,{x:4,rotation:6,scaleX:1.06,scaleY:.96}),motionFrame(1)]}
 ],assignments:{all:{},characters:{}}};}
export function validateMotions(input){
 if(!input||input.schemaVersion!==1||!Array.isArray(input.motions)||input.motions.length>60||!input.assignments)throw Error('모션 설정 형식을 확인해 주세요.');
 const ids=new Set(),out={schemaVersion:1,motions:[],assignments:{all:{},characters:{}}};
 for(const m of input.motions){
  if(!m||typeof m.id!=='string'||!/^[a-z0-9-]{1,60}$/.test(m.id)||ids.has(m.id))throw Error('모션 ID가 중복되었거나 올바르지 않습니다.');ids.add(m.id);
  if(typeof m.name!=='string'||!m.name.trim()||m.name.length>80||!Number.isFinite(m.duration)||m.duration<.2||m.duration>10||typeof m.loop!=='boolean'||!['linear','smooth'].includes(m.easing)||!Array.isArray(m.frames)||m.frames.length<2||m.frames.length>24)throw Error('이름·길이·키프레임을 확인해 주세요.');
  let previous=-1;const frames=m.frames.map(f=>{if(!f||!Number.isFinite(f.t)||f.t<0||f.t>1||f.t<=previous)throw Error('키프레임 시간은 중복 없이 순서대로 지정해 주세요.');previous=f.t;const row={t:f.t};for(const [k,[min,max]]of Object.entries(motionFrameLimits)){if(!Number.isFinite(f[k])||f[k]<min||f[k]>max)throw Error('모션 '+k+' 범위를 확인해 주세요.');row[k]=f[k];}return row;});
  if(frames[0].t!==0||frames.at(-1).t!==1)throw Error('시작(0%)과 끝(100%) 키프레임이 필요합니다.');
  out.motions.push({id:m.id,name:m.name.trim(),duration:m.duration,loop:m.loop,easing:m.easing,frames});
 }
 const assignment=row=>{if(!row||typeof row!=='object'||Array.isArray(row))throw Error('캐릭터 지정 형식을 확인해 주세요.');const value={};for(const [action,id]of Object.entries(row)){if(!motionActions.includes(action)||id!==null&&!ids.has(id))throw Error('존재하는 모션과 동작을 지정해 주세요.');value[action]=id;}return value;};
 out.assignments.all=assignment(input.assignments.all);if(!input.assignments.characters||typeof input.assignments.characters!=='object'||Array.isArray(input.assignments.characters))throw Error('캐릭터 지정 형식을 확인해 주세요.');
 for(const [id,row]of Object.entries(input.assignments.characters)){if(!motionCharacters.includes(id))throw Error('캐릭터를 확인해 주세요.');out.assignments.characters[id]=assignment(row);}return out;
}
export function sampleMotion(m,time){const t=m.loop?((time%m.duration)+m.duration)%m.duration/m.duration:Math.max(0,Math.min(1,time/m.duration));let b=m.frames.findIndex(f=>f.t>=t);if(b<1)b=1;const a=m.frames[b-1],z=m.frames[b];let v=Math.max(0,Math.min(1,(t-a.t)/(z.t-a.t)));if(m.easing==='smooth')v=v*v*(3-2*v);const out={};for(const k of Object.keys(motionFrameLimits))out[k]=a[k]+(z[k]-a[k])*v;return out;}
export function assignedMotion(config,id,action){const row=config?.assignments.characters[id];const key=row&&Object.hasOwn(row,action)?row[action]:config?.assignments.all[action];return config?.motions.find(m=>m.id===key);}
export function allyMotionState(config,id,attackAge){const m=assignedMotion(config,id,'attack');return m&&Number.isFinite(attackAge)&&attackAge>=0&&attackAge<m.duration?{action:'attack',motionTime:attackAge}:{action:'idle'};}
export function applyMotionPose(pose,config,id,action,time,hit=0){const m=assignedMotion(config,id,action);if(!m)return pose;const f=sampleMotion(m,time),hurt=Math.sin(Math.min(1,hit)*Math.PI);return {...pose,shift:f.x+hurt*2,hop:-f.y+hurt*5,tilt:f.rotation*Math.PI/180+hurt*.075,sx:f.scaleX+hurt*.05,sy:f.scaleY+hurt*.06,shadowScale:Math.max(.5,1+f.y*.025),shadowAlpha:Math.max(.06,.19+f.y*.006)};}
export async function loadMotionConfig(){
 let config=defaultMotions();try{const release=await(await import('./live-release.js?v=production-49')).readLiveRelease();if(release.settings.motion)config=validateMotions(release.settings.motion);}catch(e){console.warn('기본 모션을 사용합니다.',e.message);}return config;
}
