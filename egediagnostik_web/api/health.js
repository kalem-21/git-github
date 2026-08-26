export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const supabase=Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
  const auth=Boolean(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32);
  return res.status(supabase&&auth?200:503).json({ok:supabase&&auth,services:{database:supabase?'configured':'missing',auth:auth?'configured':'missing'}});
}
