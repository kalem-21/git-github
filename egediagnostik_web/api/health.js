export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const database=Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
  const auth=Boolean(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32);
  const production=database&&auth;
  return res.status(200).json({ok:true,mode:production?'production':'demo',services:{database:database?'configured':'demo-local',auth:auth?'configured':'demo-session'}});
}
