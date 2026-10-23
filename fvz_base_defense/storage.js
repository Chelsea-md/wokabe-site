import { rules } from "./config.js?v=production-49";
import {normalizeTraining} from './plant-progression.js';

const fresh = () => structuredClone(rules.defaults);
const number = (value, fallback, minimum, maximum) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : fallback;

export function reconcileRoster(progress) {
  normalizeTraining(progress,rules.troops.length);
  const old = Array.isArray(progress.unlocks) ? progress.unlocks : [];
  progress.unlocks = rules.troops.map((troop, index) => index === 0 || !!old[index]);
  const requested = Array.isArray(progress.loadout) ? progress.loadout : rules.defaults.loadout;
  progress.loadout = [...new Set(requested.filter(index =>
    Number.isInteger(index) && index >= 0 && index < rules.troops.length && progress.unlocks[index]))].slice(0, 4);
  if (!progress.loadout.length) progress.loadout = [0];
  const upgrades = Array.isArray(progress.plantUpgrades) ? progress.plantUpgrades : [];
  progress.plantUpgrades = rules.troops.map((_, index) => Math.max(0, Math.min(3, Math.floor(Number(upgrades[index]) || 0))));
  progress.selectedStage = Math.max(1, Math.min(progress.completedStages + 1, Math.floor(Number(progress.selectedStage) || progress.completedStages + 1)));
  return [];
}

export function toggleLoadout(progress, index) {
  if (!progress.unlocks[index]) return false;
  const selected = progress.loadout.indexOf(index);
  if (selected >= 0) {
    if (progress.loadout.length === 1) return false;
    progress.loadout.splice(selected, 1);
  } else if (progress.loadout.length < 4) progress.loadout.push(index);
  else progress.loadout[3] = index;
  return true;
}

export function loadProgress(storage) {
  const result = fresh();
  try {
    storage ||= globalThis.localStorage;
    const data = JSON.parse(storage.getItem(rules.saveKey) || "null");
    if (!data || typeof data !== "object" || Array.isArray(data)) return result;
    result.chapter = Math.floor(
      number(data.chapter, 0, 0, rules.chapters.length - 1),
    );
    result.completedStages = Math.floor(number(data.completedStages, result.chapter, 0, 100000));
    result.chapter = result.completedStages % rules.chapters.length;
    result.gems = Math.floor(number(data.gems, 0, 0, 1e12));
    result.coins = Math.floor(number(data.coins, 0, 0, 1e12));
    result.health = number(data.health, result.health, 10, 1e8);
    result.rate = number(data.rate, result.rate, 0.01, 1e5);
    result.income = Math.floor(number(data.income, result.income, 1, 1e8));
    if (Array.isArray(data.unlocks)) result.unlocks = data.unlocks;
    if (Array.isArray(data.loadout)) result.loadout = data.loadout;
    if (Array.isArray(data.plantUpgrades)) result.plantUpgrades = data.plantUpgrades;
    if (Array.isArray(data.plantTraining)) result.plantTraining = data.plantTraining;
    if (Number.isInteger(data.selectedStage)) result.selectedStage = data.selectedStage;
    for (const key of ["tutorial", "played", "sound"])
      if (typeof data[key] === "boolean") result[key] = data[key];
    if (data.freeUsed && typeof data.freeUsed === "object") {
      for (const key of ["health", "rate", "income"])
        if (data.freeUsed[key] === true) result.freeUsed[key] = true;
    }
  } catch {
    /* Unreadable saves fall back without overwriting the stored record. */
  }
  reconcileRoster(result);
  return result;
}

export function persistProgress(progress, storage) {
  try {
    storage ||= globalThis.localStorage;
    storage.setItem(rules.saveKey, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
