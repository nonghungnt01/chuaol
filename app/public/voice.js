export class VoicePlayer {
  current=null;controller=null;
  stop(){this.controller?.abort();this.controller=null;if(this.current){this.current.pause();this.current=null;}if('speechSynthesis'in window)speechSynthesis.cancel();}
  async prepare(text){
    const controller=new AbortController();this.controller=controller;
    const timer=setTimeout(()=>controller.abort(),14000);
    try{
      const r=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:controller.signal});
      if(!r.ok){const b=await r.json();throw Error(b.error||'Không tạo được giọng đọc');}
      const blob=await r.blob();return {blob};
    }catch(error){return {error};}finally{clearTimeout(timer);}
  }
  async play(text,config,ready,isValid=()=>true){
    if(!isValid())return;
    if(config.speechMode!=='browser'){
      const result=await(ready||this.prepare(text));if(!isValid())return;
      if(!result.error){
        const url=URL.createObjectURL(result.blob),sound=new Audio(url);this.current=sound;sound.volume=config.volume;
        try{await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,22000);const done=()=>{clearTimeout(timer);resolve();};sound.onended=done;sound.onpause=done;sound.onerror=()=>{clearTimeout(timer);reject(Error('Không phát được âm thanh'));};sound.play().catch(reject);});return;}
        finally{sound.pause();if(this.current===sound)this.current=null;URL.revokeObjectURL(url);}
      }
    }
    if(!('speechSynthesis'in window))throw Error('Trình duyệt không hỗ trợ giọng đọc');
    const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'));
    if(!voice)throw Error('Chưa phát được giọng Việt. Kiểm tra Internet hoặc cài giọng tiếng Việt trên máy.');
    if(!isValid())return;
    await new Promise(resolve=>{const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang='vi-VN';utterance.volume=config.volume;utterance.rate=.95;const timer=setTimeout(resolve,22000);utterance.onend=utterance.onerror=()=>{clearTimeout(timer);resolve();};speechSynthesis.speak(utterance);});
  }
}
