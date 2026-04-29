export const EVASION_KEYWORDS = [
  '0[1-9][0-9]{8,9}',
  'zalo', 'za loo', 'za lờ', 'zzl', 'dzalo', 'zl', 'da lo', 'zá lồ', 'zép\\s*lào', 'giấy\\s*lô', 'da\\s*lô', 'za\\s*lô', 'z\\s*a\\s*l\\s*o', 'z\\.l', 'z\\.a\\.l\\.o',
  'facebook', 'fb', 'phây', 'phở\\s*bò', 'phờ\\s*bờ', 'f\\s*b', 'fesbuk', 'face\\s*book', 'fắc\\s*búc',
  'telegram', 'tele', 'tê\\s*lê\\s*gram', 'whatsapp', 'viber', 'wechat', 'skype', 'discord', 'messenger', 'mess ',
  'tiktok', 'tóp\\s*tóp', 'tik\\s*tok', 'tíc\\s*tóc', 'tok\\s*tok', 'ig', 'insta', 'instagram', 'ins', 'youtube', 'linkedin',
  'stk', 'số\\s*tài\\s*khoản', 'chuyển\\s*khoản', 'vietcombank', 'vcb', 'techcombank', 'mbbank', 'vpbank', 'momo', 'zalopay', 'vnpay', 'chuyển\\s*tiền',
  'drive\\.google', '1drv\\.ms', 'dropbox', 'notion\\.site', 'onedrive', 'googledrive',
  'không\\s*chín', 'không\\s*ba', 'không\\s*bảy', 'không\\s*tám', 'không\\s*năm', 'sđt', 'số\\s*điện\\s*thoại', 'gọi\\s*số',
  '@gmail', '@yahoo', '@hotmail', '@outlook'
];

export const PROFANITY_KEYWORDS = [
  'đm', 'vcl', 'đéo', 'cmn', 'loz', 'cặc', 'lồn', 'đĩ', 'phò', 'điếm', 'địt', 'chó\\s*đẻ', 'ốc\\s*chó', 'óc\\s*chó', 'cđm', 'dcm', 'vkl', 'vl', 'cl', 'clgv', 'đb', 'đmm', 'đcm', 'đờ\\s*mờ', 'lìn', 'cc', 'cứt', 'cẹc', 'đjt', 'đụ', 'đù', 'vãi\\s*lồn', 'vãi\\s*cả\\s*lồn', 'vãi\\s*cức'
];

export const EVASION_REGEX = new RegExp(`(${EVASION_KEYWORDS.join('|')})`, 'i');
export const PROFANITY_REGEX = new RegExp(`(${PROFANITY_KEYWORDS.join('|')})`, 'i');
