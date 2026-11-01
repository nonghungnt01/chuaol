const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=__dirname,port=Number(process.env.PHATMT_PORT)||3002,url='http://localhost:'+port;
function openBrowser(){spawn(path.join(process.env.SystemRoot||'C:\\Windows','System32','rundll32.exe'),['url.dll,FileProtocolHandler',url],{windowsHide:true,stdio:'ignore'}).unref();}
async function check(){try{const r=await fetch('http://127.0.0.1:'+port+'/api/license/status',{signal:AbortSignal.timeout(700)});return {reachable:true,data:await r.json().catch(()=>null)};}catch{return null;}}
(async()=>{
 const expected=JSON.parse(fs.readFileSync(path.join(root,'BUILD_INFO.json'),'utf8')).buildId;const existing=await check();if(existing?.data?.product==='PhatMT'){if(expected&&existing.data.buildId!==expected){console.error('Dang chay PhatMT ban cu. Hay dong TAT CA cua so BAT_DAU cu, roi chay BAT_DAU.bat trong thu muc PhatMTV3.');process.exitCode=1;return;}openBrowser();return;}
 if(existing){console.error('Cong '+port+' dang duoc ung dung khac su dung. Hay dong tool localhost cu roi mo lai PhatMT.');process.exitCode=1;return;}
 console.log('Dang mo PhatMT...');
 const child=spawn(path.join(root,'runtime','node.exe'),[path.join(root,'app','server.cjs')],{cwd:path.join(root,'app'),env:{...process.env,PORT:String(port)},stdio:'inherit',windowsHide:true});
 child.on('error',()=>{console.error('Khong mo duoc bo chay. Giai nen day du thu muc runtime va app.');process.exitCode=1;});
 child.on('exit',code=>process.exit(code||0));process.on('SIGINT',()=>{child.kill();});
 for(let i=0;i<80;i++){const status=await check();if(status?.data?.product==='PhatMT'){openBrowser();console.log('Bang dieu khien: '+url);console.log('Giu cua so nay mo khi LIVE. Bam Ctrl+C de dung.');return;}await new Promise(resolve=>setTimeout(resolve,250));}
 console.error('Chua mo duoc trang. Kiem tra thong bao trong cua so nay.');
})();
