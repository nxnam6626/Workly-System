const fs = require('fs');
const file = 'app/(public)/(candidate)/profile/jobs/viewed/page.tsx';
let content = fs.readFileSync(file, 'latin1');
const replacements = [
  ['H? Chí Minh', 'Hồ Chí Minh'],
  ['Hà N?i', 'Hà Nội'],
  ['Ðang t?i l?ch s? xem...', 'Đang tải lịch sử xem...'],
  ['Vi?c làm', 'Việc làm'],
  ['Ðã xem', 'Đã xem'],
  ['L?ch s? xem vi?c làm giúp b?n d? d?nh hu?ng và tìm l?i nh?ng co h?i dã lu?t qua.', 'Lịch sử xem việc làm giúp bạn dễ định hướng và tìm lại những cơ hội đã lướt qua.'],
  ['Tìm ki?m...', 'Tìm kiếm...'],
  ['V?a xem', 'Vừa xem'],
  ['Xem l?i ngay', 'Xem lại ngay'],
  ['B?n chua xem <span className="text-blue-600 italic">công vi?c nào?</span>', 'Bạn chưa xem <span className="text-blue-600 italic">công việc nào?</span>'],
  ['L?ch s? xem s? giúp b?n luu l?i hành trình tìm ki?m. Hãy b?t d?u khám phá các co h?i ngh? nghi?p ngay!', 'Lịch sử xem sẽ giúp bạn lưu lại hành trình tìm kiếm. Hãy bắt đầu khám phá các cơ hội nghề nghiệp ngay!'],
  ['B?t d?u tìm ki?m', 'Bắt đầu tìm kiếm']
];
for(const [bad, good] of replacements) {
  content = content.replace(bad, good);
}
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed file');
