export type ImageMode='original'|'gray'|'sharp';
export const imageModes=[{value:'original' as const,label:'สีเดิม'},{value:'gray' as const,label:'ขาวดำ'},{value:'sharp' as const,label:'ขาวดำคมชัด'}];
export function filterPixels(data:Uint8ClampedArray,width:number,height:number,mode:ImageMode,sharpness=0){
 const output=new Uint8ClampedArray(data);
 let amount=sharpness;
 if(sharpness<0){let edge=0,samples=0;for(let y=2;y<height-2;y+=4)for(let x=2;x<width-2;x+=4){const i=(y*width+x)*4,gray=(at:number)=>.299*data[at]+.587*data[at+1]+.114*data[at+2],center=gray(i),neighbors=(gray(i-4)+gray(i+4)+gray(i-width*4)+gray(i+width*4))/4;edge+=Math.abs(center-neighbors);samples++}const edgeLevel=samples?edge/samples:0;amount=Math.max(.08,Math.min(.48,.48-edgeLevel/50))}
 if(amount>0)for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=(y*width+x)*4;for(let c=0;c<3;c++){const blur=(data[i-4+c]+data[i+4+c]+data[i-width*4+c]+data[i+width*4+c])/4;output[i+c]=Math.max(0,Math.min(255,data[i+c]+(data[i+c]-blur)*amount*2))}}
 if(mode==='original')return output;
 const gray=new Uint8Array(width*height);
 for(let i=0;i<gray.length;i++)gray[i]=Math.round(.299*output[i*4]+.587*output[i*4+1]+.114*output[i*4+2]);
 if(mode==='gray'){
  for(let i=0;i<gray.length;i++)output[i*4]=output[i*4+1]=output[i*4+2]=gray[i];
  return output;
 }
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
  const threshold=mean*(1+.22*(Math.sqrt(variance)/128-1)),value=gray[y*width+x]<=threshold?0:255,index=(y*width+x)*4;
  output[index]=output[index+1]=output[index+2]=value;
 }
 return output;
}
