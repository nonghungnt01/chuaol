import {seatedBow} from './anime-poses.mjs';
// Each round chooses a quarter of the lower crowd, not every seated person.
export class CrowdBows {
 constructor(random=Math.random){this.random=random;this.roundEnd=0;this.selected=new Map();this.active=new Set();}
 update(now,members){
  if(members.length&&now>=this.roundEnd){const shuffled=members.slice();for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}this.selected=new Map(shuffled.slice(0,Math.floor(members.length/4)).map(person=>[person,now+this.random()*1500]));this.roundEnd=now+7800;}
  const eligible=new Set(members);this.active=new Set([...this.selected.keys()].filter(p=>eligible.has(p)).slice(0,Math.floor(members.length/4)));
 }
 has(person){return this.active.has(person);}
 value(person,now){const start=this.selected.get(person);return this.has(person)&&now>=start?seatedBow((now-start)/1000,7.8):0;}
}
