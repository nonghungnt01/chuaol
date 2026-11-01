// WebSocket events use their own connection pool, leaving HTTP available for controls/uploads.
export class RealtimeEvents extends EventTarget{
 constructor(){super();this.stopped=false;this.retry=0;this.open();}
 open(){if(this.stopped)return;const socket=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/events/ws');this.socket=socket;
 socket.addEventListener('open',()=>{this.retry=0;});
 socket.addEventListener('message',e=>{try{const message=JSON.parse(e.data);if(typeof message.type==='string')this.dispatchEvent(new MessageEvent(message.type,{data:JSON.stringify(message.data)}));}catch{}});
 socket.addEventListener('error',()=>{this.onerror?.(new Event('error'));});
 socket.addEventListener('close',()=>{if(this.stopped)return;this.onerror?.(new Event('error'));this.timer=setTimeout(()=>this.open(),Math.min(10000,500*2**Math.min(this.retry++,4)));});
 }
 close(){this.stopped=true;clearTimeout(this.timer);this.socket?.close();}
}
