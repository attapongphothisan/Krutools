'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
import {X,FolderOpen} from 'lucide-react';
export function Dialog({title,subtitle,children,onClose,wide=false}:{title:string;subtitle?:string;children:ReactNode;onClose:()=>void;wide?:boolean}){const ref=useRef<HTMLDialogElement>(null),id=useId();useEffect(()=>{ref.current?.showModal()},[]);return <dialog ref={ref} className={`dialog ${wide?'dialog-wide':''}`} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose()}}><div className="dialog-heading"><div><h2 id={id}>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" aria-label="ปิด" onClick={onClose}><X size={20}/></button></div>{children}</dialog>}
export function Empty({title,description,children}:{title:string;description:string;children?:ReactNode}){return <div className="empty"><div className="empty-visual"><FolderOpen size={38} strokeWidth={1.4}/><span/><span/></div><h3>{title}</h3><p>{description}</p>{children}</div>}
export type Change=(action:string,payload:unknown)=>Promise<import('./grading/types').WorkspaceData>;
