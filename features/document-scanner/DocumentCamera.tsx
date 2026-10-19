'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {Camera,Check,LoaderCircle,RotateCcw,Trash2,X} from 'lucide-react';
import {Dialog} from '../ui';

type Shot={file:File;url:string};
export function DocumentCamera({onClose,onConfirm}:{onClose:()=>void;onConfirm:(files:File[])=>void}){
 const video=useRef<HTMLVideoElement>(null),streamRef=useRef<MediaStream|null>(null),shotsRef=useRef<Shot[]>([]),busy=useRef(false);
 const[shots,setShots]=useState<Shot[]>([]),[error,setError]=useState(''),[starting,setStarting]=useState(true),[facing,setFacing]=useState<'environment'|'user'>('environment');
 const release=useCallback(()=>{streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null},[]);
 useEffect(()=>{
  let cancelled=false;
  async function start(){
   setStarting(true);setError('');release();
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('เบราว์เซอร์นี้เปิดกล้องในหน้าเว็บไม่ได้ กรุณาเลือกรูปจากคลังภาพแทน');
    const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:2560},height:{ideal:1920}}});
    if(cancelled){stream.getTracks().forEach(track=>track.stop());return}
    streamRef.current=stream;if(video.current){video.current.srcObject=stream;await video.current.play().catch(()=>{})}
   }catch(reason){if(!cancelled)setError(reason instanceof Error?reason.message:'เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องแล้วลองอีกครั้ง')}
   finally{if(!cancelled)setStarting(false)}
  }
  void start();return()=>{cancelled=true;release()};
 },[facing,release]);
 useEffect(()=>()=>{shotsRef.current.forEach(shot=>URL.revokeObjectURL(shot.url));shotsRef.current=[]},[]);
 async function capture(){
  const element=video.current;if(!element||!element.videoWidth||busy.current)return;
  busy.current=true;try{
   const canvas=document.createElement('canvas');canvas.width=element.videoWidth;canvas.height=element.videoHeight;const context=canvas.getContext('2d');if(!context)throw new Error('ถ่ายภาพไม่สำเร็จ กรุณาลองอีกครั้ง');context.drawImage(element,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('บันทึกภาพไม่สำเร็จ')),'image/jpeg',.94));canvas.width=0;canvas.height=0;
   const file=new File([blob],`scan-${Date.now()}-${shotsRef.current.length+1}.jpg`,{type:'image/jpeg',lastModified:Date.now()}),shot={file,url:URL.createObjectURL(blob)};
   const next=[...shotsRef.current,shot];shotsRef.current=next;setShots(next);setError('');
  }catch(reason){setError(reason instanceof Error?reason.message:'ถ่ายภาพไม่สำเร็จ กรุณาลองอีกครั้ง')}finally{busy.current=false}
 }
 function removeShot(index:number){const next=[...shotsRef.current],removed=next.splice(index,1)[0];if(removed)URL.revokeObjectURL(removed.url);shotsRef.current=next;setShots(next)}
 function confirm(){if(!shotsRef.current.length)return;const files=shotsRef.current.map(shot=>shot.file);shotsRef.current.forEach(shot=>URL.revokeObjectURL(shot.url));shotsRef.current=[];release();onConfirm(files)}
 return <Dialog title="ถ่ายเอกสาร" subtitle="ถ่ายเก็บไว้หลายหน้า แล้วตรวจภาพก่อนใช้ทั้งหมด" wide onClose={onClose}>
  <div className="document-camera-body">
   {error&&<p role="alert" className="document-camera-error">{error}</p>}
   <div className="document-camera-stage">
    <video ref={video} className="document-camera-video" autoPlay playsInline muted aria-label="ภาพจากกล้องโทรศัพท์"/>
    {starting&&<div className="document-camera-loading"><LoaderCircle className="spin" size={22}/>กำลังเปิดกล้อง…</div>}
    {!starting&&error&&<div className="document-camera-unavailable"><Camera size={30}/><span>กล้องยังไม่พร้อมใช้งาน</span></div>}
   </div>
   <div className="document-camera-controls">
    <button type="button" className="document-back" disabled={starting||!!error} onClick={()=>setFacing(value=>value==='environment'?'user':'environment')}><RotateCcw size={17}/>สลับกล้อง</button>
    <button type="button" className="document-camera-shutter" disabled={starting||!!error} aria-label="ถ่ายภาพ" onClick={()=>void capture()}><Camera size={22}/><span>ถ่ายภาพ</span></button>
    <span className="document-camera-count">ถ่ายแล้ว {shots.length} หน้า</span>
   </div>
   {!!shots.length&&<>
    <div className="document-camera-shots" aria-label="ภาพที่ถ่ายไว้">
     {shots.map((shot,index)=><div key={shot.url}><img src={shot.url} alt={`ภาพที่ถ่าย ${index+1}`}/><button type="button" aria-label={`ลบภาพที่ ${index+1}`} onClick={()=>removeShot(index)}><Trash2 size={15}/></button><span>หน้า {index+1}</span></div>)}
    </div>
    <div className="document-camera-footer"><button type="button" className="document-back" onClick={()=>{shotsRef.current.forEach(shot=>URL.revokeObjectURL(shot.url));shotsRef.current=[];setShots([])}}><X size={16}/>ล้างชุดภาพ</button><button type="button" className="button" onClick={confirm}><Check size={17}/>ใช้ภาพทั้งหมด ({shots.length})</button></div>
   </>}
   {!shots.length&&<p className="document-camera-hint">จัดเอกสารให้อยู่ในกรอบ แล้วถ่ายทีละหน้า กดใช้ภาพทั้งหมดเมื่อถ่ายครบ</p>}
  </div>
 </Dialog>;
}
