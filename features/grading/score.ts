import type {ExamDefinition,Response,Grade} from './types';
export function validateExam(exam:ExamDefinition){
 if(!Number.isInteger(exam.questionCount)||exam.questionCount<1||exam.questionCount>60)throw Error('จำนวนข้อต้องอยู่ระหว่าง 1–60 ข้อ');
 if(!Array.isArray(exam.key)||!Array.isArray(exam.pointsHundredths)||exam.key.length!==exam.questionCount||exam.pointsHundredths.length!==exam.questionCount)throw Error('กรุณากรอกเฉลยและคะแนนให้ครบทุกข้อ');
 if(exam.key.some(c=>![0,1,2,3].includes(c)))throw Error('เฉลยต้องเป็น ก ข ค ง');
 if(exam.pointsHundredths.some(p=>!Number.isSafeInteger(p)||p<0||p>100000000))throw Error('คะแนนต้องไม่ติดลบและมีทศนิยมไม่เกิน 2 ตำแหน่ง');
}
export function gradeAnswers(responses:Response[],exam:ExamDefinition):Grade{
 if(exam.keyReady===false)throw Error('กรุณาตั้งเฉลยให้ครบก่อนตรวจข้อสอบ');validateExam(exam);if(!Array.isArray(responses)||responses.length!==exam.questionCount||responses.some(r=>![0,1,2,3,'blank','multiple'].includes(r)))throw Error('กรุณาตรวจคำตอบที่ไม่ชัดเจนให้ครบก่อนยืนยัน');
 return {totalHundredths:responses.reduce<number>((sum,r,i)=>sum+(r===exam.key[i]?exam.pointsHundredths[i]:0),0),maxHundredths:exam.pointsHundredths.reduce((a,b)=>a+b,0)};
}
