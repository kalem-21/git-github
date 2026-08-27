import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { requireSession } from '../../lib/session.js';

const courseSchema=z.object({id:z.coerce.number().int().positive().optional(),category_id:z.coerce.number().int().positive().nullable().optional(),title:z.string().min(3).max(220),slug:z.string().min(2).max(230),summary:z.string().max(3000).optional().nullable(),cover_url:z.string().max(1000).optional().nullable(),level:z.string().max(50).optional().nullable(),duration_minutes:z.coerce.number().int().min(0).max(100000).default(0),is_active:z.boolean().default(true)});
const sliderSchema=z.object({id:z.coerce.number().int().positive().optional(),eyebrow:z.string().max(160).optional().nullable(),title:z.string().min(2).max(220),subtitle:z.string().max(3000).optional().nullable(),image_url:z.string().max(2000).optional().nullable(),button_text:z.string().max(100).optional().nullable(),button_url:z.string().max(500).optional().nullable(),sort_order:z.coerce.number().int().min(0).max(10000).default(0),is_active:z.boolean().default(true)});

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const s=await requireSession(req,res,'admin'); if(!s)return;
 const resource=String(req.query.resource||'');
 if(resource==='cms'){
   if(req.method==='GET'){
     const [set,sl]=await Promise.all([
       db.from('site_settings').select('value').eq('key','cms_payload').maybeSingle(),
       db.from('sliders').select('*').order('sort_order',{ascending:true}).order('id',{ascending:true})
     ]);
     if(set.error||sl.error)return res.status(500).json({error:'db_error'});
     let settings=null;try{settings=set.data?.value?JSON.parse(set.data.value):null}catch{}
     return res.json({ok:true,settings,sliders:sl.data||[]});
   }
   if(req.method==='POST'){
     const action=String(req.body?.action||'');
     if(action==='save_settings'){
       const settings=req.body?.settings;if(!settings||typeof settings!=='object')return res.status(400).json({error:'invalid_request'});
       const value=JSON.stringify(settings);if(value.length>250000)return res.status(413).json({error:'payload_too_large'});
       const {error}=await db.from('site_settings').upsert({key:'cms_payload',value,updated_at:new Date().toISOString()},{onConflict:'key'});
       if(error)return res.status(500).json({error:'db_error'});return res.json({ok:true});
     }
     if(action==='upsert_slider'){
       const p=sliderSchema.safeParse(req.body?.slider||{});if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()});
       const {id,...payload}=p.data;const q=id?db.from('sliders').update(payload).eq('id',id).select().single():db.from('sliders').insert(payload).select().single();
       const {data,error}=await q;if(error)return res.status(500).json({error:'db_error'});return res.json({ok:true,item:data});
     }
     return res.status(400).json({error:'unknown_action'});
   }
   if(req.method==='DELETE'){
     const id=Number(req.query.id||req.body?.id);if(!id)return res.status(400).json({error:'id_required'});
     const {error}=await db.from('sliders').delete().eq('id',id);if(error)return res.status(500).json({error:'db_error'});return res.json({ok:true});
   }
   return res.status(405).json({error:'method_not_allowed'});
 }
 if(req.method==='GET'){const {data,error}=await db.from('courses').select('*').order('id',{ascending:false}); if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true,items:data||[]});}
 if(req.method==='POST'){const p=courseSchema.safeParse(req.body||{}); if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()}); const {id,...payload}=p.data; const q=id?db.from('courses').update(payload).eq('id',id).select().single():db.from('courses').insert(payload).select().single(); const {data,error}=await q; if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true,item:data});}
 if(req.method==='DELETE'){const id=Number(req.query.id||req.body?.id); if(!id)return res.status(400).json({error:'id_required'}); const {error}=await db.from('courses').delete().eq('id',id); if(error)return res.status(500).json({error:'db_error'}); return res.json({ok:true});}
 return res.status(405).json({error:'method_not_allowed'});
}
