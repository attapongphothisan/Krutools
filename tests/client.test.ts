import {it,expect,vi,afterEach} from 'vitest';
import {useToken,workspaceRequest,readToken,createWorkspace} from '../features/workspace/client';

afterEach(()=>{useToken('');vi.unstubAllGlobals()});

it('requires an active workspace before opening local storage',async()=>{
 useToken('');
 await expect(workspaceRequest()).rejects.toMatchObject({code:'NO_WORKSPACE'});
});

it('reads the saved local workspace token',()=>{
 vi.stubGlobal('localStorage',{getItem:vi.fn(()=> 'saved-token')});
 expect(readToken()).toBe('saved-token');
});

it('handles unavailable local storage',()=>{
 vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('Storage blocked')}});
 expect(readToken()).toBe('');
});

it.each([[undefined,'kru-tools-local-root'],[{pathname:'/teacher-tools/'},'kru-tools-local-teacher-tools']])('opens the correct database with location %j',async(locationValue,expected)=>{
 vi.stubGlobal('location',locationValue);
 vi.stubGlobal('localStorage',{getItem:()=> 'saved-token'});
 const failure=new Error('Database unavailable');
 const open=vi.fn(()=>{
  const request={error:failure,onerror:null as null|(()=>void)};
  queueMicrotask(()=>request.onerror?.());
  return request;
 });
 vi.stubGlobal('indexedDB',{open});
 await expect(createWorkspace()).rejects.toThrow('Database unavailable');
 expect(open).toHaveBeenCalledWith(expected,1);
});
