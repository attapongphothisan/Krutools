import type {Choice,PaperSize} from '../grading/types';
export type PointMm={x:number;y:number};
export type SheetLayout={widthMm:number;heightMm:number;anchors:[PointMm,PointMm,PointMm,PointMm];bubbles:Array<{question:number;choice:Choice;center:PointMm;radiusMm:number}>};
export const QR_BOX={x:175,y:17,size:18};
export function buildLayout(paper:PaperSize,count:number):SheetLayout{
 if(!Number.isInteger(count)||count<1||count>60)throw Error('จำนวนข้อไม่ถูกต้อง');
 const h=paper==='A4'?297:148.5,start=paper==='A4'?65:54,step=paper==='A4'?9.4:4;
 return {widthMm:210,heightMm:h,anchors:[{x:10,y:10},{x:200,y:10},{x:200,y:h-10},{x:10,y:h-10}],bubbles:Array.from({length:count*4},(_,n)=>{const q=Math.floor(n/4),c=n%4;return{question:q,choice:c as Choice,center:{x:36+Math.floor(q/20)*62+c*10,y:start+(q%20)*step},radiusMm:1.5}})};
}
export function qrPayload(examId:string,count:number,paper:PaperSize){return `TT1:${examId}:${count}:${paper}:1`}
export function parsePayload(value:string){const m=/^TT1:([\w-]+):(\d+):(A4|A5):1$/.exec(value);return m&&+m[2]>=1&&+m[2]<=60?{examId:m[1],questionCount:+m[2],paper:m[3] as PaperSize}:null}
