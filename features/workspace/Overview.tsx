'use client';
import {ArrowLeft} from 'lucide-react';
import {assetPath} from './assets';
type Destination='exams'|'classrooms'|'grading'|'results';
const actions:{label:string;destination:Destination;image:string;width:number;height:number}[]=[
 {label:'สร้างกระดาษคำตอบ',destination:'exams',image:'tool-images/01_answer_sheet.png',width:526,height:477},
 {label:'นำเข้านักเรียน',destination:'classrooms',image:'tool-images/02_import_students.png',width:526,height:477},
 {label:'ตรวจข้อสอบ',destination:'grading',image:'tool-images/03_grade_exams.png',width:526,height:490},
 {label:'สรุป',destination:'results',image:'tool-images/04_summary.png',width:526,height:490},
];

export function Overview({onNavigate,onBack}:{onNavigate:(tab:Destination)=>void;onBack:()=>void}) {
 return <section className="overview">
  <header className="overview-heading"><div><span className="eyebrow">กระดาษคำตอบ</span><h1>เลือกงานที่ต้องการ</h1></div><button type="button" className="overview-back" aria-label="กลับไปหน้าเลือกเครื่องมือ" onClick={onBack}><ArrowLeft size={16}/>หน้าเลือกเครื่องมือ</button></header>
  <div className="overview-actions" aria-label="งานกระดาษคำตอบ">
   {actions.map(({label,destination,image,width,height})=><button key={destination} type="button" className="overview-action" aria-label={label} onClick={()=>onNavigate(destination)}><img className="overview-action-image" src={assetPath(image)} alt="" width={width} height={height} loading="eager"/></button>)}
  </div>
 </section>
}
