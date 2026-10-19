'use client';
import {useState} from 'react';
import type {DocumentPage} from './session';
export function PageAdjustments({page,busy,onApply}:{page:DocumentPage;busy:boolean;onApply:(sharpness:number,bend:number)=>void}){
 const[sharpness,setSharpness]=useState(page.sharpness),[bend,setBend]=useState(page.bend);
 return <fieldset className="document-adjustments" disabled={busy}><legend>ปรับเอกสาร</legend><label>ความคมชัด {Math.round(sharpness*100)}%<input aria-label="ความคมชัด" type="range" min="0" max="1" step="0.05" value={sharpness} onChange={e=>setSharpness(+e.target.value)}/></label><label>คลี่แนวข้อความโค้ง {Math.round(bend*100)}%<input aria-label="คลี่แนวข้อความโค้ง" type="range" min="0" max="1" step="0.05" value={bend} onChange={e=>setBend(+e.target.value)}/></label><p className="muted">ช่วยแก้แนวข้อความโค้งเล็กน้อย กระดาษที่งอหรือยับมากอาจแก้ไม่ได้ทั้งหมด หากตัวอักษรผิดรูปให้ลดค่านี้</p><button type="button" className="button secondary small" disabled={busy||(sharpness===page.sharpness&&bend===page.bend)} onClick={()=>onApply(sharpness,bend)}>ใช้ค่ากับหน้านี้</button></fieldset>
}
