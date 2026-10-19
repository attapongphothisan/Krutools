import {homography,project,type Point} from '../scanner/warp';
export type Quad=[Point,Point,Point,Point];
export const fullFrame=():Quad=>[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
export function validQuad(points:Quad){
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))return false;
 let area=0;
 for(let i=0;i<4;i++){
  const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];
  if((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)<0.0001)return false;
  if(Math.hypot(b.x-a.x,b.y-a.y)<0.02)return false;
  area+=a.x*b.y-b.x*a.y;
 }
 return area/2>=0.02;
}
export function warpDocument(data:Uint8ClampedArray,width:number,height:number,corners:Quad,maxEdge=1600){
 if(!validQuad(corners))throw new Error('กรอบไม่ถูกต้อง กรุณาปรับมุมทั้งสี่อีกครั้ง');
 const points=corners.map(p=>({x:p.x*(width-1),y:p.y*(height-1)}));
 const distance=(a:number,b:number)=>Math.hypot(points[a].x-points[b].x,points[a].y-points[b].y);
 let w=Math.max(distance(0,1),distance(3,2)),h=Math.max(distance(0,3),distance(1,2));
 const scale=Math.min(1,maxEdge/Math.max(w,h));w=Math.max(2,Math.round(w*scale));h=Math.max(2,Math.round(h*scale));
 const matrix=homography([{x:0,y:0},{x:w-1,y:0},{x:w-1,y:h-1},{x:0,y:h-1}],points);
 const output=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=project(matrix,{x,y}),sx=Math.max(0,Math.min(width-1,p.x)),sy=Math.max(0,Math.min(height-1,p.y));
  const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(width-1,x0+1),y1=Math.min(height-1,y0+1),dx=sx-x0,dy=sy-y0,index=(y*w+x)*4;
  for(let c=0;c<3;c++)output[index+c]=data[(y0*width+x0)*4+c]*(1-dx)*(1-dy)+data[(y0*width+x1)*4+c]*dx*(1-dy)+data[(y1*width+x0)*4+c]*(1-dx)*dy+data[(y1*width+x1)*4+c]*dx*dy;
  output[index+3]=255;
 }
 return{data:output,width:w,height:h};
}

// A conservative bright-paper detector. Ambiguous white backgrounds fall back to manual corners.
export function detectDocument(data:Uint8ClampedArray,width:number,height:number):Quad|null{
 const stride=Math.max(1,Math.ceil(Math.max(width,height)/400)),w=Math.ceil(width/stride),h=Math.ceil(height/stride),gray=new Uint8Array(w*h);
 let sum=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(Math.min(height-1,y*stride)*width+Math.min(width-1,x*stride))*4;const value=Math.round(.299*data[i]+.587*data[i+1]+.114*data[i+2]);gray[y*w+x]=value;sum+=value}
 const mean=sum/gray.length;let best:Quad|null=null,bestArea=0;
 for(const threshold of [...new Set([Math.round(Math.min(235,Math.max(145,mean+20))),190,220])]){
  const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);
  for(let start=0;start<gray.length;start++){
   if(seen[start]||gray[start]<threshold)continue;
   let end=1,count=0,border=0;queue[0]=start;seen[start]=1;
   let tl={x:w,y:h},tr={x:0,y:h},br={x:0,y:0},bl={x:w,y:0};
   for(let q=0;q<end;q++){
    const i=queue[q],x=i%w,y=Math.floor(i/w);count++;
    if(x===0||x===w-1||y===0||y===h-1)border++;
    if(x+y<tl.x+tl.y)tl={x,y};if(x-y>tr.x-tr.y)tr={x,y};if(x+y>br.x+br.y)br={x,y};if(y-x>bl.y-bl.x)bl={x,y};
    for(const n of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&gray[n]>=threshold){seen[n]=1;queue[end++]=n}
   }
   const fraction=count/(w*h);if(fraction<.15||fraction>.94||border>Math.min(w,h)*.1)continue;
   const quad=[tl,tr,br,bl].map(p=>({x:Math.min(1,p.x*stride/(width-1)),y:Math.min(1,p.y*stride/(height-1))})) as Quad;
   const area=quad.reduce((a,p,i)=>a+p.x*quad[(i+1)%4].y-quad[(i+1)%4].x*p.y,0)/2;
   if(validQuad(quad)&&area>.18&&fraction/area>.65&&area>bestArea){best=quad;bestArea=area}
  }
 }
 return best;
}

// Estimate the vertical displacement of text rows in neighbouring strips.
// Low-confidence or blank strips keep their original position.
export function flattenTextCurve(data:Uint8ClampedArray,width:number,height:number,amount:number){
 if(amount===0||width<100||height<100)return data;
 const strength=amount<0?.7:Math.max(0,Math.min(1,amount));
 const rows=Math.min(600,height),columns=20,profiles:Array<Float64Array>=[];
 for(let col=0;col<columns;col++){const profile=new Float64Array(rows);for(let y=0;y<rows;y++){const sy=Math.min(height-1,Math.round(y*(height-1)/(rows-1)));let ink=0;for(let sample=0;sample<12;sample++){const x=Math.min(width-1,Math.floor((col+(sample+.5)/12)*width/columns)),i=(sy*width+x)*4;ink+=Math.max(0,190-(.299*data[i]+.587*data[i+1]+.114*data[i+2]))}profile[y]=ink/12}profiles.push(profile)}
 const reference=new Float64Array(rows);for(let y=0;y<rows;y++)reference[y]=(profiles[9][y]+profiles[10][y])/2;
 const limit=Math.max(2,Math.round(rows*.08)),shifts=new Float64Array(columns),reliable=new Uint8Array(columns);
 for(let col=0;col<columns;col++){let best=0,bestShift=0;for(let shift=-limit;shift<=limit;shift++){let ab=0,aa=0,bb=0;for(let y=Math.round(rows*.12);y<rows*.88;y++){const a=reference[y],b=profiles[col][y+shift]??0;ab+=a*b;aa+=a*a;bb+=b*b}const score=ab/Math.sqrt(aa*bb||1)-Math.abs(shift)*.002;if(score>best){best=score;bestShift=shift}}if(best>.55){shifts[col]=bestShift*height/rows;reliable[col]=1}}
 const valid=Array.from(reliable,(_,i)=>i).filter(i=>reliable[i]);if(valid.length<6)return data;
 for(let i=0;i<columns;i++)if(!reliable[i]){const left=valid.filter(v=>v<i).at(-1)??valid[0],right=valid.find(v=>v>i)??valid[valid.length-1];shifts[i]=left===right?shifts[left]:shifts[left]+(shifts[right]-shifts[left])*(i-left)/(right-left)}
 let smooth=Array.from(shifts);for(let pass=0;pass<3;pass++)smooth=smooth.map((v,i)=>(smooth[Math.max(0,i-1)]+2*v+smooth[Math.min(columns-1,i+1)])/4);
 const mx=(columns-1)/2,my=smooth.reduce((a,b)=>a+b,0)/columns,slope=smooth.reduce((sum,v,i)=>sum+(i-mx)*(v-my),0)/smooth.reduce((sum,_,i)=>sum+(i-mx)**2,0);
 smooth=smooth.map((v,i)=>v-my-slope*(i-mx));if(Math.max(...smooth)-Math.min(...smooth)<height*.004)return data;
 const out=new Uint8ClampedArray(data.length);
 for(let x=0;x<width;x++){const at=Math.max(0,Math.min(columns-1,x/width*columns-.5)),left=Math.floor(at),fraction=at-left,offset=(smooth[left]*(1-fraction)+smooth[Math.min(columns-1,left+1)]*fraction)*strength;for(let y=0;y<height;y++){const sy=Math.max(0,Math.min(height-1,y+offset)),y0=Math.floor(sy),y1=Math.min(height-1,y0+1),dy=sy-y0,i=(y*width+x)*4;for(let c=0;c<3;c++)out[i+c]=data[(y0*width+x)*4+c]*(1-dy)+data[(y1*width+x)*4+c]*dy;out[i+3]=255}}
 return out;
}
