import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';
import { hashPassword } from '../../lib/auth.js';
const schema=z.object({id:z.coerce.number().int().positive().optional(),role_id:z.coerce.number().int().positive(),first_name:z.string().min(2).max(100),last_name:z.string().min(2).max(100),email:z.string().email().max(190),phone:z.string().max(40).optional().nullable(),institution:z.string().max(190).optional().nullable(),password:z.string().min(8).max(128).optional(),status:z.enum(['active','passive','blocked']).default('active')});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res,'admin'); if(!s)return;
 if(req.method==='GET'){
   const [u,r]=await Promise.all([db.from('users').select('id,role_id,first_name,last_name,email,phone,institution,status,last_login_at,created_at,roles(slug,name)').order('id',{ascending:false}),db.from('roles').select('id,name,slug').order('id')]);
   if(u.error||r.error)return res.status(500).json({error:'db_error'}); return res.json({ok:true,items:u.data||[],roles:r.data||[]});
 }
 if(req.method==='POST'){
   const p=schema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()});
   const {id,password,...payload}=p.data;
   if(!id&&!password)return res.status(400).json({error:'password_required'});
   if(password)payload.password_hash=await hashPassword(password);
   const q=id?db.from('users').update(payload).eq('id',id).select('id,role_id,first_name,last_name,email,phone,institution,status').single():db.from('users').insert(payload).select('id,role_id,first_name,last_name,email,phone,institution,status').single();
   const {data,error}=await q; if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true,item:data});
 }
 if(req.method==='DELETE'){
   const id=Number(req.query.id||req.body?.id); if(!id)return res.status(400).json({error:'id_required'}); if(String(id)===String(s.sub))return res.status(400).json({error:'cannot_delete_self'});
   const {error}=await db.from('users').delete().eq('id',id); if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true});
 }
 return res.status(405).json({error:'method_not_allowed'});
}
