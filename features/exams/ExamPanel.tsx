'use client';
import {BookOpen,Download,Pencil,Plus,Trash2} from 'lucide-react';
import {displayScore,type ExamDefinition,type WorkspaceData} from '../grading/types';
import {Empty} from '../ui';
export function ExamPanel({data,selectedId,onSelect,onEdit,onPrint,onDelete}:{data:WorkspaceData;selectedId:string;onSelect:(id:string)=>void;onEdit:(exam:ExamDefinition|true)=>void;onPrint:(exam:ExamDefinition)=>void;onDelete:(exam:ExamDefinition)=>void}){
 return <><div className="page-heading"><div><h2>ชุดสอบและกระดาษคำตอบ</h2><p>เลือกชุดที่จะใช้ หรือสร้างชุดสอบใหม่</p></div>{data.exams.length>0&&<button type="button" className="button" onClick={()=>onEdit(true)}><Plus size={18}/>สร้างชุดสอบ</button>}</div>
 {!data.exams.length?<div className="panel"><Empty title="สร้างชุดสอบแรกของคุณ" description="กำหนดชื่อ จำนวนข้อ และเฉลย รองรับสูงสุด 60 ข้อ"><button type="button" className="button" onClick={()=>onEdit(true)}><Plus size={18}/>สร้างชุดสอบแรก</button></Empty></div>:<div className="answer-exam-list">{data.exams.map(exam=><article key={exam.id} className={`answer-exam-card ${exam.id===selectedId?'selected':''}`}>
  <label className="answer-exam-select"><input type="radio" name="answer-exam" checked={exam.id===selectedId} onChange={()=>onSelect(exam.id)}/><span><strong>{exam.title}</strong><small>{exam.subject} · ภาคเรียน {exam.term}/{exam.academicYear}</small></span></label>
  <div className="answer-exam-details"><span><BookOpen size={15}/>{exam.questionCount} ข้อ · {displayScore(exam.pointsHundredths.reduce((a,b)=>a+b,0))} คะแนน</span><span className={`status-tag ${exam.keyReady===false?'pending':''}`}>{exam.keyReady===false?'รอตั้งเฉลย':'เฉลยพร้อม'}</span></div>
  <div className="answer-exam-actions"><button type="button" className="button secondary small" onClick={()=>onPrint(exam)}><Download size={16}/>กระดาษคำตอบ PDF</button><button type="button" className="text-button" aria-label={`แก้ไข ${exam.title}`} onClick={()=>onEdit(exam)}><Pencil size={15}/>{exam.keyReady===false?'ตั้งเฉลย':'แก้ไขชุดสอบ'}</button><button type="button" className="text-button document-delete" aria-label={`ลบ ${exam.title}`} onClick={()=>onDelete(exam)}><Trash2 size={15}/>ลบชุดสอบ</button></div>
 </article>)}</div>}
 <p className="answer-paper-note">กระดาษคำตอบมีทั้ง A4 เต็มแผ่น และ A5 สองใบบน A4 ชื่อนักเรียนและเลขที่เขียนบนกระดาษ</p>
 </>;
}
