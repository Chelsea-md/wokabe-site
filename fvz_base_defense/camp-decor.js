// Shared opt-in decoration set. Never adds collision or overwrites authored props.
export function addCampDecor(layout){
 const next=structuredClone(layout);
 if(next.theme!=='camp')return next;
 const additions=[[69,360,170,27],[69,1060,345,26],[69,880,515,24],[67,285,325,29]];
 additions.forEach(([asset,x,y,height],i)=>{
  const id='camp-soft-'+i;
  if(next.props.length<60&&!next.props.some(p=>p.id===id))next.props.push({id,asset,x,y,height,visible:true,flipX:false,solid:false,shadow:{width:.65,height:4,opacity:.12,x:0,y:-1}});
 });
 return next;
}
