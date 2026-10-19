'use client';
import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {Check,LoaderCircle,ScanLine,Undo2} from 'lucide-react';
import {Dialog} from '../ui';
import type {DocumentPage} from './session';
import {fullFrame,validQuad,type Quad} from './geometry';
import {processCrop} from './crop';
const names=['ซ้ายบน','ขวาบน','ขวาล่าง','ซ้ายล่าง'];
export function CropEditor({page,onClose,onApply}:{page:DocumentPage;onClose:()=>void;onApply:(corners:Quad|null,result:{blob:Blob;width:number;height:number}|null)=>void}){
 const[corners,setCorners]=useState<Quad>(()=>page.corners??fullFrame()),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const stage=useRef<HTMLDivElement>(null),task=useRef<AbortController|null>(null);
 useEffect(()=>()=>task.current?.abort(),[]);
 const valid=validQuad(corners);
 function change(index:number,x:number,y:number){setCorners(points=>points.map((point,i)=>i===index?{x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))}:point) as Quad);setMessage('');setError('')}
 function pointer(event:PointerEvent<HTMLButtonElement>,index:number){
  if(busy||event.buttons===0)return;
  const bounds=stage.current?.getBoundingClientRect();if(bounds)change(index,(event.clientX-bounds.left)/bounds.width,(event.clientY-bounds.top)/bounds.height);
 }
 function keyboard(event:KeyboardEvent<HTMLButtonElement>,index:number){
  const delta=event.shiftKey?.015:.003,point=corners[index];
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();change(index,point.x+(event.key==='ArrowLeft'?-delta:event.key==='ArrowRight'?delta:0),point.y+(event.key==='ArrowUp'?-delta:event.key==='ArrowDown'?delta:0));
 }
 async function detect(){
  if(busy)return;setBusy(true);setError('');setMessage('กำลังค้นหาขอบกระดาษ…');
  const controller=new AbortController();task.current=controller;
  try{const result=await processCrop(page.originalUrl,'detect',corners,controller.signal);if(result.corners){setCorners(result.corners);setMessage('พบกรอบกระดาษแล้ว ตรวจมุมทั้งสี่ก่อนใช้กรอบนี้')}else setMessage('ยังไม่พบขอบกระดาษที่ชัดเจน ลากมุมให้ตรงกับเอกสารได้เลย')}
  catch(cause){if(!controller.signal.aborted){setError(cause instanceof Error?cause.message:'ค้นหาขอบไม่สำเร็จ');setMessage('')}}
  finally{if(!controller.signal.aborted)setBusy(false)}
 }
 async function apply(){
  if(!valid||busy)return;setBusy(true);setError('');setMessage('กำลังปรับมุมกระดาษ…');
  const controller=new AbortController();task.current=controller;
  try{
   if(corners.every((p,i)=>p.x===fullFrame()[i].x&&p.y===fullFrame()[i].y)){onApply(null,null);return}
   const result=await processCrop(page.originalUrl,'warp',corners,controller.signal);onApply(corners,result);
  }catch(cause){if(!controller.signal.aborted){setError(cause instanceof Error?cause.message:'ปรับภาพไม่สำเร็จ');setMessage('')}}
  finally{if(!controller.signal.aborted)setBusy(false)}
 }
 function close(){task.current?.abort();onClose()}
 return <Dialog title="ปรับขอบกระดาษ" subtitle="ลากมุมทั้ง 4 จุดให้ตรงกับขอบเอกสาร แล้วกดใช้กรอบนี้" wide onClose={close}>
  <div className="document-crop-body">
   <p id="crop-instructions" className="document-crop-instructions">ปรับกรอบจากภาพต้นฉบับ การหมุนหน้าจะยังอยู่ตามที่เลือกไว้ ใช้ปุ่มลูกศรบนคีย์บอร์ดเลื่อนมุมได้</p>
   <div className="document-crop-stage" ref={stage} style={{aspectRatio:`${page.originalWidth} / ${page.originalHeight}`,width:`min(100%, calc(clamp(160px, 28dvh, 300px) * ${page.originalWidth/page.originalHeight}))`}}>
    <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="document-crop-overlay" aria-hidden="true">
     <image href={page.originalUrl} width="1" height="1" preserveAspectRatio="none"/>
     <path d={`M0 0H1V1H0Z M${corners.map(p=>`${p.x} ${p.y}`).join('L')}Z`} fill="#0f172a" fillOpacity=".48" fillRule="evenodd"/>
     <polygon points={corners.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={valid?'#3b82f6':'#ef4444'} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    </svg>
    {corners.map((point,index)=><button type="button" key={index} className="document-crop-corner" style={{left:`${point.x*100}%`,top:`${point.y*100}%`}} disabled={busy} aria-label={`มุม${names[index]}`} aria-describedby="crop-instructions" title={`มุม${names[index]}`} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId)}} onPointerMove={event=>pointer(event,index)} onKeyDown={event=>keyboard(event,index)}><span>{index+1}</span></button>)}
   </div>
   <p role={!valid||error?'alert':'status'} className={`document-crop-message ${!valid||error?'document-crop-error':''}`}>
    {!valid?'กรอบต้องไม่ไขว้กัน และต้องมีพื้นที่กระดาษเพียงพอ กรุณาจัดมุมตามลำดับ 1–4':error||<>{busy&&<LoaderCircle size={16} className="spin"/>}{message}</>}
   </p>
   <div className="document-crop-tools"><button type="button" className="document-back" disabled={busy} onClick={()=>void detect()}><ScanLine size={17}/>จับขอบอัตโนมัติ</button><button type="button" className="document-back" disabled={busy} onClick={()=>{setCorners(fullFrame());setMessage('คืนกรอบเต็มภาพแล้ว กดใช้กรอบนี้เพื่อยืนยัน');setError('')}}><Undo2 size={17}/>กรอบเต็มภาพ</button></div>
  </div>
  <div className="dialog-footer"><button type="button" className="button secondary" onClick={close}>ยกเลิก</button><button type="button" className="button" disabled={!valid||busy} onClick={()=>void apply()}>{busy?<LoaderCircle size={18} className="spin"/>:<Check size={18}/>}ใช้กรอบนี้</button></div>
 </Dialog>;
}
