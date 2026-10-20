'use client';

import {useEffect,useRef,useState,type ChangeEvent,type DragEvent} from 'react';
import {ArrowDown,ArrowLeft,ArrowUp,Check,FilePlus2,FileText,GripVertical,Image as ImageIcon,LoaderCircle,Merge,Trash2,UploadCloud} from 'lucide-react';
import {PDFDocument} from 'pdf-lib';
import './pdf-merge-tool.css';

type PdfFile={id:string;file:File};
const formatSize=(size:number)=>size<1024*1024?`${Math.max(1,Math.round(size/1024))} KB`:`${(size/1024/1024).toFixed(1)} MB`;
const isPdf=(file:File)=>file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf');
const isImage=(file:File)=>file.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.test(file.name);

async function embedImage(pdf:PDFDocument,file:File){
 const name=file.name.toLowerCase(),type=file.type.toLowerCase();
 if(type==='image/png'||name.endsWith('.png'))return pdf.embedPng(await file.arrayBuffer());
 if(type==='image/jpeg'||name.endsWith('.jpg')||name.endsWith('.jpeg'))return pdf.embedJpg(await file.arrayBuffer());
 let bitmap:ImageBitmap|undefined,canvas:HTMLCanvasElement|undefined;
 try{
  bitmap=await createImageBitmap(file);canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d');if(!context)throw new Error('เปิดภาพไม่ได้');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0);
  const converted=await new Promise<Blob>((resolve,reject)=>canvas!.toBlob(blob=>blob?resolve(blob):reject(new Error('แปลงภาพไม่ได้')),'image/jpeg',.94));
  return await pdf.embedJpg(await converted.arrayBuffer());
 }catch{throw new Error(`เปิดรูป “${file.name}” ไม่ได้ กรุณาแปลงเป็น JPG หรือ PNG แล้วลองใหม่`)}
 finally{bitmap?.close();if(canvas){canvas.width=0;canvas.height=0}}
}

export function PdfMergeTool({onBack}:{onBack:()=>void}){
 const heading=useRef<HTMLHeadingElement>(null),picker=useRef<HTMLInputElement>(null),dragged=useRef<string|null>(null);
 const[files,setFiles]=useState<PdfFile[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 useEffect(()=>{const previous=document.title;document.title='เครื่องมือครู | รวม PDF';heading.current?.focus();window.scrollTo({top:0});return()=>{document.title=previous}},[]);
 function addFiles(incoming:File[]){
  const valid=incoming.filter(file=>isPdf(file)||isImage(file));
  if(valid.length!==incoming.length)setError('เพิ่มได้เฉพาะไฟล์ PDF หรือรูปภาพ');else setError('');
  if(valid.length)setFiles(current=>[...current,...valid.map(file=>({id:crypto.randomUUID(),file}))]);
 }
 function pick(event:ChangeEvent<HTMLInputElement>){addFiles(Array.from(event.currentTarget.files??[]));event.currentTarget.value=''}
 function drop(event:DragEvent<HTMLDivElement>){event.preventDefault();event.currentTarget.classList.remove('pdf-merge-drop-active');if(!busy)addFiles(Array.from(event.dataTransfer.files))}
 function move(index:number,direction:-1|1){setFiles(current=>{const target=index+direction;if(target<0||target>=current.length)return current;const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next})}
 async function merge(){
  if(files.length<2){setError('เลือกไฟล์อย่างน้อย 2 ไฟล์ก่อนรวม');return}
  setBusy(true);setError('');setStatus('กำลังอ่านไฟล์ PDF…');
  try{
   const merged=await PDFDocument.create();
   for(let i=0;i<files.length;i++){
    setStatus(`กำลังรวมไฟล์ ${i+1} จาก ${files.length}…`);
    if(isPdf(files[i].file)){
     const source=await PDFDocument.load(await files[i].file.arrayBuffer());
     const pages=await merged.copyPages(source,source.getPageIndices());
     pages.forEach(page=>merged.addPage(page));
    }else{
     const image=await embedImage(merged,files[i].file),landscape=image.width>image.height,pageWidth=landscape?841.89:595.28,pageHeight=landscape?595.28:841.89,margin=28,scale=Math.min((pageWidth-margin*2)/image.width,(pageHeight-margin*2)/image.height),width=image.width*scale,height=image.height*scale,page=merged.addPage([pageWidth,pageHeight]);
     page.drawImage(image,{x:(pageWidth-width)/2,y:(pageHeight-height)/2,width,height});
    }
   }
   if(!merged.getPageCount())throw new Error('ไม่พบหน้าเอกสารในไฟล์ที่เลือก');
   setStatus('กำลังเตรียมไฟล์ดาวน์โหลด…');
   const bytes=await merged.save(),data=new Uint8Array(bytes),blob=new Blob([data.buffer as ArrayBuffer],{type:'application/pdf'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download='รวมเอกสาร.pdf';document.body.appendChild(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus(`รวม ${files.length} ไฟล์สำเร็จ · ${merged.getPageCount()} หน้า`);
  }catch(cause){setError(cause instanceof Error?cause.message.includes('encrypted')?'ไฟล์ PDF บางไฟล์มีรหัสผ่าน กรุณาปลดล็อกก่อนรวม':`รวม PDF ไม่สำเร็จ: ${cause.message}`:'รวม PDF ไม่สำเร็จ กรุณาตรวจไฟล์แล้วลองอีกครั้ง');setStatus('')}
  finally{setBusy(false)}
 }
 return <main className="pdf-merge">
  <header className="pdf-merge-header"><button type="button" className="document-back" onClick={onBack}><ArrowLeft size={18}/>หน้าเลือกเครื่องมือ</button><span><Merge size={17}/>เครื่องมือครู</span></header>
  <div className="pdf-merge-content">
   <div className="pdf-merge-heading"><span className="eyebrow">จัดการเอกสารของคุณ</span><h1 ref={heading} tabIndex={-1}>รวม PDF</h1><p>เพิ่มไฟล์ PDF หรือรูปภาพ จัดลำดับ แล้วรวมเป็น PDF ไฟล์เดียว</p></div>
   <ol className="pdf-merge-steps" aria-label="ขั้นตอนรวม PDF"><li aria-current={!files.length?'step':undefined}><span>1</span>เพิ่มไฟล์</li><li aria-current={files.length?'step':undefined}><span>2</span>จัดลำดับ</li><li aria-current={status.startsWith('รวม ')&&!busy?'step':undefined}><span>3</span>รวมและดาวน์โหลด</li></ol>
   <input ref={picker} type="file" accept="application/pdf,.pdf,image/*" multiple hidden onChange={pick} aria-label="เลือกไฟล์ PDF หรือรูปภาพ"/>
   <div className="pdf-merge-drop" onDragOver={event=>{event.preventDefault();event.currentTarget.classList.add('pdf-merge-drop-active')}} onDragLeave={event=>event.currentTarget.classList.remove('pdf-merge-drop-active')} onDrop={drop} aria-label="ลากไฟล์ PDF หรือรูปภาพมาวางเพื่อเพิ่มไฟล์">
    <UploadCloud size={34}/><strong>ลาก PDF หรือรูปภาพมาวางที่นี่</strong><span>รองรับ PDF, JPG, PNG และรูปแบบภาพที่เบราว์เซอร์เปิดได้</span><button type="button" className="button secondary" disabled={busy} onClick={()=>picker.current?.click()}><FilePlus2 size={17}/>{files.length?'เพิ่มไฟล์':'เลือกไฟล์'}</button>
   </div>
   {error&&<p className="pdf-merge-error" role="alert">{error}</p>}
   {files.length>0&&<section className="pdf-merge-list" aria-label="ลำดับไฟล์ที่จะรวม">
    <div className="pdf-merge-list-heading"><h2>ไฟล์ที่จะรวม <span>{files.length} ไฟล์</span></h2><button type="button" className="document-back" disabled={busy} onClick={()=>{setFiles([]);setError('');setStatus('')}}><Trash2 size={16}/>ล้างรายการ</button></div>
    <ol>{files.map((item,index)=><li key={item.id} draggable={!busy} onDragStart={event=>{dragged.current=item.id;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',item.id)}} onDragEnd={()=>{dragged.current=null}} onDragOver={event=>{if(dragged.current&&!busy)event.preventDefault()}} onDrop={event=>{event.preventDefault();const id=dragged.current;dragged.current=null;if(!id||busy)return;setFiles(current=>{const from=current.findIndex(file=>file.id===id);if(from<0||from===index)return current;const next=[...current], [moving]=next.splice(from,1);next.splice(index,0,moving);return next})}}>
     <span className="pdf-merge-order">{index+1}</span><GripVertical size={16} className="pdf-merge-grip" aria-hidden="true"/>{isImage(item.file)?<ImageIcon size={20} className="pdf-merge-file-icon"/>:<FileText size={20} className="pdf-merge-file-icon"/>}<div className="pdf-merge-file-info"><strong title={item.file.name}>{item.file.name}</strong><small>{isImage(item.file)?'รูปภาพ':'PDF'} · {formatSize(item.file.size)}</small></div><div className="pdf-merge-row-actions"><button type="button" className="document-back" aria-label={`เลื่อนไฟล์ ${item.file.name} ขึ้น`} disabled={busy||index===0} onClick={()=>move(index,-1)}><ArrowUp size={16}/></button><button type="button" className="document-back" aria-label={`เลื่อนไฟล์ ${item.file.name} ลง`} disabled={busy||index===files.length-1} onClick={()=>move(index,1)}><ArrowDown size={16}/></button><button type="button" className="document-back pdf-merge-remove" aria-label={`นำไฟล์ ${item.file.name} ออก`} disabled={busy} onClick={()=>setFiles(current=>current.filter(file=>file.id!==item.id))}><Trash2 size={16}/></button></div>
    </li>)}</ol>
    <p className="pdf-merge-hint">ลากรายการเพื่อเปลี่ยนลำดับ หรือใช้ปุ่มลูกศร ไฟล์จะถูกรวมตามลำดับจากบนลงล่าง</p>
    <div className="pdf-merge-footer"><p className="pdf-merge-status" role="status" aria-live="polite">{busy&&<LoaderCircle size={16} className="spin"/>}{!busy&&status.startsWith('รวม ')&&<Check size={16}/>}{status}</p><button type="button" className="button" disabled={busy||files.length<2} onClick={()=>void merge()}><Merge size={17}/>{busy?'กำลังรวม…':'รวมและดาวน์โหลด PDF'}</button></div>
   </section>}
   <p className="pdf-merge-note">ภาพจะถูกเพิ่มเป็นหน้า PDF ตามลำดับที่เลือก และไฟล์ทั้งหมดประมวลผลในเบราว์เซอร์บนอุปกรณ์นี้</p>
  </div>
 </main>
}
