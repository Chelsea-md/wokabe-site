// Experiment-only wave composition. The seeded choice makes reruns comparable.
export function validateWavePlan(value){
 if(value==null)return null;
 const fields={total:[1,160],interval:[.1,12],rushCount:[0,160],rushInterval:[.1,12],randomness:[0,100],seed:[0,999999999]};
 const plan={};
 for(const [key,[min,max]] of Object.entries(fields)){
  const n=value[key];
  if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||(['total','rushCount','randomness','seed'].includes(key)&&!Number.isInteger(n)))throw Error(`웨이브 ${key} 값을 ${min}–${max} 범위로 입력해주세요.`);
  plan[key]=n;
 }
 if(plan.rushCount>plan.total)throw Error('빠른 출현 마릿수는 전체 출현 수를 넘을 수 없습니다.');
 if(!Array.isArray(value.weights)||value.weights.length!==4||value.weights.some(n=>!Number.isInteger(n)||n<0||n>100))throw Error('좀비 종류별 등장 비중은 0–100으로 입력해주세요.');
 if(value.weights.every(n=>n===0))throw Error('적 종류 중 하나는 등장 비중을 1 이상으로 설정해주세요.');
 return {...plan,weights:[...value.weights]};
}
function randomAt(seed,index){let x=(seed+Math.imul(index+1,0x9e3779b9))|0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296;}
export function waveKind(plan,index,scriptedKind,finalWave,bossSlot){
 if(finalWave&&index===bossSlot)return 3;
 if(!plan)return scriptedKind;
 if(randomAt(plan.seed,index*2)>=plan.randomness/100)return scriptedKind===3?0:scriptedKind;
 const sum=plan.weights.reduce((a,b)=>a+b,0),pick=randomAt(plan.seed,index*2+1)*sum;
 let soFar=0;
 for(let i=0;i<4;i++){soFar+=plan.weights[i];if(pick<soFar)return [0,1,2,4][i];}
 return 0;
}
export function waveCadence(plan,spawned,defaultInterval,bigWave){return plan?(spawned<=plan.rushCount?plan.rushInterval:plan.interval):(bigWave&&spawned<=12?.36:defaultInterval);}
