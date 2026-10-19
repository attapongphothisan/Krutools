import {z} from 'zod';
const id=z.string().min(1).max(100),text=z.string().trim().min(1).max(160),choice=z.union([z.literal(0),z.literal(1),z.literal(2),z.literal(3)]);
const response=z.union([choice,z.literal('blank'),z.literal('multiple')]);
const exam=z.object({id:id.optional(),title:text,subject:text,term:text,academicYear:text,questionCount:z.number().int().min(1).max(60),keyReady:z.boolean().optional(),keyDraft:z.array(z.union([response,z.literal('uncertain')])).max(60).optional(),key:z.array(choice).max(60),pointsHundredths:z.array(z.number().int().min(0).max(100000000)).max(60),revision:z.number().int().optional()});
const student=z.object({id:id.optional(),classroomId:id,number:z.number().int().min(1).max(99999),fullName:text});
export const commandSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('classroom.save'),payload:z.object({id:id.optional(),name:text})}),
 z.object({action:z.literal('student.save'),payload:student}),
 z.object({action:z.literal('student.import'),payload:z.object({classroomId:id,rows:z.array(student.omit({id:true,classroomId:true})).min(1).max(2000)})}),
 z.object({action:z.literal('exam.save'),payload:exam}),
 z.object({action:z.literal('attempt.submit'),payload:z.object({submissionId:id,examId:id,studentId:id,responses:z.array(response).max(60),expectedKeyRevision:z.number().int(),mode:z.enum(['initial','replace','new']),replaceAttemptId:id.optional(),expectedAttemptVersion:z.number().int().optional()})}),
 z.object({action:z.literal('attempt.update'),payload:z.object({attemptId:id,responses:z.array(response).max(60),expectedVersion:z.number().int(),expectedKeyRevision:z.number().int()})})
]);
export class DomainError extends Error{constructor(message:string,public code='INVALID',public status=400){super(message)}}
