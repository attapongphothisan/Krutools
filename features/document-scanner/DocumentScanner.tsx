'use client';

import {useEffect,useRef,useState,type ChangeEvent} from 'react';
import {ArrowLeft,ArrowRight,Camera,FileText,Images,ScanLine,RotateCw,Trash2,LoaderCircle,GripVertical,Crop,ArrowDownToLine} from 'lucide-react';
import {Dialog} from '../ui';
import {CropEditor} from './CropEditor';
import {imageModes} from './color';
import {PageImage} from './PageImage';
import {ExportPanel} from './ExportPanel';
import {defaultExportName,type ExportSettings} from './export-layout';
import {useDocumentSession} from './session';
import './document-scanner.css';

const steps=['เพิ่มเอกสาร','ปรับและจัดหน้า','ดาวน์โหลด'];

export function DocumentScanner({onBack}:{onBack:()=>void}) {
 const heading=useRef<HTMLHeadingElement>(null),camera=useRef<HTMLInputElement>(null),picker=useRef<HTMLInputElement>(null),dragged=useRef<string|null>(null);
 const[confirmExit,setConfirmExit]=useState(false),[cropId,setCropId]=useState<string|null>(null);
 const[exportOpen,setExportOpen]=useState(false),[exportSettings,setExportSettings]=useState<ExportSettings>(()=>({name:defaultExportName(),format:'combined'}));
 const session=useDocumentSession();
 const {pages,selectedId,setSelectedId,busy,progress,errors,addFiles,remove,rotate,move,applyCrop,setMode,canCancel,cancelProcessing}=session;
 const cropPage=pages.find(page=>page.id===cropId);
 const selectedIndex=pages.findIndex(page=>page.id===selectedId),selected=pages[selectedIndex];
 useEffect(()=>{
  const previousTitle=document.title;document.title='เครื่องมือครู | สแกนเอกสารเป็น PDF';
  heading.current?.focus();window.scrollTo({top:0});
  return()=>{document.title=previousTitle};
 },[]);
 function importImages(event:ChangeEvent<HTMLInputElement>){const files=Array.from(event.currentTarget.files??[]);event.currentTarget.value='';void addFiles(files)}
 function back(){if(pages.length||busy)setConfirmExit(true);else onBack()}
 const importActions=<div className="document-import-actions">
  <button type="button" className="button" disabled={busy} onClick={()=>camera.current?.click()}><Camera size={19}/>{pages.length?'ถ่ายเพิ่ม':'ถ่ายเอกสาร'}</button>
  <button type="button" className="button secondary" disabled={busy} onClick={()=>picker.current?.click()}><Images size={19}/>{pages.length?'เพิ่มรูปจากเครื่อง':'เลือกรูปจากเครื่อง'}</button>
 </div>;

 return <main className="document-scanner">
  <header className="document-scanner-header">
   <button type="button" className="document-back" onClick={back}><ArrowLeft size={18}/>หน้าเลือกเครื่องมือ</button>
   <span className="document-scanner-label"><ScanLine size={17}/>เครื่องมือครู</span>
  </header>
  <div className="document-scanner-content">
   <div className="document-scanner-heading">
    <span className="eyebrow">จัดการเอกสารของคุณ</span>
    <h1 ref={heading} tabIndex={-1}>สแกนเอกสารเป็น PDF</h1>
    <p>ถ่ายหรือเลือกรูปเอกสาร แล้วจัดหน้าตามลำดับที่ต้องการ</p>
   </div>
   <ol className="document-steps" aria-label="ขั้นตอนสแกนเอกสาร">
    {steps.map((label,index)=><li key={label} aria-current={index===(exportOpen?2:pages.length?1:0)?'step':undefined}><span aria-hidden="true">{index+1}</span>{label}</li>)}
   </ol>
   {exportOpen?<ExportPanel pages={pages} settings={exportSettings} onSettings={setExportSettings} initialPage={selectedIndex} onBack={()=>{setExportOpen(false);window.scrollTo({top:0})}}/>:<>
   <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={importImages} aria-label="ถ่ายภาพเอกสาร"/>
   <input ref={picker} type="file" accept="image/*" multiple hidden onChange={importImages} aria-label="เลือกภาพเอกสารหลายไฟล์"/>
   <div role="status" aria-live="polite" className="document-status">{busy?<><LoaderCircle size={17} className="spin"/>{progress}</>:pages.length?`มีเอกสาร ${pages.length} หน้า`:''}{canCancel&&<button type="button" className="document-back" onClick={cancelProcessing}>ยกเลิกการปรับภาพ</button>}</div>
   {errors.length>0&&<div className="document-errors" role="alert">{errors.map((error,index)=><p key={index}>{error}</p>)}</div>}
   {!pages.length?<section className="document-import-panel" aria-labelledby="document-import-title" aria-busy={busy}>
    <div className="document-empty-art" aria-hidden="true"><FileText size={44} strokeWidth={1.4}/></div>
    <h2 id="document-import-title">เริ่มจากเอกสารหน้าแรก</h2>
    <p>ใช้ภาพจากกล้องหรือเลือกรูปหลายภาพพร้อมกัน</p>
    {importActions}
   </section>:<section className="document-workspace" aria-label="จัดหน้าเอกสาร" aria-busy={busy}>
    <div className="document-page-toolbar"><h2>เอกสารของคุณ <span>{pages.length} หน้า</span></h2>{importActions}</div>
    {selected&&<>
     <div className="document-preview"><PageImage page={selected} label={`ตัวอย่างหน้า ${selectedIndex+1}: ${selected.name}`}/></div>
     <div className="document-selected-heading"><strong>หน้า {selectedIndex+1} จาก {pages.length}</strong><span title={selected.name}>{selected.name}</span></div>
     <fieldset className="document-color-panel" disabled={busy}>
      <legend>โหมดภาพ</legend>
      <div className="document-mode-options">{imageModes.map(mode=><label key={mode.value} className={`document-mode-option ${selected.mode===mode.value?'selected':''}`}><input type="radio" name="document-image-mode" value={mode.value} checked={selected.mode===mode.value} onChange={()=>void setMode(mode.value)}/><span>{mode.label}</span></label>)}</div>
      <div className="document-mode-footer"><p>{selected.mode==='sharp'?'เหมาะกับเอกสารข้อความ ตรวจว่าตัวอักษรจางยังอ่านได้ครบก่อนบันทึก':'เลือกโหมดสำหรับหน้านี้ ภาพต้นฉบับยังคงอยู่'}</p><button type="button" className="document-back" disabled={busy||pages.every(page=>page.mode===selected.mode)} onClick={()=>void setMode(selected.mode,true)}>ใช้โหมดนี้กับทุกหน้า</button></div>
     </fieldset>
     <div className="document-edit-actions" aria-label="เครื่องมือสำหรับหน้าที่เลือก">
      <button type="button" className="document-back" disabled={busy} onClick={()=>setCropId(selected.id)}><Crop size={17}/>{selected.corners?'แก้ไขขอบ':'ปรับขอบ'}</button>
      <button type="button" className="document-back" disabled={busy} onClick={()=>rotate(selected.id)}><RotateCw size={17}/>หมุน 90°</button>
      <button type="button" className="document-back" disabled={busy||selectedIndex===0} onClick={()=>move(selected.id,-1)}><ArrowLeft size={17}/>เลื่อนก่อนหน้า</button>
      <button type="button" className="document-back" disabled={busy||selectedIndex===pages.length-1} onClick={()=>move(selected.id,1)}>เลื่อนถัดไป<ArrowRight size={17}/></button>
      <button type="button" className="document-back document-delete" disabled={busy} onClick={()=>remove(selected.id)}><Trash2 size={17}/>ลบหน้านี้</button>
     </div>
    </>}
    <p className="document-list-hint">เลือกภาพย่อเพื่อดูแต่ละหน้า ใช้ปุ่มเลื่อนหรือลากภาพย่อเพื่อจัดลำดับ</p>
    <ol className="document-page-list" aria-label="ลำดับหน้าเอกสาร">
     {pages.map((page,index)=><li key={page.id} draggable={!busy} onDragStart={event=>{dragged.current=page.id;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',page.id)}} onDragEnd={()=>{dragged.current=null}} onDragOver={event=>{if(dragged.current&&!busy)event.preventDefault()}} onDrop={event=>{event.preventDefault();const id=dragged.current;dragged.current=null;if(id&&!busy)move(id,index-pages.findIndex(item=>item.id===id))}}>
      <button type="button" className={`document-thumbnail ${selectedId===page.id?'selected':''}`} aria-pressed={selectedId===page.id} aria-label={`เลือกหน้า ${index+1}: ${page.name}`} onClick={()=>setSelectedId(page.id)}>
       <PageImage page={page} label={`ภาพย่อหน้า ${index+1}`}/><span><GripVertical size={13} aria-hidden="true"/>หน้า {index+1}</span><small>{imageModes.find(mode=>mode.value===page.mode)?.label}</small>
      </button>
     </li>)}
    </ol>
    <div className="document-export-entry"><button type="button" className="button" disabled={busy} onClick={()=>{setExportOpen(true);window.scrollTo({top:0})}}><ArrowDownToLine size={18}/>ดูตัวอย่าง PDF</button></div>
   </section>}
   <p className="document-session-note">ภาพเอกสารอยู่เฉพาะในอุปกรณ์นี้ระหว่างใช้งาน<br/>เมื่อออกจากเครื่องมือหรือรีเฟรช งานสแกนจะถูกล้าง</p>
   </>}
  </div>
  {cropPage&&<CropEditor key={cropPage.id} page={cropPage} onClose={()=>setCropId(null)} onApply={(corners,result)=>{applyCrop(cropPage.id,corners,result);setCropId(null)}}/>}
  {confirmExit&&<Dialog title="ออกและล้างงานสแกนนี้?" subtitle="ภาพและการจัดหน้าจะถูกล้าง เมื่อกลับมาจะเริ่มงานใหม่" onClose={()=>setConfirmExit(false)}><div className="dialog-footer"><button type="button" className="button secondary" onClick={()=>setConfirmExit(false)}>ทำต่อ</button><button type="button" className="button" onClick={onBack}>ออกและล้างงาน</button></div></Dialog>}
 </main>;
}
