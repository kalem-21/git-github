import { readSession } from './auth.js';

export function cookie(req,name){
  const raw=req.headers.cookie||'';
  const hit=raw.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='));
  return hit?decodeURIComponent(hit.slice(name.length+1)):null;
}

export async function requireSession(req,res,role){
  try{
    const token=cookie(req,'ege_session');
    if(!token){ res.status(401).json({error:'unauthorized'}); return null; }
    const session=await readSession(token);
    if(role && session.role!==role){ res.status(403).json({error:'forbidden'}); return null; }
    return session;
  }catch{
    res.status(401).json({error:'invalid_session'}); return null;
  }
}
