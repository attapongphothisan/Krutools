'use client';

import {useEffect,useRef,useState,type ChangeEvent,type DragEvent} from 'react';
import {ArrowLeft,Download,FilePlus2,FileText,LoaderCircle,UploadCloud} from 'lucide-react';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './pdf-to-word-tool.css';

type TextLine={y:number;items:Array<{x:number;width:number;fontSize:number;text:string}>};

const formatSize=(size:number)=>size<1024*1024?`${Math.max(1,Math.round(size/1024))} KB`:`${(size/1024/1024).toFixed(1)} MB`;
function cleanFilename(name:string){return name.replace(/\.pdf$/i,'').replace(/[\\/:*?"<>|]+/g,' ').trim()||'เอกสาร';}

function collectLines(items:unknown[]):TextLine[]{
 const runs=items.flatMap(entry=>{
  if(!entry||typeof entry!=='object'||!('str'in entry)||typeof entry.str!=='string'||!entry.str.trim()||!('transform'in entry)||!Array.isArray(entry.transform)||entry.transform.length<6||!('width'in entry)||typeof entry.width!=='number')return [];
  const transform=entry.transform;
  return [{x:transform[4],y:transform[5],width:Math.max(0,entry.width),fontSize:Math.max(1,Math.hypot(transform[2],transform[3])),text:entry.str}];
 }).sort((a,b)=>b.y-a.y||a.x-b.x);
 const lines:TextLine[]=[];
 for(const run of runs){
  let line=lines.find(candidate=>Math.abs(candidate.y-run.y)<=Math.max(2,run.fontSize*.24));
  if(!line){line={y:run.y,items:[]};lines.push(line)}
  line.items.push(run);
 }
 return lines.sort((a,b)=>b.y-a.y).map(line=>({...line,items:line.items.sort((a,b)=>a.x-b.x)}));
}

function lineText(line:TextLine){
 let text='';
 for(let index=0;index<line.items.length;index++){
  const item=line.items[index],previous=line.items[index-1];
  if(previous){
   const gap=item.x-(previous.x+previous.width);
   if(gap>Math.max(1,Math.min(previous.fontSize,item.fontSize)*.18)&&!/[\s([{\u0E40-\u0E44]$/.test(text)&&! /^[\s,.;:!?%)\]}\u0E30-\u0E3A]/.test(item.text))text+=' ';
  }
  text+=item.text;
 }
 return text.trim();
}

export function PdfToWordTool({onBack}:{onBack:()=>void}){
 const heading=useRef<HTMLHeadingElement>(null),picker=useRef<HTMLInputElement>(null),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 useEffect(()=>{const previous=document.title;document.title='เครื่องมือครู | PDF เป็น Word';heading.current?.focus();window.scrollTo({top:0});return()=>{document.title=previous}},[]);
 function selectFile(next:File|undefined){if(!next)return;setError('');setStatus('');if(next.type!=='application/pdf'&&!next.name.toLowerCase().endsWith('.pdf')){setError('เลือกได้เฉพาะไฟล์ PDF');return}if(next.size>50*1024*1024){setError('ไฟล์มีขนาดเกิน 50 MB กรุณาเลือกไฟล์ที่เล็กลง');return}setFile(next)}
 function pick(event:ChangeEvent<HTMLInputElement>){selectFile(event.currentTarget.files?.[0]);event.currentTarget.value=''}
 function drop(event:DragEvent<HTMLDivElement>){event.preventDefault();event.currentTarget.classList.remove('pdf-to-word-drop-active');if(!busy)selectFile(event.dataTransfer.files?.[0])}
 async function convert(){
  if(!file)return;
  setBusy(true);setError('');setStatus('กำลังอ่านเอกสาร…');
  let cleanup:(()=>Promise<void>)|undefined;
  let pageCount=0;
  try{
   const [pdfjsLib,docx]=await Promise.all([import('pdfjs-dist'),import('docx')]);
   pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorker;
   const loadingTask=pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true});
   cleanup=()=>loadingTask.destroy();
   const pdf=await loadingTask.promise;
   pageCount=pdf.numPages;
   const pages:TextLine[][]=[];
   for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
    setStatus(`กำลังอ่านข้อความหน้า ${pageNumber} จาก ${pdf.numPages}…`);
    const page=await pdf.getPage(pageNumber),content=await page.getTextContent(),lines=collectLines(content.items),hasWords=lines.some(line=>lineText(line).length>0);
    if(!hasWords)throw new Error(`หน้า ${pageNumber} ไม่มีข้อความที่เลือกได้ อาจเป็นเอกสารสแกนหรือภาพถ่าย ซึ่งยังไม่รองรับ`);
    pages.push(lines);
   }
   setStatus('กำลังสร้างไฟล์ Word…');
   const children:InstanceType<typeof docx.Paragraph>[]=[];
   pages.forEach((lines,pageIndex)=>lines.forEach((line,lineIndex)=>{
    const value=lineText(line);
    if(value)children.push(new docx.Paragraph({pageBreakBefore:pageIndex>0&&lineIndex===0,children:[new docx.TextRun(value)]}));
   }));
   const wordDocument=new docx.Document({title:cleanFilename(file.name),creator:'เครื่องมือครู',sections:[{properties:{page:{margin:{top:850,bottom:850,left:900,right:900}}},children}]});
   const blob=await docx.Packer.toBlob(wordDocument),url=URL.createObjectURL(blob),anchor=window.document.createElement('a');
   anchor.href=url;anchor.download=`${cleanFilename(file.name)}.docx`;document.body.appendChild(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus(`แปลงเอกสาร ${pageCount} หน้าเสร็จแล้ว`);
  }catch(cause){
   const message=cause instanceof Error?cause.message:'';
   setError(message.includes('password')||message.includes('encrypted')?'ไฟล์ PDF มีรหัสผ่าน กรุณาปลดล็อกไฟล์ก่อนแปลง':message.startsWith('หน้า ')?message:'แปลง PDF ไม่สำเร็จ กรุณาตรวจไฟล์แล้วลองอีกครั้ง');setStatus('');
  }finally{await cleanup?.();setBusy(false)}
 }
 return <main className="pdf-to-word">
  <header className="pdf-to-word-header"><button type="button" className="document-back" onClick={onBack}><ArrowLeft size={18}/>หน้าเลือกเครื่องมือ</button><span><FileText size={17}/>เครื่องมือครู</span></header>
  <div className="pdf-to-word-content">
   <div className="pdf-to-word-heading"><span className="eyebrow">จัดการเอกสารของคุณ</span><h1 ref={heading} tabIndex={-1}>แปลง PDF เป็น Word</h1><p>แปลงข้อความจากไฟล์ PDF เป็นเอกสาร Word ที่แก้ไขต่อได้</p></div>
   <ol className="pdf-to-word-steps" aria-label="ขั้นตอนแปลง PDF เป็น Word"><li aria-current={!file?'step':undefined}><span>1</span>เลือก PDF</li><li aria-current={file?'step':undefined}><span>2</span>ตรวจข้อความ</li><li aria-current={status.startsWith('แปลงเอกสาร')?'step':undefined}><span>3</span>ดาวน์โหลด Word</li></ol>
   <input ref={picker} type="file" accept="application/pdf,.pdf" hidden onChange={pick} aria-label="เลือกไฟล์ PDF"/>
   <div className="pdf-to-word-drop" onDragOver={event=>{event.preventDefault();event.currentTarget.classList.add('pdf-to-word-drop-active')}} onDragLeave={event=>event.currentTarget.classList.remove('pdf-to-word-drop-active')} onDrop={drop} aria-label="ลากไฟล์ PDF มาวางเพื่อเลือกไฟล์">
    <UploadCloud size={34}/><strong>ลากไฟล์ PDF มาวางที่นี่</strong><span>รองรับไฟล์ PDF ขนาดไม่เกิน 50 MB</span><button type="button" className="button secondary" disabled={busy} onClick={()=>picker.current?.click()}><FilePlus2 size={17}/>{file?'เปลี่ยนไฟล์':'เลือกไฟล์ PDF'}</button>
   </div>
   {error&&<p className="pdf-to-word-error" role="alert">{error}</p>}
   {file&&<section className="pdf-to-word-file" aria-label="ไฟล์ PDF ที่เลือก"><div className="pdf-to-word-file-icon"><FileText size={22}/></div><div className="pdf-to-word-file-info"><strong title={file.name}>{file.name}</strong><small>PDF · {formatSize(file.size)}</small></div><button type="button" className="document-back" disabled={busy} onClick={()=>{setFile(null);setError('');setStatus('')}}>นำออก</button></section>}
   {file&&<div className="pdf-to-word-footer"><p className="pdf-to-word-status" role="status" aria-live="polite">{busy&&<LoaderCircle size={16} className="spin"/>}{status}</p><button type="button" className="button" disabled={busy} onClick={()=>void convert()}><Download size={17}/>{busy?'กำลังแปลง…':'แปลงและดาวน์โหลด Word'}</button></div>}
   <p className="pdf-to-word-note">รองรับ PDF ที่มีข้อความเอกสารให้เลือกหรือคัดลอกได้ ไฟล์สแกนที่เป็นภาพและเอกสารที่ต้องใช้ OCR ยังไม่รองรับ การจัดหน้าอาจต่างจากต้นฉบับ และไฟล์จะประมวลผลบนอุปกรณ์นี้</p>
  </div>
 </main>
}
