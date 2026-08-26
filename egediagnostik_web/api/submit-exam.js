import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';
const schema=z.object({exam_id:z.coerce.number().int().positive(),answers:z.record(z.string(),z.enum(['A','B','C','D']))});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res); if(!s)return;
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 const p=schema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request'});
 const {exam_id,answers}=p.data;
 const {data:exam}=await db.from('exams').select('id,pass_score,max_attempts,is_active').eq('id',exam_id).maybeSingle();
 if(!exam?.is_active)return res.status(404).json({error:'exam_not_found'});
 const {count}=await db.from('exam_attempts').select('id',{count:'exact',head:true}).eq('user_id',Number(s.sub)).eq('exam_id',exam_id);
 if((count||0)>=exam.max_attempts)return res.status(403).json({error:'attempt_limit_reached'});
 const {data:qs,error}=await db.from('exam_questions').select('id,correct_option').eq('exam_id',exam_id).eq('is_active',true);
 if(error||!qs?.length)return res.status(400).json({error:'exam_has_no_questions'});
 let correct=0; for(const q of qs){if(answers[String(q.id)]===q.correct_option)correct++;}
 const score=Math.round((correct/qs.length)*10000)/100; const passed=score>=Number(exam.pass_score);
 const now=new Date().toISOString();
 const {data:attempt,error:aerr}=await db.from('exam_attempts').insert({user_id:Number(s.sub),exam_id,score,passed,started_at:now,completed_at:now}).select().single();
 if(aerr)return res.status(500).json({error:'db_error'});
 return res.json({ok:true,attempt_id:attempt.id,score,passed,correct,total:qs.length,pass_score:Number(exam.pass_score)});
}
