export function bowFrame(amount){return amount<.22?0:amount<.55?1:amount<.85?2:3;}
export function poseFrame(p,{walking=false,held=false,direction='back',step=0}={}){
 if(walking)return {atlas:'walk',index:(direction==='front'?4:0)+((Math.trunc(step)%4)+4)%4};
 if(p.kneel>=.5)return {atlas:'bow',index:bowFrame(p.bow)};
 if(p.salute>.25)return {atlas:'standing',index:1};
 return {atlas:'standing',index:held?(p.reach<.5?2:3):0};
}
export function seatedBow(seconds,period=7.8){const phase=((seconds%period)+period)%period,down=period<5?.62:.85,hold=period<5?.18:.35;let b=phase<down?phase/down:phase<down+hold?1:phase<down*2+hold?1-(phase-down-hold)/down:0;return b*b*(3-2*b);}
