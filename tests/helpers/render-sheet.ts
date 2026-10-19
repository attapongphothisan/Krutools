import QRCode from 'qrcode';
import {buildLayout,qrPayload,QR_BOX} from '../../features/paper/layout';
import type {PaperSize,Response} from '../../features/grading/types';
export async function renderTestSheet(paper:PaperSize,count:number,responses:Array<Response|number>):Promise<ImageData>{
 const l=buildLayout(paper,count),s=5,w=Math.round(l.widthMm*s),h=Math.round(l.heightMm*s),data=new Uint8ClampedArray(w*h*4).fill(255);
 const dot=(x:number,y:number,v:number)=>{const i=(y*w+x)*4;if(x>=0&&y>=0&&x<w&&y<h){data[i]=data[i+1]=data[i+2]=v;data[i+3]=255}};
 for(const a of l.anchors)for(let y=Math.floor((a.y-2)*s);y<(a.y+2)*s;y++)for(let x=Math.floor((a.x-2)*s);x<(a.x+2)*s;x++)dot(x,y,0);
 const qr=QRCode.create(qrPayload('exam-1',count,paper),{errorCorrectionLevel:'M'}).modules;
 for(let y=0;y<Math.ceil(QR_BOX.size*s);y++)for(let x=0;x<Math.ceil(QR_BOX.size*s);x++){if(qr.get(Math.min(qr.size-1,Math.floor(y/(QR_BOX.size*s)*qr.size)),Math.min(qr.size-1,Math.floor(x/(QR_BOX.size*s)*qr.size))))dot(Math.round(QR_BOX.x*s)+x,Math.round(QR_BOX.y*s)+y,0)}
 for(const b of l.bubbles){const selected=responses[b.question]===b.choice||(responses[b.question]==='multiple'&&b.choice<2);const cx=b.center.x*s,cy=b.center.y*s,r=b.radiusMm*s;for(let y=Math.floor(cy-r-1);y<=cy+r+1;y++)for(let x=Math.floor(cx-r-1);x<=cx+r+1;x++){const d=Math.hypot(x-cx,y-cy);if((selected&&d<r*.84)||Math.abs(d-r)<.5)dot(x,y,0)}}
 return {data,width:w,height:h,colorSpace:'srgb'} as ImageData;
}
export async function perspectiveSheet(){
 const f=await renderTestSheet('A5',60,Array.from({length:60},(_,i)=>i%4));
 const {homography,project}=await import('../../features/scanner/warp');
 const w=f.width+120,h=f.height+120,quad=[{x:70,y:45},{x:w-50,y:80},{x:w-65,y:h-30},{x:35,y:h-65}],inv=homography(quad,[{x:0,y:0},{x:f.width,y:0},{x:f.width,y:f.height},{x:0,y:f.height}]);
 const data=new Uint8ClampedArray(w*h*4).fill(255);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=project(inv,{x,y}),sx=Math.round(p.x),sy=Math.round(p.y);if(sx<0||sy<0||sx>=f.width||sy>=f.height)continue;const j=(y*w+x)*4,k=(sy*f.width+sx)*4,shade=.75+.25*x/w;data[j]=data[j+1]=data[j+2]=Math.round(f.data[k]*shade);data[j+3]=255}return {data,width:w,height:h,colorSpace:'srgb'} as ImageData;
}
