import { createClient } from '@supabase/supabase-js';
let client=null;
function getClient(){
  if(client)return client;
  const url=process.env.SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!serviceKey)throw new Error('Supabase environment variables are missing');
  client=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{'X-Client-Info':'egediagnostik-web'}}});
  return client;
}
export const db=new Proxy({}, {get(_target,prop){const c=getClient();const value=c[prop];return typeof value==='function'?value.bind(c):value;}});
