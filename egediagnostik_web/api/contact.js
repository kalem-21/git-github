import { z } from 'zod';
import { db, databaseReady } from '../lib/supabase.js';

const schema=z.object({
  name:z.string().trim().min(2).max(160),
  email:z.string().email().max(190),
  phone:z.string().trim().max(50).optional().default(''),
  subject:z.string().trim().max(180).optional().default('İletişim'),
  message:z.string().trim().min(10).max(3000)
});
function ipOf(req){return (req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').toString().split(',')[0].trim();}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='GET'&&String(req.query.resource||'')==='site'){
    if(!databaseReady())return res.status(200).json({ok:true,mode:'demo',settings:null,sliders:[]});
    try{
      const [set,sl]=await Promise.all([
        db.from('site_settings').select('value').eq('key','cms_payload').maybeSingle(),
        db.from('sliders').select('id,eyebrow,title,subtitle,image_url,button_text,button_url,sort_order,is_active').eq('is_active',true).order('sort_order',{ascending:true}).order('id',{ascending:true})
      ]);
      if(set.error||sl.error)return res.status(500).json({error:'db_error'});
      let settings=null;try{settings=set.data?.value?JSON.parse(set.data.value):null}catch{}
      return res.status(200).json({ok:true,mode:'production',settings,sliders:sl.data||[]});
    }catch{return res.status(500).json({error:'service_unavailable'});}
  }
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  const parsed=schema.safeParse(req.body||{});if(!parsed.success)return res.status(400).json({error:'invalid_request'});
  if(!databaseReady())return res.status(503).json({error:'service_unavailable'});
  const ip=ipOf(req);
  const {data:ban}=await db.from('blocked_ips').select('id,expires_at').eq('ip',ip).maybeSingle();
  if(ban&&(!ban.expires_at||new Date(ban.expires_at)>new Date()))return res.status(403).json({error:'access_denied'});
  const {error}=await db.from('contact_messages').insert({...parsed.data,ip,status:'new'});
  if(error){console.error('contact_insert_failed',error.message);return res.status(500).json({error:'service_unavailable'});}
  return res.status(201).json({ok:true});
}
