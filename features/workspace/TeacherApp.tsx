'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Download,LoaderCircle,Plus,Printer,Check} from 'lucide-react';
import {ToolPortal} from './ToolPortal';
import {AnswerWorkflow,answerSteps,type AnswerStep} from './AnswerWorkflow';
import {DocumentScanner} from '../document-scanner/DocumentScanner';
import {ExamPanel} from '../exams/ExamPanel';
import {ClassroomPanel} from '../roster/ClassroomPanel';
import {ExamEditor} from '../exams/ExamEditor';
import {GradingScreen,type GradingActivity} from '../grading/GradingScreen';
import {ResultsPanel} from '../results/ResultsPanel';
import {PrintSheets} from '../paper/PaperSheet';
import {Dialog,type Change} from '../ui';
import type {ExamDefinition,PaperSize,WorkspaceData} from '../grading/types';
import {useToken as setWorkspaceToken,readToken,workspaceRequest,createWorkspace,requestPersistentStorage} from './client';
type Tool='answer-sheet'|'document-scanner';
const idle:GradingActivity={reviewing:false,busy:false,camera:false};
export default function TeacherApp(){
 const activationTick=useRef(0);
 const[data,setData]=useState<WorkspaceData|null>(null),[loading,setLoading]=useState(true),[activeTool,setActiveTool]=useState<Tool|null>(null),[error,setError]=useState(''),[tab,setTab]=useState<AnswerStep>('exams'),[editing,setEditing]=useState<ExamDefinition|true|null>(null),[printExam,setPrintExam]=useState<ExamDefinition|null>(null),[paper,setPaper]=useState<PaperSize>('A4'),[starting,setStarting]=useState(false);
 const[examId,setExamId]=useState(''),[roomId,setRoomId]=useState(''),[studentId,setStudentId]=useState(''),[activity,setActivity]=useState<GradingActivity>(idle),[pendingNavigation,setPendingNavigation]=useState<(()=>void)|null>(null);
 const exam=data?.exams.find(item=>item.id===examId)??data?.exams[0],room=data?.classrooms.find(item=>item.id===roomId)??data?.classrooms[0];
 const students=data?.students.filter(item=>item.classroomId===room?.id)??[],graded=exam?students.filter(student=>data?.currentResults[`${exam.id}:${student.id}`]).length:0;
 const refresh=async()=>{const fresh=await workspaceRequest();setData(fresh);return fresh};
 const change:Change=async(action,payload)=>{
  const fresh=await workspaceRequest({action,payload});setData(fresh);const item=payload as {id?:string};
  if(action==='exam.save'){const saved=item.id?fresh.exams.find(e=>e.id===item.id):fresh.exams.find(e=>!data?.exams.some(old=>old.id===e.id));if(saved)setExamId(saved.id)}
  if(action==='classroom.save'){const saved=item.id?fresh.classrooms.find(c=>c.id===item.id):fresh.classrooms.find(c=>!data?.classrooms.some(old=>old.id===c.id));if(saved)setRoomId(saved.id)}
  return fresh;
 };
 const selectContext=useCallback((nextExam:string,nextRoom:string)=>{setExamId(nextExam);setRoomId(nextRoom)},[]);
 const selectGradingContext=useCallback((nextExam:string,nextRoom:string,nextStudent:string)=>{setExamId(nextExam);setRoomId(nextRoom);setStudentId(nextStudent)},[]);
 useEffect(()=>{let live=true;const activate=async()=>{const tick=++activationTick.current,token=readToken();setWorkspaceToken(token);if(!token){setLoading(false);return}try{const fresh=await workspaceRequest();if(live&&tick===activationTick.current)setData(fresh)}catch(e){if(live)setError((e as Error).message)}finally{if(live)setLoading(false)}};void activate();void requestPersistentStorage();return()=>{live=false}},[]);
 async function start(){if(starting)return;setStarting(true);setError('');try{const w=await createWorkspace();setWorkspaceToken(w.token);await refresh()}catch(e){setError((e as Error).message)}finally{setStarting(false)}}
 function openTool(){setActiveTool('answer-sheet');setTab('exams');setActivity(idle);if(!data&&!loading)void start()}
 function navigate(action:()=>void){if(activity.busy)return;if(tab==='grading'&&(activity.reviewing||activity.camera)){setPendingNavigation(()=>action);return}setActivity(idle);action()}
 function go(to:AnswerStep){if(to===tab)return;navigate(()=>{setTab(to);window.scrollTo({top:0})})}
 function backToTools(){navigate(()=>{setActiveTool(null);setTab('exams');window.scrollTo({top:0})})}
 function saveAnswerSheetPdf(){if(!printExam)return;const previousTitle=document.title,fileName=`${printExam.subject}-${printExam.title}-กระดาษคำตอบ-${paper}`.replace(/[\\/:*?"<>|]/g,'-').trim();const restoreTitle=()=>{document.title=previousTitle};document.title=fileName;window.addEventListener('afterprint',restoreTitle,{once:true});void document.fonts.ready.then(()=>window.print())}
 const index=answerSteps.findIndex(step=>step.id===tab);
 let nextLabel='ถัดไป: เพิ่มนักเรียน',hint=!exam?'สร้างชุดสอบแรกก่อน แล้วกดถัดไปเพื่อเพิ่มนักเรียน':exam.keyReady===false?'ชุดนี้ยังไม่มีเฉลย เพิ่มนักเรียนก่อนได้ แล้วกลับมาตั้งเฉลยก่อนตรวจ':'',nextDisabled=tab==='exams'&&!exam;
 function next(){
  if(tab==='exams'){if(!exam)setEditing(true);else go('classrooms')}
  else if(tab==='classrooms'){if(!exam||exam.keyReady===false){go('exams');setEditing(exam??true)}else go('grading')}
  else if(tab==='grading')go('results');else go('grading');
 }
 if(tab==='classrooms'){
  nextLabel=!exam?'สร้างชุดสอบก่อนตรวจ':exam.keyReady===false?'ตั้งเฉลยก่อนตรวจ':'ถัดไป: ตรวจคำตอบ';
  nextDisabled=!!exam&&exam.keyReady!==false&&!students.length;
  hint=!students.length?'เพิ่มนักเรียนในห้องที่เลือกอย่างน้อย 1 คนก่อนเริ่มตรวจ':`${room?.name} พร้อมตรวจ ${students.length} คน`;
 }
 if(tab==='grading'){nextLabel='ดูสรุปคะแนน';hint=`${room?.name??'ห้องเรียน'} · ยืนยันคะแนนแล้ว ${graded} จาก ${students.length} คน`}
 if(tab==='results'){nextLabel='กลับไปตรวจคำตอบ';hint='เลือกส่งออก Excel เพื่อเก็บผลคะแนนไว้ใช้งานต่อ'}
 if(activeTool==='document-scanner')return <DocumentScanner onBack={()=>{setActiveTool(null);window.scrollTo({top:0})}}/>;
 if(!activeTool)return <ToolPortal onOpen={openTool} onOpenDocumentScanner={()=>setActiveTool('document-scanner')} loading={loading} error={error}/>;
 return <>
 <AnswerWorkflow step={tab} onStep={go} onBack={backToTools} previous={index?`กลับ: ${answerSteps[index-1].label}`:'หน้าเลือกเครื่องมือ'} onPrevious={()=>index?go(answerSteps[index-1].id):backToTools()} nextLabel={nextLabel} onNext={next} nextDisabled={nextDisabled||loading||starting||!data} hint={hint} locked={activity.busy} examName={exam?.title} roomName={room?.name} completed={{exams:!!exam&&exam.keyReady!==false,classrooms:students.length>0,grading:students.length>0&&graded===students.length,results:false}}>
 {loading||starting?<div className="loading-state"><LoaderCircle size={28} className="spin"/><p>กำลังเปิดเครื่องมือ…</p></div>:!data?<div className="answer-prerequisite"><h2>เปิดพื้นที่เครื่องมือกระดาษคำตอบ</h2><p>{error||'เริ่มสร้างชุดสอบและเพิ่มรายชื่อได้ทันที'}</p><button type="button" className="button" onClick={()=>void start()}><Plus size={18}/>ลองเปิดอีกครั้ง</button></div>:<>
 {tab==='exams'&&<ExamPanel data={data} selectedId={exam?.id??''} onSelect={setExamId} onEdit={setEditing} onPrint={value=>{setPrintExam(value);setPaper('A4')}}/>}
 {tab==='classrooms'&&<ClassroomPanel data={data} onChange={change} selectedRoomId={room?.id} onSelectRoom={setRoomId} embedded/>}
 {tab==='grading'&&(!exam||exam.keyReady===false?<div className="answer-prerequisite"><h2>ตั้งเฉลยก่อนเริ่มตรวจ</h2><p>เลือกหรือสร้างชุดสอบ และตั้งเฉลยให้ครบทุกข้อ</p><button type="button" className="button" onClick={()=>{go('exams');setEditing(exam??true)}}>เตรียมชุดสอบและเฉลย</button></div>:!students.length?<div className="answer-prerequisite"><h2>เพิ่มนักเรียนก่อนเริ่มตรวจ</h2><p>เลือกห้องและเพิ่มรายชื่ออย่างน้อย 1 คน เพื่อบันทึกคะแนนให้ตรงคน</p><button type="button" className="button" onClick={()=>go('classrooms')}>เพิ่มรายชื่อนักเรียน</button></div>:<GradingScreen data={data} onChange={change} refresh={refresh} initialExamId={exam.id} initialRoomId={room?.id} initialStudentId={studentId} onSelectionChange={selectGradingContext} onActivityChange={setActivity} embedded onSetup={()=>go('classrooms')}/>)}
 {tab==='results'&&<ResultsPanel data={data} onChange={change} refresh={refresh} initialExamId={exam?.id} initialRoomId={room?.id} onSelectionChange={selectContext} embedded/>}
 </>}
 </AnswerWorkflow>
 {editing&&<ExamEditor exam={editing===true?undefined:editing} onChange={change} onClose={()=>setEditing(null)}/>}
 {printExam&&<><Dialog title="บันทึกกระดาษคำตอบเป็น PDF" subtitle={`${printExam.title} • ${printExam.questionCount} ข้อ`} onClose={()=>setPrintExam(null)} wide><div className="paper-options">{(['A4','A5'] as const).map(p=><button key={p} className={paper===p?'selected':''} onClick={()=>setPaper(p)}><Printer size={21}/><strong>{p==='A4'?'A4 เต็มแผ่น':'A5 ครึ่งแผ่น'}</strong><small>{p==='A4'?'1 ใบต่อ A4':'2 ใบต่อ A4 แล้วตัดครึ่ง'}</small>{paper===p&&<Check size={18}/>}</button>)}</div><p className="notice">กดบันทึกไฟล์ PDF แล้วเลือกปลายทาง “บันทึกเป็น PDF” (iPhone: แตะแชร์ แล้วบันทึกไปยังแอปไฟล์) หากพิมพ์ภายหลัง ให้เลือกขนาดจริง 100%</p><div className="paper-preview"><PrintSheets exam={printExam} paper={paper}/></div><div className="dialog-footer"><span className="muted">ชื่อนักเรียนและเลขที่เขียนบนกระดาษ</span><button className="button" onClick={saveAnswerSheetPdf}><Download size={17}/> บันทึกไฟล์ PDF</button></div></Dialog>{createPortal(<div className="print-host"><PrintSheets exam={printExam} paper={paper}/></div>,document.body)}</>}
 {pendingNavigation&&<Dialog title="ยังมีคำตอบที่ไม่ได้ยืนยัน" subtitle="คะแนนจะยังไม่ถูกบันทึกจนกดยืนยัน ต้องการเปลี่ยนขั้นตอนหรือไม่?" onClose={()=>setPendingNavigation(null)}><div className="dialog-footer"><button type="button" className="button secondary" onClick={()=>setPendingNavigation(null)}>ตรวจทานต่อ</button><button type="button" className="button" onClick={()=>{const action=pendingNavigation;setPendingNavigation(null);setActivity(idle);action()}}>เปลี่ยนขั้นตอน</button></div></Dialog>}
 </>;
}
