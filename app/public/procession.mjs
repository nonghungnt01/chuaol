import {isBigGift} from './large-gift.mjs';
const giftValue=gift=>Math.max(0,Number(gift.count)||0)*Math.max(0,Number(gift.diamonds)||0);
const isRose=gift=>['rose','hoa hong'].includes(String(gift.gift||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim());
export function groupRoseThanksText(group){const names=group.map(p=>p.name);return `Chùa xin cảm ơn các bạn ${names.slice(0,-1).join(', ')} và ${names.at(-1)} đã dâng hương. Chúc các bạn và gia đình luôn bình an.`;}
// Higher-value pending gifts go first; the active ceremony is never interrupted.
export class OfferingQueue {
  pending = [];
  add(event) {
    const key = `${event.id}|${event.giftId || event.gift}`;
    const existing = this.pending.find(item => item.key === key);
    if (existing) { existing.count += event.count; existing.name = event.name; existing.avatar=event.avatar||existing.avatar;if(Number(event.diamonds)>0)existing.diamonds=event.diamonds;return existing; }
    const item = {...event, key}; this.pending.push(item); return item;
  }
  take() { this.pending.sort((a,b)=>giftValue(b)-giftValue(a));return this.pending.shift(); }
  roseThanksGroup(current,eligible=()=>true){
    if(current.thanksRead||!isRose(current)||isBigGift(current))return [current];
    const candidates=[],ids=new Set([current.id]);
    for(const item of [...this.pending].sort((a,b)=>giftValue(b)-giftValue(a))){
      if(!item.thanksRead&&isRose(item)&&!isBigGift(item)&&!ids.has(item.id)&&eligible(item)){candidates.push(item);ids.add(item.id);}
    }
    if(ids.size<6)return [current];
    const group=[current,...candidates.slice(0,2)];
    if(group.length>1)for(const item of group)item.thanksRead=true;
    return group;
  }
  clear() { this.pending.length = 0; }
  get length() { return this.pending.length; }
}
export function seatPosition(index,capacity=160) {
  const side=index%2,n=Math.floor(index/2),row=Math.floor(n/10),col=n%10;
  const noise=k=>{const v=Math.sin((index+1)*127.1+k*311.7)*43758.5453;return v-Math.floor(v);};
  const depth=row/Math.max(1,Math.ceil(capacity/20)-1),outer=100-depth*30,lateral=Math.min(450,outer+(450-outer)*col/9+(noise(1)-.5)*26);
  return {x:side?1080-lateral:lateral,y:1235+445*depth**1.15+(noise(2)-.5)*40,scale:(.83+depth*.189+noise(3)*.045)*1.07,row:row+3};
}
export function cushionPosition(index){return {x:[160,330,750,920][index%4],y:870,scale:.99,row:0};}
// Each side: an inner row of two and a lower row of three facing the center.
export function ordinaryCushionPosition(index){return {x:[140,275,410,670,805,940][index%6],y:1045,scale:1.01,row:1};}
export function assignSeats(people,recentGivers=[],capacity=people.length||160){const premium=recentGivers.slice(0,4),reserved=new Set(premium.map(p=>p.id));return [...people.map((p,i)=>{const person=reserved.has(p.id)?{id:'reserved-seat-'+i,name:'',avatar:'',anonymous:true}:p;return {person,key:person.id,special:false,position:seatPosition(i,capacity)};}).filter(s=>!s.person.vacant),...premium.map((p,i)=>({person:p,key:'premium:'+p.id,special:true,position:cushionPosition(i)}))];}
