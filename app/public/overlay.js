import {RealtimeEvents} from './realtime.js';
import {isBigGift,largeGiftThanks} from './large-gift.mjs';
import {giftIcon,giftIcons,defaultGiftSlots} from './gift-icons.mjs';
import {applyLayout} from './layout-editor.js';
import {OfferingQueue,groupRoseThanksText,assignSeats,cushionPosition,ordinaryCushionPosition} from './procession.mjs';
import {rig,Burner} from './ritual-motion.js';
import {fixedSeats} from './seating.mjs';
import {thanksText,chooseWish} from './thanks.mjs';
import {AmbientMusic} from './ambient-music.js';
import {VoicePlayer} from './voice.js';
import {IncenseSmoke} from './incense-smoke.js';
const $=s=>document.querySelector(s),preview=new URLSearchParams(location.search).has('preview');
const queue=new OfferingQueue(),nodes=new Map(),roamers=new Map(),voicePlayer=new VoicePlayer(),actor=$('#procession');
let state,audio,music,busy=false,activeId=null,rotation=0,lastBell=0,runToken=0,previousWish='';
const burner=new Burner({capacity:2}),ordinaryQueue=[],pads=new Set(),departed=new Set();let lastComment=0,botCursor=0;
const outfitIds=new Set();let outfitsRestored=false;let donorRanks=new Map();
function donorStyle(el,id){el.classList.toggle('donor',!!state?.scores?.[id]);el.classList.toggle('donor-outfit',outfitIds.has(id));const rank=donorRanks.get(id)||0;el.classList.toggle('top-donor',rank>0);if(rank)el.dataset.donorRank=String(rank);else delete el.dataset.donorRank;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const smoke=new IncenseSmoke($('#scene'));
function fit(){const s=Math.min(innerWidth/1080,innerHeight/1920);$('#frame').style.transform=`scale(${s})`;$('#frame').style.left=(innerWidth-1080*s)/2+'px';$('#frame').style.top=(innerHeight-1920*s)/2+'px';}
addEventListener('resize',fit);fit();for(let i=0;i<10;i++){const premium=i<4,p=premium?cushionPosition(i):ordinaryCushionPosition(i-4),pad=document.createElement('div');pad.className=premium?'premium-pad luxury-pad':'premium-pad ordinary-pad';pad.style.left=p.x-(premium?78:66)+'px';pad.style.top=p.y-(premium?24:21)+'px';pad.dataset.x=p.x;pad.dataset.y=p.y;if(!premium)pad.style.rotate=(p.x<540?'-5deg':'5deg');$('#cushions').append(pad);}
$('#cushions').setAttribute('aria-label','4 đệm công đức trên chiếu nghỉ, 3 đệm hành lễ mỗi bên phía dưới');
function startAudio(){
 if(preview)return;
 try{const Context=window.AudioContext||window.webkitAudioContext;if(!audio&&Context){audio=new Context();music=new AmbientMusic(audio);}if(state)music?.setConfig(state.config.musicEnabled??true,state.config.musicVolume??.2,state.config.backgroundAudio?.url);if(audio?.state==='suspended')audio.resume().catch(()=>{});}catch{}
}
// Request normal autoplay on load. A browser that requires a gesture can unlock
// on any normal interaction; no button or control is drawn over the LIVE.
startAudio();addEventListener('pointerdown',startAudio,{passive:true});addEventListener('keydown',startAudio);addEventListener('focus',startAudio);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)startAudio();});
let giftSound;
function bell(){startAudio();if(!audio||audio.state!=='running'||Date.now()-lastBell<1500)return;lastBell=Date.now();if(state?.config.giftAudio?.url){giftSound?.pause();giftSound=new Audio(state.config.giftAudio.url);giftSound.volume=Math.max(0,Math.min(1,state.config.volume??.35));giftSound.play().catch(()=>{});return;}[220,441,653,891,1233].forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((state?.config.volume??.35)*.15/(i+1),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+3.8);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+4);});}
function initial(p){const el=document.createElement('span');el.className='initial';el.textContent=p.name?.[0]||'✦';return el;}
function nameContent(name){const text=document.createElement('span');text.textContent=name;return text;}
let namesScheduled=false;function measureNames(){if(namesScheduled)return;namesScheduled=true;requestAnimationFrame(()=>{namesScheduled=false;document.querySelectorAll('.person-name').forEach(n=>{const text=n.firstElementChild;if(!text)return;const overflow=Math.max(0,text.scrollWidth-n.clientWidth);n.style.setProperty('--overflow',-overflow+'px');n.classList.toggle('scroll-name',overflow>1);});});}
new MutationObserver(measureNames).observe($('#frame'),{childList:true,subtree:true});document.fonts.ready.then(measureNames);
function avatar(p){if(!/^https:\/\//i.test(p.avatar))return initial(p);const img=document.createElement('img');img.src=p.avatar;img.referrerPolicy='no-referrer';img.alt='';img.onerror=()=>img.replaceWith(initial(p));return img;}
function giftEmoji(g){return /rose|h[oồ]ng/i.test(g)?'🌹':/heart|tim/i.test(g)?'💗':/peach|đào/i.test(g)?'🍑':/lion/i.test(g)?'🦁':'🪷';}
function renderTopSupporters(top,c){const widget=$('#top-supporters');widget.hidden=c.showTopSupporters===false||!top.length;widget.replaceChildren();for(const index of [1,0,2]){const p=top[index];if(!p)continue;const item=document.createElement('div'),frame=document.createElement('div'),photo=document.createElement('div'),badge=document.createElement('b'),name=document.createElement('span'),score=document.createElement('small');item.className='top-supporter supporter-rank-'+(index+1);frame.className='supporter-frame';photo.className='supporter-avatar';photo.append(avatar(p));badge.className='supporter-position';badge.textContent='TOP '+(index+1);frame.append(photo,badge);name.className='supporter-name person-name';name.append(nameContent(p.name));name.title=p.name;score.textContent='◆ '+p.total.toLocaleString('vi-VN');item.append(frame,name,score);widget.append(item);}}
function renderFooter(c,top){
 const rail=$('#gift-prayer-rail');rail.replaceChildren();for(const slot of (c.giftSlots||defaultGiftSlots).slice(0,4)){const row=document.createElement('div'),icon=giftIcon(slot.icon),text=document.createElement('strong');row.className='gift-prayer-item';icon.classList.add('gift-prayer-icon');text.textContent=slot.prayer;row.append(icon,text);rail.append(row);}

 $('#footer-gifts').replaceChildren();for(const rule of (c.giftSlots||defaultGiftSlots).slice(0,3)){const tile=document.createElement('div'),name=document.createElement('b'),prayer=document.createElement('span');tile.className='footer-gift';name.textContent=giftIcons.find(x=>x.id===rule.icon)?.name||'Quà tặng';prayer.textContent=rule.prayer;tile.append(name,prayer);$('#footer-gifts').append(tile);}
 $('#footer-ranking').replaceChildren();$('#footer-merit').hidden=!c.board;for(const[p,i]of top.slice(0,3).map((p,i)=>[p,i])){const row=document.createElement('div'),name=document.createElement('span'),score=document.createElement('b');row.className='footer-rank';name.textContent=(i+1)+'. '+p.name;score.textContent='★ '+p.total.toLocaleString('vi-VN');row.append(name,score);$('#footer-ranking').append(row);}if(!top.length)$('#footer-ranking').textContent='Chờ tấm lòng đầu tiên';
}
new MutationObserver(()=>{$('#footer-current').textContent=$('#ceremony-status-text').textContent||'Thành tâm dâng hương';}).observe($('#ceremony-status-text'),{childList:true,subtree:true,characterData:true});
function render(){
 donorRanks=new Map(Object.values(state.scores||{}).filter(p=>p.total>0).sort((a,b)=>b.total-a.total).slice(0,3).map((p,i)=>[p.id,i+1]));
 const c=state.config;$('header').hidden=c.showTitle===false;$('#gift-prayer-rail').hidden=c.showGiftRail===false;$('#live-footer').hidden=c.showFooter===false;if(c.peachBlossoms===false)$('#petals').replaceChildren();if(!preview){startAudio();music?.setConfig(c.musicEnabled??true,c.musicVolume??.2,c.backgroundAudio?.url);}$('#title').textContent=c.title;$('#subtitle').textContent=c.subtitle;$('#board').hidden=!c.board;$('#peace-hint').textContent=`Gõ “${c.keyword||'adidaphat'}”\nđể cùng gửi lời cầu an`;
 const reservedIds=new Set((state.recentGivers||[]).slice(0,4).map(p=>p.id));for(const id of [...roamers.keys()])if(reservedIds.has(id))stopRoamer(id);
 const seats=assignSeats(fixedSeats(state.people,state.capacity),state.recentGivers,state.capacity);const ids=new Set(seats.map(s=>s.key));for(const[id,n]of nodes)if(!ids.has(id)){stopRoamer(id);n.remove();nodes.delete(id);}
 seats.forEach(({person:p,key,position:pos,special},i)=>{
  let n=nodes.get(key);if(!n){n=document.createElement('div');n.className='devotee';n.dataset.id=p.id;const body=document.createElement('div');body.className='body devotee-sprite';body.style.animationDelay=-(i*.71)+'s';const label=document.createElement('div');label.className='label';n.append(body,label);$('#people').append(n);nodes.set(key,n);}
  if(n.dataset.name!==p.name||n.dataset.avatar!==p.avatar){const name=document.createElement('span');name.className='person-name';const text=document.createElement('span');text.textContent=p.name;name.append(text);n.querySelector('.label').replaceChildren(avatar(p),name);n.dataset.name=p.name;n.dataset.avatar=p.avatar;requestAnimationFrame(()=>{const overflow=Math.max(0,text.scrollWidth-name.clientWidth);name.style.setProperty('--overflow',-overflow+'px');name.classList.toggle('scroll-name',overflow>1);});}n.querySelector('.label').hidden=!p.name;
  donorStyle(n,p.id);n.classList.toggle('premium',special);n.style.left=pos.x-64+'px';n.style.top=pos.y-164+'px';n.style.transform=`scale(${pos.scale})`;n.style.setProperty('--bubble-scale',1/pos.scale);n.style.setProperty('--bubble-shift',((Math.max(180,Math.min(900,pos.x))-pos.x)/pos.scale)+'px');n.style.setProperty('--name-lift',special?'0px':(-(Math.floor((i%20)/2)%3)*28/pos.scale)+'px');n.querySelector('.label').title=p.name||'';n.dataset.x=pos.x;n.dataset.y=pos.y;n.dataset.scale=pos.scale;n.style.zIndex=String(pos.row+1);n.classList.toggle('away',p.id===activeId||roamers.has(p.id));rig(n).seated();
 });
 $('#ranking').replaceChildren();const top=Object.values(state?.scores||{}).sort((a,b)=>b.total-a.total).slice(0,5);
 if(!top.length){const p=document.createElement('p');p.className='empty';p.textContent='Chờ tấm lòng đầu tiên';$('#ranking').append(p);}
 top.forEach((p,i)=>{const row=document.createElement('div');row.className='rank rank-'+(i+1);const name=document.createElement('span');name.className='name';name.textContent=p.name;name.title=p.name;const value=document.createElement('span');value.className='value';const star=document.createElement('span');star.className='merit-star';star.textContent='★';const number=document.createElement('b');number.textContent=p.total.toLocaleString('vi-VN');const unit=document.createElement('small');unit.textContent='tâm đức';value.append(star,number,unit);row.append(avatar(p),name,value);$('#ranking').append(row);});
 renderFooter(c,top);renderTopSupporters(top.slice(0,3),c);applyLayout(c);if(activeId)donorStyle(actor,activeId);for(const [id,r] of roamers)donorStyle(r.el,id);queueStatus();
}
function queueStatus(){$('#queue-count').textContent=queue.length?`${queue.length} lượt dâng hương đang chờ`:'TÂM AN · VẠN SỰ AN';}
function petals(big=false){if(state?.config.peachBlossoms===false)return;const layer=$('#petals'),available=Math.max(0,72-layer.childElementCount);for(let i=0;i<Math.min(big?28:14,available);i++){const p=document.createElement('i'),duration=9+Math.random()*5,size=24+Math.random()*24;p.className='peach-blossom';p.style.left=(50+Math.random()*980)+'px';p.style.width=p.style.height=size+'px';p.style.setProperty('--drift',(Math.random()*240-120)+'px');p.style.setProperty('--turn',(Math.random()*700-350)+'deg');p.style.animationDuration=duration+'s';p.style.animationDelay=(Math.random()*1.2)+'s';layer.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true});setTimeout(()=>p.remove(),16500);}}
function chatBubble(d,prayer=false){
 const n=nodes.get(d.id)||nodes.get('premium:'+d.id);if(!n)return;
 // Keep comments above the assigned character for the configured duration.
 n.querySelector('.chat-bubble')?.remove();const bubble=document.createElement('div');bubble.className='chat-bubble';bubble.textContent=prayer?'🙏 '+(d.comment||'A Di Đà Phật'):String(d.comment||'').slice(0,100);n.append(bubble);n.classList.add('chatting');setTimeout(()=>{bubble.remove();if(!n.querySelector('.chat-bubble'))n.classList.remove('chatting');},Math.max(1,Math.min(30,Number(state?.config.commentSeconds)||8))*1000);
}
function actorAt(el,x,y,scale=1){el.style.left=x-75+'px';el.style.top=y-195+'px';el.style.transform=`scale(${scale})`;}
// Frames are centered from atlas metadata in the shared anime motion renderer.
function gait(el,direction='back'){
 rig(el).walk(true,direction);el.classList.add('walking');
}
function stopGait(el){el._rig?.walk(false);el._gait?.cancel();el._gait=null;const sprite=el.querySelector('.ceremony-sprite');sprite.style.backgroundImage='';sprite.style.backgroundSize='';el.classList.remove('walking');}
async function moveActor(el,points,duration,token,valid=()=>true){
 gait(el,points.at(-1).y>points[0].y?'front':'back');
 const animation=el.animate(points.map(p=>({left:p.x-75+'px',top:p.y-195+'px',transform:`scale(${p.scale??1})`})),{duration,easing:'ease-in-out',fill:'forwards'});el._move=animation;
 try{await animation.finished;}catch{return false;}if(token!==runToken||!valid())return false;
 const p=points.at(-1);actorAt(el,p.x,p.y,p.scale??1);animation.cancel();el._move=null;stopGait(el);return true;
}
function stopRoamer(id){const r=roamers.get(id);if(!r)return;roamers.delete(id);r.release?.();pads.delete(r.pad);r.el._move?.cancel();r.el._rig?.dispose();stopGait(r.el);r.el.remove();if(id!==activeId)nodes.get(id)?.classList.remove('away');burner.pump();}
async function bowOnce(el,token,valid,stage='bow'){
 const model=rig(el);el.dataset.stage=stage;await model.pose({bow:1},620);await sleep(180);await model.pose({bow:0},620);return token===runToken&&valid();
}
async function placeIncense(el,token,valid,priority=false,lease=null){
 const release=lease||await burner.acquire(()=>token===runToken&&valid(),priority);if(!release)return false;
 const r=roamers.get(el.dataset.id);if(r)r.release=release;
 el.dataset.incenseSlot=release.slot;el.style.setProperty('--standing-label-top',release.slot===1?'-125px':'-75px');el.style.setProperty('--holding-label-top',release.slot===1?'-165px':'-115px');
 try{if(token!==runToken||!valid())return false;const model=rig(el);if(priority&&activeId){outfitIds.add(activeId);donorStyle(el,activeId);render();}el.dataset.stage='standing-salute';await model.pose({kneel:0,bow:0,reach:0,salute:1},550);if(token!==runToken||!valid())return false;await sleep(250);await model.pose({salute:0},550);if(token!==runToken||!valid())return false;
 el.dataset.stage='incense';model.incense(true);await sleep(450);await model.pose({reach:1},1100);if(token!==runToken||!valid())return false;model.incense(false);petals(priority);
 const stick=document.createElement('i');stick.className='planted-incense';stick.style.left=(529+Math.random()*22)+'px';stick.style.top='731px';$('#scene').append(stick);smoke.plant(parseFloat(stick.style.left),731);const planted=document.querySelectorAll('.planted-incense');if(planted.length>20)planted[0].remove();await sleep(350);await model.pose({reach:0},650);return token===runToken&&valid();
 }finally{release();if(r)r.release=null;delete el.dataset.incenseSlot;el.style.removeProperty('--standing-label-top');el.style.removeProperty('--holding-label-top');}
}
async function roam(){
 // Eight circulating visitors plus the one gift actor: two serving, at most seven waiting.
 if(!state||roamers.size>=8)return;
 const reserved=new Set((state.recentGivers||[]).slice(0,4).map(p=>p.id));const options=fixedSeats(state.people,state.capacity).filter(p=>!p.vacant&&!reserved.has(p.id)&&p.id!==activeId&&!roamers.has(p.id)&&!queue.pending.some(d=>d.id===p.id));if(!options.length)return;
 let p;while(ordinaryQueue.length&&!p){const id=ordinaryQueue.shift();p=options.find(x=>x.id===id);}if(!p){if(Date.now()-lastComment<8000)return;p=options[botCursor++%options.length];}const seat=nodes.get(p.id);if(!seat)return;
 const pad=Array.from({length:6},(_,i)=>i).find(i=>!pads.has(i));if(pad===undefined)return;pads.add(pad);
 const el=document.createElement('div');el.className='ceremony-person roamer';el.dataset.id=p.id;donorStyle(el,p.id);
 const sprite=document.createElement('div');sprite.className='ceremony-sprite devotee-sprite';const label=document.createElement('div');label.className='ceremony-label';const name=document.createElement('span');name.className='person-name';name.append(nameContent(p.name));label.append(avatar(p),name);label.hidden=!p.name;el.append(sprite,label);$('#people').append(el);
 const r={el,pad};roamers.set(p.id,r);seat.classList.add('away');const token=runToken,valid=()=>roamers.get(p.id)===r;
 const home={x:Number(seat.dataset.x),y:Number(seat.dataset.y),scale:Number(seat.dataset.scale)||.98};actorAt(el,home.x,home.y,home.scale);
 const lane=540,front={x:540,y:975,scale:1.09},back=ordinaryCushionPosition(pad);
 try{
  el.dataset.stage='stand';await rig(el).pose({kneel:1},1);await rig(el).pose({kneel:0},700);
  el.dataset.stage='up';const waiting={x:540,y:1045+pad*48,scale:1};if(!await moveActor(el,[home,{x:lane,y:home.y,scale:home.scale},waiting],4300,token,valid))return;
  el.dataset.stage='waiting';r.release=await burner.acquire(()=>token===runToken&&valid());if(!r.release||!valid())return;
  front.x=r.release.slot===0?484:596;
  if(!await moveActor(el,[waiting,front],1250,token,valid))return;
  if(!await placeIncense(el,token,valid,false,r.release))return;
  el.dataset.stage='down';if(!await moveActor(el,[front,{x:lane,y:1115,scale:1},back],3000,token,valid))return;
  rig(el).face(Math.PI-Math.atan2(540-back.x,350));el.dataset.stage='kneel';await rig(el).pose({kneel:1},800);for(let i=0;i<3;i++){el.dataset.bowCount=i+1;if(!await bowOnce(el,token,valid))return;}
  el.dataset.stage='stand';await rig(el).pose({kneel:0},800);
  const current=nodes.get(p.id),target=current?{x:Number(current.dataset.x),y:Number(current.dataset.y),scale:Number(current.dataset.scale)||1}:home;
  el.dataset.stage='home';if(await moveActor(el,[back,{x:lane,y:target.y,scale:1},target],4000,token,valid))await rig(el).pose({kneel:1},700);
 }finally{if(valid())stopRoamer(p.id);}
}
setInterval(roam,1400);
let tributeTimer,finishTribute;
function hideLargeGift(){clearTimeout(tributeTimer);$('#large-gift-tribute').hidden=true;$('#large-gift-avatar').replaceChildren();finishTribute?.();finishTribute=null;}
function showLargeGift(d){$('#large-gift-name').textContent=d.name;$('#large-gift-details').textContent=d.gift+' ×'+d.count+' · '+(d.count*d.diamonds).toLocaleString('vi-VN')+' xu';$('#large-gift-avatar').replaceChildren(avatar(d));$('#large-gift-tribute').hidden=false;return new Promise(resolve=>{finishTribute=resolve;tributeTimer=setTimeout(hideLargeGift,6000);});}
function cleanup(){hideLargeGift();actor._release?.();actor._release=null;music?.setDucking(false);actor._move?.cancel();stopGait(actor);nodes.get(activeId)?.classList.remove('away');nodes.get('premium:'+activeId)?.classList.remove('away');activeId=null;actor.hidden=true;actor.classList.remove('bowing');actor.querySelector('.chat-bubble')?.remove();$('#focus-card').classList.remove('show');$('#aura').classList.remove('big');$('#frame').classList.remove('in-ceremony');$('#scene').classList.remove('camera-close');}
async function next(){
 if(busy||!queue.length||!state)return;busy=true;const token=runToken,d=queue.take(),valid=()=>token===runToken&&!departed.has(d.id);activeId=d.id;stopRoamer(d.id);queueStatus();const n=nodes.get('premium:'+d.id)||nodes.get(d.id);n?.classList.add('away');nodes.get(d.id)?.classList.add('away');
 d.wish=chooseWish(state.config.wishes,previousWish);previousWish=d.wish;d.big=isBigGift(d);d.thanks=d.big?largeGiftThanks(d):thanksText(d,state.config.thanksTemplate);
 const shouldRead=d.big||!d.thanksRead;let ready=!preview&&state.config.speech&&shouldRead&&state.config.speechMode!=='browser'?voicePlayer.prepare(d.thanks):null;
 $('#frame').classList.add('in-ceremony');$('#ceremony-status-text').textContent=`${d.name} · Thành tâm dâng hương`;$('#ceremony-name').className='person-name';$('#ceremony-name').replaceChildren(nameContent(d.name));$('#ceremony-avatar').replaceChildren(avatar(d));$('#offering-prayer').textContent=d.prayer||'Cầu Bình An';$('#offering-details').textContent=`${d.name} dâng ${d.gift} ×${d.count}`;
 const origin={x:Number(n?.dataset.x)||540,y:Number(n?.dataset.y)||1640,scale:1.02},altar={x:540,y:975,scale:1.13};actorAt(actor,origin.x,origin.y,origin.scale);actor.hidden=false;donorStyle(actor,d.id);
 try{
  await rig(actor).pose({kneel:1,bow:0},1);await rig(actor).pose({kneel:0},650);
  actor._release=await burner.acquire(valid,true);if(!actor._release)return;
  altar.x=actor._release.slot===0?484:596;
  const approach=origin.y<1000?[origin,{x:540,y:origin.y+25,scale:1.08},altar]:[origin,{x:540,y:Math.max(1040,origin.y-35),scale:1.08},altar];
  if(!await moveActor(actor,approach,1800,token,valid))return;
  if(!await placeIncense(actor,token,valid,true,actor._release))return;actor._release=null;
  actor.classList.add('bowing');$('#scene').classList.add('camera-close');$('#prayer').textContent=`Cảm ơn bạn ${d.name}`;$('#dedication').textContent=d.wish;$('#focus-card').classList.add('show');
  $('#ceremony-status-text').textContent=`${d.name} · ${d.gift} ×${d.count}`;
  const group=state.config.speech&&shouldRead&&!d.big?queue.roseThanksGroup(d,p=>!departed.has(p.id)):[d];if(group.length>1){d.thanks=groupRoseThanksText(group);ready=!preview&&state.config.speech&&state.config.speechMode!=='browser'?voicePlayer.prepare(d.thanks):null;$('#ceremony-status-text').textContent='Tri ân: '+group.map(p=>p.name).join(', ');}
  const big=d.big;if(big&&ready)await ready;if(!valid())return;bell();if(big)$('#aura').classList.add('big');const tribute=big?showLargeGift(d):Promise.resolve();
  if(!preview&&state.config.speech&&shouldRead)music?.setDucking(true);
  const speech=!preview&&state.config.speech&&shouldRead?voicePlayer.play(d.thanks,state.config,ready,valid).catch(e=>{if(group.length>1)group.forEach(p=>p.thanksRead=false);if(token===runToken)$('#offline').textContent=e.message;}).finally(()=>{if(token===runToken)music?.setDucking(false);}):Promise.resolve();
  const reverence=(async()=>{await rig(actor).pose({kneel:1},700);for(let i=0;i<3;i++)if(!valid()||!await bowOnce(actor,token,valid))return;})();
  await Promise.all([sleep(Math.max(4.8,state.config.focusSeconds)*1000),speech,reverence,tribute]);if(!valid())return;
  hideLargeGift();$('#scene').classList.remove('camera-close');$('#focus-card').classList.remove('show');$('#aura').classList.remove('big');actor.classList.remove('bowing');$('#ceremony-status-text').textContent=`${d.name} · Hoàn lễ, bình an`;
  await sleep(550);if(!valid())return;
  await rig(actor).pose({kneel:0},650);
  const homeNode=nodes.get('premium:'+d.id)||nodes.get(d.id),home=homeNode?{x:Number(homeNode.dataset.x),y:Number(homeNode.dataset.y),scale:.9}:origin;
  if(await moveActor(actor,[altar,{x:540,y:home.y,scale:.85},home],1500,token))await rig(actor).pose({kneel:1},650);
 }finally{if(token===runToken){cleanup();busy=false;$('#ceremony-status-text').textContent='Chờ những tấm lòng thành kính';queueStatus();next();}}
}
let giftStartTimer;const es=new RealtimeEvents();
es.addEventListener('state',e=>{state=JSON.parse(e.data,(_,v)=>typeof v==='string'?v.normalize('NFC'):v);if(!outfitsRestored){Object.keys(state.scores||{}).forEach(id=>outfitIds.add(id));outfitsRestored=true;}for(const p of state.people)if(!p.vacant)departed.delete(p.id);$('#offline').textContent='';render();});
es.addEventListener('focus',e=>{const d=JSON.parse(e.data,(_,v)=>typeof v==='string'?v.normalize('NFC'):v);if(d.kind==='chat'){chatBubble(d,true);return;}queue.add(d);queueStatus();if(!busy&&!giftStartTimer)giftStartTimer=setTimeout(()=>{giftStartTimer=null;next();},650);});
es.addEventListener('activity',e=>{const d=JSON.parse(e.data,(_,v)=>typeof v==='string'?v.normalize('NFC'):v);if(d.type==='chat'){chatBubble(d);lastComment=Date.now();if(!ordinaryQueue.includes(d.id)&&!roamers.has(d.id))ordinaryQueue.push(d.id);roam();}});
es.addEventListener('leave',async e=>{
 const d=JSON.parse(e.data);departed.add(d.id);queue.pending=queue.pending.filter(p=>p.id!==d.id);ordinaryQueue.splice(0,ordinaryQueue.length,...ordinaryQueue.filter(id=>id!==d.id));
 const n=nodes.get('premium:'+d.id)||nodes.get(d.id),moving=roamers.get(d.id)?.el||(activeId===d.id?actor:null);if(!n&&!moving)return;
 const movingStyle=moving?getComputedStyle(moving):null,x=movingStyle?parseFloat(movingStyle.left)+75:Number(n.dataset.x),y=movingStyle?parseFloat(movingStyle.top)+195:Number(n.dataset.y);
 stopRoamer(d.id);if(activeId===d.id){voicePlayer.stop();actor._rig?.dispose();cleanup();}n?.classList.add('away');
 const el=document.createElement('div');el.className='ceremony-person roamer departing';el.innerHTML='<div class="ceremony-sprite"></div>';$('#people').append(el);actorAt(el,x,y,.85);await rig(el).pose({kneel:1},1);await rig(el).pose({kneel:0},700);await moveActor(el,[{x,y,scale:.85},{x:x<540?-100:1180,y:Math.min(1830,y+140),scale:.9}],3200,runToken);el._rig?.dispose();el.remove();
});
es.addEventListener('walk',()=>{roam();});
es.addEventListener('reset',()=>{clearTimeout(giftStartTimer);giftStartTimer=null;outfitIds.clear();runToken++;lastComment=Date.now();botCursor=0;departed.clear();smoke.reset();queue.clear();ordinaryQueue.length=0;burner.clear();voicePlayer.stop();actor._rig?.dispose();cleanup();for(const id of [...roamers.keys()])stopRoamer(id);document.querySelectorAll('.planted-incense,.departing').forEach(n=>n.remove());busy=false;$('#ceremony-status-text').textContent='Chờ những tấm lòng thành kính';queueStatus();$('#petals').replaceChildren();});
es.onerror=()=>$('#offline').textContent='Mất kết nối localhost · đang thử lại…';

addEventListener('pagehide',()=>{music?.dispose();smoke.dispose();});

addEventListener('pagehide',()=>es.close());
