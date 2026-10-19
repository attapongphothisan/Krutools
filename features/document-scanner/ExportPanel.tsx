'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Download,FileText,LoaderCircle} from 'lucide-react';
import type {DocumentPage} from './session';
import {PageArtwork,pageViewBox} from './PageImage';
import {a4Layout,exportFilename,sizeLabel,type ExportSettings} from './export-layout';

export function ExportPanel({pages,settings,onSettings,onBack,initialPage=0}:{pages:DocumentPage[];settings:ExportSettings;onSettings:(settings:ExportSettings)=>void;onBack:()=>void;initialPage?:number}){
 const[index,setIndex]=useState(Math.max(0,Math.min(initialPage,pages.length-1))),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState<{url:string;filename:string;size:number}|null>(null);
 const lifecycle=useRef({active:false,url:null as string|null,controller:null as AbortController|null,running:false});
 useEffect(()=>{const state=lifecycle.current;state.active=true;return()=>{state.active=false;state.controller?.abort();if(state.url)URL.revokeObjectURL(state.url)}},[]);
 const page=pages[index],layout=a4Layout(page.width,page.height,page.rotation),filename=exportFilename(settings.name,settings.format,pages.length);
 function clearReady(){if(lifecycle.current.url){URL.revokeObjectURL(lifecycle.current.url);lifecycle.current.url=null}setReady(null)}
 function change(next:ExportSettings){clearReady();setError('');setStatus('');onSettings(next)}
 async function generate(){
  const state=lifecycle.current;if(state.running||!settings.name.trim())return;
  state.running=true;const controller=new AbortController();state.controller=controller;
  clearReady();setBusy(true);setError('');setStatus('กำลังเตรียมเอกสาร…');
  try{
   const {buildDocumentExport}=await import('./pdf');controller.signal.throwIfAborted();
   const result=await buildDocumentExport(pages,settings.name,settings.format,controller.signal,message=>{if(state.active&&!controller.signal.aborted)setStatus(message)});
   if(!state.active||controller.signal.aborted)return;
   const url=URL.createObjectURL(result.blob);state.url=url;setReady({url,filename:result.filename,size:result.blob.size});setStatus('ไฟล์พร้อมดาวน์โหลด');
  }catch(cause){if(state.active){if(controller.signal.aborted)setStatus('ยกเลิกการสร้างไฟล์แล้ว เอกสารยังอยู่');else{setError(cause instanceof Error?cause.message:'สร้างไฟล์ไม่สำเร็จ กรุณาลองใหม่');setStatus('')}}}
  finally{state.running=false;if(state.active){state.controller=null;setBusy(false)}}
 }
 return <section className="document-export" aria-label="ตัวอย่างและดาวน์โหลด PDF">
  <div className="document-export-heading"><h2>ตรวจเอกสารก่อนดาวน์โหลด</h2><button type="button" className="document-back" onClick={onBack}><ArrowLeft size={17}/>กลับไปปรับหน้า</button></div>
  <div className="document-export-grid">
   <div className="document-a4-panel">
    <div className="document-a4-stage"><svg className="document-a4-image" viewBox={`0 0 ${layout.pageWidth} ${layout.pageHeight}`} role="img" aria-label={`ตัวอย่าง PDF หน้า ${index+1} กระดาษ A4 ${layout.landscape?'แนวนอน':'แนวตั้ง'}`}>
     <rect width={layout.pageWidth} height={layout.pageHeight} fill="white"/>
     <svg x={layout.x} y={layout.y} width={layout.imageWidth} height={layout.imageHeight} viewBox={pageViewBox(page)}><PageArtwork page={page}/></svg>
    </svg></div>
    <div className="document-export-page-nav"><button type="button" className="document-back" aria-label="ดูหน้าก่อนหน้า" disabled={index===0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={17}/></button><span>หน้า {index+1} จาก {pages.length}</span><button type="button" className="document-back" aria-label="ดูหน้าถัดไป" disabled={index===pages.length-1} onClick={()=>setIndex(i=>i+1)}><ArrowRight size={17}/></button></div>
    <p className="document-export-note">A4 {layout.landscape?'แนวนอน':'แนวตั้ง'} · ขอบขาว 5 มม. · แสดงภาพครบทั้งหน้า</p>
   </div>
   <div className="document-export-settings">
    <fieldset disabled={busy} className="document-export-fields">
     <label htmlFor="document-export-name">ชื่อไฟล์<input id="document-export-name" value={settings.name} maxLength={120} onChange={event=>change({...settings,name:event.target.value})} autoComplete="off"/></label>
     <fieldset className="document-export-format"><legend>รูปแบบไฟล์</legend><label><input type="radio" name="document-export-format" checked={settings.format==='combined'} onChange={()=>change({...settings,format:'combined'})}/><span>รวมทุกหน้าเป็น PDF เดียว</span></label><label><input type="radio" name="document-export-format" checked={settings.format==='separate'} onChange={()=>change({...settings,format:'separate'})}/><span>แยก PDF หน้าละไฟล์</span></label></fieldset>
     {settings.format==='separate'&&<p className="document-export-note">{pages.length>1?'ดาวน์โหลดเป็น ZIP ไฟล์เดียว ภายในมี PDF เรียงตามเลขหน้า':'มีเอกสารหน้าเดียว จึงดาวน์โหลดเป็น PDF โดยตรง'}</p>}
    </fieldset>
    <div className="document-export-file"><FileText size={20}/><div><strong>{filename}</strong><small>{pages.length} หน้า · A4{ready?` · ${sizeLabel(ready.size)}`:''}</small></div></div>
    <p className="document-export-status" role="status">{busy&&<LoaderCircle size={17} className="spin"/>}{status}</p>
    {error&&<p role="alert" className="document-errors">{error}</p>}
    {busy?<button type="button" className="button secondary" onClick={()=>lifecycle.current.controller?.abort()}>ยกเลิกการสร้างไฟล์</button>:<button type="button" className="button" disabled={!settings.name.trim()} onClick={()=>void generate()}><FileText size={18}/>{ready?'สร้างไฟล์อีกครั้ง':'สร้างไฟล์พร้อมดาวน์โหลด'}</button>}
    {ready&&<a className="button document-download" href={ready.url} download={ready.filename}><Download size={18}/>ดาวน์โหลด {ready.filename.endsWith('.zip')?'ZIP':'PDF'}</a>}
    <p className="document-export-note">เมื่อไฟล์พร้อม ให้กดดาวน์โหลดเพื่อบันทึกลงอุปกรณ์ หากเปิดตัวอย่างไฟล์ ให้ใช้เมนูแชร์เพื่อบันทึก</p>
   </div>
  </div>
 </section>;
}
