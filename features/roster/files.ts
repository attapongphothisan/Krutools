import type {Student} from '../grading/types';
export type RosterPreview={validRows:Array<{number:number;fullName:string}>;errors:Array<{row:number;message:string}>};
export function parseRosterRows(rows:unknown[][],existing:Pick<Student,'number'>[]=[]):RosterPreview{
 const out:RosterPreview={validRows:[],errors:[]},seen=new Set(existing.map(s=>s.number));
 const header=String(rows[0]?.[0]??'').trim();if(!['เลขที่','number','No.'].includes(header)){out.errors.push({row:1,message:'แถวแรกต้องเป็นหัวตาราง เลขที่ และชื่อ–นามสกุล'});return out}
 if(rows.length>2001){out.errors.push({row:1,message:'นำเข้าได้ไม่เกิน 2,000 รายชื่อต่อครั้ง'});return out}
 rows.slice(1).forEach((row,i)=>{if(row.every(v=>v==null||String(v).trim()===''))return;const number=Number(row[0]),fullName=String(row[1]??'').trim();if(!Number.isInteger(number)||number<1||number>99999)out.errors.push({row:i+2,message:'เลขที่ต้องเป็นจำนวนเต็มมากกว่า 0'});else if(!fullName||fullName.length>160)out.errors.push({row:i+2,message:'กรุณาระบุชื่อ–นามสกุลไม่เกิน 160 ตัวอักษร'});else if(seen.has(number))out.errors.push({row:i+2,message:`เลขที่ ${number} ซ้ำ`});else{seen.add(number);out.validRows.push({number,fullName})}});return out;
}
export async function parseRoster(file:File,existing:Student[]=[]){if(file.size>5*1024*1024)throw Error('ไฟล์ต้องไม่เกิน 5 MB');let rows:unknown[][];
 if(file.name.toLowerCase().endsWith('.xlsx')){const ExcelJS=(await import('exceljs')).default,wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const sheet=wb.worksheets[0];if(!sheet)throw Error('ไม่พบชีตในไฟล์');rows=[];sheet.eachRow({includeEmpty:true},r=>rows.push([r.getCell(1).text,r.getCell(2).text]))}
 else if(file.name.toLowerCase().endsWith('.csv')){const Papa=(await import('papaparse')).default;const parsed=Papa.parse<string[]>(await file.text(),{skipEmptyLines:'greedy'});if(parsed.errors.length)throw Error('อ่าน CSV ไม่ได้ กรุณาตรวจรูปแบบไฟล์');rows=parsed.data}
 else throw Error('รองรับไฟล์ .xlsx และ .csv');return parseRosterRows(rows,existing);
}
export function downloadBytes(buffer:ArrayBuffer,filename:string,type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){const url=URL.createObjectURL(new Blob([buffer],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
export async function downloadRosterTemplate(){const E=(await import('exceljs')).default,w=new E.Workbook(),s=w.addWorksheet('รายชื่อ');s.addRow(['เลขที่','ชื่อ–นามสกุล']);s.getColumn(1).width=12;s.getColumn(2).width=36;downloadBytes(await w.xlsx.writeBuffer() as ArrayBuffer,'แบบฟอร์มรายชื่อนักเรียน.xlsx')}
