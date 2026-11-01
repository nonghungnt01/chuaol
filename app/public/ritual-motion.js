import {atlas} from './female-atlas.mjs';
import {poseFrame,seatedBow} from './anime-poses.mjs';
import {CrowdBows} from './crowd-bows.mjs';
const people=new Set(),crowdBows=new CrowdBows();let raf=0;
function run(now){raf=0;const lower=[...people].filter(person=>person.isCrowd&&person.el.isConnected&&!person.el.classList.contains('away'));crowdBows.update(now,lower);for(const person of people){if(!person.el.isConnected){person.dispose();continue;}if(person.isCrowd){const selected=String(crowdBows.has(person));if(person.el.dataset.crowdBow!==selected)person.el.dataset.crowdBow=selected;}person.update(now,crowdBows.value(person,now));}if(people.size)raf=requestAnimationFrame(run);}
function wake(){if(!raf)raf=requestAnimationFrame(run);}
// Exactly one painted image at a time. Feet stay anchored across all pose frames.
export function rig(el){
 if(el._rig)return el._rig;
 const body=el.querySelector('.ceremony-sprite,.body'),root=document.createElement('div');root.className='anime-figure';body.classList.add('anime-anchor');body.append(root);
 const p={kneel:el.classList.contains('devotee')?1:0,bow:0,reach:0,salute:0},offset=[...String(el.dataset.id||'')].reduce((n,c)=>n+c.charCodeAt(0),0)/19;
 let walking=false,held=false,direction='back',seated=false,tween=null,disposed=false,paintKey='',stepStart=0,lastTransform='';const width=body.clientWidth||150,height=body.clientHeight||195;
 function paint(now){
  const frame=poseFrame(p,{walking,held,direction,step:Math.max(0,Math.floor((now-stepStart)/180))}),spec=atlas[frame.atlas],artScale=frame.atlas==='bow'?1:1.22,w=width*artScale,h=height*artScale,ox=(width-w)/2,oy=height-h,key=frame.atlas+':'+frame.index+':'+width+':'+height;
  if(key!==paintKey){const foot=spec.feet[frame.index],sx=w/(spec.width/spec.columns)*.96,sy=h/(spec.height/spec.rows)*.96,bx=w/2-foot.x*sx,by=height*.97-oy-foot.y*sy;root.style.left=ox+'px';root.style.top=oy+'px';root.style.width=w+'px';root.style.height=h+'px';root.style.backgroundImage=`url('${spec.url}')`;root.style.backgroundSize=`${spec.width*sx}px ${spec.height*sy}px`;root.style.backgroundPosition=`${bx}px ${by}px`;root.style.clipPath=`inset(${Math.max(0,by+foot.top*sy)}px ${Math.max(0,w-bx-foot.right*sx)}px ${Math.max(0,h-by-foot.bottom*sy)}px ${Math.max(0,bx+foot.left*sx)}px)`;root.dataset.atlas=frame.atlas;root.dataset.frame=frame.index;el.dataset.poseKind=frame.atlas;el.dataset.artScale=artScale;el.dataset.animationFrame=frame.atlas+':'+frame.index;paintKey=key;}
  const transform=walking?`translateY(${-Math.abs(Math.sin((now-stepStart)/130))*2}px)`:'none';if(transform!==lastTransform){root.style.transform=transform;lastTransform=transform;}
 }
 const person={el,get isCrowd(){return seated&&!el.classList.contains('premium');},update(now,crowdBow=0){if(tween){const t=Math.max(0,Math.min(1,(now-tween.start)/tween.ms)),e=t*t*(3-2*t);for(const key of Object.keys(p))p[key]=tween.from[key]+((tween.to[key]??tween.from[key])-tween.from[key])*e;if(t===1){tween.resolve(true);tween=null;}}if(seated){p.kneel=1;p.bow=el.classList.contains('premium')?seatedBow(now/1000+offset,4.2):crowdBow;}paint(now);},dispose(){api.dispose();}};
 const api={
  walk(value,facing='back'){if(value&&!walking)stepStart=performance.now();walking=value;direction=facing;paint(performance.now());},
  face(angle){el.dataset.facing=angle.toFixed(2);},
  seated(){seated=true;p.kneel=1;paint(performance.now());},
  incense(value){held=value;el.dataset.holding=String(value);paint(performance.now());},
  pose(to,ms=700){if(disposed)return Promise.resolve(false);tween?.resolve(false);if(ms<=1){Object.assign(p,to);paint(performance.now());return Promise.resolve(true);}return new Promise(resolve=>{tween={from:{...p},to,start:performance.now(),ms,resolve};});},
  dispose(){if(disposed)return;disposed=true;tween?.resolve(false);tween=null;people.delete(person);root.remove();body.classList.remove('anime-anchor');el._rig=null;delete el.dataset.holding;delete el.dataset.motionRenderer;}
 };
 el._rig=api;el.dataset.motionRenderer='sprite';el.dataset.character='female';el.dataset.holding='false';people.add(person);paint(performance.now());wake();return api;
}
export class Burner{
 waiting=[];owners=new Map();
 constructor({capacity=1}={}){this.capacity=capacity;}
 get owner(){return this.owners.values().next().value||null;}
 acquire(valid,priority=false){return new Promise(resolve=>{const job={valid,resolve};priority?this.waiting.unshift(job):this.waiting.push(job);this.pump();});}
 pump(){this.waiting=this.waiting.filter(job=>{if(job.valid())return true;job.resolve(null);return false;});for(let slot=0;slot<this.capacity;slot++){if(this.owners.has(slot)||!this.waiting.length)continue;const job=this.waiting.shift();this.owners.set(slot,job);let released=false;const release=()=>{if(released)return;released=true;if(this.owners.get(slot)===job)this.owners.delete(slot);this.pump();};release.slot=slot;job.resolve(release);}}
 clear(){this.owners.clear();for(const job of this.waiting)job.resolve(null);this.waiting=[];}
}
