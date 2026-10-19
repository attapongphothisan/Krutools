import type {ExamDefinition,PaperSize} from '../grading/types';
export async function downloadAnswerPdf(exam:ExamDefinition,paper:PaperSize){
 const source=document.querySelector('.paper-preview svg');if(!source)throw new Error('ยังไม่พบตัวอย่างกระดาษคำตอบ');
 await document.fonts.ready;
 const svg=source.cloneNode(true) as SVGElement;svg.setAttribute('width','2480');svg.setAttribute('height',paper==='A4'?'3508':'1754');svg.removeAttribute('style');
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=2480;canvas.height=3508;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('สร้างกระดาษคำตอบไม่ได้');
  ctx.fillStyle='white';ctx.fillRect(0,0,2480,3508);ctx.drawImage(image,0,0,2480,paper==='A4'?3508:1754);if(paper==='A5')ctx.drawImage(image,0,1754,2480,1754);
  const bytes=await new Promise<ArrayBuffer>((resolve,reject)=>canvas.toBlob(blob=>blob?void blob.arrayBuffer().then(resolve,reject):reject(new Error('สร้างภาพกระดาษคำตอบไม่ได้')),'image/png'));
  const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.create();pdf.setTitle(exam.title);const asset=await pdf.embedPng(bytes);const page=pdf.addPage([210*72/25.4,297*72/25.4]);page.drawImage(asset,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});
  const output=URL.createObjectURL(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}));const link=document.createElement('a');link.href=output;link.download=`${exam.title.replace(/[\\/:*?"<>|]/g,'-')}-กระดาษคำตอบ-${paper}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(output),60000);canvas.width=canvas.height=0;
 }finally{URL.revokeObjectURL(url)}
}
