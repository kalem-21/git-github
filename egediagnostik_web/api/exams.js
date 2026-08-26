import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res); if(!s)return;
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const {data,error}=await db.from('exams').select('id,course_id,title,question_count,pass_score,time_limit_minutes,max_attempts,is_active,courses(title)').eq('is_active',true).order('id',{ascending:false});
 if(error)return res.status(500).json({error:'db_error'});
 const ids=(data||[]).map(x=>x.id); let attempts=[];
 if(ids.length){const a=await db.from('exam_attempts').select('exam_id,score,passed,completed_at').eq('user_id',Number(s.sub)).in('exam_id',ids).order('id',{ascending:false}); attempts=a.data||[];}
 return res.json({ok:true,items:(data||[]).map(e=>({...e,attempts:attempts.filter(a=>a.exam_id===e.id)}))});
}
