export const CHOICES = ['ก','ข','ค','ง'] as const;
export type Choice=0|1|2|3;
export type Response=Choice|'blank'|'multiple'|'uncertain';
export type PaperSize='A4'|'A5';
export type Grade={totalHundredths:number;maxHundredths:number};
export type ExamDefinition={id:string;title:string;subject:string;term:string;academicYear:string;questionCount:number;keyReady?:boolean;keyDraft?:Response[];key:Choice[];pointsHundredths:number[];revision:number};
export type Classroom={id:string;name:string};
export type Student={id:string;classroomId:string;number:number;fullName:string};
export type AttemptRecord={id:string;examId:string;studentId:string;responses:Response[];createdAt:string;savedKeyRevision:number;savedTotalHundredths:number;version:number};
export type AttemptView=AttemptRecord&{grade:Grade;scoreRevision:number};
export type SubmitInput={submissionId:string;examId:string;studentId:string;responses:Response[];expectedKeyRevision:number;mode:'initial'|'replace'|'new';replaceAttemptId?:string;expectedAttemptVersion?:number};
export type ResultRow={student:Student;attemptId:string|null;grade:Grade|null};
export type WorkspaceData={workspaceId?:string;classrooms:Classroom[];students:Student[];exams:ExamDefinition[];attempts:AttemptView[];currentResults:Record<string,string>};
export function displayScore(hundredths:number){return new Intl.NumberFormat('th-TH',{maximumFractionDigits:2}).format(hundredths/100)}
