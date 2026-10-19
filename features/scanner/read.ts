import jsQR from 'jsqr';
import {buildLayout,parsePayload,QR_BOX} from '../paper/layout';
import type {PaperSize,Response} from '../grading/types';
import {homography,project} from './warp';
import {findMarker,gray} from './detect';
export type ScanResult={status:'ready';responses:Response[];uncertainIndices:number[]}|{status:'retry';reason:'markers'|'blur'|'wrong-exam'|'multi-sheet'|'qr'};
export function readSheet(frame:ImageData,expected:{examId:string;questionCount:number;paper?:PaperSize}):ScanResult{
 const fail=(reason:'markers'|'blur'|'wrong-exam'|'multi-sheet'|'qr'):ScanResult=>({status:'retry',reason});
 try{
 const qr=jsQR(frame.data,frame.width,frame.height,{inversionAttempts:'dontInvert'});if(!qr)return fail('qr');const info=parsePayload(qr.data);if(!info)return fail('qr');if(info.examId!==expected.examId||info.questionCount!==expected.questionCount||(expected.paper&&info.paper!==expected.paper))return fail('wrong-exam');
 const loc=qr.location,q=[loc.topLeftCorner,loc.topRightCorner,loc.bottomRightCorner,loc.bottomLeftCorner];
 const canonical=[{x:QR_BOX.x,y:QR_BOX.y},{x:QR_BOX.x+QR_BOX.size,y:QR_BOX.y},{x:QR_BOX.x+QR_BOX.size,y:QR_BOX.y+QR_BOX.size},{x:QR_BOX.x,y:QR_BOX.y+QR_BOX.size}];
 // QR corner rounding makes projective extrapolation unstable far from a small QR.
 const ux=((q[1].x-q[0].x)+(q[2].x-q[3].x))/2/QR_BOX.size,uy=((q[1].y-q[0].y)+(q[2].y-q[3].y))/2/QR_BOX.size;
 const vx=((q[3].x-q[0].x)+(q[2].x-q[1].x))/2/QR_BOX.size,vy=((q[3].y-q[0].y)+(q[2].y-q[1].y))/2/QR_BOX.size;
 const approx=[ux,vx,q[0].x-ux*QR_BOX.x-vx*QR_BOX.y,uy,vy,q[0].y-uy*QR_BOX.x-vy*QR_BOX.y,0,0,1],layout=buildLayout(info.paper,info.questionCount),pxPerMm=Math.hypot(q[1].x-q[0].x,q[1].y-q[0].y)/QR_BOX.size;
 if(pxPerMm*1.5<3.5)return fail('blur');
 const markers=layout.anchors.map(a=>findMarker(frame,project(approx,a),pxPerMm*4));if(markers.some(a=>!a))return fail('markers');
 const h=homography(layout.anchors,markers as {x:number;y:number}[]);
 if(canonical.some((p,i)=>{const a=project(h,p);return Math.hypot(a.x-q[i].x,a.y-q[i].y)>pxPerMm*4}))return fail('markers');
 // A second QR means two forms are visible: ask for one sheet to avoid ambiguity.
 const masked=new Uint8ClampedArray(frame.data),xs=q.map(p=>p.x),ys=q.map(p=>p.y);for(let y=Math.max(0,Math.floor(Math.min(...ys))-8);y<Math.min(frame.height,Math.max(...ys)+8);y++)for(let x=Math.max(0,Math.floor(Math.min(...xs))-8);x<Math.min(frame.width,Math.max(...xs)+8);x++){const i=(y*frame.width+x)*4;masked[i]=masked[i+1]=masked[i+2]=255}
 const second=jsQR(masked,frame.width,frame.height,{inversionAttempts:'dontInvert'});if(second&&parsePayload(second.data))return fail('multi-sheet');
 const ratios=layout.bubbles.map(b=>{let inner=0,background=0,n=0,m=0;for(let yy=-4;yy<=4;yy++)for(let xx=-4;xx<=4;xx++){const rr=Math.hypot(xx,yy)/4;if(rr<=.65){const p=project(h,{x:b.center.x+xx/4*b.radiusMm,y:b.center.y+yy/4*b.radiusMm});inner+=gray(frame,p.x,p.y);n++}else if(rr>=1.05&&rr<=1.4){const p=project(h,{x:b.center.x+xx/4*b.radiusMm*1.4,y:b.center.y+yy/4*b.radiusMm*1.4});background+=gray(frame,p.x,p.y);m++}}return Math.max(0,(background/m-inner/n)/Math.max(background/m,1))});
 const responses:Response[]=[],uncertainIndices:number[]=[];for(let i=0;i<info.questionCount;i++){const r=ratios.slice(i*4,i*4+4),marked=r.map((v,j)=>v>.48?j:-1).filter(j=>j>=0);let response:Response=marked.length>1?'multiple':marked.length===1?marked[0] as 0|1|2|3:'blank';if(r.some(v=>v>.18&&v<=.48)){response='uncertain';uncertainIndices.push(i)}responses.push(response)}
 return{status:'ready',responses,uncertainIndices};
 }catch{return fail('markers')}
}
