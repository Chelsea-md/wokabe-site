import {rules} from './config.js?v=production-49';
import {enemyStats,bigWaveBonus,countForWave,kindForSpawn,spawnInterval} from './systems.js?v=combat-81';
import {tuningFields,validateTuning} from './combat-tuning.js?v=82';
const $=id=>document.getElementById(id),names=['Shambler · 근접','Bruiser · 중장갑','Archer · 원거리','Boss · 강타','Elite · 근거리 사격'],storageKey='fvz-combat-lab-drafts-v1';
let drafts={},activeKey='',running=null,requestId=0;
const status=text=>$('status').textContent=text;
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const value of Object.values(saved)){try{const clean=validateTuning(value);drafts[clean.stage+':'+clean.wave]=clean;}catch{}}}catch{status('저장된 실험값을 불러오지 못했습니다. 기본값으로 시작합니다.');}
const number=(id,min,max,fallback)=>{const n=Number($(id).value);const v=Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;$(id).value=v;return v;};
function context(){const stage=Math.floor(number('stage',1,96,1)),save={chapter:(stage-1)%rules.chapters.length,completedStages:stage-1},chapter=rules.chapters[save.chapter];return {stage,save,chapter};}
function defaults(){const {stage,save}=context(),wave=Number($('wave').value);return {stage,wave,monsters:names.map((_,kind)=>enemyStats(save,wave,kind))};}
function current(){return validateTuning(drafts[activeKey]);}
function render(reset=false){
 const {stage,save,chapter}=context();if(reset||!$('wave').options.length)$('wave').replaceChildren(...Array.from({length:chapter.waves},(_,i)=>new Option(String(i+1),String(i+1))));
 const wave=Number($('wave').value),big=wave===Math.floor(chapter.waves/2)+1||wave===chapter.waves,base=countForWave(save,wave),bonus=big?bigWaveBonus(base):0,total=base+bonus,counts=[0,0,0,0,0];for(let i=0;i<total;i++)counts[kindForSpawn(save,wave,i,total)]++;
 activeKey=stage+':'+wave;drafts[activeKey]??=defaults();const d=drafts[activeKey],original=defaults();
 $('summary').textContent='Stage '+stage+' · '+(chapter.name||chapter.id)+' · Wave '+wave+'/'+chapter.waves+' · '+(big?'BIG WAVE · ':'')+total+'마리 (기본 '+base+' + 추가 '+bonus+') · 기본 등장 간격 '+spawnInterval(save,wave).toFixed(2)+'초';
 $('stats').innerHTML=names.map((name,kind)=>'<tr><th scope="row">'+name+'<small>'+(counts[kind]?counts[kind]+'마리 출현':'이번 웨이브 미출현')+'</small></th>'+Object.entries(tuningFields).map(([key,[min,max,step,label]])=>'<td><input aria-label="'+name+' '+label+'" type="number" data-kind="'+kind+'" data-stat="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+d.monsters[kind][key]+'"><small>기본 '+(+original.monsters[kind][key].toFixed(3))+'</small></td>').join('')+'</tr>').join('');
 $('editor').href='live-ops.html?stage='+stage;
}
$('stats').addEventListener('input',e=>{const input=e.target;if(!input.dataset.stat)return;drafts[activeKey].monsters[Number(input.dataset.kind)][input.dataset.stat]=input.value===''?NaN:Number(input.value);status('수정됨 · 현재 전투에 적용하거나 다시 시작해주세요.');});
$('stage').onchange=()=>{render(true);status('선택한 스테이지의 실험값입니다. 다시 시작하면 해당 스테이지를 실행합니다.');};
$('wave').onchange=()=>{render();status('선택한 웨이브의 실험값입니다. 다시 시작하면 해당 웨이브를 실행합니다.');};
$('save-draft').onclick=()=>{try{current();const valid={};for(const [key,value]of Object.entries(drafts))valid[key]=validateTuning(value);localStorage.setItem(storageKey,JSON.stringify(valid));status('이 브라우저에 실험값을 저장했습니다. 공개 게임 기본값은 변경되지 않습니다.');}catch(e){status('저장 실패: '+e.message);}};
$('reset').onclick=()=>{drafts[activeKey]=defaults();render();status('선택한 스테이지·웨이브를 기본값으로 복원했습니다. 적용 또는 다시 시작을 눌러주세요.');};
$('apply').onclick=()=>{try{const tuning=current();if(!running)throw Error('먼저 전투를 시작해주세요.');if(running.stage!==tuning.stage||running.wave!==tuning.wave)throw Error('실행 중인 스테이지·웨이브와 다릅니다. 다시 시작해주세요.');$('battle').contentWindow.postMessage({type:'fvz-combat-tuning',requestId:++requestId,tuning},location.origin);status('전투에 적용 중…');}catch(e){status(e.message);}};
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('battle').contentWindow)return;if(e.data?.type==='fvz-combat-ready'){running={stage:e.data.stage,wave:e.data.wave};status('Stage '+running.stage+' · Wave '+running.wave+' 테스트 준비 완료 · 편집한 몬스터 수치 적용됨');}if(e.data?.type==='fvz-combat-tuning-result'&&e.data.requestId===requestId)status(e.data.error||'현재 전투에 적용 완료 · 생존 몬스터 '+e.data.count+'마리와 이후 등장 몬스터에 반영했습니다.');});
$('run').onclick=()=>{try{const tuning=current(),q=new URLSearchParams({demo:'menus','combat-sim':'1','sim-stage':tuning.stage,'sim-wave':tuning.wave,'sim-tuning':JSON.stringify(tuning),'sim-health':number('health',20,10000,100),'sim-sun':number('sun',0,999,30),v:'combat-82',run:Date.now()});running=null;$('battle').hidden=false;$('battle').src='./?'+q;status('편집한 값으로 전투를 불러오는 중…');}catch(e){status(e.message);}};
render(true);
