import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { requireSession } from '../lib/session.js';

const sectionSchema=z.object({id:z.coerce.number().int().positive().optional(),course_id:z.coerce.number().int().positive(),title:z.string().min(2).max(220),sort_order:z.coerce.number().int().min(0).max(10000).default(0)});
const lessonSchema=z.object({id:z.coerce.number().int().positive().optional(),section_id:z.coerce.number().int().positive(),title:z.string().min(2).max(220),content:z.string().max(10000).optional().nullable(),video_type:z.enum(['youtube','url','none']).default('none'),video_url:z.string().max(2000).optional().nullable(),duration_seconds:z.coerce.number().int().min(0).max(100000).default(0),sort_order:z.coerce.number().int().min(0).max(10000).default(0),is_active:z.boolean().default(true)});
const progressSchema=z.object({lesson_id:z.coerce.number().int().positive(),watched_seconds:z.coerce.number().int().min(0).max(100000).default(0),completed:z.boolean().default(false)});

async function getCourseBundle(courseId,userId,admin=false){
 const cq=admin?db.from('courses').select('*').eq('id',courseId).maybeSingle():db.from('courses').select('*').eq('id',courseId).eq('is_active',true).maybeSingle();
 const {data:course,error:ce}=await cq;if(ce||!course)return null;
 const {data:sections,error:se}=await db.from('course_sections').select('*').eq('course_id',courseId).order('sort_order',{ascending:true}).order('id',{ascending:true});if(se)throw se;
 const sectionIds=(sections||[]).map(x=>x.id);let lessons=[];
 if(sectionIds.length){let lq=db.from('lessons').select('*').in('section_id',sectionIds).order('sort_order',{ascending:true}).order('id',{ascending:true});if(!admin)lq=lq.eq('is_active',true);const lr=await lq;if(lr.error)throw lr.error;lessons=lr.data||[];}
 const lessonIds=lessons.map(x=>x.id);let progress=[];
 if(userId&&lessonIds.length){const pr=await db.from('lesson_progress').select('*').eq('user_id',Number(userId)).in('lesson_id',lessonIds);if(pr.error)throw pr.error;progress=pr.data||[];}
 const completedCount=lessons.filter(l=>progress.some(p=>Number(p.lesson_id)===Number(l.id)&&p.completed)).length;
 return {course:{...course,lesson_count:lessons.length,completed_count:completedCount,progress_percent:lessons.length?Math.round(completedCount/lessons.length*100):0},sections:(sections||[]).map(s=>({...s,lessons:lessons.filter(l=>Number(l.section_id)===Number(s.id)).map(l=>({...l,progress:progress.find(p=>Number(p.lesson_id)===Number(l.id))||null}))}))};
}

async function finishEnrollmentIfComplete(userId,lessonId){
 const {data:lesson}=await db.from('lessons').select('id,section_id,course_sections(course_id)').eq('id',lessonId).maybeSingle();
 const courseId=lesson?.course_sections?.course_id;if(!courseId)return;
 const bundle=await getCourseBundle(courseId,userId,false);if(!bundle)return;
 const total=Number(bundle.course.lesson_count||0),done=Number(bundle.course.completed_count||0);
 if(total>0&&done===total){await db.from('enrollments').update({completed_at:new Date().toISOString()}).eq('user_id',Number(userId)).eq('course_id',Number(courseId));}
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const s=await requireSession(req,res);if(!s)return;
 try{
  if(req.method==='GET'){
   const courseId=Number(req.query.course_id||0);
   if(courseId){const bundle=await getCourseBundle(courseId,s.sub,s.role==='admin');if(!bundle)return res.status(404).json({error:'course_not_found'});return res.json({ok:true,...bundle});}
   let cq=db.from('courses').select('*').order('id',{ascending:true});if(s.role!=='admin')cq=cq.eq('is_active',true);const {data:courses,error}=await cq;if(error)throw error;
   const ids=(courses||[]).map(c=>c.id);let sections=[],lessons=[],progress=[];
   if(ids.length){const sr=await db.from('course_sections').select('id,course_id').in('course_id',ids);if(sr.error)throw sr.error;sections=sr.data||[];const sids=sections.map(x=>x.id);if(sids.length){let lq=db.from('lessons').select('id,section_id,duration_seconds,is_active').in('section_id',sids);if(s.role!=='admin')lq=lq.eq('is_active',true);const lr=await lq;if(lr.error)throw lr.error;lessons=lr.data||[];const lids=lessons.map(x=>x.id);if(lids.length){const pr=await db.from('lesson_progress').select('lesson_id,completed,watched_seconds').eq('user_id',Number(s.sub)).in('lesson_id',lids);if(pr.error)throw pr.error;progress=pr.data||[];}}}
   const items=(courses||[]).map(c=>{const sids=sections.filter(x=>Number(x.course_id)===Number(c.id)).map(x=>x.id),ls=lessons.filter(x=>sids.includes(x.section_id)),done=ls.filter(l=>progress.some(p=>Number(p.lesson_id)===Number(l.id)&&p.completed)).length;return {...c,lesson_count:ls.length,completed_count:done,progress_percent:ls.length?Math.round(done/ls.length*100):0};});
   return res.json({ok:true,items});
  }
  if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
  const action=String(req.body?.action||'');
  if(action==='progress'){
   const p=progressSchema.safeParse(req.body||{});if(!p.success)return res.status(400).json({error:'invalid_request'});
   const {data:existing}=await db.from('lesson_progress').select('completed,watched_seconds').eq('user_id',Number(s.sub)).eq('lesson_id',p.data.lesson_id).maybeSingle();
   const payload={user_id:Number(s.sub),lesson_id:p.data.lesson_id,watched_seconds:Math.max(Number(existing?.watched_seconds||0),p.data.watched_seconds),completed:Boolean(existing?.completed||p.data.completed),updated_at:new Date().toISOString()};
   const {data,error}=await db.from('lesson_progress').upsert(payload,{onConflict:'user_id,lesson_id'}).select().single();if(error)throw error;
   if(data.completed)await finishEnrollmentIfComplete(s.sub,p.data.lesson_id);
   return res.json({ok:true,item:data});
  }
  if(s.role!=='admin')return res.status(403).json({error:'forbidden'});
  if(action==='upsert_section'){
   const p=sectionSchema.safeParse(req.body||{});if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()});const {id,...payload}=p.data;const q=id?db.from('course_sections').update(payload).eq('id',id).select().single():db.from('course_sections').insert(payload).select().single();const {data,error}=await q;if(error)throw error;return res.json({ok:true,item:data});
  }
  if(action==='delete_section'){
   const id=Number(req.body?.id||0);if(!id)return res.status(400).json({error:'id_required'});const {error}=await db.from('course_sections').delete().eq('id',id);if(error)throw error;return res.json({ok:true});
  }
  if(action==='upsert_lesson'){
   const p=lessonSchema.safeParse(req.body||{});if(!p.success)return res.status(400).json({error:'invalid_request',details:p.error.flatten()});const {id,...payload}=p.data;const q=id?db.from('lessons').update(payload).eq('id',id).select().single():db.from('lessons').insert(payload).select().single();const {data,error}=await q;if(error)throw error;return res.json({ok:true,item:data});
  }
  if(action==='delete_lesson'){
   const id=Number(req.body?.id||0);if(!id)return res.status(400).json({error:'id_required'});const {error}=await db.from('lessons').delete().eq('id',id);if(error)throw error;return res.json({ok:true});
  }
  return res.status(400).json({error:'unknown_action'});
 }catch(e){console.error('learning_api_error',e?.message||e);return res.status(500).json({error:'db_error'});}
}
