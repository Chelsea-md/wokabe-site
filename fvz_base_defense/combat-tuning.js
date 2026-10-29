// Sandbox-only absolute values, validated in both editor and game.
import {validateWavePlan} from './combat-wave-plan.js?v=90';
export const tuningFields={hp:[1,100000,1,'HP'],damage:[0,10000,.1,'피해'],interval:[.1,30,.1,'공격 간격 (초)'],range:[10,500,1,'플랜트 사거리'],baseRange:[10,500,1,'기지 사거리'],speed:[1,150,.1,'이동 / 초'],armor:[0,.9,.01,'방어율 (0–0.9)']};
export function validateTuning(value){
 if(!value||!Number.isInteger(value.stage)||value.stage<1||value.stage>96||!Number.isInteger(value.wave)||value.wave<1||value.wave>100||!Array.isArray(value.monsters)||value.monsters.length!==5)throw Error('스테이지·웨이브와 몬스터 5종 설정을 확인해주세요.');
 const monsters=value.monsters.map((row,kind)=>Object.fromEntries(Object.entries(tuningFields).map(([key,[min,max,,label]])=>{const n=row?.[key];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(`몬스터 ${kind+1}의 ${label}: ${min}–${max} 범위로 입력해주세요.`);return [key,n];})));
 return {stage:value.stage,wave:value.wave,monsters,wavePlan:validateWavePlan(value.wavePlan)};
}
export function tunedStats(base,tuning,stage,wave,kind){return tuning?.stage===stage&&tuning?.wave===wave&&tuning.monsters[kind]?{...base,...tuning.monsters[kind]}:base;}
export function retuneEnemy(enemy,stats){
 const ratio=Math.max(0,Math.min(1,enemy.hp/Math.max(1,enemy.maxHp)));
 enemy.hp=stats.hp*ratio;enemy.maxHp=stats.hp;enemy.armor=stats.armor;enemy.speed=stats.speed;
 enemy.fire=Math.min(enemy.fire,stats.interval);enemy.path=null;enemy.navAge=0;enemy.navStalled=0;
}
