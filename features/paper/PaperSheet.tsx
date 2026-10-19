'use client';
import QRCode from 'qrcode';
import {buildLayout,qrPayload,QR_BOX} from './layout';
import {CHOICES,type ExamDefinition,type PaperSize} from '../grading/types';
export function PaperSheet({exam,paper}:{exam:ExamDefinition;paper:PaperSize}){
 const l=buildLayout(paper,exam.questionCount),qr=QRCode.create(qrPayload(exam.id,exam.questionCount,paper),{errorCorrectionLevel:'M'}).modules;
 const start=l.bubbles[0].center.y,step=paper==='A4'?9.4:4;
 return <svg className="answer-sheet" role="img" aria-label={`กระดาษคำตอบ ${paper} ${exam.questionCount} ข้อ`} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 210 ${l.heightMm}`} style={{width:'210mm',height:`${l.heightMm}mm`}}>
 <rect width="210" height={l.heightMm} fill="white"/>
 <g fill="black">{l.anchors.map((a,i)=><rect key={i} x={a.x-2} y={a.y-2} width="4" height="4"/>)}{Array.from({length:qr.size*qr.size},(_,i)=>qr.get(Math.floor(i/qr.size),i%qr.size)?<rect key={`qr${i}`} x={QR_BOX.x+i%qr.size*QR_BOX.size/qr.size} y={QR_BOX.y+Math.floor(i/qr.size)*QR_BOX.size/qr.size} width={QR_BOX.size/qr.size+.02} height={QR_BOX.size/qr.size+.02}/>:null)}</g>
 <g fontFamily="Tahoma,Thonburi,sans-serif" fill="#111">
 <text x="20" y="19" fontSize="4.4" fontWeight="bold">กระดาษคำตอบ</text><text x="20" y="25" fontSize="3.2">{exam.title.slice(0,54)}</text>
 <text x="20" y="33" fontSize="3.1">ชื่อ–นามสกุล ....................................................................................</text>
 <text x="20" y="40" fontSize="3.1">ชั้น ................... เลขที่ ............ วิชา ............................................................</text>
 <text x="20" y="45" fontSize="2.5">ระบายวงกลมให้เต็ม เลือกเพียงคำตอบเดียว • {exam.questionCount} ข้อ • {paper}</text>
 {Array.from({length:Math.ceil(exam.questionCount/20)},(_,col)=><g key={col}>{CHOICES.map((c,i)=><text key={c} x={36+col*62+i*10} y={start-4.5} fontSize="2.8" textAnchor="middle">{c}</text>)}</g>)}
 {Array.from({length:exam.questionCount},(_,q)=><text key={q} x={24+Math.floor(q/20)*62} y={start+(q%20)*step+1} fontSize="3" textAnchor="end">{q+1}</text>)}
 <text x="105" y={l.heightMm-5} fontSize="2.3" textAnchor="middle">เครื่องมือครู • หากพิมพ์ ให้ใช้ขนาดจริง 100% • อย่าเขียนทับเครื่องหมายมุมกระดาษ</text>
 </g>
 <g fill="none" stroke="black" strokeWidth=".22">{l.bubbles.map((b,i)=><circle key={i} cx={b.center.x} cy={b.center.y} r={b.radiusMm}/>)}</g>
 </svg>
}
export function PrintSheets({exam,paper}:{exam:ExamDefinition;paper:PaperSize}){return <div className="print-page"><PaperSheet exam={exam} paper={paper}/>{paper==='A5'&&<PaperSheet exam={exam} paper={paper}/>}</div>}
