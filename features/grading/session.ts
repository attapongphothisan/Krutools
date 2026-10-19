export type SessionState={status:'selecting'|'scanning'|'review'|'saving'|'saved'|'error'};
export type SessionEvent={type:'select'|'start'|'read'|'edit'|'confirm'|'success'|'failure'};
export function transitionSession(state:SessionState,event:SessionEvent):SessionState{
 if(event.type==='select')return{status:'selecting'};
 if(event.type==='start'&&state.status!=='saving')return{status:'scanning'};
 if(event.type==='read'&&state.status==='scanning')return{status:'review'};
 if(event.type==='edit'&&state.status!=='saving')return{status:'review'};
 if(event.type==='confirm'&&['review','error'].includes(state.status))return{status:'saving'};
 if(event.type==='success'&&state.status==='saving')return{status:'saved'};
 if(event.type==='failure'&&state.status==='saving')return{status:'error'};return state;
}
import type {SubmitInput} from './types';import type {PendingDraft} from './pending';
export function submissionPayload(draft:PendingDraft,requested:SubmitInput['mode'],existing?:{id:string;version:number}):SubmitInput{
 const replay=requested==='initial'&&draft.mode!==undefined,mode=replay?draft.mode!:requested;
 return{submissionId:draft.submissionId,examId:draft.examId,studentId:draft.studentId,responses:draft.responses,expectedKeyRevision:draft.expectedKeyRevision,mode,...(mode==='replace'?{replaceAttemptId:replay?draft.replaceAttemptId:existing?.id,expectedAttemptVersion:replay?draft.expectedAttemptVersion:existing?.version}:{})};
}
