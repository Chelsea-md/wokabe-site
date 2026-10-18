import {validateStage} from './stage-layout.js?v=production-44';
export const adminOrigin='https://fvz-design-workspace.chelsea-here.chatgpt.site';
export const deliveryOrigin='https://fvz-live-delivery.chelsea-here.chatgpt.site';
export const privateEditor=()=>location.origin===adminOrigin;
let held,pending,heldAt=0;
export async function readLiveRelease(force=false){if(!force&&held&&Date.now()-heldAt<2000)return held;if(!force&&pending)return pending;const task=read();pending=task;try{return await task;}finally{if(pending===task)pending=null;}}
async function read(){const response=await fetch(privateEditor()?'/api/live-stages':deliveryOrigin+'/v1/stages',{cache:'no-store',credentials:privateEditor()?'same-origin':'omit',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('게시본을 불러오지 못했습니다.');const data=await response.json();if(data.schemaVersion!==1||!data.stages||!data.versions)throw Error('게시본 형식을 확인해 주세요.');const stages={};for(const [n,layout]of Object.entries(data.stages))stages[n]=validateStage(layout,Number(n));held={stages,versions:data.versions,settings:data.settings||{},settingsVersions:data.settingsVersions||{},assets:data.assets||{}};heldAt=Date.now();return held;}

let assetFeed;
export async function publishedAsset(src,base=document.baseURI){if(String(src).startsWith('data:'))return src;const url=new URL(src,base);const file=decodeURIComponent(url.pathname.split('/').pop());try{const release=await(assetFeed||=readLiveRelease().catch(()=>({assets:{}}))),asset=release.assets[file];if(asset){return (privateEditor()?adminOrigin+'/api/live-images/':deliveryOrigin+'/v1/assets/')+encodeURIComponent(asset.id)+'?v='+asset.version;}}catch{}return url.href;}
