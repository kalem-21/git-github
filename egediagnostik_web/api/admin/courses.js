import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';
const schema=z.object({id:z.coerce.number().int().positive().optional(),category_id:z.coerce.number().int().positive().nullable().optional(),title:z.string().min(3).max(220),slug:z.string().min(2).max(230),summary:z.string().max(3000).optional().nullable(),cover_url:z.string().max(1000).optional().nullable(),level:z.string().max(50).optional().nullable(),duration_minutes:z.coerce.number().int().min(0).max(100000).default(0),is_active:z.boolean().default(true)});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res,'admin'); if(!s)return;
 if(req.method==='GET'){const {data,error}=await db.from('courses').select('*').order('id',{ascending:false}); if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true,items:data||[]});}
 if(req.method==='POST'){const p=schema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()}); const {id,...payload}=p.data; const q=id?db.from('courses').update(payload).eq('id',id).select().single():db.from('courses').insert(payload).select().single(); const {data,error}=await q; if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true,item:data});}
 if(req.method==='DELETE'){const id=Number(req.query.id||req.body?.id); if(!id)return res.status(400).json({error:'id_required'}); const {error}=await db.from('courses').delete().eq('id',id); if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true});}
 return res.status(405).json({error:'method_not_allowed'});
}
