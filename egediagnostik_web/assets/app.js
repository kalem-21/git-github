const pageStyles=document.createElement('link');pageStyles.rel='stylesheet';pageStyles.href='/assets/pages.css';document.head.appendChild(pageStyles);
const body=document.body;
const menu=document.querySelector('.menu');
if(menu){menu.onclick=null;menu.addEventListener('click',()=>body.classList.toggle('navopen'));}
document.querySelectorAll('.navitem>a').forEach(link=>{link.addEventListener('click',e=>{if(window.innerWidth<=840){const item=link.parentElement;if(item.querySelector('.dropdown')){e.preventDefault();document.querySelectorAll('.navitem.open').forEach(x=>x!==item&&x.classList.remove('open'));item.classList.toggle('open');}}});});
document.addEventListener('click',e=>{if(window.innerWidth<=840&&!e.target.closest('.top'))body.classList.remove('navopen');});
const targets=document.querySelectorAll('.hero-panel,.pillars article,.value-grid article,.solution-grid article,.servicegrid article,.academy-list span,.contact,.content-split>*,.intro>*,.feature-grid article,.product-row>*');
targets.forEach(el=>el.classList.add('reveal'));
if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:.1});targets.forEach(el=>io.observe(el));}else targets.forEach(el=>el.classList.add('is-visible'));
window.addEventListener('resize',()=>{if(window.innerWidth>840){body.classList.remove('navopen');document.querySelectorAll('.navitem.open').forEach(x=>x.classList.remove('open'));}});