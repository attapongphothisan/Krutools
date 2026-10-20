'use client';
import {assetPath} from './assets';
export function ToolPortal({onOpen,onOpenDocumentScanner,onOpenQrCode,loading,error}:{onOpen:()=>void;onOpenDocumentScanner:()=>void;onOpenQrCode:()=>void;loading:boolean;error:string}) {
 return <main className="tool-portal">
  <header className="portal-header"><div className="portal-brand"><img className="portal-brand-logo" src={assetPath('tool-images/site-logo.png')} alt="โลโก้เครื่องมือครู" width="48" height="48"/><div><strong>เครื่องมือครู</strong><small>จัดการงานสอนให้เป็นเรื่องง่าย</small></div></div><span className="portal-header-note">พื้นที่ทำงานสำหรับครู</span></header>
  <section className="portal-content">
   <div className="portal-heading"><span className="eyebrow">เครื่องมือของคุณ</span><h1>เลือกเครื่องมือ</h1></div>
   <div className="portal-tools-grid">
   <button type="button" className="portal-tool-card" onClick={onOpen} disabled={loading} aria-busy={loading} aria-label="เปิดเครื่องมือกระดาษคำตอบ">
    <img src={assetPath('tool-images/answer-sheet-tool-a.png')} alt="" width="1254" height="1254"/>
   </button>
   <button type="button" className="portal-tool-card" onClick={onOpenDocumentScanner} aria-label="เปิดเครื่องมือสแกนเอกสารเป็น PDF">
    <img src={assetPath('tool-images/document-scanner-tool-a.png')} alt="" width="1254" height="1254"/>
   </button>
   <button type="button" className="portal-tool-card" onClick={onOpenQrCode} aria-label="เปิดเครื่องมือสร้าง QR Code">
    <img src={assetPath('tool-images/qr-code-tool.svg')} alt="" width="1254" height="1254"/>
   </button>
   </div>
   {error&&<p className="error" role="alert">{error}</p>}
  </section>
  <footer className="portal-footer"><span>เครื่องมือครู</span><span>ออกแบบเพื่อเวลาของครู</span></footer>
 </main>
}
