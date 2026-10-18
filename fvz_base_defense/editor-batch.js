const clone=value=>JSON.parse(JSON.stringify(value));
export function copyStageShadows(layout,sourceId,fields){
 const source=layout.props.find(p=>p.id===sourceId),allowed=['width','height','opacity','x','y'];
 if(!source)throw Error('기준 오브젝트를 선택하세요.');
 if(!fields.length||fields.some(k=>!allowed.includes(k)))throw Error('복사할 그림자 항목을 선택하세요.');
 const next=clone(layout);
 for(const prop of next.props)for(const key of new Set(fields))prop.shadow[key]=source.shadow[key];
 return next;
}
export function copyGrowthSettings(config,id,sourceStar,targets,{includeHat=false}={}){
 if(!config.characters[id]||!Number.isInteger(sourceStar)||sourceStar<2||sourceStar>10)throw Error('기준은 2~10성 중에서 선택하세요.');
 if(!targets.length||targets.some(n=>!Number.isInteger(n)||n<2||n>10))throw Error('복사 대상 성급을 선택하세요.');
 const next=clone(config),source=config.characters[id][sourceStar-1],keys=includeHat?['x','y','width','rotation','hat']:['x','y','width','rotation'];
 for(const rank of new Set(targets))for(const key of keys)next.characters[id][rank-1][key]=source[key];
 return next;
}
