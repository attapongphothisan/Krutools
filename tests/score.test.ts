import { describe, expect, it } from 'vitest';
import { gradeAnswers, validateExam } from '../features/grading/score';
import type { ExamDefinition } from '../features/grading/types';
export const exam = {id:'exam-1',title:'สอบ',subject:'วิทยาศาสตร์',term:'1',academicYear:'2569',questionCount:4,key:[0,1,2,3],pointsHundredths:[100,150,200,25],revision:1} as ExamDefinition;
describe('weighted scoring',()=>{
 it('counts blanks and multiple selections as zero using integer hundredths',()=>expect(gradeAnswers([0,'blank','multiple',3],exam)).toEqual({totalHundredths:125,maxHundredths:475}));
 it('rejects uncertain and incomplete answers',()=>{expect(()=>gradeAnswers(['uncertain',1,2,3],exam)).toThrow();expect(()=>gradeAnswers([0],exam)).toThrow()});
 it('validates limits and points',()=>{expect(()=>validateExam({...exam,questionCount:61})).toThrow();expect(()=>validateExam({...exam,questionCount:0})).toThrow();expect(()=>validateExam({...exam,key:[0]})).toThrow();expect(()=>validateExam({...exam,pointsHundredths:[-1,100,100,100]})).toThrow()});
 it('regrades saved answers using the current key',()=>expect(gradeAnswers([0,1,2,3],{...exam,key:[1,1,2,3],revision:2}).totalHundredths).toBe(375));
});
it('never grades a draft exam without a confirmed answer key',()=>expect(()=>gradeAnswers([0,1,2,3],{...exam,keyReady:false})).toThrow('เฉลย'));
