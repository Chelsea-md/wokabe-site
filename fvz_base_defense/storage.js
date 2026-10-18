import { rules } from "./config.js?v=production-22";

const fresh = () => structuredClone(rules.defaults);
const number = (value, fallback, minimum, maximum) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : fallback;

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
    if (Array.isArray(data.unlocks))
      result.unlocks = [true, !!data.unlocks[1], !!data.unlocks[2], !!data.unlocks[3]];
    for (const key of ["tutorial", "played", "sound"])
      if (typeof data[key] === "boolean") result[key] = data[key];
    if (data.freeUsed && typeof data.freeUsed === "object") {
      for (const key of ["health", "rate", "income"])
        if (data.freeUsed[key] === true) result.freeUsed[key] = true;
    }
  } catch {
    /* Unreadable saves fall back without overwriting the stored record. */
  }
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
