import {env} from 'cloudflare:workers';
import {DomainError} from './validation';
export function database(){if(!env.DB)throw new DomainError('ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่','DATABASE',503);return env.DB}
export async function hashToken(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
export async function authorizeWorkspace(request:Request){const match=/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization')??'');if(!match)throw new DomainError('กรุณาเปิดลิงก์พื้นที่ส่วนตัวอีกครั้ง','UNAUTHORIZED',401);const row=await database().prepare('SELECT id, revision FROM workspaces WHERE token_hash=?').bind(await hashToken(match[1])).first<{id:string;revision:number}>();if(!row)throw new DomainError('ลิงก์พื้นที่นี้ไม่ถูกต้อง','UNAUTHORIZED',401);return{workspaceId:row.id}}
