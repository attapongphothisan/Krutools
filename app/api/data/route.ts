import {authorizeWorkspace} from '../../../server/access';import {execute,snapshot} from '../../../server/repository';import {json,failure,readJson} from '../../../server/http';
export async function GET(request:Request){try{const{workspaceId}=await authorizeWorkspace(request);return json({...await snapshot(workspaceId),workspaceId})}catch(e){return failure(e)}}
export async function POST(request:Request){try{const{workspaceId}=await authorizeWorkspace(request);return json({...await execute(workspaceId,await readJson(request)),workspaceId})}catch(e){return failure(e)}}
