import {layoutObstacles} from './stage-layout.js?v=scene-split-1';
import {findRoute,bodyObstacles,stageObstacles} from './library/art-directions/cartoon-v5/navigation.js?v=unstuck-1';
export const reviewTarget={x:600,y:265};
// Representative samples, not an exhaustive simulation of every spawn or target.
export function reviewRoutes(layout,kind='shambler'){
 const obstacles=bodyObstacles({kind},layoutObstacles(layout,layout.theme==='green'?stageObstacles('green'):[]));
 const padding=kind==='boss'?25:14,starts=[];
 for(const t of [.12,.5,.88])starts.push({x:-85,y:600*t},{x:1285,y:600*t},{x:1200*t,y:-85},{x:1200*t,y:685});
 return {obstacles,paths:starts.map(start=>({start,path:findRoute(start,reviewTarget,obstacles,padding)}))};
}
export function installNavigationReview({getLayout,getScene,onBattle,onDecor}){
 const controls=document.createElement('div');controls.className='preview-options';
 controls.innerHTML='<label class="check"><input type="checkbox" id="review-routes">접근 경로 · 배치 영역 보기</label><label>경로 샘플<select id="review-kind"><option value="shambler">일반 좀비</option><option value="boss">보스</option></select></label><button type="button" id="camp-decor">Night Camp 낮은 장식 추가</button><span class="hint" id="review-summary">12개 출현 지점 → 기지 경로 샘플입니다. 실제 웨이브 검증은 별도로 필요합니다.</span>';
 document.querySelector('#preview-viewport').before(controls);
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=600;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';canvas.hidden=true;document.querySelector('#preview').append(canvas);
 const toggle=controls.querySelector('#review-routes'),kind=controls.querySelector('#review-kind'),summary=controls.querySelector('#review-summary');
 function render(){
  controls.querySelector('#camp-decor').disabled=getLayout().theme!=='camp';
  canvas.hidden=!toggle.checked||getScene()!=='battle';if(canvas.hidden)return;
  const {obstacles,paths}=reviewRoutes(getLayout(),kind.value),g=canvas.getContext('2d');g.clearRect(0,0,1200,600);
  g.fillStyle='#67e9bd22';g.strokeStyle='#a1ffe0';g.lineWidth=2;g.strokeRect(465,130,270,270);g.fillRect(465,130,270,270);
  g.fillStyle='#ff535333';g.strokeStyle='#ff7979';for(const [x,y,rx,ry] of obstacles){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();g.stroke();}
  g.strokeStyle='#ffe773';g.lineWidth=2;g.setLineDash([7,5]);for(const {start,path} of paths){g.beginPath();g.moveTo(start.x,start.y);for(const p of path)g.lineTo(p.x,p.y);g.stroke();}g.setLineDash([]);
  const failed=paths.filter(p=>!p.path.length).length;summary.textContent=`기지 접근 샘플 ${12-failed}/12개 연결 · 노랑: 경로 / 민트: 배치 여유 / 빨강: 몸체 보정 장애물. 실제 전투 검증 별도.`;
 }
 toggle.onchange=()=>{if(toggle.checked)onBattle();render();};kind.onchange=render;controls.querySelector('#camp-decor').onclick=()=>{onDecor();render();};
 return {render};
}
