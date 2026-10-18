// Every theme shares this home-to-battle terrain camera; battle coordinates remain unchanged.
export function terrainCamera(blend){const home=1-Math.max(0,Math.min(1,blend));return {scale:1+home*.06,x:-42*home,y:8*home};}
export function advanceTerrainCamera(blend,battle,dt,reduced=false){const target=battle?1:0;if(reduced)return target;const next=blend+(target-blend)*(1-Math.exp(-Math.max(0,dt)*8));return Math.abs(target-next)<.0001?target:next;}
