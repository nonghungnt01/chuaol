// The user's local MP3, streamed by the localhost server with byte-range support.
export class AmbientMusic{
 constructor(context){
  this.context=context;this.enabled=false;this.volume=.2;this.ducked=false;this.pending=false;this.disposed=false;
  this.element=new Audio('/audio/meditation-user.mp3?v=1');this.element.loop=true;this.element.preload='metadata';
  this.source=context.createMediaElementSource(this.element);this.master=context.createGain();this.master.gain.value=0;
  this.source.connect(this.master).connect(context.destination);
  this.timer=setInterval(()=>this.tick(),1000);
 }
 setConfig(enabled,volume=.2,url='/audio/meditation-user.mp3?v=1'){
  if(this.url!==url){this.url=url;this.element.pause();this.element.src=url;this.element.load();}
  this.enabled=!!enabled;this.volume=Math.max(0,Math.min(1,Number(volume)||0));this.applyGain();clearTimeout(this.pauseTimer);
  if(this.enabled)this.tick();else this.pauseTimer=setTimeout(()=>this.element.pause(),350);
 }
 setDucking(active){this.ducked=!!active;this.applyGain();}
 applyGain(){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(this.enabled?this.volume*(this.ducked?.22:1):0,now,.22);}
 tick(){
  if(this.disposed||!this.enabled||this.pending||!this.element.paused)return;
  this.pending=true;
  this.element.play().catch(()=>{/* Host autoplay permissions still apply. Retry on normal interaction/tick. */}).finally(()=>{this.pending=false;});
 }
 dispose(){
  this.disposed=true;this.enabled=false;clearInterval(this.timer);clearTimeout(this.pauseTimer);this.element.pause();this.element.removeAttribute('src');this.element.load();this.source.disconnect();this.master.disconnect();
 }
}
