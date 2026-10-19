import {describe,it,expect} from 'vitest';
import {filterPixels} from '../features/document-scanner/color';
describe('document image modes',()=>{
 it('keeps original color samples unchanged and creates an independent result',()=>{
  const source=new Uint8ClampedArray([255,0,0,255,0,255,0,255,0,0,255,255]);
  const output=filterPixels(source,3,1,'original');expect(output).toEqual(source);expect(output).not.toBe(source);
  expect(filterPixels(source,3,1,'original',.4)).toEqual(source);expect(source[1]).toBe(0);
 });
 it('separates text from paper on both dark and light sides of an unevenly lit page',()=>{
  const w=160,h=80,source=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const ink=y>=36&&y<=39&&((x>=24&&x<=48)||(x>=112&&x<=136));
   const value=ink?30:Math.round(100+140*x/(w-1));source.set([value,value,value,255],(y*w+x)*4);
  }
  const result=filterPixels(source,w,h,'bw');
  for(const x of [30,120]){expect(result[(37*w+x)*4]).toBe(0);expect(result[(30*w+x)*4]).toBe(255)}
  expect(new Set(Array.from(result).filter((_,i)=>i%4!==3))).toEqual(new Set([0,255]));
 });
 it('keeps uniform white paper white, including edge pixels',()=>{
  const source=new Uint8ClampedArray(12*8*4).fill(255);expect(filterPixels(source,12,8,'bw')).toEqual(source);
 });
});
