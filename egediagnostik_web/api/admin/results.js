import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res,'admin'); if(!s)return;
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const {data,error}=await db.from('exam_attempts').select('id,score,passed,started_at,completed_at,users(first_name,last_name,email),exams(title,courses(title))').order('id',{ascending:false}).limit(500);
 if(error)return res.status(500).json({error:'db_error'});
 return res.json({ok:true,items:data||[]});
}
