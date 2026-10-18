import {publishedAsset} from './live-release.js?v=production-44';
// Bound each image request, including failed published replacements. onload also
// works in mobile webviews where Image.decode can remain pending indefinitely.
function imageAt(url){return new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';const timer=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error('Image request timed out'));},20000);image.onload=()=>{clearTimeout(timer);image.onload=image.onerror=null;resolve(image);};image.onerror=()=>{clearTimeout(timer);image.onload=image.onerror=null;reject(Error('Image could not load'));};image.src=url;});}
export async function loadGameImage(src,base=import.meta.url){const original=new URL(src,base).href,url=await publishedAsset(src,base);try{return await imageAt(url);}catch(error){if(url!==original)return imageAt(original);throw error;}}
