const response=await fetch('design-briefs.json');
if(!response.ok)throw Error('시안 목록을 불러오지 못했습니다.');
const brief=await response.json(),chosen={character:null,ui:null};
for(const group of ['character','ui']){
  document.querySelector('#'+group+'-grid').innerHTML=brief.records.filter(r=>r.group===group).map(record=>`<article class="concept" data-concept="${record.id}"><a href="${record.file}" target="_blank" rel="noopener" aria-label="${record.id} 원본 크게 보기"><img src="${record.file}" alt="${group==='character'?'캐릭터':'홈·인게임 UI'} 디자인 ${record.id}" ${record.id==='C1'?'':'loading="lazy"'}></a><footer><label><input type="radio" name="${group}" value="${record.id}">${record.id}</label><small>이미지 클릭 · 원본 크게 보기</small></footer></article>`).join('');
}
document.addEventListener('change',event=>{
  const input=event.target;if(!input.matches('input[type="radio"]'))return;
  chosen[input.name]=input.value;
  document.querySelectorAll('.concept').forEach(card=>card.classList.toggle('chosen',Object.values(chosen).includes(card.dataset.concept)));
  document.querySelector('#selection-text').textContent=`캐릭터 ${chosen.character||'미선택'} · UI ${chosen.ui||'미선택'}`;
  document.querySelector('#copy-selection').disabled=!chosen.character||!chosen.ui;
});
document.querySelector('#copy-selection').addEventListener('click',async()=>{
  const text=`Flower vs Zombie : Base Defense의 캐릭터는 ${chosen.character}, UI는 ${chosen.ui}로 선택합니다. 현재 배치·합성·성장 기획을 유지하고 이 조합으로 비주얼을 개편해 주세요.`;
  const status=document.querySelector('#copy-status');
  try{await navigator.clipboard.writeText(text);status.textContent='복사했습니다. 이 대화에 붙여넣어 주세요.';}catch{status.textContent=text;}
});
