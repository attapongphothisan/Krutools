import {a4Layout,cleanFilename,exportFilename,type ExportFormat} from './export-layout';
import type {DocumentPage} from './session';
import {prepareExportImage} from './crop';
export type ExportImage={bytes:Uint8Array;type:'png'|'jpeg';width:number;height:number;rotation:number};
export async function assemblePdf(images:AsyncIterable<ExportImage>|Iterable<ExportImage>,signal:AbortSignal,title:string){
 const {PDFDocument,degrees}=await import('pdf-lib');signal.throwIfAborted();
 const pdf=await PDFDocument.create();pdf.setTitle(title);pdf.setCreator('เครื่องมือครู');
 for await(const image of images){
  signal.throwIfAborted();const asset=image.type==='png'?await pdf.embedPng(image.bytes):await pdf.embedJpg(image.bytes);
  const layout=a4Layout(image.width,image.height,image.rotation),page=pdf.addPage([layout.pageWidth,layout.pageHeight]);
  const r=((image.rotation%360)+360)%360;
  const x=layout.x+(r===180||r===270?layout.imageWidth:0),y=layout.y+(r===90||r===180?layout.imageHeight:0);
  page.drawImage(asset,{x,y,width:image.width*layout.scale,height:image.height*layout.scale,rotate:degrees(-r)});
 }
 signal.throwIfAborted();const bytes=await pdf.save({objectsPerTick:20});signal.throwIfAborted();return bytes;
}
export async function archivePdfs(files:Record<string,Uint8Array>,signal:AbortSignal){
 const {zip}=await import('fflate');signal.throwIfAborted();
 return new Promise<Uint8Array>((resolve,reject)=>{
  let terminate=()=>{};
  const abort=()=>{terminate();reject(new DOMException('Aborted','AbortError'))};
  signal.addEventListener('abort',abort,{once:true});
  terminate=zip(files,{level:0},(error,data)=>{signal.removeEventListener('abort',abort);if(signal.aborted)reject(new DOMException('Aborted','AbortError'));else if(error)reject(error);else resolve(data)});
 });
}
export async function buildDocumentExport(pages:DocumentPage[],name:string,format:ExportFormat,signal:AbortSignal,onProgress:(message:string)=>void){
 if(!pages.length)throw new Error('เพิ่มเอกสารอย่างน้อยหนึ่งหน้าก่อนสร้างไฟล์');
 const base=cleanFilename(name),separate=format==='separate'&&pages.length>1;
 let bytes:Uint8Array;
 if(separate){
  const files:Record<string,Uint8Array>={};
  for(let i=0;i<pages.length;i++){
   signal.throwIfAborted();onProgress(`กำลังเตรียมหน้า ${i+1} จาก ${pages.length}`);
   const image=await prepareExportImage(pages[i],signal),filename=`${base}-${String(i+1).padStart(3,'0')}.pdf`;
   files[filename]=await assemblePdf([image],signal,filename);
  }
  onProgress('กำลังรวมไฟล์แยกหน้าเป็น ZIP…');bytes=await archivePdfs(files,signal);
 }else{
  async function* prepare(){for(let i=0;i<pages.length;i++){signal.throwIfAborted();onProgress(`กำลังเตรียมหน้า ${i+1} จาก ${pages.length}`);yield await prepareExportImage(pages[i],signal)}onProgress('กำลังสร้างไฟล์ PDF…')}
  bytes=await assemblePdf(prepare(),signal,base);
 }
 signal.throwIfAborted();return{blob:new Blob([new Uint8Array(bytes)],{type:separate?'application/zip':'application/pdf'}),filename:exportFilename(base,format,pages.length)};
}
