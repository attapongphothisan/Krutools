'use client';
import {useState} from 'react';
import type {DocumentPage} from './session';
export function PageAdjustments({page,busy,onApply}:{page:DocumentPage;busy:boolean;onApply:(sharpness:number,bend:number)=>void}){
 const automatic=page.sharpness<0&&page.bend<0;
 const[sharpness,setSharpness]=useState(page.sharpness<0?.3:page.sharpness),[bend,setBend]=useState(page.bend<0?.7:page.bend);
 const[manual,setManual]=useState(!automatic);
 return <details className="document-adjustments" onToggle={event=>{if(event.currentTarget.open)setManual(true)}}>
  <summary>ปรับเองเมื่อจำเป็น</summary>
  <fieldset disabled={busy}>
   <label>ความคมชัด {Math.round(sharpness*100)}%<input aria-label="ความคมชัด" type="range" min="0" max="1" step="0.05" value={sharpness} onChange={e=>setSharpness(+e.target.value)}/></label>
   <label>ปรับแนวโค้ง {Math.round(bend*100)}%<input aria-label="ปรับแนวโค้ง" type="range" min="0" max="1" step="0.05" value={bend} onChange={e=>setBend(+e.target.value)}/></label>
   <p className="muted">ระบบปรับให้อัตโนมัติก่อน หากตัวอักษรผิดรูปให้ลดแนวโค้ง หากภาพนุ่มหรือมีขอบหยาบให้ปรับความคมชัด</p>
   <div className="button-row"><button type="button" className="button secondary small" disabled={busy||!manual} onClick={()=>onApply(-1,-1)}>กลับเป็นอัตโนมัติ</button><button type="button" className="button secondary small" disabled={busy||(sharpness===page.sharpness&&bend===page.bend)} onClick={()=>onApply(sharpness,bend)}>ใช้ค่าที่ปรับ</button></div>
  </fieldset>
 </details>
}
