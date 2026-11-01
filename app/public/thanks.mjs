export const defaultThanks='Cảm ơn bạn {name} đã dâng hương. {wish}';
export const defaultWishes=[
 'Chúc bạn và gia đình luôn bình an, mạnh khỏe.',
 'Chúc bạn mỗi ngày đều gặp những điều tốt lành.',
 'Chúc bạn tâm luôn an, lòng luôn nhẹ nhàng.',
 'Chúc bạn và những người thân yêu luôn vui vẻ, an nhiên.',
 'Chúc bạn mọi việc thuận hòa, gặp nhiều may mắn.',
 'Chúc bạn một ngày ấm áp và nhiều niềm vui.',
 'Chúc bạn giữ được nụ cười và sự bình yên trong tâm.',
 'Chúc bạn gia đình hòa thuận, đong đầy yêu thương.',
 'Chúc bạn có thêm nghị lực để vượt qua những điều khó khăn.',
 'Chúc bạn công việc thuận lợi, cuộc sống an vui.',
 'Chúc bạn luôn được bao quanh bởi những người tốt.',
 'Chúc bạn đêm ngủ an lành, ngày mới nhiều hy vọng.',
 'Chúc bạn học tập tiến bộ, bền lòng với những ước mơ.',
 'Chúc bạn đi đâu cũng bình an, trở về luôn có người thương.',
 'Chúc bạn bớt muộn phiền, thêm nhiều niềm vui nhỏ.',
 'Chúc bạn đủ sức khỏe, đủ yêu thương và đủ bình yên.',
 'Chúc bạn luôn vững tâm và tìm thấy những điều ý nghĩa.',
 'Chúc bạn đón nhận nhiều tin vui trong những ngày sắp tới.',
 'Chúc bạn cùng gia đình có những phút giây ấm áp bên nhau.',
 'Chúc bạn gieo điều thiện lành, nuôi dưỡng lòng bao dung.'
];
export function chooseWish(wishes=defaultWishes,previous='',random=Math.random){const list=[...new Set(wishes.filter(x=>typeof x==='string'&&x.trim()))];const choices=list.length>1?list.filter(x=>x!==previous):list;return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]||defaultWishes[0];}
const giftNames={'rose':'hoa hồng','finger heart':'trái tim','heart':'trái tim','peach':'quả đào','lion':'sư tử','tiktok':'quà TikTok'};
export function thanksText(d,template=defaultThanks){
  const values={name:String(d.name||'bạn').slice(0,60),count:String(d.count||1),gift:giftNames[String(d.gift||'').toLowerCase()]||String(d.gift||'quà'),prayer:String(d.prayer||'Cầu chúc bình an'),wish:d.wish||chooseWish()};
  return template.replace(/\{(name|count|gift|prayer|wish)\}/g,(_,key)=>values[key]).slice(0,450);
}
