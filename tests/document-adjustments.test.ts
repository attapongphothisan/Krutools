import {expect,it} from 'vitest';
import {flattenTextCurve} from '../features/document-scanner/geometry';
import {filterPixels} from '../features/document-scanner/color';
import {exportFilename} from '../features/document-scanner/export-layout';
it('straightens a mild text-line curve and leaves blank paper unchanged',()=>{
 const width=400,height=600,data=new Uint8ClampedArray(width*height*4).fill(255),rows=[100,155,225,310,395,472];
 for(let x=0;x<width;x++){const offset=Math.round(13*Math.cos(x/width*Math.PI*2));for(const row of rows)for(let dy=-2;dy<=2;dy++){const at=((row+offset+dy)*width+x)*4;data[at]=data[at+1]=data[at+2]=20}}
 const out=flattenTextCurve(data,width,height,1);
 const baseline=(pixels:Uint8ClampedArray,x:number)=>{let sum=0,n=0;for(let y=75;y<125;y++)if(pixels[(y*width+x)*4]<100){sum+=y;n++}return sum/n};
 const range=(pixels:Uint8ClampedArray)=>{const values=[20,100,200,300,380].map(x=>baseline(pixels,x));return Math.max(...values)-Math.min(...values)};
 expect(range(out)).toBeLessThan(range(data)*.5);
 const blank=new Uint8ClampedArray(width*height*4).fill(255);expect(flattenTextCurve(blank,width,height,1)).toEqual(blank);
});
it('sharpness increases edge contrast without changing dimensions or alpha',()=>{const data=new Uint8ClampedArray([100,100,100,255,100,100,100,255,100,100,100,255,100,100,100,255,150,150,150,255,100,100,100,255,100,100,100,255,100,100,100,255,100,100,100,255]);const out=filterPixels(data,3,3,'original',.5);expect(out[16]).toBeGreaterThan(data[16]);expect(out).toHaveLength(data.length);expect(out[19]).toBe(255)});
it('uses a JPEG for one image and ZIP for multiple images',()=>{expect(exportFilename('เอกสาร','images',1)).toBe('เอกสาร.jpg');expect(exportFilename('เอกสาร','images',2)).toBe('เอกสาร.zip')});
