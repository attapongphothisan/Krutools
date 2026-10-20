'use client';
import {useState,type FormEvent} from 'react';
import {ArrowLeft,Download,LoaderCircle,QrCode} from 'lucide-react';
import QRCode from 'qrcode';
import './qr-code-tool.css';

export function QRCodeTool({onBack}:{onBack:()=>void}){
 const[value,setValue]=useState(''),[image,setImage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function create(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const content=value.trim();
  if(!content){setError('กรอกข้อความหรือลิงก์ก่อนสร้าง QR Code');setImage('');return}
  setBusy(true);setError('');
  try{const result=await QRCode.toDataURL(content,{width:640,margin:3,errorCorrectionLevel:'M'});setImage(result)}
  catch{setError('สร้าง QR Code ไม่สำเร็จ กรุณาตรวจข้อความหรือลิงก์แล้วลองอีกครั้ง');setImage('')}
  finally{setBusy(false)}
 }
 function download(){if(!image)return;const link=document.createElement('a');link.href=image;link.download='qr-code.png';document.body.appendChild(link);link.click();link.remove()}
 return <main className="qr-tool">
  <header className="qr-tool-header"><button type="button" className="document-back" onClick={onBack}><ArrowLeft size={18}/>หน้าเลือกเครื่องมือ</button><span><QrCode size={17}/>เครื่องมือครู</span></header>
  <section className="qr-tool-content">
   <div className="qr-tool-heading"><span className="eyebrow">เครื่องมือของคุณ</span><h1>สร้าง QR Code</h1><p>กรอกข้อความหรือลิงก์ แล้วกดสร้างเพื่อดูตัวอย่าง</p></div>
   <div className="qr-tool-panel">
    <form className="qr-tool-form" onSubmit={event=>void create(event)}>
     <label htmlFor="qr-content">ข้อความหรือลิงก์</label>
     <textarea id="qr-content" value={value} onChange={event=>setValue(event.target.value)} placeholder="เช่น https://example.com" rows={5} autoComplete="off" />
     {error&&<p className="qr-tool-error" role="alert">{error}</p>}
     <button type="submit" className="button qr-create-button" disabled={busy}>{busy?<><LoaderCircle size={17} className="spin"/>กำลังสร้าง…</>:<><QrCode size={17}/>สร้าง QR Code</>}</button>
    </form>
    {image&&<section className="qr-preview" aria-live="polite">
     <h2>ตัวอย่าง QR Code</h2>
     <div className="qr-preview-image"><img src={image} alt="QR Code สำหรับข้อความหรือลิงก์ที่กรอก"/></div>
     <button type="button" className="button" onClick={download}><Download size={17}/>ดาวน์โหลด PNG</button>
    </section>}
   </div>
  </section>
 </main>
}
