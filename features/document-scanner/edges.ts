import type {Quad} from './geometry';
type Line={theta:number;rho:number;votes:number};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function edgeFrame(gray:Uint8Array,w:number,h:number){
 const smooth=new Float32Array(gray.length),gx=new Float32Array(gray.length),gy=new Float32Array(gray.length),magnitude=new Float32Array(gray.length);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;smooth[i]=(gray[i]*4+(gray[i-1]+gray[i+1]+gray[i-w]+gray[i+w])*2+gray[i-w-1]+gray[i-w+1]+gray[i+w-1]+gray[i+w+1])/16}
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x;gx[i]=(smooth[i+1]-smooth[i-1])/2;gy[i]=(smooth[i+w]-smooth[i-w])/2;magnitude[i]=Math.hypot(gx[i],gy[i])}
 return{gx,gy,magnitude};
}
type Edges=ReturnType<typeof edgeFrame>;
export function outlineScore(quad:Quad,gray:Uint8Array,w:number,h:number,edges:Edges){
 const area=Math.abs(quad.reduce((s,p,i)=>s+p.x*quad[(i+1)%4].y-quad[(i+1)%4].x*p.y,0))/2;if(area<.2||area>.96)return 0;
 let support=0,weakest=1,contrast=0;
 for(let side=0;side<4;side++){const a=quad[side],b=quad[(side+1)%4],dx=(b.x-a.x)*(w-1),dy=(b.y-a.y)*(h-1),length=Math.hypot(dx,dy);if(length<Math.min(w,h)*.18)return 0;const nx=-dy/length,ny=dx/length;let hits=0,total=0,edgeStrength=0;
  for(let sample=2;sample<30;sample++){const t=sample/32,x=(a.x*(1-t)+b.x*t)*(w-1),y=(a.y*(1-t)+b.y*t)*(h-1);let best=0;for(let offset=-2;offset<=2;offset++){const px=Math.round(x+nx*offset),py=Math.round(y+ny*offset);if(px<2||py<2||px>=w-2||py>=h-2)continue;const i=py*w+px;best=Math.max(best,Math.abs(edges.gx[i]*nx+edges.gy[i]*ny))}if(best>5)hits++;edgeStrength+=Math.min(1,best/24);const contrasts=[4,8,12].map(distance=>{const inside=clamp(Math.round(y+ny*distance),0,h-1)*w+clamp(Math.round(x+nx*distance),0,w-1),outside=clamp(Math.round(y-ny*distance),0,h-1)*w+clamp(Math.round(x-nx*distance),0,w-1);return gray[inside]-gray[outside]}).sort((a,b)=>a-b);contrast+=contrasts[1];total++}
  const fraction=hits/total;weakest=Math.min(weakest,fraction);support+=fraction*.6+edgeStrength/total*.4;
 }
 if(weakest<.4||contrast/(4*28)<2)return 0;
 return support/4*.65+Math.sqrt(area)*.25+weakest*.1;
}
function intersection(a:Line,b:Line){const ca=Math.cos(a.theta),sa=Math.sin(a.theta),cb=Math.cos(b.theta),sb=Math.sin(b.theta),det=ca*sb-sa*cb;if(Math.abs(det)<.2)return null;return{x:(a.rho*sb-b.rho*sa)/det,y:(b.rho*ca-a.rho*cb)/det}}
function ordered(points:{x:number;y:number}[],w:number,h:number):Quad|null{if(points.some(p=>p.x<1||p.y<1||p.x>w-2||p.y>h-2))return null;const cx=points.reduce((s,p)=>s+p.x,0)/4,cy=points.reduce((s,p)=>s+p.y,0)/4;points.sort((a,b)=>Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx));let start=0;for(let i=1;i<4;i++)if(points[i].x+points[i].y<points[start].x+points[start].y)start=i;return Array.from({length:4},(_,i)=>({x:points[(start+i)%4].x/(w-1),y:points[(start+i)%4].y/(h-1)})) as Quad}
export function edgeDocument(gray:Uint8Array,w:number,h:number,edges:Edges):Quad|null{
 const diagonal=Math.ceil(Math.hypot(w,h)),bins=2*diagonal+1,votes=new Float32Array(180*bins),cos=Array.from({length:180},(_,a)=>Math.cos(a*Math.PI/180)),sin=cos.map((_,a)=>Math.sin(a*Math.PI/180));
 for(let y=3;y<h-3;y+=2)for(let x=3;x<w-3;x+=2){const i=y*w+x,mag=edges.magnitude[i];if(mag<6)continue;const angle=(Math.round(Math.atan2(edges.gy[i],edges.gx[i])*180/Math.PI)+180)%180;for(let d=-6;d<=6;d+=2){const a=(angle+d+180)%180,rho=Math.round(x*cos[a]+y*sin[a])+diagonal;votes[a*bins+rho]+=Math.min(3,mag/12)}}
 const peaks:{angle:number;rho:number;votes:number}[]=[];for(let angle=0;angle<180;angle++)for(let rho=0;rho<bins;rho++){const score=votes[angle*bins+rho];if(score>Math.min(w,h)*.12)peaks.push({angle,rho:rho-diagonal,votes:score})}peaks.sort((a,b)=>b.votes-a.votes);
 const lines:Line[]=[];for(const peak of peaks){if(lines.some(line=>{const angle=Math.abs(line.theta*180/Math.PI-peak.angle),same=angle<7,opposite=angle>173;return same&&Math.abs(line.rho-peak.rho)<9||opposite&&Math.abs(line.rho+peak.rho)<9}))continue;lines.push({theta:peak.angle*Math.PI/180,rho:peak.rho,votes:peak.votes});if(lines.length===32)break}
 const pairs:{a:Line;b:Line;strength:number}[]=[];for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){const a=lines[i],original=lines[j],difference=Math.abs(a.theta-original.theta),b=difference>Math.PI/2?{...original,theta:original.theta+(original.theta<a.theta?Math.PI:-Math.PI),rho:-original.rho}:original;if(Math.abs(a.theta-b.theta)>Math.PI/12||Math.abs(a.rho-b.rho)<Math.min(w,h)*.3)continue;pairs.push({a,b,strength:a.votes+b.votes})}pairs.sort((a,b)=>b.strength-a.strength);pairs.splice(90);
 let best:Quad|null=null,bestScore=0;for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){const a=pairs[i],b=pairs[j],angle=Math.abs(Math.cos(a.a.theta-b.a.theta));if(angle>.65)continue;const points=[intersection(a.a,b.a),intersection(a.a,b.b),intersection(a.b,b.b),intersection(a.b,b.a)];if(points.some(p=>!p))continue;const quad=ordered(points as {x:number;y:number}[],w,h);if(!quad)continue;const score=outlineScore(quad,gray,w,h,edges);if(score>bestScore){best=quad;bestScore=score}}
 return bestScore>.6?best:null;
}

export function refineOutline(quad:Quad,gray:Uint8Array,w:number,h:number,edges:Edges):Quad{
 const lines:Line[]=[];
 for(let side=0;side<4;side++){
  const a=quad[side],b=quad[(side+1)%4],dx=(b.x-a.x)*(w-1),dy=(b.y-a.y)*(h-1),length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length,points:{x:number;y:number;weight:number}[]=[];
  for(let sample=3;sample<61;sample++){const t=sample/64,x=(a.x*(1-t)+b.x*t)*(w-1),y=(a.y*(1-t)+b.y*t)*(h-1);const nearby:{offset:number;value:number}[]=[];let strength=0,best=0;for(let offset=-3;offset<=3;offset++){const px=Math.round(x+nx*offset),py=Math.round(y+ny*offset);if(px<2||py<2||px>=w-2||py>=h-2)continue;const i=py*w+px,value=edges.gx[i]*nx+edges.gy[i]*ny;if(value>0)nearby.push({offset,value});if(value>strength){strength=value;best=offset}}if(strength>5){const peak=nearby.filter(p=>p.value>=strength*.7);best=peak.reduce((sum,p)=>sum+p.offset*p.value,0)/peak.reduce((sum,p)=>sum+p.value,0);}if(strength>5)points.push({x:x+nx*best,y:y+ny*best,weight:strength})}
  if(points.length<28)return quad;const total=points.reduce((s,p)=>s+p.weight,0),cx=points.reduce((s,p)=>s+p.x*p.weight,0)/total,cy=points.reduce((s,p)=>s+p.y*p.weight,0)/total,xx=points.reduce((s,p)=>s+(p.x-cx)**2*p.weight,0),yy=points.reduce((s,p)=>s+(p.y-cy)**2*p.weight,0),xy=points.reduce((s,p)=>s+(p.x-cx)*(p.y-cy)*p.weight,0),theta=.5*Math.atan2(2*xy,xx-yy)+Math.PI/2;lines.push({theta,rho:cx*Math.cos(theta)+cy*Math.sin(theta),votes:total});
 }
 const points=lines.map((line,i)=>intersection(lines[(i+3)%4],line));if(points.some(p=>!p))return quad;const refined=ordered(points as {x:number;y:number}[],w,h);if(!refined||refined.some((p,i)=>Math.hypot(p.x-quad[i].x,p.y-quad[i].y)>.025))return quad;
 return outlineScore(refined,gray,w,h,edges)>=outlineScore(quad,gray,w,h,edges)-.015?refined:quad;
}
