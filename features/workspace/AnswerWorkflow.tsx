'use client';
import type {ReactNode} from 'react';
import {ArrowLeft,ArrowRight,Check,ScanLine} from 'lucide-react';
import './answer-workflow.css';
export const answerSteps=[
 {id:'exams',label:'เตรียมกระดาษ',description:'สร้างชุดสอบ ตั้งเฉลย แล้วบันทึกกระดาษคำตอบเป็น PDF'},
 {id:'classrooms',label:'เพิ่มนักเรียน',description:'เลือกห้องเรียน แล้วเพิ่มรายชื่อทีละคนหรือนำเข้าจากไฟล์'},
 {id:'grading',label:'ตรวจคำตอบ',description:'เลือกนักเรียน ถ่ายภาพ แล้วตรวจทานก่อนยืนยันคะแนน'},
 {id:'results',label:'สรุปคะแนน',description:'ตรวจคะแนนรวมและส่งออก Excel เพื่อนำไปใช้งานต่อ'},
] as const;
export type AnswerStep=typeof answerSteps[number]['id'];
export function AnswerWorkflow({step,onStep,onBack,children,previous,onPrevious,nextLabel,onNext,nextDisabled=false,hint,locked=false,examName,roomName,completed}:{step:AnswerStep;onStep:(step:AnswerStep)=>void;onBack:()=>void;children:ReactNode;previous:string;onPrevious:()=>void;nextLabel:string;onNext:()=>void;nextDisabled?:boolean;hint?:string;locked?:boolean;examName?:string;roomName?:string;completed:Record<AnswerStep,boolean>}){
 const index=answerSteps.findIndex(item=>item.id===step),active=answerSteps[index];
 return <main className="answer-flow">
  <header className="answer-flow-header"><button type="button" className="answer-back" onClick={onBack} disabled={locked}><ArrowLeft size={18}/>หน้าเลือกเครื่องมือ</button><span><ScanLine size={17}/>เครื่องมือครู</span></header>
  <div className="answer-flow-content">
   <div className="answer-flow-heading"><span className="eyebrow">จัดการข้อสอบของคุณ</span><h1>กระดาษคำตอบ</h1><p>เตรียมกระดาษ เพิ่มรายชื่อ ตรวจคำตอบ และสรุปคะแนน</p></div>
   <ol className="answer-steps" aria-label="ขั้นตอนกระดาษคำตอบ">{answerSteps.map((item,i)=><li key={item.id}><button type="button" disabled={locked} aria-current={step===item.id?'step':undefined} onClick={()=>onStep(item.id)}><span aria-hidden="true">{completed[item.id]&&i<index?<Check size={16}/>:i+1}</span>{item.label}</button></li>)}</ol>
   <div className="answer-step-help"><strong>ขั้นที่ {index+1} จาก 4 · {active.label}</strong><p>{active.description}</p></div>
   {(examName||roomName)&&<div className="answer-context" aria-label="งานที่เลือก">{examName&&<span>ชุดสอบ: <strong>{examName}</strong></span>}{roomName&&<span>ห้อง: <strong>{roomName}</strong></span>}</div>}
   <section className="answer-step-content" aria-label={`ขั้นที่ ${index+1} ${active.label}`}>{children}</section>
   <footer className="answer-flow-actions">{hint&&<p id="answer-next-hint" role="status">{hint}</p>}<div><button type="button" className="answer-back" onClick={onPrevious} disabled={locked}><ArrowLeft size={17}/>{previous}</button><button type="button" className="button" onClick={onNext} disabled={locked||nextDisabled} aria-describedby={hint?'answer-next-hint':undefined}>{nextLabel}<ArrowRight size={17}/></button></div></footer>
   <p className="answer-storage-note">ข้อมูลห้องเรียน ชุดสอบ และคะแนนบันทึกอยู่ในอุปกรณ์นี้</p>
  </div>
 </main>;
}
