import {describe,it,expect} from 'vitest';
import {PDFDocument} from 'pdf-lib';
import {unzipSync} from 'fflate';
import {a4Layout,cleanFilename,defaultExportName,exportFilename} from '../features/document-scanner/export-layout';
import {assemblePdf,archivePdfs,type ExportImage} from '../features/document-scanner/pdf';
const png=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DAwPAfAAcAAf9+CLHQAAAAAElFTkSuQmCC','base64'));
const picture:ExportImage={bytes:png,type:'png',width:2,height:1,rotation:0};
describe('document PDF export',()=>{
 it('fits portrait and rotated landscape images inside 5 mm A4 margins without distortion',()=>{
  const margin=5*72/25.4;
  for(const rotation of [0,90,180,270]){
   const layout=a4Layout(1200,1800,rotation),ratio=rotation%180?1800/1200:1200/1800;
   expect(layout.imageWidth/layout.imageHeight).toBeCloseTo(ratio,8);
   expect(layout.x).toBeGreaterThanOrEqual(margin-1e-8);expect(layout.y).toBeGreaterThanOrEqual(margin-1e-8);
   expect(layout.x*2+layout.imageWidth).toBeCloseTo(layout.pageWidth,8);
   expect(layout.y*2+layout.imageHeight).toBeCloseTo(layout.pageHeight,8);
   expect(layout.landscape).toBe(rotation%180!==0);
  }
 });
 it('creates a readable combined PDF in input order with the correct A4 orientation',async()=>{
  const bytes=await assemblePdf([picture,{...picture,rotation:90}],new AbortController().signal,'เอกสารทดสอบ');
  const doc=await PDFDocument.load(bytes);expect(doc.getTitle()).toBe('เอกสารทดสอบ');expect(doc.getPageCount()).toBe(2);
  expect(doc.getPage(0).getWidth()).toBeCloseTo(297*72/25.4,4);expect(doc.getPage(0).getHeight()).toBeCloseTo(210*72/25.4,4);
  expect(doc.getPage(1).getWidth()).toBeCloseTo(210*72/25.4,4);expect(doc.getPage(1).getHeight()).toBeCloseTo(297*72/25.4,4);
 });
 it('archives separate one-page PDFs with ordered Thai filenames and preserves their bytes',async()=>{
  const signal=new AbortController().signal;
  const first=await assemblePdf([picture],signal,'หนึ่ง'),second=await assemblePdf([{...picture,rotation:90}],signal,'สอง');
  const files={'ใบงาน-001.pdf':first,'ใบงาน-002.pdf':second},zip=await archivePdfs(files,signal),restored=unzipSync(zip);
  expect(Object.keys(restored)).toEqual(Object.keys(files));expect(restored['ใบงาน-001.pdf']).toEqual(first);
  expect((await PDFDocument.load(restored['ใบงาน-002.pdf'])).getPageCount()).toBe(1);
 });
 it('stops a partially assembled document when cancellation arrives between pages',async()=>{
  const controller=new AbortController();
  function* pages(){yield picture;controller.abort();yield picture}
  await expect(assemblePdf(pages(),controller.signal,'ยกเลิก')).rejects.toMatchObject({name:'AbortError'});
 });
 it('normalizes filenames without paths or duplicate extensions and handles the single-page exception',()=>{
  expect(cleanFilename(' ใบงาน.pdf.zip ')).toBe('ใบงาน');expect(cleanFilename('../../ใบงาน:ม.6')).not.toMatch(/[/:]/);
  expect(cleanFilename('CON')).toBe('เอกสาร-CON');expect(cleanFilename('...')).toBe('เอกสาร');
  expect(exportFilename('ใบงาน.pdf','combined',2)).toBe('ใบงาน.pdf');expect(exportFilename('ใบงาน','separate',2)).toBe('ใบงาน.zip');expect(exportFilename('ใบงาน','separate',1)).toBe('ใบงาน.pdf');
  expect(defaultExportName(new Date(2026,9,19))).toBe('เอกสาร-2026-10-19');
 });
});
