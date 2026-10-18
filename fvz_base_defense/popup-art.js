import {publishedAsset} from './live-release.js?v=production-40';
// Runtime crops preserve the user-supplied transparent PNGs unchanged.
export async function loadPopupArt() {
  const images = await Promise.all(['cartoon-v5-popup-sprout.png','cartoon-v5-pause-controls.png'].map(async name => {
    const im = new Image();
    im.crossOrigin='anonymous';im.src=await publishedAsset('assets/'+name,import.meta.url);
    await im.decode();
    return im;
  }));
  const specs = {sprout:[0,219,133,1107,763],resume:[1,1244,42,735,135],home:[1,1244,189,735,137],soundOn:[1,1245,337,734,109],soundOff:[1,1245,455,734,108]};
  return Object.fromEntries(Object.entries(specs).map(([key,[index,x,y,w,h]]) => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(images[index],x,y,w,h,0,0,w,h);
    return [key,cv.toDataURL()];
  }));
}
