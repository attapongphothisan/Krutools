import type {Point} from './warp';
export function gray(frame:ImageData,x:number,y:number){const i=(Math.round(y)*frame.width+Math.round(x))*4;return frame.data[i]===undefined?255:(frame.data[i]+frame.data[i+1]+frame.data[i+2])/3}
export function findMarker(frame:ImageData,p:Point,size:number):Point|null{
 const range=Math.max(8,size*7),x0=Math.max(0,Math.floor(p.x-range)),y0=Math.max(0,Math.floor(p.y-range)),w=Math.min(frame.width-x0,Math.ceil(range*2)),h=Math.min(frame.height-y0,Math.ceil(range*2));
 if(w<1||h<1)return null;
 const seen=new Uint8Array(w*h);let best:Point|null=null,bestScore=Infinity;
 for(let start=0;start<w*h;start++){if(seen[start])continue;const sx=start%w,sy=Math.floor(start/w);seen[start]=1;if(gray(frame,x0+sx,y0+sy)>100)continue;
 const queue=[start];let count=0,minX=sx,maxX=sx,minY=sy,maxY=sy;
 for(let q=0;q<queue.length;q++){const n=queue[q],x=n%w,y=Math.floor(n/w);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=w||ny>=h)continue;const k=ny*w+nx;if(!seen[k]){seen[k]=1;if(gray(frame,x0+nx,y0+ny)<100)queue.push(k)}}}
 const bw=maxX-minX+1,bh=maxY-minY+1;if(count/(bw*bh)<.75||bw/bh<.45||bw/bh>2.2||bw<size*.4||bh<size*.4||bw>size*2||bh>size*2)continue;
 const c={x:x0+(minX+maxX)/2,y:y0+(minY+maxY)/2},score=Math.hypot(c.x-p.x,c.y-p.y)+Math.abs(bw-size);if(score<bestScore){bestScore=score;best=c}
 }
 return best;
}
