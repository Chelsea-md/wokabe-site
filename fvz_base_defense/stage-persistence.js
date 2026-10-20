import {validateStage} from './stage-layout.js?v=production-48';
const key=n=>'fvz-stage-applied-v1-'+n;
// Applied layouts are separate from automatically retained editor drafts.
export function readAppliedStage(stage,storage=globalThis.localStorage){try{return validateStage(JSON.parse(storage.getItem(key(stage))),stage);}catch{return null;}}
export function saveAppliedStage(layout,storage=globalThis.localStorage){const next=validateStage(layout);storage.setItem(key(next.stage),JSON.stringify(next));return next;}
export function mergeAppliedStages(stages,storage=globalThis.localStorage){const result={...stages};try{for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith('fvz-stage-applied-v1-'))continue;const n=Number(k.slice('fvz-stage-applied-v1-'.length)),layout=readAppliedStage(n,storage);if(layout)result[n]=layout;}}catch{}return result;}
