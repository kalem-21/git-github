import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';

const examSchema=z.object({
  id:z.coerce.number().int().positive().optional(),
  course_id:z.coerce.number().int().positive(),
  title:z.string().min(3).max(220),
  question_count:z.coerce.number().int().min(1).max(200).default(10),
  pass_score:z.coerce.number().min(0).max(100).default(70),
  time_limit_minutes:z.coerce.number().int().min(1).max(600).default(20),
  max_attempts:z.coerce.number().int().min(1).max(20).default(3),
  is_active:z.boolean().default(true)
});

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const s=await requireSession(req,res,'admin'); if(!s)return;
  if(req.method==='GET'){
    const {data,error}=await db.from('exams').select('*,courses(title)').order('id',{ascending:false});
    if(error)return res.status(500).json({error:'db_error'});
    return res.json({ok:true,items:data||[]});
  }
  if(req.method==='POST'){
    const p=examSchema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()});
    const {id,...payload}=p.data;
    const q=id?db.from('exams').update(payload).eq('id',id).select().single():db.from('exams').insert(payload).select().single();
    const {data,error}=await q; if(error)return res.status(500).json({error:'db_error'});
    return res.json({ok:true,item:data});
  }
  if(req.method==='DELETE'){
    const id=Number(req.query.id||req.body?.id); if(!id)return res.status(400).json({error:'id_required'});
    const {error}=await db.from('exams').delete().eq('id',id); if(error)return res.status(500).json({error:'db_error'});
    return res.json({ok:true});
  }
  return res.status(405).json({error:'method_not_allowed'});
}
