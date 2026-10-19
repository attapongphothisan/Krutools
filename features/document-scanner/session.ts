import {useEffect,useRef,useState} from 'react';
import type {Quad} from './geometry';
import {processColor} from './crop';
import type {ImageMode} from './color';

export type DocumentPage={id:string;name:string;source:File;previewUrl:string;width:number;height:number;rotation:number;originalUrl:string;originalWidth:number;originalHeight:number;corners:Quad|null;colorUrl:string;mode:ImageMode};

async function readPage(file:File):Promise<DocumentPage>{
 const sourceUrl=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=sourceUrl;await img.decode();
  if(!img.naturalWidth||!img.naturalHeight)throw new Error('Empty image');
  const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Image conversion failed')),'image/jpeg',0.9));
  const width=canvas.width,height=canvas.height;canvas.width=0;canvas.height=0;
  const url=URL.createObjectURL(blob);
  return{id:crypto.randomUUID(),name:file.name,source:file,previewUrl:url,originalUrl:url,colorUrl:url,mode:'original',originalWidth:width,originalHeight:height,corners:null,width,height,rotation:0};
 }finally{URL.revokeObjectURL(sourceUrl)}
}

export function useDocumentSession(){
 const[pages,setPages]=useState<DocumentPage[]>([]),[selectedId,setSelectedId]=useState<string|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[errors,setErrors]=useState<string[]>([]),[canCancel,setCanCancel]=useState(false);
 const current=useRef<DocumentPage[]>([]),resources=useRef(new Set<string>()),activity=useRef({alive:false,operation:0}),importing=useRef(false),processing=useRef<AbortController|null>(null);
 useEffect(()=>{
  const lifecycle=activity.current,urls=resources.current;lifecycle.alive=true;const processingRef=processing;
  return()=>{lifecycle.alive=false;lifecycle.operation++;processingRef.current?.abort();urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();current.current=[]};
 },[]);
 useEffect(()=>{
  if(!pages.length&&!busy)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[pages.length,busy]);
 function update(next:DocumentPage[]){current.current=next;setPages(next)}
 async function addFiles(files:File[]){
  if(importing.current||!files.length)return;
  importing.current=true;const task=++activity.current.operation;setBusy(true);setErrors([]);
  const failed:string[]=[];
  try{
   for(let i=0;i<files.length;i++){
    if(!activity.current.alive||task!==activity.current.operation)break;
    setProgress(`กำลังเพิ่มภาพ ${i+1} จาก ${files.length}`);
    try{
     const page=await readPage(files[i]);
     if(!activity.current.alive||task!==activity.current.operation){URL.revokeObjectURL(page.previewUrl);break}
     resources.current.add(page.previewUrl);update([...current.current,page]);setSelectedId(id=>id??page.id);
    }catch{failed.push(`เปิดภาพ “${files[i].name}” ไม่ได้ กรุณาใช้ JPEG, PNG หรือถ่ายใหม่`)}
   }
  }finally{
   importing.current=false;
   if(activity.current.alive&&task===activity.current.operation){setBusy(false);setProgress('');setErrors(failed)}
  }
 }
 function remove(id:string){
  const index=current.current.findIndex(page=>page.id===id);if(index<0)return;
  const page=current.current[index],next=current.current.filter(page=>page.id!==id);
  for(const url of new Set([page.previewUrl,page.originalUrl,page.colorUrl])){URL.revokeObjectURL(url);resources.current.delete(url)}update(next);
  setSelectedId(selected=>selected===id?(next[Math.min(index,next.length-1)]?.id??null):selected);
 }
 function rotate(id:string){update(current.current.map(page=>page.id===id?{...page,rotation:(page.rotation+90)%360}:page))}
 function move(id:string,offset:number){
  const next=[...current.current],index=next.findIndex(page=>page.id===id),target=index+offset;
  if(index<0||target<0||target>=next.length)return;
  [next[index],next[target]]=[next[target],next[index]];update(next);
 }
 function releaseUnused(previous:DocumentPage[],next:DocumentPage[]){
  const retained=new Set(next.flatMap(page=>[page.originalUrl,page.colorUrl,page.previewUrl]));
  for(const url of new Set(previous.flatMap(page=>[page.originalUrl,page.colorUrl,page.previewUrl])))if(!retained.has(url)){URL.revokeObjectURL(url);resources.current.delete(url)}
 }
 async function runProcessing(work:(signal:AbortSignal,temporary:Set<string>)=>Promise<DocumentPage[]>){
  if(importing.current)return;
  importing.current=true;const task=++activity.current.operation,controller=new AbortController(),temporary=new Set<string>();processing.current=controller;
  setBusy(true);setCanCancel(true);setErrors([]);
  try{
   const next=await work(controller.signal,temporary);controller.signal.throwIfAborted();
   if(!activity.current.alive||task!==activity.current.operation)return;
   temporary.forEach(url=>resources.current.add(url));releaseUnused(current.current,next);update(next);temporary.clear();
  }catch(error){if(activity.current.alive&&!controller.signal.aborted)setErrors([error instanceof Error?error.message:'ปรับภาพไม่สำเร็จ กรุณาลองใหม่'])}
  finally{
   temporary.forEach(url=>URL.revokeObjectURL(url));importing.current=false;
   if(activity.current.alive&&task===activity.current.operation){processing.current=null;setBusy(false);setCanCancel(false);setProgress('')}
  }
 }
 function applyCrop(id:string,corners:Quad|null,result:{blob:Blob;width:number;height:number}|null){
  const page=current.current.find(item=>item.id===id);if(!page)return;
  return runProcessing(async(signal,temporary)=>{
   setProgress('กำลังปรับภาพหลังแก้ขอบ…');
   const base=result?URL.createObjectURL(result.blob):page.originalUrl;if(result)temporary.add(base);
   const preview=page.mode==='original'?base:URL.createObjectURL(await processColor(base,page.mode,signal));if(preview!==base)temporary.add(preview);
   return current.current.map(item=>item.id===id?{...item,corners,colorUrl:base,previewUrl:preview,width:result?.width??page.originalWidth,height:result?.height??page.originalHeight}:item);
  });
 }
 function setMode(mode:ImageMode,all=false){
  const targets=current.current.filter(page=>(all||page.id===selectedId)&&page.mode!==mode);
  if(!targets.length)return;
  return runProcessing(async(signal,temporary)=>{
   const changed=new Map<string,DocumentPage>();
   for(let i=0;i<targets.length;i++){
    signal.throwIfAborted();setProgress(`กำลังปรับภาพ ${i+1} จาก ${targets.length}`);
    const page=targets[i],url=mode==='original'?page.colorUrl:URL.createObjectURL(await processColor(page.colorUrl,mode,signal));
    if(url!==page.colorUrl)temporary.add(url);changed.set(page.id,{...page,mode,previewUrl:url});
   }
   return current.current.map(page=>changed.get(page.id)??page);
  });
 }
 function cancelProcessing(){processing.current?.abort()}
 return{pages,selectedId,setSelectedId,busy,progress,errors,addFiles,remove,rotate,move,applyCrop,setMode,canCancel,cancelProcessing};
}
