import type {AttemptRecord,WorkspaceData,Classroom,Student,ExamDefinition} from '../features/grading/types';
import {gradeAnswers,validateExam} from '../features/grading/score';
import {commandSchema,DomainError} from './validation';
export type DomainState={classrooms:Classroom[];students:Student[];exams:ExamDefinition[];attempts:AttemptRecord[];currentResults:Record<string,string>;receipts:Record<string,string>};
export function emptyState():DomainState{return{classrooms:[],students:[],exams:[],attempts:[],currentResults:{},receipts:{}}}
export const resultKey=(examId:string,studentId:string)=>`${examId}:${studentId}`;
function member<T extends {id:string}>(items:T[],id:string){const found=items.find(r=>r.id===id);if(!found)throw new DomainError('ไม่พบข้อมูลในพื้นที่นี้','NOT_FOUND',404);return found}
export function toView(s:DomainState):WorkspaceData{return{classrooms:s.classrooms,students:s.students,exams:s.exams,currentResults:s.currentResults,attempts:s.attempts.map(a=>{const e=member(s.exams,a.examId);return{...a,grade:gradeAnswers(a.responses,e),scoreRevision:e.revision}})}}
export function applyCommand(s:DomainState,raw:unknown){
 const parsed=commandSchema.safeParse(raw);if(!parsed.success)throw new DomainError('ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง');const cmd=parsed.data;
 if(cmd.action==='classroom.save'){const p=cmd.payload;if(p.id){member(s.classrooms,p.id).name=p.name}else s.classrooms.push({id:crypto.randomUUID(),name:p.name});return}
 if(cmd.action==='student.save'){const p=cmd.payload;member(s.classrooms,p.classroomId);if(s.students.some(st=>st.classroomId===p.classroomId&&st.number===p.number&&st.id!==p.id))throw new DomainError('เลขที่นี้มีอยู่ในห้องแล้ว');if(p.id){const st=member(s.students,p.id);if(st.classroomId!==p.classroomId)throw new DomainError('ไม่สามารถย้ายห้องของรายชื่อนี้');Object.assign(st,p)}else s.students.push({...p,id:crypto.randomUUID()});return}
 if(cmd.action==='student.import'){const p=cmd.payload;member(s.classrooms,p.classroomId);const numbers=new Set(s.students.filter(r=>r.classroomId===p.classroomId).map(r=>r.number));for(const row of p.rows){if(numbers.has(row.number))throw new DomainError(`เลขที่ ${row.number} ซ้ำ กรุณาแก้ไฟล์ก่อนนำเข้า`);numbers.add(row.number)}s.students.push(...p.rows.map(row=>({...row,classroomId:p.classroomId,id:crypto.randomUUID()})));return}
 if(cmd.action==='exam.save'){const p=cmd.payload;const prior=p.id?member(s.exams,p.id):null;if(prior&&p.revision!==undefined&&p.revision!==prior.revision)throw new DomainError('ชุดสอบถูกแก้ไขจากอีกเครื่อง กรุณาโหลดใหม่','CONFLICT',409);if(prior&&prior.questionCount!==p.questionCount&&s.attempts.some(a=>a.examId===prior.id))throw new DomainError('เปลี่ยนจำนวนข้อไม่ได้หลังเริ่มตรวจแล้ว กรุณาสร้างชุดสอบใหม่');if(prior&&p.keyReady===false&&s.attempts.some(a=>a.examId===prior.id))throw new DomainError('ชุดสอบนี้มีผลตรวจแล้ว กรุณาตั้งเฉลยให้ครบ');const e:ExamDefinition={...p,id:prior?.id??crypto.randomUUID(),revision:(prior?.revision??0)+1};validateExam(e);if(prior)Object.assign(prior,e);else s.exams.push(e);return}
 if(cmd.action==='attempt.submit'){
 const p=cmd.payload,fingerprint=JSON.stringify(p);if(s.receipts[p.submissionId]){if(s.receipts[p.submissionId]!==fingerprint)throw new DomainError('รหัสการบันทึกนี้ถูกใช้กับข้อมูลอื่นแล้ว','CONFLICT',409);return}
 const e=member(s.exams,p.examId);member(s.students,p.studentId);if(e.revision!==p.expectedKeyRevision)throw new DomainError('เฉลยเปลี่ยนแล้ว กรุณาตรวจคะแนนและยืนยันใหม่','EXAM_CHANGED',409);
 const grade=gradeAnswers(p.responses,e),key=resultKey(p.examId,p.studentId),existing=s.currentResults[key];
 if(existing&&p.mode==='initial')throw new DomainError('มีคะแนนเดิมแล้ว เลือกเขียนทับหรือเก็บเป็นครั้งใหม่','DUPLICATE',409);
 if(p.mode==='replace'){if(!existing||p.replaceAttemptId!==existing)throw new DomainError('ผลเดิมเปลี่ยนแล้ว กรุณาโหลดใหม่','CONFLICT',409);const a=member(s.attempts,existing);if(a.version!==p.expectedAttemptVersion)throw new DomainError('มีการแก้ผลเดิมจากอีกเครื่อง','CONFLICT',409);Object.assign(a,{responses:p.responses,savedKeyRevision:e.revision,savedTotalHundredths:grade.totalHundredths,version:a.version+1})}
 else{const a:AttemptRecord={id:crypto.randomUUID(),examId:e.id,studentId:p.studentId,responses:p.responses,createdAt:new Date().toISOString(),savedKeyRevision:e.revision,savedTotalHundredths:grade.totalHundredths,version:1};s.attempts.push(a);s.currentResults[key]=a.id}
 s.receipts[p.submissionId]=fingerprint;return;
 }
 if(cmd.action==='attempt.update'){const p=cmd.payload,a=member(s.attempts,p.attemptId),e=member(s.exams,a.examId);if(a.version!==p.expectedVersion)throw new DomainError('คำตอบถูกแก้ไขจากอีกเครื่อง กรุณาโหลดใหม่','CONFLICT',409);if(e.revision!==p.expectedKeyRevision)throw new DomainError('เฉลยเปลี่ยนแล้ว กรุณายืนยันใหม่','EXAM_CHANGED',409);const g=gradeAnswers(p.responses,e);Object.assign(a,{responses:p.responses,savedKeyRevision:e.revision,savedTotalHundredths:g.totalHundredths,version:a.version+1})}
}
