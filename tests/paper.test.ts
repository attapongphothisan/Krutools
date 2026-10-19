import { expect,it } from 'vitest';
import {buildLayout,qrPayload,parsePayload} from '../features/paper/layout';
for(const paper of ['A4','A5'] as const)for(const count of [1,30,60])it(`${paper} ${count} has valid circles`,()=>{const l=buildLayout(paper,count);expect(l.bubbles).toHaveLength(count*4);for(const b of l.bubbles){expect(b.center.x-b.radiusMm).toBeGreaterThan(0);expect(b.center.x+b.radiusMm).toBeLessThan(l.widthMm);expect(b.center.y+b.radiusMm).toBeLessThan(l.heightMm)}expect(l.anchors).toHaveLength(4)});
it('payload identifies paper and exam without a workspace secret',()=>{expect(parsePayload(qrPayload('abc',60,'A5'))).toEqual({examId:'abc',questionCount:60,paper:'A5'});expect(parsePayload('wrong')).toBe(null)});
it('keeps A5 answer circles below the handwritten header and instructions',()=>expect(buildLayout('A5',60).bubbles[0].center.y-1.5).toBeGreaterThan(51));
