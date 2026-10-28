import {validateTuning} from './combat-tuning.js?v=82';
export function validateDuel(value,plantCount){
 const tuning=validateTuning(value?.tuning),kind=value?.kind,plants=value?.plants,health=value?.health;
 if(!Number.isInteger(kind)||kind<0||kind>4)throw Error('몬스터를 선택해주세요.');
 if(!Array.isArray(plants)||plants.length!==8||plants.some(p=>!Number.isInteger(p)||p< -1||p>=plantCount))throw Error('Plants 배치를 확인해주세요.');
 if(!Number.isFinite(health)||health<20||health>10000)throw Error('기지 HP는 20–10000으로 입력해주세요.');
 return {tuning,kind,plants:[...plants],health};
}
