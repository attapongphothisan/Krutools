import {describe,it,expect} from 'vitest';
import {detectDocument,fullFrame,validQuad,warpDocument,type Quad} from '../features/document-scanner/geometry';
function frame(w:number,h:number,fill:(x:number,y:number)=>number[]){const data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)data.set(fill(x,y),(y*w+x)*4);return data}
describe('document perspective correction',()=>{
 it('maps the four corners of an off-center trapezoid to the output corners without flipping them',()=>{
  const w=101,h=101,data=frame(w,h,(x,y)=>[x*2,y*2,40,255]);
  const corners:Quad=[{x:.2,y:.1},{x:.8,y:.2},{x:.9,y:.9},{x:.1,y:.8}];
  const output=warpDocument(data,w,h,corners);
  const pixel=(x:number,y:number)=>Array.from(output.data.slice((y*output.width+x)*4,(y*output.width+x)*4+3));
  expect(pixel(0,0)).toEqual([40,20,40]);expect(pixel(output.width-1,0)).toEqual([160,40,40]);
  expect(pixel(output.width-1,output.height-1)).toEqual([180,180,40]);expect(pixel(0,output.height-1)).toEqual([20,160,40]);
 });
 it('rejects crossed, collapsed and out-of-bounds quadrilaterals before processing',()=>{
  expect(validQuad(fullFrame())).toBe(true);
  for(const corners of [
   [{x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1}],
   [{x:0,y:0},{x:.001,y:0},{x:.001,y:.001},{x:0,y:.001}],
   [{x:-.1,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],
  ] as Quad[]){expect(validQuad(corners)).toBe(false);expect(()=>warpDocument(new Uint8ClampedArray(400),10,10,corners)).toThrow()}
 });
 it('detects a bright document on a contrasting background and declines an ambiguous blank frame',()=>{
  const w=200,h=150;
  const data=frame(w,h,(x,y)=>{const value=x>=20&&x<180&&y>=15&&y<135?245:60;return[value,value,value,255]});
  const corners=detectDocument(data,w,h);expect(corners).not.toBeNull();
  expect(corners![0].x).toBeCloseTo(20/199,2);expect(corners![0].y).toBeCloseTo(15/149,2);
  expect(corners![2].x).toBeCloseTo(179/199,2);expect(corners![2].y).toBeCloseTo(134/149,2);
  expect(detectDocument(frame(w,h,()=>[255,255,255,255]),w,h)).toBeNull();
 });
 it('finds a rotated page from its contour instead of diagonal extrema',()=>{
  const w=240,h=220,quad:Quad=[{x:.25,y:.08},{x:.9,y:.35},{x:.68,y:.92},{x:.07,y:.67}];
  const pixels=frame(w,h,(x,y)=>{const p={x:x/(w-1),y:y/(h-1)},inside=quad.every((a,i)=>{const b=quad[(i+1)%4];return(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)>=0});const value=inside?245:45;return[value,value,value,255]});
  const found=detectDocument(pixels,w,h);expect(found).not.toBeNull();found!.forEach((p,i)=>expect(Math.hypot(p.x-quad[i].x,p.y-quad[i].y)).toBeLessThan(.035));
 });

});
