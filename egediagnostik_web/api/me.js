import { readSession } from '../lib/auth.js';

function cookie(req,name){
  const raw=req.headers.cookie||'';
  const hit=raw.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='));
  return hit?decodeURIComponent(hit.slice(name.length+1)):null;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'method_not_allowed'});
  try{
    const token=cookie(req,'ege_session');
    if(!token) return res.status(401).json({error:'unauthorized'});
    const s=await readSession(token);
    return res.status(200).json({ok:true,user:{id:s.sub,name:s.name,role:s.role}});
  }catch{
    return res.status(401).json({error:'invalid_session'});
  }
}
