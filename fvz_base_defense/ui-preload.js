// Warm CSS artwork before it is first painted; keep decoded images alive.
const images=new Map();
export function warmUI(urls){
 return Promise.all(urls.map(url=>{
  if(images.has(url))return images.get(url);
  const task=new Promise(resolve=>{const image=new Image();const timer=setTimeout(resolve,8000);image.onload=async()=>{try{await image.decode();}catch{}clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);resolve(null);};image.src=url;});
  images.set(url,task);return task;
 }));
}
export async function warmStyles(url){
 try{const css=await fetch(url).then(r=>r.text());return await warmUI([...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>new URL(m[1],url).href));}catch{}
}
