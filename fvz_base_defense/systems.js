import { rules } from "./config.js?v=production-49";

export function chapterFor(save) {
  return rules.chapters[
    Math.min(Math.max(0, save.chapter || 0), rules.chapters.length - 1)
  ];
}

export function priceAt(index) {
  const exact = rules.economy.prices[index];
  if (exact !== undefined) return exact;
  const curve = rules.economy.fallback;
  const delta = index - curve.anchorIndex;
  return Math.round(
    curve.anchor + delta * curve.linear + curve.quadratic * delta ** 2,
  );
}

export function costFor(save, stat) {
  const index =
    stat === "health"
      ? Math.round(save.health / 10) - 1
      : stat === "rate"
        ? Math.round((save.rate - 0.2) / 0.02)
        : save.income;
  return priceAt(index);
}

export function increaseStat(save, stat) {
  if (!(stat in rules.economy.increments)) throw new Error("Unknown upgrade");
  save[stat] = +(save[stat] + rules.economy.increments[stat]).toFixed(2);
}

export function encounterScale(save){return 1+Math.floor((save.completedStages||0)/rules.chapters.length)*(rules.campaign?.repeatDifficultyIncrement||.18);}

// Shared by the live game and Live Ops combat inspector (world-space units).
export function enemyStats(save,wave,kind,archerRange=240){
  const scale=encounterScale(save),boss=kind===3,ranged=kind===2||kind===4;
  const hp=boss?chapterFor(save).bossHp:(40+Math.max(0,wave-1)*10)*(kind===1?2:kind===4?2.5:kind===2?.8:1);
  return {hp:Math.round(hp*(chapterFor(save).hpFactor||1)*scale),
    damage:(boss?40:ranged?(kind===4?16:10)+wave*2:10)*scale,
    interval:ranged?(kind===4?2.3:1.8):boss?1.6:1.2,
    range:ranged?(kind===4?108:archerRange):boss?100:28,
    baseRange:ranged?(kind===4?108:archerRange):boss?120:62,
    speed:((boss?18:kind===1?9:11)*1.5+wave*.6)*Math.min(1.4,scale),
    armor:stageBeat(save)?.stage===18&&(kind===1||kind===4)?.32:0};
}

export function bigWaveBonus(base){return Math.min(14,Math.max(6,Math.ceil(base*.45)));}

export function stageBeat(save) {
  const stage=(save.completedStages||0)+1;
  const beats=[
    {stage:6,ally:'CRYSTAL',threat:'fast couriers',pattern:[2,0,2,1]},
    {stage:9,ally:'MUSHROOM',threat:'durable bruisers',pattern:[1,0,1,2]},
    {stage:12,ally:'MOSS GOLEM',threat:'close-range pressure',pattern:[0,1,0,4]},
    {stage:15,ally:'LILY',threat:'sustained attacks',pattern:[2,1,2,0]},
    {stage:18,ally:'LEAF',threat:'armored elites',pattern:[4,1,4,0]},
    {stage:21,ally:'HOLLY',threat:'crowded waves',pattern:[0,2,0,2,1]},
  ];
  const beat=beats.find(item=>stage>=item.stage-1&&stage<=item.stage+1);
  return beat?{...beat,phase:stage===beat.stage-1?'preview':stage===beat.stage?'spotlight':'mix'}:null;
}

export function countForWave(save, wave) {
  return Math.ceil((chapterFor(save).waveCounts[wave - 1] || 15)*encounterScale(save));
}

export function kindForSpawn(save, wave, index, total) {
  const chapter = chapterFor(save);
  if (wave === chapter.waves && index === Math.floor(total * chapter.bossAt))
    return 3;
  const beat=stageBeat(save);
  if(beat&&wave>=2){
    if(beat.phase==='preview')return beat.pattern[index%beat.pattern.length];
    if(beat.phase==='spotlight')return beat.pattern[(index+1)%beat.pattern.length];
    return [...beat.pattern,0,1][index%(beat.pattern.length+2)];
  }
  if (chapter.id==='forest-camp'&&wave>=3)return [0,2,2,4,1][index%5];
  if (chapter.id==='moonblock'&&(wave===3||wave===5))return [1,1,0,2][index%4];
  if (!save.chapter) return wave === 1 ? 0 : wave === 2 ? index % 2 : index % 3;
  if (wave === 1) return 0;
  if (wave === 2) return index % 2 ? 2 : 0;
  const pattern = wave >= 7 ? [0, 2, 1, 4] : [0, 2, 1];
  return pattern[index % pattern.length];
}

export function spawnInterval(save, wave) {
  const cadence = chapterFor(save).spawn;
  return Math.max(cadence.min, (cadence.base - wave * cadence.decrease)/Math.sqrt(encounterScale(save)));
}

export function killReward(save, kind) {
  const multiplier =
    kind === 3
      ? 7
      : save.chapter > 0
        ? kind === 1 || kind === 4
          ? 2
          : 1
        : kind + 1;
  return (save.income + rules.economy.killBaseBonus) * multiplier;
}

export function mergeHealth(target, newLevel) {
  const maxHp = Math.floor(
    rules.troops[target.type].hp * rules.merge.hpGrowth ** newLevel,
  );
  const missingHealth = Math.max(0, target.maxHp - target.hp);
  return { maxHp, hp: Math.max(0, maxHp - missingHealth) };
}
