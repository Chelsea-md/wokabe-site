import {validateStage} from './stage-layout.js?v=production-36';
export const adminOrigin='https://fvz-design-workspace.chelsea-here.chatgpt.site';
export const deliveryOrigin='https://fvz-live-delivery.chelsea-here.chatgpt.site';
export const privateEditor=()=>location.origin===adminOrigin;
export async function readLiveRelease(){const response=await fetch(privateEditor()?'/api/live-stages':deliveryOrigin+'/v1/stages',{cache:'no-store',credentials:privateEditor()?'same-origin':'omit',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('게시본을 불러오지 못했습니다.');const data=await response.json();if(data.schemaVersion!==1||!data.stages||!data.versions)throw Error('게시본 형식을 확인해 주세요.');const stages={};for(const [n,layout]of Object.entries(data.stages))stages[n]=validateStage(layout,Number(n));return {stages,versions:data.versions};}
