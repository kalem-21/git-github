import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res); if(!s)return;
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const id=Number(req.query.id||0); if(!id)return res.status(400).json({error:'id_required'});
 const {data:exam,error}=await db.from('exams').select('id,course_id,title,question_count,pass_score,time_limit_minutes,max_attempts,is_active,courses(title)').eq('id',id).eq('is_active',true).maybeSingle();
 if(error||!exam)return res.status(404).json({error:'exam_not_found'});
 const {data:qs,error:qerr}=await db.from('exam_questions').select('id,question_text,option_a,option_b,option_c,option_d').eq('exam_id',id).eq('is_active',true).order('id',{ascending:true});
 if(qerr)return res.status(500).json({error:'db_error'});
 const {count}=await db.from('exam_attempts').select('id',{count:'exact',head:true}).eq('user_id',Number(s.sub)).eq('exam_id',id);
 if((count||0)>=exam.max_attempts)return res.status(403).json({error:'attempt_limit_reached'});
 return res.json({ok:true,exam,questions:(qs||[]).slice(0,exam.question_count)});
}
