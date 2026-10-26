// Only accelerate cleanup after the entire wave has spawned, never a lone
// enemy at the beginning or a lone visible enemy with others offscreen.
export function lastEnemyPace(previous=1,dt=0,{spawned,total,killed,alive}={}){
 const cleanup=total>0&&spawned>=total&&killed>=total-1&&alive===1;
 const target=cleanup?2:1;
 return previous+(target-previous)*(1-Math.exp(-Math.max(0,dt)*6));
}
