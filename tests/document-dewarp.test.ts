import {expect,it} from 'vitest';
import {straightenTextRows} from '../features/document-scanner/dewarp';
const width=450,height=650,lines=[100,175,250,325,400,475,550];
function document(curve:(x:number,line:number)=>number){const data=new Uint8ClampedArray(width*height*4).fill(255);for(let x=0;x<width;x++)for(let line=0;line<lines.length;line++){const y=lines[line]+Math.round(curve(x,line));for(let dy=-2;dy<=2;dy++){const i=((y+dy)*width+x)*4;data[i]=data[i+1]=data[i+2]=30}}return data}
function spread(data:Uint8ClampedArray){const values=[20,100,225,350,430].map(x=>{let weight=0,sum=0;for(let y=75;y<140;y++){const ink=255-data[(y*width+x)*4];sum+=y*ink;weight+=ink}return sum/weight});return Math.max(...values)-Math.min(...values)}
it('reduces a shared paper curve supported by several text rows',()=>{const input=document(x=>14*(2*x/width-1)**2),result=straightenTextRows(input,width,height);expect(result===input).toBe(false);expect(spread(result)).toBeLessThan(spread(input)*.35);expect(result.length).toBe(input.length)});
it('preserves already straight text and blank pages exactly',()=>{for(const input of [document(()=>0),new Uint8ClampedArray(width*height*4).fill(255)])expect(straightenTextRows(input,width,height)===input).toBe(true)});
it('declines contradictory curves instead of bending the page based on one row',()=>{const input=document((x,line)=>(line%2?1:-1)*14*(2*x/width-1)**2);expect(straightenTextRows(input,width,height)===input).toBe(true)});
it('does not geometrically alter a colorful illustration',()=>{const input=document(x=>14*(2*x/width-1)**2);for(let i=0;i<input.length;i+=4){input[i]=100;input[i+1]=170;input[i+2]=240}expect(straightenTextRows(input,width,height)===input).toBe(true)});
