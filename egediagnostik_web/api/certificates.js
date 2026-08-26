import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store'); const s=await requireSession(req,res); if(!s)return;
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const {data,error}=await db.from('certificates').select('id,certificate_code,score,issued_at,revoked_at,courses(title)').eq('user_id',Number(s.sub)).order('issued_at',{ascending:false});
 if(error)return res.status(500).json({error:'db_error'});
 return res.json({ok:true,items:data||[]});
}
