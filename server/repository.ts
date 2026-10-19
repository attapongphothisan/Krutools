import {database} from './access';import {emptyState,applyCommand,toView,type DomainState} from './domain';import {DomainError} from './validation';
type Kind='classrooms'|'students'|'exams'|'attempts'|'currentResults'|'receipts';
const collections:Kind[]=['classrooms','students','exams','attempts','currentResults','receipts'];
async function load(workspaceId:string){const db=database();const result=await db.batch([db.prepare('SELECT revision FROM workspaces WHERE id=?').bind(workspaceId),db.prepare('SELECT kind,id,data FROM records WHERE workspace_id=?').bind(workspaceId)]);const revision=(result[0].results[0] as {revision:number}).revision,state=emptyState();for(const r of result[1].results as {kind:Kind;id:string;data:string}[]){if(!collections.includes(r.kind))continue;const value=JSON.parse(r.data);if(r.kind==='currentResults'||r.kind==='receipts')state[r.kind][r.id]=value;else (state[r.kind] as {id:string}[]).push(value)}return{state,revision}}
function flatten(s:DomainState){const map=new Map<string,{kind:Kind;id:string;data:string}>();for(const kind of collections){if(kind==='currentResults'||kind==='receipts'){for(const[id,value]of Object.entries(s[kind]))map.set(`${kind}/${id}`,{kind,id,data:JSON.stringify(value)})}else for(const row of s[kind])map.set(`${kind}/${row.id}`,{kind,id:row.id,data:JSON.stringify(row)})}return map}
export async function snapshot(workspaceId:string){return toView((await load(workspaceId)).state)}
export async function execute(workspaceId:string,command:unknown){for(let retry=0;retry<4;retry++){
 const{state,revision}=await load(workspaceId),before=flatten(state);applyCommand(state,command);const after=flatten(state),db=database();
 // NOT NULL violation aborts the entire batch when another request won the revision.
 const statements=[db.prepare('UPDATE workspaces SET revision=CASE WHEN revision=? THEN revision+1 ELSE NULL END WHERE id=?').bind(revision,workspaceId)];
 for(const[key,row]of after)if(before.get(key)?.data!==row.data)statements.push(db.prepare('INSERT INTO records(workspace_id,kind,id,data) VALUES(?,?,?,?) ON CONFLICT(workspace_id,kind,id) DO UPDATE SET data=excluded.data').bind(workspaceId,row.kind,row.id,row.data));
 try{await db.batch(statements);return toView(state)}catch(error){if(!String(error).includes('NOT NULL')||retry===3)throw error}
 }throw new DomainError('มีการบันทึกพร้อมกัน กรุณาลองใหม่','CONFLICT',409)}
