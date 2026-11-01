export function isBigGift(gift){return (Number(gift.count)||0)*(Number(gift.diamonds)||0)>=50;}
export function largeGiftThanks(gift){return `Chùa xin trân trọng cảm ơn bạn ${gift.name}. Kính chúc bạn và gia đình luôn bình an.`;}
