import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { verifyPassword, createSession, sessionCookie } from '../lib/auth.js';

const schema = z.object({ email: z.string().email().max(190), password: z.string().min(8).max(128) });

function ipOf(req){ return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim(); }

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  const parsed=schema.safeParse(req.body||{}); if(!parsed.success) return res.status(400).json({error:'invalid_request'});
  const {email,password}=parsed.data; const ip=ipOf(req);

  const {data:ban}=await db.from('blocked_ips').select('id,expires_at').eq('ip',ip).maybeSingle();
  if(ban && (!ban.expires_at || new Date(ban.expires_at)>new Date())) return res.status(403).json({error:'access_denied'});

  const {data:attempt}=await db.from('login_attempts').select('*').eq('ip',ip).eq('email',email).maybeSingle();
  if(attempt?.locked_until && new Date(attempt.locked_until)>new Date()) return res.status(429).json({error:'temporarily_locked'});

  const {data:user}=await db.from('users').select('id,first_name,last_name,email,password_hash,status,role_id,roles(slug)').eq('email',email).maybeSingle();
  const roleSlug=user?.roles?.slug;
  const ok=user && user.status==='active' && await verifyPassword(password,user.password_hash);
  if(!ok){
    const count=(attempt?.failed_count||0)+1; const locked=count>=5?new Date(Date.now()+15*60*1000).toISOString():null;
    await db.from('login_attempts').upsert({ip,email,failed_count:count,last_failed_at:new Date().toISOString(),locked_until:locked},{onConflict:'ip,email'});
    await db.from('security_events').insert({event_type:'login_failed',severity:'medium',ip,request_uri:'/api/login',details:email});
    if(count>=10) await db.from('blocked_ips').upsert({ip,reason:'Brute force automatic ban',expires_at:new Date(Date.now()+24*60*60*1000).toISOString()},{onConflict:'ip'});
    return res.status(401).json({error:'invalid_credentials'});
  }
  await db.from('login_attempts').delete().eq('ip',ip).eq('email',email);
  await db.from('users').update({last_login_at:new Date().toISOString(),last_login_ip:ip}).eq('id',user.id);
  const token=await createSession({...user,role_slug:roleSlug});
  res.setHeader('Set-Cookie',sessionCookie(token));
  return res.status(200).json({ok:true,redirect:roleSlug==='admin'?'/admin':'/academy',user:{id:user.id,name:`${user.first_name} ${user.last_name}`,role:roleSlug}});
}
