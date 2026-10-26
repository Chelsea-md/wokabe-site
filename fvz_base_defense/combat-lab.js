import {rules} from './config.js?v=production-49';
import {enemyStats,bigWaveBonus,countForWave,kindForSpawn,spawnInterval} from './systems.js?v=combat-81';
const $=id=>document.getElementById(id),names=['Shambler · 근접','Bruiser · 중장갑','Archer · 원거리','Boss · 강타','Elite · 근거리 사격'];
const number=(id,min,max,fallback)=>{const n=Number($(id).value);const v=Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;$(id).value=v;return v;};
function context(){const stage=Math.floor(number('stage',1,96,1)),save={chapter:(stage-1)%rules.chapters.length,completedStages:stage-1},chapter=rules.chapters[save.chapter];return {stage,save,chapter};}
function render(reset=false){const {stage,save,chapter}=context();if(reset||!$('wave').options.length){$('wave').replaceChildren(...Array.from({length:chapter.waves},(_,i)=>new Option(String(i+1),String(i+1))));}const wave=Number($('wave').value),big=wave===Math.floor(chapter.waves/2)+1||wave===chapter.waves,base=countForWave(save,wave),bonus=big?bigWaveBonus(base):0,total=base+bonus,counts=[0,0,0,0,0];for(let i=0;i<total;i++)counts[kindForSpawn(save,wave,i,total)]++;
 const range=number('range',120,360,240);$('summary').textContent=`Stage ${stage} · ${chapter.name||chapter.id} · Wave ${wave}/${chapter.waves} · ${big?'BIG WAVE · ':''}${total}마리 (기본 ${base} + 추가 ${bonus}) · 기본 등장 간격 ${spawnInterval(save,wave).toFixed(2)}초`;
 $('stats').innerHTML=names.map((name,kind)=>{const s=enemyStats(save,wave,kind,range);return `<tr class="${counts[kind]?'':'absent'}"><td>${name}</td><td>${counts[kind]}</td><td>${s.hp}</td><td>${s.damage.toFixed(1)}</td><td>${s.interval.toFixed(1)}초</td><td>${s.range} / ${s.baseRange}</td><td>${s.speed.toFixed(1)}</td><td>${Math.round(s.armor*100)}%</td></tr>`;}).join('');$('editor').href=`live-ops.html?stage=${stage}`;
}
$('stage').onchange=()=>render(true);$('wave').onchange=()=>render();$('range').onchange=()=>render();
$('run').onclick=()=>{render();const {stage}=context(),q=new URLSearchParams({demo:'menus','combat-sim':'1','sim-stage':stage,'sim-wave':$('wave').value,'sim-range':$('range').value,'sim-health':number('health',20,10000,100),'sim-sun':number('sun',0,999,30),v:'combat-81',run:Date.now()});$('battle').hidden=false;$('battle').src='./?'+q;};
render(true);
