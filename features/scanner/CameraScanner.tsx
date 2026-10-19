'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,ScanLine,LoaderCircle} from 'lucide-react';
import {Dialog} from '../ui';
import type {ScanResult} from './read';
import scanWorkerUrl from './scan.worker?worker&url';

const messages={qr:'อ่าน QR ไม่ได้ กรุณาถ่ายใหม่ให้ภาพชัดและเห็นกระดาษทั้งใบ',markers:'ไม่พบจุดดำครบ 4 มุม กรุณาถ่ายใหม่ให้เห็นกระดาษทั้งใบ',blur:'ภาพกระดาษเล็กเกินไป กรุณาถ่ายให้ใกล้ขึ้นและคมชัด', 'wrong-exam':'กระดาษนี้ไม่ตรงกับชุดสอบที่เลือก กรุณาเลือกชุดสอบให้ตรงกัน','multi-sheet':'พบกระดาษหลายใบ กรุณาถ่ายครั้งละ 1 ใบ'};

export function CameraScanner({expected,onRead,onClose}:{expected:{examId:string;questionCount:number};onRead:(r:ScanResult)=>void;onClose:()=>void}){
 const input=useRef<HTMLInputElement>(null),image=useRef<HTMLImageElement>(null),worker=useRef<Worker|null>(null),objectUrl=useRef(''),timer=useRef<ReturnType<typeof setTimeout>|null>(null),active=useRef(false);
 const [photo,setPhoto]=useState(''),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function stop(){worker.current?.terminate();worker.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;active.current=false;}
 useEffect(()=>()=>{stop();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current)},[]);
 function choose(file?:File){
  if(!file)return;
  stop();setBusy(false);setError('');setLoaded(false);
  if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);
  objectUrl.current=URL.createObjectURL(file);setPhoto(objectUrl.current);
 }
 function read(force=false){
  const img=image.current;if(!img||(!loaded&&!force)||active.current)return;
  setError('');setBusy(true);active.current=true;
  try{
   const canvas=document.createElement('canvas'),scale=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));
   canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
   const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('เปิดภาพไม่ได้ กรุณาถ่ายใหม่');
   ctx.drawImage(img,0,0,canvas.width,canvas.height);const frame=ctx.getImageData(0,0,canvas.width,canvas.height);canvas.width=0;canvas.height=0;
   const w=new Worker(new URL(scanWorkerUrl,window.location.href),{type:'module'});worker.current=w;
   w.onmessage=(event:MessageEvent<ScanResult>)=>{const result=event.data;stop();setBusy(false);if(result.status==='ready')onRead(result);else setError(messages[result.reason]);};
   w.onerror=()=>{stop();setBusy(false);setError('อ่านภาพไม่สำเร็จ กรุณากดอ่านคำตอบอีกครั้ง')};
   w.onmessageerror=()=>{stop();setBusy(false);setError('ส่งภาพไปอ่านไม่สำเร็จ กรุณาลองอีกครั้ง')};
   timer.current=setTimeout(()=>{stop();setBusy(false);setError('อ่านภาพนานเกินไป กรุณาถ่ายใหม่ให้กระดาษชัดขึ้น')},30000);
   w.postMessage({frame,expected},[frame.data.buffer]);
  }catch(e){stop();setBusy(false);setError((e as Error).message)}
 }
 return <Dialog title="ถ่ายภาพกระดาษคำตอบ" subtitle="ถ่ายภาพ → อ่านคำตอบ → ตรวจทานและยืนยันคะแนน" onClose={onClose}>
  <input ref={input} type="file" accept="image/*" capture="environment" hidden aria-label="ถ่ายหรือเลือกภาพกระดาษคำตอบ" onChange={e=>{choose(e.target.files?.[0]);e.target.value=''}}/>
  <div className="camera-view">{photo?<img ref={image} src={photo} alt="ภาพกระดาษคำตอบที่เลือก" style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}} onLoad={()=>{setLoaded(true);requestAnimationFrame(()=>read(true))}} onError={()=>{setLoaded(false);setError('เปิดภาพนี้ไม่ได้ กรุณาถ่ายใหม่หรือเลือกภาพ JPEG / PNG')}}/>:<div className="camera-placeholder"><Camera size={44} strokeWidth={1.2}/><p>ถ่ายกระดาษครั้งละ 1 ใบ<br/>ให้เห็น QR และจุดดำทั้ง 4 มุม</p></div>}</div>
  <p className="scanner-status" aria-live="polite">{busy?<LoaderCircle className="spin" size={17}/>:<ScanLine size={17}/>} {busy?'กำลังอ่านคำตอบจากภาพ…':photo?'ระบบจะอ่านคำตอบให้อัตโนมัติ ตรวจว่าภาพเห็นกระดาษครบ':'กดถ่ายภาพเพื่อเปิดกล้องของโทรศัพท์ หรือเลือกไฟล์ภาพบนคอม'}</p>
  <p className="muted">ภาพใช้เพื่ออ่านบนอุปกรณ์เท่านั้น ไม่อัปโหลดหรือบันทึกในระบบ</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="dialog-footer"><button className="button secondary" disabled={busy} onClick={()=>input.current?.click()}><Camera size={18}/> {photo?'ถ่ายใหม่ / เลือกภาพใหม่':'ถ่ายภาพ / เลือกภาพ'}</button></div>
 </Dialog>
}
