import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';

function decodeBody(raw){try{const x=JSON.parse(raw);if(x&&typeof x==='object'&&x.body)return {body:x.body,theme:x.theme||'corporate',accent:x.accent||'#0778c5',background_url:x.background_url||''}}catch{}return {body:raw||'',theme:'corporate',accent:'#0778c5',background_url:''}}
function presentTemplate(t){if(!t)return null;const d=decodeBody(t.body_template);return {id:t.id,name:t.name,title:t.title,footer_text:t.footer_text,signature_name:t.signature_name,signature_title:t.signature_title,...d}}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
 const verify=String(req.query.verify||'').trim();
 if(verify){
  if(verify.length<8||verify.length>120)return res.status(400).json({error:'invalid_code'});
  try{
   const {data,error}=await db.from('certificates').select('certificate_code,score,issued_at,revoked_at,users(first_name,last_name,institution),courses(title),certificate_templates(id,name,title,body_template,footer_text,signature_name,signature_title)').eq('certificate_code',verify).maybeSingle();
   if(error)return res.status(500).json({error:'db_error'});
   if(!data)return res.status(404).json({ok:true,valid:false});
   return res.json({ok:true,valid:!data.revoked_at,certificate:{certificate_code:data.certificate_code,score:data.score,issued_at:data.issued_at,revoked_at:data.revoked_at,full_name:`${data.users?.first_name||''} ${data.users?.last_name||''}`.trim(),institution:data.users?.institution||null,course_title:data.courses?.title||'EGE Akademi',template:presentTemplate(data.certificate_templates)}});
  }catch(e){console.error('certificate_verify_error',e?.message||e);return res.status(500).json({error:'db_error'});}
 }
 const s=await requireSession(req,res); if(!s)return;
 const {data,error}=await db.from('certificates').select('id,certificate_code,score,issued_at,revoked_at,courses(title),users(first_name,last_name,institution),certificate_templates(id,name,title,body_template,footer_text,signature_name,signature_title)').eq('user_id',Number(s.sub)).order('issued_at',{ascending:false});
 if(error)return res.status(500).json({error:'db_error'});
 return res.json({ok:true,items:(data||[]).map(c=>({...c,template:presentTemplate(c.certificate_templates),certificate_templates:undefined,full_name:`${c.users?.first_name||''} ${c.users?.last_name||''}`.trim(),institution:c.users?.institution||null}))});
}
