// Wake simulation independently of requestAnimationFrame in background tabs.
setInterval(()=>postMessage(0),100);
