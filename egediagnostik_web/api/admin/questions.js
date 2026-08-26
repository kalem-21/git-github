import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';

const schema=z.object({
  id:z.coerce.number().int().positive().optional(),
  exam_id:z.coerce.number().int().positive(),
  question_text:z.string().min(3),
  option_a:z.string().min(1), option_b:z.string().min(1), option_c:z.string().min(1), option_d:z.string().min(1),
  correct_option:z.enum(['A','B','C','D']),
  explanation:z.string().max(4000).optional().nullable(),
  is_active:z.boolean().default(true)
});

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const s=await requireSession(req,res,'admin'); if(!s)return;
  if(req.method==='GET'){
    const examId=Number(req.query.exam_id||0);
    let q=db.from('exam_questions').select('*').order('id',{ascending:true});
    if(examId)q=q.eq('exam_id',examId);
    const {data,error}=await q; if(error)return res.status(500).json({error:'db_error'});
    return res.json({ok:true,items:data||[]});
  }
  if(req.method==='POST'){
    const p=schema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()});
    const {id,...payload}=p.data;
    const q=id?db.from('exam_questions').update(payload).eq('id',id).select().single():db.from('exam_questions').insert(payload).select().single();
    const {data,error}=await q; if(error)return res.status(500).json({error:'db_error'});
    return res.json({ok:true,item:data});
  }
  if(req.method==='DELETE'){
    const id=Number(req.query.id||req.body?.id); if(!id)return res.status(400).json({error:'id_required'});
    const {error}=await db.from('exam_questions').delete().eq('id',id); if(error)return res.status(500).json({error:'db_error'});
    return res.json({ok:true});
  }
  return res.status(405).json({error:'method_not_allowed'});
}
