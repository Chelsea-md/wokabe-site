import {createUpgradeView} from './plant-upgrades-ui.js';
import {createPlantsShop} from './plants-shop.js?v=shop-11';
import {installSquadInteraction} from './squad-interaction.js?v=garden-5';
// Local concept preview: five-menu navigation using the player's supplied icon atlas.
const icon = name => `<span class="menu-sprite icon-${name}" aria-hidden="true"></span>`;
const menuAsset = name => new URL(`./assets/${name}`, import.meta.url).href;
// Keyed by authored art theme, so later chapters can reuse their world illustration.
const journeyIllustrations = {
  green: 'journey-green.webp', dune: 'journey-dune.webp', camp: 'journey-night-camp.webp',
  moon: 'journey-moon.webp', oasis: 'journey-oasis.webp', noon: 'journey-noon.webp',
  ember: 'journey-ember.webp', frost: 'journey-frost.webp',
  coral: 'journey-coral.webp', hollow: 'journey-hollow.webp',
};
const ownedCount = progress => progress.unlocks.filter(Boolean).length;

export function createMenuPreview({frame, rules, getProgress, getSelectedStage,
  portrait, gemMarkup, mapPreview, bossPreview, onNavigate, onStage, onSquad, onUpgrade, onNotice, lockAsset, coinAsset, onBuy}) {
  const plantShop=createPlantsShop({frame,rules,getProgress,portrait,onBuy,lockAsset,coinAsset});
  const nav = frame.querySelector('.bottom-nav');
  const entries = [
    {key:'journey',label:'JOURNEY',icon:'map',requirement:'Clear Chapter 1'},
    {key:'plants',label:'PLANTS',icon:'shop'},
    {key:'home',label:'BATTLE',icon:'swords'},
    {key:'squad',label:'SQUAD',icon:'helmet',requirement:'Own 5 plants'},
    {key:'upgrades',label:'UPGRADES',icon:'book',requirement:'Own 6 plants'},
  ];
  nav.innerHTML = entries.map(entry => `<button type="button" id="menu-${entry.key}" data-menu="${entry.key}" aria-label="${entry.label}">${icon(entry.icon)}<span>${entry.label}</span><img class="menu-lock" src="${lockAsset}" alt=""></button>`).join('');
  let pendingPlant = -1;
  let focusedStage = getSelectedStage();
  const surfaces = {};
  const garden=document.createElement('div');garden.className='squad-garden';garden.setAttribute('aria-hidden','true');frame.append(garden);
  for (const key of ['journey','squad','upgrades']) {
    const section = document.createElement('section');
    section.className = 'menu-surface';
    section.dataset.menuSurface = key;
    section.setAttribute('aria-label', key.toUpperCase());
    frame.append(section);
    surfaces[key] = section;
  }
  const squadInteraction=installSquadInteraction({frame,surface:surfaces.squad,getProgress,onSquad});
  const unlocked = (key, progress) => key === 'journey'
    ? progress.completedStages >= 1
    : key === 'squad' ? ownedCount(progress) >= 5
    : key === 'upgrades' ? ownedCount(progress) >= 6 : true;
  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-menu]');
    if (!button) return;
    const key = button.dataset.menu;
    if (!unlocked(key, getProgress())) {
      onNotice(entries.find(entry => entry.key === key).requirement);
      return;
    }
    pendingPlant = -1;
    onNavigate(key);
  });

  function renderJourney(progress, direction = 0) {
    const latest = progress.completedStages + 1;
    // Show only the first locked chapter, never the undiscovered pages beyond it.
    const lastPage = latest + 1;
    focusedStage = Math.max(1, Math.min(lastPage, focusedStage));
    const stage = focusedStage;
    const chapter = rules.chapters[(stage - 1) % rules.chapters.length];
    const cleared = stage <= progress.completedStages;
    const playable = stage <= latest;
    const descriptions = [
      'A fresh trail through the garden.\nProtect your little corner of green.',
      'Follow the trail across the dunes.\nKeep your allies close in the sand.',
      'A quiet camp under the moonlight…\nBut the darkness is hiding\nsomething dangerous.',
      'Beyond the trees, moonlight falls.\nA new enemy waits in the shadows.',
      'Ancient stones under a golden sun.\nLead your plants into the temple.',
      'The sun beats down on the trail.\nHold your ground in the heat.',
      'Warm embers light the valley.\nGuide your squad through the glow.',
      'A frosty path through the garden.\nKeep your defense standing strong.',
      'A new trail beside the coral coast.\nThe next adventure is just ahead.',
      'A blue glow fills the hollow.\nSee what lies around the bend.',
    ];
    surfaces.journey.innerHTML = `<div class="journey-book ${playable ? '' : 'is-locked'}" role="group" aria-label="Chapter selection book" tabindex="0">
      <div class="book-spread" style="--page-direction:${direction}" ${direction ? 'data-turning="true"' : ''}>
        <div class="book-map-page">
          <div class="book-map"><img data-map-image="${stage}" alt="${chapter.name} terrain"><span class="journey-map-loading">Opening the map…</span></div>
          <div class="book-map-caption">${icon('map')}<span>${cleared ? 'A PLACE YOU KNOW' : playable ? 'YOUR NEXT ADVENTURE' : 'UNCHARTED TERRITORY'}</span></div>
          <div class="journey-boss ${playable ? '' : 'secret'}" role="img" aria-label="${playable ? 'Chapter boss' : 'Unknown boss'}"><img data-boss-image="${stage}" alt=""><span>${playable ? 'BOSS' : '???'}</span></div>
        </div>
        <div class="book-detail-page">
          <div class="book-chapter" aria-label="Chapter ${stage}"><b>${stage}</b></div>
          <h2>${chapter.name}</h2>
          <div class="book-status ${cleared ? 'cleared' : playable ? 'ready' : 'locked'}"><img src="${playable ? menuAsset('chapter-check.png') : lockAsset}" alt=""><span>${cleared ? 'Cleared' : playable ? 'Ready to Play' : 'Locked'}</span></div>
          <p class="book-description">${playable ? descriptions[(stage-1)%descriptions.length] : `Clear Chapter ${stage-1}\nto open this page.`}</p>
          <button type="button" class="journey-visit" data-visit-stage="${stage}" ${playable ? '' : 'disabled'}><span>${cleared ? 'REVISIT' : playable ? 'ENTER' : 'LOCKED'}</span></button>
          <small class="book-footnote">${cleared ? 'First-clear rewards already collected.' : playable ? 'A new chapter is waiting for you.' : 'Finish the previous chapter first.'}</small>
        </div>
      </div>
      <button type="button" class="book-arrow previous" data-page="-1" aria-label="Previous chapter" ${stage === 1 ? 'disabled' : ''}><img src="${menuAsset('cartoon-v5-upgrade-arrow-v17.png')}" alt=""></button>
      <button type="button" class="book-arrow next" data-page="1" aria-label="Next chapter" ${stage === lastPage ? 'disabled' : ''}><img src="${menuAsset('cartoon-v5-upgrade-arrow-v17.png')}" alt=""></button>
      <span class="book-page-number" aria-live="polite">${stage}</span>
    </div>`;
    const image = surfaces.journey.querySelector('[data-map-image]');
    const illustration = journeyIllustrations[chapter.artStage];
    image.parentElement.classList.toggle('illustrated', Boolean(illustration));
    image.onload = () => image.parentElement.classList.add('loaded');
    image.onerror = async () => {
      image.onerror = null;
      if (!image.isConnected) return;
      image.parentElement.classList.remove('illustrated', 'loaded');
      try { image.src = await mapPreview(stage); }
      catch { image.parentElement.querySelector('.journey-map-loading').textContent = 'Map unavailable'; }
    };
    (illustration ? Promise.resolve(menuAsset(illustration)) : mapPreview(stage)).then(url => {
      if (!image.isConnected) return;
      image.src = url;
    }).catch(() => {
      if (image.isConnected) image.parentElement.querySelector('.journey-map-loading').textContent = 'Map unavailable';
    });
    const bossImage = surfaces.journey.querySelector('[data-boss-image]');
    bossPreview(stage).then(({url,name}) => {
      if (!bossImage.isConnected) return;
      bossImage.src = url;
      if (playable) bossImage.parentElement.setAttribute('aria-label',`Chapter boss: ${name}`);
    }).catch(() => { if (bossImage.isConnected) bossImage.parentElement.hidden = true; });
    const turnPage = delta => {
      const next = stage + delta;
      if (next > lastPage) { onNotice(`Clear Chapter ${latest} first.`); return; }
      if (next < 1) return;
      focusedStage = next;
      renderJourney(getProgress(), delta);
      const control = surfaces.journey.querySelector(`[data-page="${delta}"]:not(:disabled)`) || surfaces.journey.querySelector('.journey-book');
      control.focus({preventScroll:true});
    };
    surfaces.journey.querySelectorAll('[data-page]').forEach(button => button.onclick = () => turnPage(Number(button.dataset.page)));
    surfaces.journey.querySelector('[data-visit-stage]').onclick = () => {
      if (stage <= getProgress().completedStages + 1) onStage(stage);
    };
    const book = surfaces.journey.querySelector('.journey-book');
    book.addEventListener('dragstart', event => event.preventDefault());
    book.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault(); turnPage(event.key === 'ArrowRight' ? 1 : -1);
    });
    let pointerStart = null;
    book.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      pointerStart = {id:event.pointerId,x:event.clientX,y:event.clientY};
      book.setPointerCapture(event.pointerId);
    });
    book.addEventListener('pointercancel', () => {pointerStart = null;});
    book.addEventListener('pointerup', event => {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      const rotated = Math.abs(parseFloat(getComputedStyle(document.querySelector('#game-shell')).getPropertyValue('--game-rotation'))) > 45;
      const distance = rotated ? event.clientY-pointerStart.y : event.clientX-pointerStart.x;
      const cross = rotated ? event.clientX-pointerStart.x : event.clientY-pointerStart.y;
      pointerStart = null;
      if (Math.abs(distance) > 35 && Math.abs(distance) > Math.abs(cross)*1.2) turnPage(distance < 0 ? 1 : -1);
    });
  }

  function renderSquad(progress) {
    const owned = rules.troops.map((plant, index) => ({plant,index})).filter(({index}) => progress.unlocks[index]);
    surfaces.squad.innerHTML = `
      <div class="squad-slots">${Array.from({length:4}, (_, slot) => {
        const index = progress.loadout[slot], plant = rules.troops[index];
        return `<button type="button" class="squad-slot ${plant ? '' : 'empty'} ${pendingPlant >= 0 ? 'replace-ready' : ''}" data-slot="${slot}" data-actor="${plant?.rigId||''}" aria-label="Slot ${slot+1}${plant ? ': '+plant.name : ': empty'}${pendingPlant >= 0 ? ', replace with '+rules.troops[pendingPlant].name : ''}"><span class="squad-portrait">${plant ? `<img src="${portrait(index)}" alt="">` : icon('helmet')}</span><span class="squad-nameplate"><strong>${plant ? plant.name : 'EMPTY'}</strong><small>${plant ? plant.role || 'ATTACK' : 'SLOT '+(slot+1)}</small></span></button>`;
      }).join('')}</div>
      <div class="squad-roster" aria-label="Owned plants">${owned.map(({plant,index}) => `<button type="button" class="squad-choice ${progress.loadout.includes(index) ? 'equipped' : ''} ${pendingPlant === index ? 'pending' : ''}" data-plant="${index}" aria-label="${plant.name}, ${progress.loadout.includes(index) ? 'in squad' : 'available'}"><img src="${portrait(index)}" alt=""><strong>${plant.name}</strong></button>`).join('')}</div>
      <p class="squad-a11y-status" role="status" aria-live="polite"></p>`;
    if(owned.length>8){
      surfaces.squad.insertAdjacentHTML('beforeend',[-1,1].map(direction=>`<button type="button" class="squad-roster-arrow ${direction<0?'previous':'next'}" data-roster-page="${direction}" aria-label="${direction<0?'Previous':'Next'} plants"><img src="${menuAsset('cartoon-v5-upgrade-arrow-v17.png')}" alt=""></button>`).join(''));
      surfaces.squad.querySelectorAll('[data-roster-page]').forEach(b=>b.onclick=()=>{const roster=surfaces.squad.querySelector('.squad-roster');roster.scrollBy({left:Number(b.dataset.rosterPage)*roster.clientWidth*.65,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
    }
    squadInteraction.paint();
  }

  const upgradeView=createUpgradeView({surface:surfaces.upgrades,rules,portrait,gemMarkup,onUpgrade,getProgress});
  function renderUpgrades() { upgradeView.render(); }

  function render(scene) {
    if(scene!=='squad')squadInteraction.reset();
    const progress = getProgress();
    nav.querySelectorAll('[data-menu]').forEach(button => {
      const key = button.dataset.menu;
      button.classList.toggle('chosen', key === scene);
      button.classList.toggle('menu-locked', !unlocked(key, progress));
      button.setAttribute('aria-label', `${button.textContent.trim()}${unlocked(key, progress) ? '' : ', locked. '+entries.find(entry => entry.key === key).requirement}`);
    });
    if (scene === 'plants') plantShop.render();
    if (scene === 'journey') renderJourney(progress);
    if (scene === 'squad') renderSquad(progress);
    if (scene === 'upgrades') renderUpgrades(progress);
  }
  return {render};
}
