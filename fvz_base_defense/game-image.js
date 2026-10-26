import {publishedAsset} from './live-release.js?v=production-49';
// Bound each image request, including failed published replacements. onload also
// works in mobile webviews where Image.decode can remain pending indefinitely.
function imageAt(url){return new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';const name=url.startsWith('data:')?'inline image':new URL(url,location.href).pathname.split('/').pop();const timer=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error('Image request timed out: '+name));},30000);image.onload=()=>{clearTimeout(timer);image.onload=image.onerror=null;resolve(image);};image.onerror=()=>{clearTimeout(timer);image.onload=image.onerror=null;reject(Error('Image could not load: '+name));};image.src=url;});}
// Versioned imports of this module must share decoded images and pending work.
// Otherwise menus, rigs and world art each allocate the same atlas again.
const inFlight=globalThis[Symbol.for('fvz.game-image-cache.v1')]??=new Map();
export function loadGameImage(src,base=import.meta.url){const original=new URL(src,base).href;if(original.startsWith('data:'))return imageAt(original);if(inFlight.has(original))return inFlight.get(original);const task=(async()=>{const url=await publishedAsset(src,base);try{return await imageAt(url);}catch(error){if(url!==original)return imageAt(original);throw error;}})();inFlight.set(original,task);task.catch(()=>{if(inFlight.get(original)===task)inFlight.delete(original);}).catch(()=>{});return task;}
