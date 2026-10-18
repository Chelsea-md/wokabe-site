import { rules } from "./config.js?v=production-30";

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

export function countForWave(save, wave) {
  return Math.ceil((chapterFor(save).waveCounts[wave - 1] || 15)*encounterScale(save));
}

export function kindForSpawn(save, wave, index, total) {
  const chapter = chapterFor(save);
  if (wave === chapter.waves && index === Math.floor(total * chapter.bossAt))
    return 3;
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
