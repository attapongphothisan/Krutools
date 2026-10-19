// Conservative text-row rectification. A shared smooth curve must be supported
// by several separate text rows; ambiguous pages are returned unchanged.
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]??0};
function fit(points:{x:number;y:number}[],degree:number){
 const n=degree+1,m=Array.from({length:n},(_,i)=>Array.from({length:n+1},(_,j)=>points.reduce((sum,p)=>sum+(j===n?p.y*p.x**i:p.x**(i+j)),0)));
 for(let i=0;i<n;i++){let pivot=i;for(let k=i+1;k<n;k++)if(Math.abs(m[k][i])>Math.abs(m[pivot][i]))pivot=k;[m[i],m[pivot]]=[m[pivot],m[i]];const d=m[i][i];if(Math.abs(d)<1e-8)return null;for(let j=i;j<=n;j++)m[i][j]/=d;for(let k=0;k<n;k++)if(k!==i){const v=m[k][i];for(let j=i;j<=n;j++)m[k][j]-=v*m[i][j]}}
 return m.map(row=>row[n]);
}
function bands(profile:Float64Array){
 const mean=profile.reduce((s,v)=>s+v,0)/profile.length,variance=profile.reduce((s,v)=>s+(v-mean)**2,0)/profile.length,threshold=Math.max(.025,mean+Math.sqrt(variance)*.4),peaks:number[]=[];
 for(let y=2;y<profile.length-2;y++){if(profile[y]<=threshold)continue;const start=y;let weight=0,total=0;while(y<profile.length-2&&profile[y]>threshold){weight+=profile[y];total+=y*profile[y];y++}if(y-start<=profile.length*.035&&weight>0)peaks.push(total/weight)}return peaks;
}
export function straightenTextRows(data:Uint8ClampedArray,width:number,height:number){
 if(width<120||height<150)return data;
 const rows=Math.min(800,height),cols=15,profiles:Float64Array[]=[];let colored=0,samples=0;
 for(let col=0;col<cols;col++){
  const raw=new Float64Array(rows);for(let y=0;y<rows;y++){const sy=Math.round(y*(height-1)/(rows-1));for(let sample=0;sample<18;sample++){const x=Math.min(width-1,Math.floor((col+(sample+.5)/18)*width/cols)),i=(sy*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];raw[y]+=Math.max(0,190-(.299*r+.587*g+.114*b))/(190*18);if(Math.max(r,g,b)-Math.min(r,g,b)>55)colored++;samples++}}
  profiles.push(Float64Array.from(raw,(v,y)=>(raw[Math.max(0,y-1)]+2*v+raw[Math.min(rows-1,y+1)])/4));
 }
 if(colored/samples>.15)return data;
 const reference=Float64Array.from(profiles[7],(_,y)=>(profiles[6][y]+profiles[7][y]+profiles[8][y])/3),lines=bands(reference).filter(y=>y>rows*.1&&y<rows*.9);
 if(lines.length<5)return data;
 const matches:{x:number;y:number;line:number}[]=[],offsets:{x:number;y:number}[]=[];
 for(let col=0;col<cols;col++){
  const peaks=bands(profiles[col]),column:{x:number;y:number;line:number}[]=[];
  for(let line=0;line<lines.length;line++){const ref=lines[line],gap=Math.min(ref-(lines[line-1]??0),(lines[line+1]??rows)-ref),limit=Math.min(rows*.035,gap*.32);let closest:number|undefined;for(const peak of peaks)if(Math.abs(peak-ref)<limit&&(closest===undefined||Math.abs(peak-ref)<Math.abs(closest-ref)))closest=peak;if(closest!==undefined)column.push({x:(col+.5)/cols*2-1,y:closest-ref,line})}
  if(column.length<Math.max(4,lines.length*.6))continue;const shift=median(column.map(p=>p.y));if(median(column.map(p=>Math.abs(p.y-shift)))>2.5)continue;offsets.push({x:(col+.5)/cols*2-1,y:shift});matches.push(...column.filter(p=>Math.abs(p.y-shift)<4));
 }
 if(offsets.length<10||offsets[0].x>-.65||offsets.at(-1)!.x<.65)return data;
 const curve=fit(offsets,2);if(!curve)return data;const [c,b,a]=curve,error=Math.sqrt(offsets.reduce((s,p)=>s+(p.y-c-b*p.x-a*p.x*p.x)**2,0)/offsets.length);
 if(error>1.8||Math.abs(a)<1.8||Math.abs(a)>rows*.04)return data;
 let before=0,after=0,good=0,checked=0;
 for(let line=0;line<lines.length;line++){const points=matches.filter(p=>p.line===line);if(points.length<9)continue;const linear=fit(points,1),corrected=points.map(p=>({x:p.x,y:p.y-a*p.x*p.x})),flat=fit(corrected,1);if(!linear||!flat)continue;const v0=points.reduce((s,p)=>s+(p.y-linear[0]-linear[1]*p.x)**2,0),v1=corrected.reduce((s,p)=>s+(p.y-flat[0]-flat[1]*p.x)**2,0);before+=v0;after+=v1;checked++;if(v1<v0*.6)good++}
 if(checked<Math.max(4,Math.ceil(lines.length*.8))||good<checked*.85||after>before*.5)return data;
 const out=new Uint8ClampedArray(data.length),meanSquare=offsets.reduce((s,p)=>s+p.x*p.x,0)/offsets.length;
 for(let x=0;x<width;x++){const nx=(x+.5)/width*2-1,offset=a*(nx*nx-meanSquare)*height/rows;for(let y=0;y<height;y++){const sy=Math.max(0,Math.min(height-1,y+offset)),y0=Math.floor(sy),y1=Math.min(height-1,y0+1),dy=sy-y0,i=(y*width+x)*4;for(let channel=0;channel<3;channel++)out[i+channel]=data[(y0*width+x)*4+channel]*(1-dy)+data[(y1*width+x)*4+channel]*dy;out[i+3]=data[i+3]}}
 return out;
}
