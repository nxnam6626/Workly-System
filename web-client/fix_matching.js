const fs = require('fs');
const file = 'app/(public)/(candidate)/profile/jobs/matching/page.tsx';
let content = fs.readFileSync(file, 'latin1');
const replacements = [
  ['AI dang phân tích h? so c?a b?n...', 'AI đang phân tích hồ sơ của bạn...'],
  ['Vi?c làm', 'Việc làm'],
  ['cho phong cách c?a b?n', 'cho phong cách của bạn'],
  ['Thu?t toán AI c?a chúng tôi dã phân tích', 'Thuật toán AI của chúng tôi đã phân tích'],
  ['k? nang trong CV d? d? xu?t nh?ng v? trí có d? tuong thích cao nh?t.', 'kỹ năng trong CV để đề xuất những vị trí có độ tương thích cao nhất.'],
  ['D?a trên Workly Core II', 'Dựa trên Workly Core II'],
  ['Ð? xu?t hàng d?u', 'Đề xuất hàng đầu'],
  ['Ðang c?p nh?t theo th?i gian th?c', 'Đang cập nhật theo thời gian thực'],
  ['B?n tin dang 2 ngày tru?c', 'Bản tin đăng 2 ngày trước'],
  ['K? nang tuong thích', 'Kỹ năng tương thích'],
  ['Ðang phân tích k? nang...', 'Đang phân tích kỹ năng...'],
  ['H? th?ng g?i ý d?a trên h? so chuyên sâu c?a b?n', 'Hệ thống gợi ý dựa trên hồ sơ chuyên sâu của bạn'],
  ['Chi ti?t', 'Chi tiết'],
  ['?ng tuy?n ngay', 'Ứng tuyển ngay'],
  ['Chua tìm th?y m?c', 'Chưa tìm thấy mục'],
  ['Ð?ng lo l?ng! Hãy c?p nh?t thêm k? nang vào h? so ho?c t?i lên CV m?i d? AI có th? phân tích chính xác hon.', 'Đừng lo lắng! Hãy cập nhật thêm kỹ năng vào hồ sơ hoặc tải lên CV mới để AI có thể phân tích chính xác hơn.'],
  ['C?p nh?t H? so/CV ngay', 'Cập nhật Hồ sơ/CV ngay']
];
for(const [bad, good] of replacements) {
  content = content.replace(bad, good);
}
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed file');
