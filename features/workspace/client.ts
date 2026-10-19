import type {WorkspaceData} from '../grading/types';
import {applyCommand,emptyState,toView,type DomainState} from '../../server/domain';

const APP_SCOPE=location.pathname.split('/').filter(Boolean)[0]??'root';
const DATABASE=`kru-tools-local-${APP_SCOPE}`, STORE='workspace', KEY='primary';
let activeToken='';

function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error??new Error('เปิดพื้นที่เก็บข้อมูลในเครื่องไม่สำเร็จ'));
 });
}

function readState(db:IDBDatabase,tx:IDBTransaction):Promise<DomainState>{
 return new Promise((resolve,reject)=>{
  const request=tx.objectStore(STORE).get(KEY);
  request.onsuccess=()=>resolve((request.result as DomainState|undefined)??emptyState());
  request.onerror=()=>reject(request.error??new Error('อ่านข้อมูลในเครื่องไม่สำเร็จ'));
 });
}

export function useToken(value:string){activeToken=value;if(value){try{localStorage.setItem('kru-tools-token',value)}catch{}}}
export function readToken(){try{return localStorage.getItem('kru-tools-token')??''}catch{return ''}}
export class ApiError extends Error{constructor(message:string,public code:string){super(message)}}

export async function workspaceRequest(command?:{action:string;payload:unknown}):Promise<WorkspaceData>{
 if(!activeToken)throw new ApiError('กรุณาเปิดพื้นที่ทำงานก่อน','NO_WORKSPACE');
 const db=await openDatabase();
 try{
  const tx=db.transaction(STORE,'readwrite');
  const state=await readState(db,tx);
  if(command){try{applyCommand(state,command)}catch(error){tx.abort();throw error}}
  tx.objectStore(STORE).put(state,KEY);
  await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('บันทึกข้อมูลในเครื่องไม่สำเร็จ'));tx.onerror=()=>reject(tx.error??new Error('บันทึกข้อมูลในเครื่องไม่สำเร็จ'))});
  return toView(state);
 }catch(error){
  if(error instanceof Error)throw error;
  throw new ApiError('บันทึกข้อมูลในเครื่องไม่สำเร็จ','LOCAL_STORAGE_ERROR');
 }finally{db.close()}
}

export async function createWorkspace(){
 let token=readToken();
 if(!token){const bytes=crypto.getRandomValues(new Uint8Array(32));token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');useToken(token)}
 const db=await openDatabase();
 try{const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);const request=store.get(KEY);request.onsuccess=()=>{if(!request.result)store.put(emptyState(),KEY)};await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('สร้างพื้นที่เก็บข้อมูลไม่สำเร็จ'));tx.onerror=()=>reject(tx.error??new Error('สร้างพื้นที่เก็บข้อมูลไม่สำเร็จ'))});}
 finally{db.close()}
 return {workspaceId:'this-device',token};
}

export async function requestPersistentStorage(){
 try{await navigator.storage?.persist?.()}catch{/* Storage persistence is best effort. */}
}
