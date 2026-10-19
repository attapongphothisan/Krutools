import {expect,it} from 'vitest';
import {parseRosterRows} from '../features/roster/files';
it('keeps Thai names and trims whitespace',()=>expect(parseRosterRows([['เลขที่','ชื่อ–นามสกุล'],[1,' เด็กชาย ทดสอบ ']]).validRows).toEqual([{number:1,fullName:'เด็กชาย ทดสอบ'}]));
it('rejects duplicate and invalid student numbers',()=>{const r=parseRosterRows([['เลขที่','ชื่อ–นามสกุล'],[1,'ก'],[1,'ข'],['x','ค']]);expect(r.errors).toHaveLength(2)});
