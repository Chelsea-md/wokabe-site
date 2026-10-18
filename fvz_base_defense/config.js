async function readData(file) {
  const response = await fetch(new URL(file, import.meta.url));
  if (!response.ok) throw new Error(`Cannot load game data: ${file}`);
  return response.json();
}

export const [rules, assetCatalog] = await Promise.all([
  readData("./data/rules.json?v=production-44"),
  readData("./data/assets.json?v=production-44"),
]);

if (rules.schemaVersion !== 1 || assetCatalog.schemaVersion !== 1) {
  throw new Error("Unsupported game data version");
}

export const assetFiles = Object.fromEntries(
  assetCatalog.assets.map((asset) => [asset.id, asset.file]),
);
export const preloadIds = assetCatalog.assets
  .filter((asset) => asset.preload)
  .map((asset) => asset.id);
