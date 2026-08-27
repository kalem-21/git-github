import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';

async function completion(courseIds,userId){
 const ids=[...new Set((Array.isArray(courseIds)?courseIds:[courseIds]).map(Number).filter(Boolean))];
 if(!ids.length)return new Map();
 const {data:sections,error:se}=await db.from('course_sections').select('id,course_id').in('course_id',ids);if(se)throw se;
 const sids=(sections||[]).map(x=>x.id);let lessons=[];if(sids.length){const lr=await db.from('lessons').select('id,section_id').in('section_id',sids).eq('is_active',true);if(lr.error)throw lr.error;lessons=lr.data||[];}
 const lids=lessons.map(x=>x.id);let progress=[];if(lids.length){const pr=await db.from('lesson_progress').select('lesson_id,completed').eq('user_id',Number(userId)).in('lesson_id',lids);if(pr.error)throw pr.error;progress=pr.data||[];}
 const map=new Map();for(const cid of ids){const csids=(sections||[]).filter(s=>Number(s.course_id)===cid).map(s=>s.id),cls=lessons.filter(l=>csids.includes(l.section_id)),done=cls.filter(l=>progress.some(p=>Number(p.lesson_id)===Number(l.id)&&p.completed)).length,total=cls.length;map.set(cid,{lesson_count:total,completed_count:done,progress_percent:total?Math.round(done/total*100):100,locked:total>0&&done<total});}return map;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const s=await requireSession(req,res); if(!s)return;
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  try{
   const id=Number(req.query.id||0);
   if(id){
    const {data:exam,error}=await db.from('exams').select('id,course_id,title,question_count,pass_score,time_limit_minutes,max_attempts,is_active,courses(title)').eq('id',id).eq('is_active',true).maybeSingle();
    if(error||!exam)return res.status(404).json({error:'exam_not_found'});
    if(s.role!=='admin'){const c=(await completion([exam.course_id],s.sub)).get(Number(exam.course_id));if(c?.locked)return res.status(403).json({error:'course_incomplete',progress:c});}
    const {count}=await db.from('exam_attempts').select('id',{count:'exact',head:true}).eq('user_id',Number(s.sub)).eq('exam_id',id);
    if((count||0)>=exam.max_attempts)return res.status(403).json({error:'attempt_limit_reached'});
    const {data:questions,error:qerr}=await db.from('exam_questions').select('id,question_text,option_a,option_b,option_c,option_d').eq('exam_id',id).eq('is_active',true).order('id',{ascending:true});
    if(qerr)return res.status(500).json({error:'db_error'});
    return res.json({ok:true,exam,questions:(questions||[]).slice(0,exam.question_count)});
   }
   const {data,error}=await db.from('exams').select('id,course_id,title,question_count,pass_score,time_limit_minutes,max_attempts,is_active,courses(title)').eq('is_active',true).order('id',{ascending:false});
   if(error)return res.status(500).json({error:'db_error'});
   const ids=(data||[]).map(x=>x.id);let attempts=[];
   if(ids.length){const a=await db.from('exam_attempts').select('exam_id,score,passed,completed_at').eq('user_id',Number(s.sub)).in('exam_id',ids).order('id',{ascending:false});attempts=a.data||[];}
   const cmap=s.role==='admin'?new Map():await completion((data||[]).map(e=>e.course_id),s.sub);
   return res.json({ok:true,items:(data||[]).map(e=>{const c=cmap.get(Number(e.course_id))||{lesson_count:0,completed_count:0,progress_percent:100,locked:false};return {...e,attempts:attempts.filter(a=>a.exam_id===e.id),course_progress:c.progress_percent,lesson_count:c.lesson_count,completed_count:c.completed_count,locked:s.role==='admin'?false:c.locked};})});
  }catch(e){console.error('exam_api_error',e?.message||e);return res.status(500).json({error:'db_error'});}
}
