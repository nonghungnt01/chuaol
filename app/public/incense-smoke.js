export function smokePoint(p,age,time){return {x:p.x+Math.sin(age*1.75+p.seed)*age*2.6+Math.sin(time*.63+p.seed*.3)*age*4.8,y:p.y-age*p.speed-age*age*.9};}
export class IncenseSmoke {
 constructor(scene){
  this.canvas=document.createElement('canvas');this.canvas.id='incense-smoke';this.canvas.width=1080;this.canvas.height=1060;this.canvas.setAttribute('aria-hidden','true');scene.append(this.canvas);this.ctx=this.canvas.getContext('2d');this.emitters=new Map();this.particles=[];this.running=true;this.reset();
  this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
 }
 emitter(key,x,y,rate,strength=1){let e=this.emitters.get(key);if(!e){e={key,x,y,rate,credit:0,seed:Math.random()*6};this.emitters.set(key,e);}Object.assign(e,{x,y,rate,strength});return e;}
 spawn(e,age=0){const now=performance.now()/1000;this.particles.push({x:e.x+(Math.random()-.5)*5,y:e.y,seed:Math.random()*7,speed:23+Math.random()*10,life:5.5+Math.random()*2.5,born:now-age,strength:e.strength});if(this.particles.length>240)this.particles.shift();}
 plant(x,y){this.emitter('stick:'+x.toFixed(2),x,y,.7);const planted=[...this.emitters.keys()].filter(k=>k.startsWith('stick:'));if(planted.length>20)this.emitters.delete(planted[0]);}
 reset(){this.emitters.clear();this.particles.length=0;const e=this.emitter('burner',540,735,11);for(let i=0;i<60;i++)this.spawn(e,Math.random()*6);for(const[key,x,y]of[['altar-left',358,679],['altar-center',540,685],['altar-right',724,679]]){const e=this.emitter(key,x,y,2.5,.48);for(let i=0;i<12;i++)this.spawn(e,Math.random()*5);}}
 tick(ms){
  if(!this.running)return;const time=ms/1000,dt=Math.min(.06,(ms-(this.last||ms))/1000);this.last=ms;const ctx=this.ctx;ctx.clearRect(0,0,1080,1060);
  const held=new Set();document.querySelectorAll('.ceremony-person[data-holding="true"]').forEach((el,i)=>{const s=getComputedStyle(el),scale=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform).a||1,art=Number(el.dataset.artScale)||1,key='held:'+(el.dataset.id||el.id||i),reaching=el.dataset.animationFrame==='standing:3';held.add(key);this.emitter(key,parseFloat(s.left)+75+(reaching?25*art:0)*scale,parseFloat(s.top)+195-190*art*scale,4);});for(const key of this.emitters.keys())if(key.startsWith('held:')&&!held.has(key))this.emitters.delete(key);
  for(const e of this.emitters.values()){e.credit+=e.rate*dt;while(e.credit>=1){e.credit--;this.spawn(e);}}
  this.particles=this.particles.filter(p=>time-p.born<p.life);
  for(const p of this.particles){const age=Math.max(0,time-p.born),q=smokePoint(p,age,time),r=2.6+age*1.65,alpha=Math.sin(Math.PI*age/p.life)*.125*p.strength,g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,`rgba(239,237,224,${alpha})`);g.addColorStop(.5,`rgba(225,224,214,${alpha*.6})`);g.addColorStop(1,'rgba(225,224,214,0)');ctx.fillStyle=g;ctx.fillRect(q.x-r,q.y-r,r*2,r*2);}
  const main=this.emitters.get('burner');if(main)for(let j=0;j<3;j++){const g=ctx.createLinearGradient(0,main.y,0,main.y-260);g.addColorStop(0,'rgba(245,241,228,.04)');g.addColorStop(.35,'rgba(245,241,228,.18)');g.addColorStop(1,'rgba(245,241,228,0)');ctx.strokeStyle=g;ctx.lineWidth=1.3+j*.3;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<32;i++){const age=i/4,q=smokePoint({x:main.x+j*3-3,y:main.y,seed:j*1.7,speed:27},age,time);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();}
  this.canvas.dataset.particles=String(this.particles.length);this.canvas.dataset.frame=String((Number(this.canvas.dataset.frame)||0)+1);this.raf=requestAnimationFrame(this.tick);
 }
 dispose(){this.running=false;cancelAnimationFrame(this.raf);this.canvas.remove();}
}
