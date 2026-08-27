import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';

const templateSchema=z.object({
  id:z.coerce.number().int().positive().optional(),
  name:z.string().min(2).max(150),
  title:z.string().min(2).max(200),
  body:z.string().min(2).max(6000),
  footer_text:z.string().max(1000).optional().default(''),
  signature_name:z.string().max(160).optional().default(''),
  signature_title:z.string().max(160).optional().default(''),
  theme:z.enum(['corporate','classic','minimal','premium']).default('corporate'),
  accent:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0778c5'),
  background_url:z.string().max(2000).optional().default('')
});

function encodeBody(v){return JSON.stringify({version:1,body:v.body,theme:v.theme,accent:v.accent,background_url:v.background_url||''})}
function decodeBody(raw){try{const x=JSON.parse(raw);if(x&&typeof x==='object'&&x.body)return {body:x.body,theme:x.theme||'corporate',accent:x.accent||'#0778c5',background_url:x.background_url||''}}catch{}return {body:raw||'',theme:'corporate',accent:'#0778c5',background_url:''}}
function present(t){const d=decodeBody(t.body_template);return {...t,...d,body_template:undefined}}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const s=await requireSession(req,res,'admin'); if(!s)return;
  try{
    if(req.method==='GET'){
      const [templates,issued]=await Promise.all([
        db.from('certificate_templates').select('id,name,title,body_template,footer_text,signature_name,signature_title,is_default,updated_at').order('id',{ascending:true}),
        db.from('certificates').select('id,certificate_code,score,issued_at,revoked_at,users(first_name,last_name,email,institution),courses(title),certificate_templates(id,name,title,body_template,footer_text,signature_name,signature_title)').order('issued_at',{ascending:false}).limit(1000)
      ]);
      if(templates.error||issued.error)return res.status(500).json({error:'db_error'});
      return res.json({ok:true,templates:(templates.data||[]).map(present),issued:(issued.data||[]).map(c=>({...c,certificate_templates:c.certificate_templates?present(c.certificate_templates):null}))});
    }
    if(req.method==='POST'){
      const action=String(req.body?.action||'save');
      if(action==='activate'){
        const id=Number(req.body?.id); if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'invalid_request'});
        const {data:target}=await db.from('certificate_templates').select('id').eq('id',id).maybeSingle();
        if(!target)return res.status(404).json({error:'template_not_found'});
        const off=await db.from('certificate_templates').update({is_default:false}).neq('id',0); if(off.error)return res.status(500).json({error:'db_error'});
        const on=await db.from('certificate_templates').update({is_default:true,updated_at:new Date().toISOString()}).eq('id',id); if(on.error)return res.status(500).json({error:'db_error'});
        return res.json({ok:true,active_id:id});
      }
      const p=templateSchema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request'});
      const v=p.data,payload={name:v.name,title:v.title,body_template:encodeBody(v),footer_text:v.footer_text||null,signature_name:v.signature_name||null,signature_title:v.signature_title||null,updated_at:new Date().toISOString()};
      if(v.id){const {data,error}=await db.from('certificate_templates').update(payload).eq('id',v.id).select().single();if(error)return res.status(500).json({error:'db_error'});return res.json({ok:true,item:present(data)})}
      const {count}=await db.from('certificate_templates').select('id',{count:'exact',head:true});
      const {data,error}=await db.from('certificate_templates').insert({...payload,is_default:(count||0)===0}).select().single();if(error)return res.status(500).json({error:'db_error'});return res.json({ok:true,item:present(data)});
    }
    if(req.method==='DELETE'){
      const id=Number(req.query?.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'invalid_request'});
      const {data:t}=await db.from('certificate_templates').select('id,is_default').eq('id',id).maybeSingle();if(!t)return res.status(404).json({error:'template_not_found'});if(t.is_default)return res.status(409).json({error:'active_template_cannot_be_deleted'});
      const {count}=await db.from('certificates').select('id',{count:'exact',head:true}).eq('template_id',id);if((count||0)>0)return res.status(409).json({error:'template_in_use'});
      const {error}=await db.from('certificate_templates').delete().eq('id',id);if(error)return res.status(500).json({error:'db_error'});return res.json({ok:true});
    }
    return res.status(405).json({error:'method_not_allowed'});
  }catch(e){console.error('certificate_center_error',e?.message||e);return res.status(500).json({error:'db_error'});}
}
