export type ImageMode='original'|'color'|'bw';
export const imageModes=[{value:'original' as const,label:'ภาพเดิม'},{value:'color' as const,label:'สแกนสี'},{value:'bw' as const,label:'สแกนขาวดำ'}];
export function filterPixels(data:Uint8ClampedArray,width:number,height:number,mode:ImageMode,sharpness=0){
 const output=new Uint8ClampedArray(data);
 if(mode==='original')return output;
 const amount=Math.max(0,Math.min(.4,sharpness));
 if(amount>0)for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=(y*width+x)*4;for(let c=0;c<3;c++){const blur=(data[i-4+c]+data[i+4+c]+data[i-width*4+c]+data[i+width*4+c])/4;output[i+c]=Math.max(0,Math.min(255,data[i+c]+(data[i+c]-blur)*amount*2))}}
 const gray=new Uint8Array(width*height);
 for(let i=0;i<gray.length;i++)gray[i]=Math.round(.299*output[i*4]+.587*output[i*4+1]+.114*output[i*4+2]);
 // Local mean and variance preserve text across uneven lighting (Sauvola threshold).
 const stride=width+1,sum=new Float64Array(stride*(height+1)),squares=new Float64Array(sum.length);
 for(let y=1;y<=height;y++){
  let row=0,rowSquares=0;
  for(let x=1;x<=width;x++){const v=gray[(y-1)*width+x-1];row+=v;rowSquares+=v*v;sum[y*stride+x]=sum[(y-1)*stride+x]+row;squares[y*stride+x]=squares[(y-1)*stride+x]+rowSquares}
 }
 const radius=Math.max(8,Math.min(48,Math.round(Math.min(width,height)*.025)));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const x0=Math.max(0,x-radius),x1=Math.min(width,x+radius+1),y0=Math.max(0,y-radius),y1=Math.min(height,y+radius+1),count=(x1-x0)*(y1-y0);
  const a=y0*stride+x0,b=y0*stride+x1,c=y1*stride+x0,d=y1*stride+x1;
  const mean=(sum[d]-sum[b]-sum[c]+sum[a])/count,variance=Math.max(0,(squares[d]-squares[b]-squares[c]+squares[a])/count-mean*mean);
  const index=(y*width+x)*4;
  if(mode==='color'){const background=Math.max(100,Math.min(255,mean+Math.sqrt(variance)*1.2)),gain=Math.min(2,255/background);for(let channel=0;channel<3;channel++)output[index+channel]=Math.max(0,Math.min(255,(output[index+channel]*gain-6)*1.025))}
  else{const threshold=mean*(1+.22*(Math.sqrt(variance)/128-1)),value=gray[y*width+x]<=threshold?0:255;output[index]=output[index+1]=output[index+2]=value;}
 }
 return output;
}
