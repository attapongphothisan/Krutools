import type {Quad} from './geometry';
import type {ImageMode} from './color';
import type {DocumentPage} from './session';
type Adjustments={sharpness?:number;bend?:number};
type Job=Adjustments & ({kind:'detect';corners:Quad}|{kind:'warp';corners:Quad}|{kind:'filter';mode:ImageMode}|{kind:'render';mode:ImageMode;corners:Quad|null});
type PixelResult={corners:Quad|null;data:Uint8ClampedArray;width:number;height:number};
async function processPixels(url:string,job:Job,signal:AbortSignal){
 const image=new Image();image.src=url;await image.decode();signal.throwIfAborted();
 const canvas=document.createElement('canvas');const scale=job.kind==='render'?Math.min(1,2480/Math.max(image.naturalWidth,image.naturalHeight)):1;canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('ไม่สามารถเปิดภาพเพื่อประมวลผลได้');
 try{
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
  const result=await new Promise<PixelResult>((resolve,reject)=>{
   const worker=new Worker(new URL('./crop.worker.ts',import.meta.url),{type:'module'});
   const stop=()=>{worker.terminate();signal.removeEventListener('abort',abort)};
   const abort=()=>{stop();reject(new DOMException('Aborted','AbortError'))};
   signal.addEventListener('abort',abort,{once:true});
   worker.onmessage=event=>{stop();if(event.data.error)reject(new Error(event.data.error));else resolve(event.data)};
   worker.onerror=()=>{stop();reject(new Error('ประมวลผลภาพไม่สำเร็จ กรุณาลองใหม่'))};
   worker.postMessage({...job,data:frame.data,width:frame.width,height:frame.height},[frame.data.buffer]);
  });
  signal.throwIfAborted();
  if(job.kind==='detect')return{corners:result.corners,blob:null,width:0,height:0};
  canvas.width=result.width;canvas.height=result.height;ctx.putImageData(new ImageData(new Uint8ClampedArray(result.data),result.width,result.height),0,0);
  // Lossless output keeps the sharp mode strictly black and white.
  const format=(job.kind==='filter'||job.kind==='render')&&job.mode==='bw'?'image/png':'image/jpeg';
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('สร้างภาพไม่สำเร็จ')),format,.92));
  signal.throwIfAborted();return{blob,width:result.width,height:result.height,corners:null};
 }finally{canvas.width=0;canvas.height=0}
}
export async function processCrop(url:string,kind:'detect',corners:Quad,signal:AbortSignal):Promise<{corners:Quad|null}>;
export async function processCrop(url:string,kind:'warp',corners:Quad,signal:AbortSignal):Promise<{blob:Blob;width:number;height:number}>;
export async function processCrop(url:string,kind:'detect'|'warp',corners:Quad,signal:AbortSignal){
 const result=await processPixels(url,{kind,corners},signal);
 if(kind==='detect')return{corners:result.corners};
 if(!result.blob)throw new Error('สร้างภาพไม่สำเร็จ');
 return{blob:result.blob,width:result.width,height:result.height};
}
export async function processColor(url:string,mode:ImageMode,signal:AbortSignal,adjustments:Adjustments={}){
 const result=await processPixels(url,{kind:'filter',mode,...adjustments},signal);
 if(!result.blob)throw new Error('ปรับโหมดภาพไม่สำเร็จ');return result.blob;
}

export async function prepareExportImage(page:DocumentPage,signal:AbortSignal){
 const url=URL.createObjectURL(page.source);
 try{
  const result=await processPixels(url,{kind:'render',mode:page.mode,corners:page.corners,sharpness:page.sharpness,bend:page.bend},signal);
  if(!result.blob)throw new Error('เตรียมภาพสำหรับ PDF ไม่สำเร็จ');
  const bytes=new Uint8Array(await result.blob.arrayBuffer());signal.throwIfAborted();
  return{bytes,width:result.width,height:result.height,rotation:page.rotation,type:result.blob.type==='image/png'?'png' as const:'jpeg' as const};
 }finally{URL.revokeObjectURL(url)}
}
