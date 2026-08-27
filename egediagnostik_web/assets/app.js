const pageStyles=document.createElement('link');pageStyles.rel='stylesheet';pageStyles.href='/assets/pages.css';if(!document.querySelector('link[href="/assets/pages.css"]'))document.head.appendChild(pageStyles);

const body=document.body;
const menu=document.querySelector('.menu');
const menuClose=document.querySelector('.menu-close');
const overlay=document.querySelector('.nav-overlay');
const mobile=()=>window.innerWidth<=900;

function setMenu(open){
  body.classList.toggle('navopen',open);
  menu?.setAttribute('aria-expanded',String(open));
  if(!open) document.querySelectorAll('.navitem.open').forEach(x=>x.classList.remove('open'));
}
menu?.addEventListener('click',()=>setMenu(!body.classList.contains('navopen')));
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

document.querySelectorAll('.dropdown a,.mainnav>a:not(.login),.mainnav .login').forEach(link=>{
  link.addEventListener('click',()=>{if(mobile())setMenu(false)});
});

document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
window.addEventListener('resize',()=>{if(!mobile())setMenu(false)});

const progress=document.querySelector('#scrollProgress');
window.addEventListener('scroll',()=>{if(progress){const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h?scrollY/h*100:0)+'%'}},{passive:true});

const reveals=[...document.querySelectorAll('.reveal')];
if('IntersectionObserver'in window){
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}}),{threshold:.1});
  reveals.forEach(x=>io.observe(x));
}else reveals.forEach(x=>x.classList.add('is-visible'));

function updateTime(){
  const d=new Date();
  const clock=d.toLocaleTimeString('tr-TR',{hour12:false});
  const day=d.getDay(),minutes=d.getHours()*60+d.getMinutes();
  const open=day>=1&&day<=5&&minutes>=510&&minutes<1080;
  document.querySelectorAll('#liveClock,#clockLarge').forEach(x=>x.textContent=clock);
  const text=open?'AÇIK • 08:30–18:00':'KAPALI • Sonraki iş günü 08:30';
  const w=document.querySelector('#workState'),wl=document.querySelector('#workLarge');
  if(w)w.textContent=text;
  if(wl){wl.textContent=open?'AÇIK':'KAPALI';wl.style.color=open?'#118d67':'#b85c5c'}
}
updateTime();setInterval(updateTime,1000);

const slides=[...document.querySelectorAll('.slide')],dotsWrap=document.querySelector('.slide-dots');
let current=0,sliderTimer,startX=null;
if(slides.length&&dotsWrap){
  slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',(i+1)+'. slayt');b.addEventListener('click',()=>go(i,true));dotsWrap.appendChild(b)});
  const dots=[...dotsWrap.children];
  function render(){slides.forEach((s,i)=>s.classList.toggle('active',i===current));dots.forEach((d,i)=>d.classList.toggle('active',i===current))}
  function go(i,manual=false){current=(i+slides.length)%slides.length;render();if(manual)restart()}
  function restart(){clearInterval(sliderTimer);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)sliderTimer=setInterval(()=>go(current+1),7000)}
  document.querySelector('.slide-arrow.prev')?.addEventListener('click',()=>go(current-1,true));
  document.querySelector('.slide-arrow.next')?.addEventListener('click',()=>go(current+1,true));
  const slider=document.querySelector('.slider');
  slider?.addEventListener('mouseenter',()=>clearInterval(sliderTimer));
  slider?.addEventListener('mouseleave',restart);
  slider?.addEventListener('touchstart',e=>{startX=e.touches[0]?.clientX??null},{passive:true});
  slider?.addEventListener('touchend',e=>{if(startX===null)return;const end=e.changedTouches[0]?.clientX??startX,diff=end-startX;startX=null;if(Math.abs(diff)>50)go(current+(diff<0?1:-1),true)},{passive:true});
  render();restart();
}

const cf=document.querySelector('#contactForm'),fs=document.querySelector('#formStatus');
if(cf)cf.addEventListener('submit',async e=>{
  e.preventDefault();if(fs)fs.textContent='Gönderiliyor…';
  const payload=Object.fromEntries(new FormData(cf));
  try{
    const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'error');
    if(fs)fs.textContent='Mesajınız alındı. Teşekkür ederiz.';cf.reset();
  }catch{
    if(fs)fs.textContent='Canlı kayıt servisi henüz yapılandırılmadı. info@egediagnostik.com.tr adresinden bize ulaşabilirsiniz.';
  }
});

if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('.principles article,.solution-grid article,.service-grid article,.news-grid article,.guidance-flow article,.code-card,.imaging-monitor').forEach(card=>{
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(950px) rotateX(${(-y*2.3).toFixed(2)}deg) rotateY(${(x*2.8).toFixed(2)}deg) translateY(-3px)`});
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });
}
