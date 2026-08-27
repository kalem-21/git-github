const pageStyles=document.createElement('link');pageStyles.rel='stylesheet';pageStyles.href='/assets/pages.css';if(!document.querySelector('link[href="/assets/pages.css"]'))document.head.appendChild(pageStyles);

const body=document.body;
const menu=document.querySelector('.menu');
const menuClose=document.querySelector('.menu-close');
const overlay=document.querySelector('.nav-overlay');
const mobile=()=>window.innerWidth<=900;
const CMS_KEY='ege_diagnostik_cms_v1';
let cmsWorkingHours='Hafta içi 08:30–18:00';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function setMenu(open){
  body.classList.toggle('navopen',open);
  menu?.setAttribute('aria-expanded',String(open));
  if(!open)document.querySelectorAll('.navitem.open').forEach(x=>x.classList.remove('open'));
}
if(menu){menu.onclick=null;menu.addEventListener('click',()=>setMenu(!body.classList.contains('navopen')))}
menuClose?.addEventListener('click',()=>setMenu(false));
overlay?.addEventListener('click',()=>setMenu(false));

document.querySelectorAll('.navitem>a').forEach(link=>{
  link.addEventListener('click',e=>{
    const item=link.parentElement;
    if(mobile()&&item.querySelector('.dropdown')){
      e.preventDefault();
      document.querySelectorAll('.navitem.open').forEach(x=>x!==item&&x.classList.remove('open'));
      item.classList.toggle('open');
    }
  });
});

document.querySelectorAll('.dropdown a,.mainnav>a:not(.login),.mainnav .login').forEach(link=>link.addEventListener('click',()=>{if(mobile())setMenu(false)}));
document.addEventListener('click',e=>{if(mobile()&&body.classList.contains('navopen')&&!e.target.closest('.top')&&!e.target.closest('.mainnav'))setMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
window.addEventListener('resize',()=>{if(!mobile())setMenu(false)});

const progress=document.querySelector('#scrollProgress');
window.addEventListener('scroll',()=>{if(progress){const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h?scrollY/h*100:0)+'%'}},{passive:true});

const reveals=[...document.querySelectorAll('.reveal')];
if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}}),{threshold:.1});reveals.forEach(x=>io.observe(x))}else reveals.forEach(x=>x.classList.add('is-visible'));

function parseWorkingHours(){const m=String(cmsWorkingHours||'').match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/);if(!m)return{start:510,end:1080};return{start:Number(m[1])*60+Number(m[2]),end:Number(m[3])*60+Number(m[4])}}
function updateTime(){
  const d=new Date(),clock=d.toLocaleTimeString('tr-TR',{hour12:false}),day=d.getDay(),minutes=d.getHours()*60+d.getMinutes(),h=parseWorkingHours(),open=day>=1&&day<=5&&minutes>=h.start&&minutes<h.end;
  document.querySelectorAll('#liveClock,#clockLarge').forEach(x=>x.textContent=clock);
  const hours=String(cmsWorkingHours||'08:30–18:00').replace(/^Hafta içi\s*/i,''),text=open?`AÇIK • ${hours}`:`KAPALI • Sonraki iş günü ${String(hours).split(/[–-]/)[0].trim()}`,w=document.querySelector('#workState'),wl=document.querySelector('#workLarge');
  if(w)w.textContent=text;if(wl){wl.textContent=open?'AÇIK':'KAPALI';wl.style.color=open?'#118d67':'#b85c5c'}
}
updateTime();setInterval(updateTime,1000);

function setText(selector,value){const el=document.querySelector(selector);if(el&&value!=null&&value!=='')el.textContent=value}
function applySiteCms(data){
 const s=data?.settings||{},h=s.homepage||{},c=s.contact||{},seo=s.seo||{},brand=s.brand||{},footer=s.footer||{},vis=s.visibility||{};
 if(seo.title)document.title=seo.title;
 if(seo.description){let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta)}meta.content=seo.description}
 if(brand.logo_url)document.querySelectorAll('.brand img,.eco-head img').forEach(img=>img.src=brand.logo_url);
 if(c.email){document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+c.email;a.textContent=c.email});document.querySelectorAll('.contact-lines span').forEach(x=>{if(x.textContent.includes('@'))x.textContent=c.email})}
 if(c.working_hours){cmsWorkingHours=c.working_hours;document.querySelectorAll('.contact-lines span').forEach(x=>{if(/Hafta içi|\d{1,2}:\d{2}/.test(x.textContent)&&!x.textContent.includes('7/24'))x.textContent=c.working_hours})}
 if(c.technical_coordination){document.querySelectorAll('.utility div:first-child span:last-child').forEach(x=>x.textContent=c.technical_coordination);document.querySelectorAll('.contact-lines span').forEach(x=>{if(x.textContent.includes('7/24')||x.textContent.toLowerCase().includes('teknik koordinasyon'))x.textContent=c.technical_coordination})}
 setText('#kurumsal .eyebrow',h.intro_eyebrow);setText('#kurumsal h2',h.intro_title);setText('#kurumsal .lead-copy',h.intro_text);
 setText('#sonuc-rehberligi .section-head .eyebrow',h.guidance_eyebrow);setText('#sonuc-rehberligi .section-head h2',h.guidance_title);setText('#sonuc-rehberligi .section-head p',h.guidance_text);
 setText('#urunler .section-head .eyebrow',h.solutions_eyebrow);setText('#urunler .section-head h2',h.solutions_title);setText('#urunler .section-head p',h.solutions_text);
 setText('#hizmetler .section-head .eyebrow',h.services_eyebrow);setText('#hizmetler .section-head h2',h.services_title);
 setText('#akademi .academy-copy .eyebrow',h.academy_eyebrow);setText('#akademi .academy-copy h2',h.academy_title);setText('#akademi .academy-copy p',h.academy_text);
 setText('#haberler .section-head .eyebrow',h.news_eyebrow);setText('#haberler .section-head h2',h.news_title);
 setText('#iletisim .contact-copy .eyebrow',h.contact_eyebrow);setText('#iletisim .contact-copy h2',h.contact_title);setText('#iletisim .contact-copy>p',h.contact_text);
 setText('.eco-head>div:first-child p',footer.description);setText('.eco-status b',footer.status_title);setText('.eco-status small',footer.status_subtitle);
 if(Array.isArray(footer.ecosystem)&&footer.ecosystem.length){const flow=document.querySelector('.eco-flow');if(flow)flow.innerHTML=footer.ecosystem.map((label,i)=>`<span><b>${String(i+1).padStart(2,'0')}</b>${esc(label)}</span>${i<footer.ecosystem.length-1?'<i>→</i>':''}`).join('')}
 const map={guidance:'#sonuc-rehberligi',solutions:'#urunler',imaging:'.imaging-zone',services:'#hizmetler',academy:'#akademi',news:'#haberler',contact:'#iletisim'};Object.entries(map).forEach(([k,sel])=>{if(k in vis){const el=document.querySelector(sel);if(el)el.style.display=vis[k]?'':'none'}});
 if(Array.isArray(data.sliders)&&data.sliders.length)renderCmsSliders(data.sliders.filter(x=>x.is_active!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)));
 updateTime();
}
function renderCmsSliders(items){const wrap=document.querySelector('.slider .slides');if(!wrap||!items.length)return;wrap.innerHTML=items.map((s,i)=>`<article class="slide ${i===0?'active':''}"><img src="${esc(s.image_url||'/assets/slider-ai-lab.svg')}" alt="${esc(s.title||'EGE Diagnostik')}"><div class="slide-shade"></div><div class="slide-copy"><span class="eyebrow light">${esc(s.eyebrow||'EGE DIAGNOSTIK')}</span><h1>${esc(s.title||'')}</h1><p>${esc(s.subtitle||'')}</p><div class="actions">${s.button_text?`<a class="primary" href="${esc(s.button_url||'#')}">${esc(s.button_text)}</a>`:''}<a class="glass-btn" href="/login.html">Portal Girişi</a></div></div><aside class="live-card"><span>${esc(s.eyebrow||'EGE DIAGNOSTIK')}</span><b>EGE DIAGNOSTIK</b><div class="pulse-line"></div><small>Technology • Quality • Service • Academy</small></aside></article>`).join('')}
async function loadSiteCms(){let data=null;try{data=JSON.parse(localStorage.getItem(CMS_KEY)||'null')}catch{}if(!data){try{const r=await fetch('/api/contact?resource=site',{cache:'no-store'});if(r.ok){const j=await r.json();if(j.settings||j.sliders?.length)data={settings:j.settings,sliders:j.sliders}}}catch{}}if(data)applySiteCms(data);initSlider()}

function initSlider(){
 const slides=[...document.querySelectorAll('.slide')],dotsWrap=document.querySelector('.slide-dots');let current=0,sliderTimer,startX=null;if(!slides.length||!dotsWrap)return;dotsWrap.innerHTML='';
 slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',(i+1)+'. slayt');b.addEventListener('click',()=>go(i,true));dotsWrap.appendChild(b)});const dots=[...dotsWrap.children];
 function render(){slides.forEach((s,i)=>s.classList.toggle('active',i===current));dots.forEach((d,i)=>d.classList.toggle('active',i===current))}
 function go(i,manual=false){current=(i+slides.length)%slides.length;render();if(manual)restart()}
 function restart(){clearInterval(sliderTimer);if(slides.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)sliderTimer=setInterval(()=>go(current+1),7000)}
 document.querySelector('.slide-arrow.prev')?.addEventListener('click',()=>go(current-1,true));document.querySelector('.slide-arrow.next')?.addEventListener('click',()=>go(current+1,true));const slider=document.querySelector('.slider');slider?.addEventListener('mouseenter',()=>clearInterval(sliderTimer));slider?.addEventListener('mouseleave',restart);slider?.addEventListener('touchstart',e=>{startX=e.touches[0]?.clientX??null},{passive:true});slider?.addEventListener('touchend',e=>{if(startX===null)return;const end=e.changedTouches[0]?.clientX??startX,diff=end-startX;startX=null;if(Math.abs(diff)>50)go(current+(diff<0?1:-1),true)},{passive:true});render();restart();
}
loadSiteCms();

const cf=document.querySelector('#contactForm'),fs=document.querySelector('#formStatus');
if(cf)cf.addEventListener('submit',async e=>{e.preventDefault();if(fs)fs.textContent='Gönderiliyor…';const payload=Object.fromEntries(new FormData(cf));try{const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'error');if(fs)fs.textContent='Mesajınız alındı. Teşekkür ederiz.';cf.reset()}catch{if(fs)fs.textContent='Canlı kayıt servisi henüz yapılandırılmadı. info@egediagnostik.com.tr adresinden bize ulaşabilirsiniz.'}});

if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.principles article,.solution-grid article,.service-grid article,.news-grid article,.guidance-flow article,.code-card,.imaging-monitor').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(950px) rotateX(${(-y*2.3).toFixed(2)}deg) rotateY(${(x*2.8).toFixed(2)}deg) translateY(-3px)`});card.addEventListener('pointerleave',()=>card.style.transform='')})}
