import {rules} from './config.js?v=production-49';
import {enemyStats,bigWaveBonus,countForWave,kindForSpawn,spawnInterval} from './systems.js?v=combat-81';
import {tuningFields,validateTuning} from './combat-tuning.js?v=90';
import {waveKind,validateWavePlan} from './combat-wave-plan.js?v=90';
const $=id=>document.getElementById(id),names=['Shambler · 근접','Bruiser · 중장갑','Archer · 원거리','Boss · 강타','Elite · 근거리 사격'],storageKey='fvz-combat-lab-drafts-v1';
let drafts={},activeKey='',running=null,requestId=0;
const status=text=>$('status').textContent=text;
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const value of Object.values(saved)){try{const clean=validateTuning(value);drafts[clean.stage+':'+clean.wave]=clean;}catch{}}}catch{status('저장된 실험값을 불러오지 못했습니다. 기본값으로 시작합니다.');}
const number=(id,min,max,fallback)=>{const n=Number($(id).value);const v=Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;$(id).value=v;return v;};
function context(){const stage=Math.floor(number('stage',1,96,1)),save={chapter:(stage-1)%rules.chapters.length,completedStages:stage-1},chapter=rules.chapters[save.chapter];return {stage,save,chapter};}
function defaultPlan(save,wave){const chapter=rules.chapters[save.chapter],big=wave===Math.floor(chapter.waves/2)+1||wave===chapter.waves,base=countForWave(save,wave),total=base+(big?bigWaveBonus(base):0),interval=spawnInterval(save,wave);return {total,interval,rushCount:big?Math.min(12,total):0,rushInterval:.36,randomness:0,seed:stageSeed(save,wave),weights:[40,20,25,15]};}
function stageSeed(save,wave){return (save.completedStages+1)*1009+wave*97;}
function defaults(){const {stage,save}=context(),wave=Number($('wave').value);return {stage,wave,monsters:names.map((_,kind)=>enemyStats(save,wave,kind)),wavePlan:defaultPlan(save,wave)};}
function current(){return validateTuning(drafts[activeKey]);}
function composition(save,wave,plan){const chapter=rules.chapters[save.chapter],final=wave===chapter.waves,bossSlot=Math.min(4,plan.total-1),counts=[0,0,0,0,0],lineup=[];for(let i=0;i<plan.total;i++){const oldSlot=Math.floor(plan.total*chapter.bossAt),ruleIndex=final?(i===bossSlot?oldSlot:i===oldSlot?bossSlot:i):i,scripted=kindForSpawn(save,wave,ruleIndex,plan.total),kind=waveKind(plan,i,scripted,final,bossSlot);counts[kind]++;lineup.push(kind);}return {counts,lineup};}
function renderWavePlan(save,wave,plan){for(const field of ['total','interval','rushCount','rushInterval','randomness','seed'])$('wave-panel').querySelector('[data-plan="'+field+'"]').value=plan[field];$('wave-weights').innerHTML=['Shambler','Bruiser','Archer','Elite'].map((name,i)=>'<label class="weight">'+name+' 비중<input data-weight="'+i+'" type="number" min="0" max="100" step="1" value="'+plan.weights[i]+'"></label>').join('');const {counts,lineup}=composition(save,wave,plan),big=wave===Math.floor(rules.chapters[save.chapter].waves/2)+1||wave===rules.chapters[save.chapter].waves;$('summary').textContent='Stage '+(save.completedStages+1)+' · '+(rules.chapters[save.chapter].name||rules.chapters[save.chapter].id)+' · Wave '+wave+'/'+rules.chapters[save.chapter].waves+' · '+(big?'BIG WAVE · ':'')+plan.total+'마리 · 빠른 출현 '+plan.rushCount+'마리 · '+(wave===rules.chapters[save.chapter].waves?'보스 1마리 필수':'보스 없음');$('wave-lineup').innerHTML='예상 등장: '+counts.map((n,i)=>n?'<span>'+names[i].split(' · ')[0]+' '+n+'</span>':'').join('')+'<small>순서 미리보기 · '+lineup.slice(0,24).map(i=>names[i].split(' · ')[0]).join(' → ')+(lineup.length>24?' → …':'')+'</small>';return counts;}
function render(reset=false){
 const {stage,save,chapter}=context();if(reset||!$('wave').options.length)$('wave').replaceChildren(...Array.from({length:chapter.waves},(_,i)=>new Option(String(i+1),String(i+1))));
 const wave=Number($('wave').value);
 activeKey=stage+':'+wave;drafts[activeKey]??=defaults();const d=drafts[activeKey],original=defaults();d.wavePlan??=defaultPlan(save,wave);const counts=renderWavePlan(save,wave,d.wavePlan);
 $('stats').innerHTML=names.map((name,kind)=>'<tr data-monster="'+kind+'"><th scope="row"><button type="button" class="monster-pick" data-pick="'+kind+'" aria-pressed="false">'+name+'</button>'+'<small>'+(counts[kind]?counts[kind]+'마리 출현':'이번 웨이브 미출현')+'</small></th>'+Object.entries(tuningFields).map(([key,[min,max,step,label]])=>'<td><input aria-label="'+name+' '+label+'" type="number" data-kind="'+kind+'" data-stat="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+d.monsters[kind][key]+'"><small>기본 '+(+original.monsters[kind][key].toFixed(3))+'</small></td>').join('')+'</tr>').join('');
 $('editor').href='live-ops.html?stage='+stage;
}
$('wave-panel').addEventListener('input',e=>{const input=e.target;if(!('plan'in input.dataset)&&!('weight'in input.dataset))return;const plan=drafts[activeKey].wavePlan;if('weight'in input.dataset)plan.weights[Number(input.dataset.weight)]=input.value===''?NaN:Number(input.value);else plan[input.dataset.plan]=input.value===''?NaN:Number(input.value);try{validateWavePlan(plan);const {save}=context();renderWavePlan(save,Number($('wave').value),plan);render();queueWaveApply();status('웨이브 조합 갱신됨 · 전투에 적용 중');}catch(error){status(error.message);}});
$('reroll').onclick=()=>{if(drafts[activeKey].wavePlan.randomness===0)drafts[activeKey].wavePlan.randomness=100;drafts[activeKey].wavePlan.seed=Math.floor(Math.random()*1e9);const {save}=context();renderWavePlan(save,Number($('wave').value),drafts[activeKey].wavePlan);render();queueWaveApply();};
let waveApplyTimer=null;
function queueWaveApply(){clearTimeout(waveApplyTimer);if(running)waveApplyTimer=setTimeout(()=>{$('apply').click();},450);}
$('stats').addEventListener('input',e=>{const input=e.target;if(!input.dataset.stat)return;drafts[activeKey].monsters[Number(input.dataset.kind)][input.dataset.stat]=input.value===''?NaN:Number(input.value);status('수정됨 · 미리보기 자동 갱신 대기 중');if(selectedMonster!==null){selectedMonster=Number(input.dataset.kind);queueDuel();}});
$('stage').onchange=()=>{render(true);queueDuel();status('선택한 스테이지의 실험값입니다. 다시 시작하면 해당 스테이지를 실행합니다.');};
$('wave').onchange=()=>{render();queueDuel();status('선택한 웨이브의 실험값입니다. 다시 시작하면 해당 웨이브를 실행합니다.');};
$('save-draft').onclick=()=>{try{current();const valid={};for(const [key,value]of Object.entries(drafts))valid[key]=validateTuning(value);localStorage.setItem(storageKey,JSON.stringify(valid));status('이 브라우저에 실험값을 저장했습니다. 공개 게임 기본값은 변경되지 않습니다.');}catch(e){status('저장 실패: '+e.message);}};
$('reset').onclick=()=>{drafts[activeKey]=defaults();render();queueDuel();queueWaveApply();status('선택한 스테이지·웨이브를 기본값으로 복원했습니다. 적용 또는 다시 시작을 눌러주세요.');};
$('apply').onclick=()=>{try{const tuning=current();if(!running)throw Error('먼저 전투를 시작해주세요.');if(running.stage!==tuning.stage||running.wave!==tuning.wave)throw Error('실행 중인 스테이지·웨이브와 다릅니다. 다시 시작해주세요.');$('battle').contentWindow.postMessage({type:'fvz-combat-tuning',requestId:++requestId,tuning},location.origin);status('전투에 적용 중…');}catch(e){status(e.message);}};
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('battle').contentWindow)return;if(e.data?.type==='fvz-combat-ready'){running={stage:e.data.stage,wave:e.data.wave};status('Stage '+running.stage+' · Wave '+running.wave+' 테스트 준비 완료 · 편집한 몬스터 수치 적용됨');}if(e.data?.type==='fvz-combat-tuning-result'&&e.data.requestId===requestId)status(e.data.error||'현재 전투에 적용 완료 · 생존 몬스터 '+e.data.count+'마리와 이후 등장 몬스터에 반영했습니다.');});
$('run').onclick=()=>{try{stopDuel();const tuning=current(),q=new URLSearchParams({demo:'menus','combat-sim':'1','sim-stage':tuning.stage,'sim-wave':tuning.wave,'sim-tuning':JSON.stringify(tuning),'sim-health':number('health',20,10000,100),'sim-sun':number('sun',0,999,30),'sim-star':$('plant-star').value,v:'combat-90',run:Date.now()});running=null;$('battle').hidden=false;$('battle').src='./?'+q;status('편집한 웨이브 구성으로 전투를 불러오는 중…');}catch(e){status(e.message);}};
let selectedMonster=null,duelTimer=null,duelKey='',duelReady=false;
const slots=['위','왼쪽 위','오른쪽 위','왼쪽','오른쪽','왼쪽 아래','오른쪽 아래','아래'];
$('plant-slots').innerHTML=slots.map((name,i)=>'<label>'+name+'<select aria-label="'+name+' Plants" data-slot="'+i+'"><option value="-1">비워두기</option>'+rules.troops.map((p,index)=>'<option value="'+index+'">'+p.name+'</option>').join('')+'</select></label>').join('');
function duelValue(){return {kind:selectedMonster,tuning:current(),health:number('health',20,10000,100),star:Number($('plant-star').value),plants:[...$('plant-slots').querySelectorAll('select')].map(s=>Number(s.value))};}
function renderDuelControls(){
 const root=$('duel-controls'),key=activeKey+':'+selectedMonster;
 if(root.dataset.key!==key){root.dataset.key=key;root.innerHTML=Object.entries(tuningFields).map(([field,[min,max,step,label]])=>'<label>'+label+'<input type="number" data-duel-stat="'+field+'" min="'+min+'" max="'+max+'" step="'+step+'" aria-label="미리보기 '+label+'"></label>').join('');}
 root.querySelectorAll('input').forEach(input=>{if(document.activeElement!==input)input.value=drafts[activeKey].monsters[selectedMonster][input.dataset.duelStat];});
}
$('duel-controls').addEventListener('input',event=>{const input=event.target,field=input.dataset.duelStat;if(!field)return;const value=input.value===''?NaN:Number(input.value);drafts[activeKey].monsters[selectedMonster][field]=value;const original=$('stats').querySelector('[data-kind="'+selectedMonster+'"][data-stat="'+field+'"]');original.value=input.value;queueDuel();});
function stopDuel(){clearTimeout(duelTimer);duelKey='';duelReady=false;$('duel-frame').src='about:blank';$('duel-panel').hidden=true;selectedMonster=null;}
function queueDuel(){clearTimeout(duelTimer);if(selectedMonster===null)return;duelTimer=setTimeout(updateDuel,500);}
function updateDuel(){
 try{
  const config=duelValue(),key=config.tuning.stage+':'+config.tuning.wave;
  $('duel-panel').hidden=false;$('duel-title').textContent=names[selectedMonster]+' · 한 마리 미리보기';
  renderDuelControls();
  document.querySelectorAll('[data-pick]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.pick)===selectedMonster)));
  $('duel-status').textContent='변경값을 적용하며 적을 교체합니다…';
  if(duelKey===key){if(duelReady)$('duel-frame').contentWindow.postMessage({type:'fvz-duel-config',config},location.origin);return;}
  duelReady=false;duelKey=key;
  const q=new URLSearchParams({demo:'menus','combat-sim':'1',duel:'1','sim-stage':config.tuning.stage,'sim-wave':config.tuning.wave,'sim-health':config.health,'sim-star':config.star,v:'combat-90'});
  $('duel-frame').src='./?'+q;
 }catch(error){$('duel-status').textContent=error.message;}
}
$('stats').addEventListener('click',e=>{const button=e.target.closest('[data-pick]');if(!button)return;selectedMonster=Number(button.dataset.pick);$('battle').src='about:blank';$('battle').hidden=true;running=null;updateDuel();});
$('plant-slots').addEventListener('change',queueDuel);
$('plant-star').addEventListener('change',()=>{queueDuel();if(running)status('새 별 등급은 전체 웨이브를 다시 시작하면 배치 Plants에 적용됩니다.');});
$('health').addEventListener('input',queueDuel);
$('duel-restart').onclick=updateDuel;
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==$('duel-frame').contentWindow||selectedMonster===null)return;
 if(e.data?.type==='fvz-combat-ready'&&e.data.duel&&duelKey===e.data.stage+':'+e.data.wave){duelReady=true;updateDuel();}
 if(e.data?.type==='fvz-duel-status')$('duel-status').textContent=e.data.text;
 if(e.data?.type==='fvz-duel-meter')$('duel-meter').textContent=e.data.text;
});
render(true);
