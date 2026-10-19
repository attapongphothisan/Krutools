export type ExportFormat='combined'|'separate';
export type ExportSettings={name:string;format:ExportFormat};
const mm=72/25.4;
export function a4Layout(width:number,height:number,rotation=0){
 const swapped=rotation%180!==0,orientedWidth=swapped?height:width,orientedHeight=swapped?width:height;
 const landscape=orientedWidth>orientedHeight,pageWidth=(landscape?297:210)*mm,pageHeight=(landscape?210:297)*mm,margin=5*mm;
 const scale=Math.min((pageWidth-margin*2)/orientedWidth,(pageHeight-margin*2)/orientedHeight);
 const imageWidth=orientedWidth*scale,imageHeight=orientedHeight*scale;
 return{pageWidth,pageHeight,imageWidth,imageHeight,x:(pageWidth-imageWidth)/2,y:(pageHeight-imageHeight)/2,scale,landscape};
}
export function cleanFilename(value:string){
 let name=value.trim().replace(/(?:\.(?:pdf|zip))+$/gi,'').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/^\.+|[. ]+$/g,'').trim();
 if(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name))name=`เอกสาร-${name}`;
 name=Array.from(name).slice(0,100).join('').replace(/[. ]+$/g,'');return name||'เอกสาร';
}
export function defaultExportName(date=new Date()){return `เอกสาร-${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function exportFilename(name:string,format:ExportFormat,count:number){return `${cleanFilename(name)}.${format==='separate'&&count>1?'zip':'pdf'}`}
export function sizeLabel(bytes:number){return bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/1024/1024).toFixed(1)} MB`}
