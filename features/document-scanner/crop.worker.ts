import {detectDocument,warpDocument,type Quad} from './geometry';
import {filterPixels,type ImageMode} from './color';
type Input={data:Uint8ClampedArray;width:number;height:number}&({kind:'detect'|'warp';corners:Quad}|{kind:'filter';mode:ImageMode}|{kind:'render';mode:ImageMode;corners:Quad|null});
self.onmessage=(event:MessageEvent<Input>)=>{
 try{
  const job=event.data,{data,width,height}=job;
  if(job.kind==='detect')self.postMessage({corners:detectDocument(data,width,height)});
  else{
   if(job.kind==='render'){
    const base=job.corners?warpDocument(data,width,height,job.corners,2480):{data,width,height};
    const result={...base,data:filterPixels(base.data,base.width,base.height,job.mode)};
    self.postMessage(result,{transfer:[result.data.buffer]});return;
   }
   const result=job.kind==='filter'?{data:filterPixels(data,width,height,job.mode),width,height}:warpDocument(data,width,height,job.corners);
   self.postMessage(result,{transfer:[result.data.buffer]});
  }
 }catch(error){self.postMessage({error:error instanceof Error?error.message:'ประมวลผลภาพไม่สำเร็จ'})}
};
