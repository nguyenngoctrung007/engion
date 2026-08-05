import { VocabularyWord } from '../types';

export const BUILTIN_VOCABULARY: VocabularyWord[] = [
  // --- IT ENGLISH ---
  {
    id: 'it-1',
    word: 'Refactor',
    phonetic: '/riːˈfæktər/',
    pos: 'verb',
    definition: 'Tái cấu trúc mã nguồn (mà không làm thay đổi hành vi bên ngoài)',
    example: 'We need to refactor this module to make the codebase more maintainable.',
    deck: 'it',
    level: 'Intermediate'
  },
  {
    id: 'it-2',
    word: 'Deprecate',
    phonetic: '/ˈdeprəkeɪt/',
    pos: 'verb',
    definition: 'Khai tử / Mos nhược điểm, ngưng hỗ trợ trong tương lai',
    example: 'The v1 API endpoints will be deprecated in the next release cycle.',
    deck: 'it',
    level: 'Intermediate'
  },
  {
    id: 'it-3',
    word: 'Idempotent',
    phonetic: '/ˌaɪdəmˈpəʊtənt/',
    pos: 'adjective',
    definition: 'Tính chất mà thực hiện nhiều lần vẫn cho kết quả như 1 lần',
    example: 'HTTP PUT operations should be idempotent to prevent duplicate resource creation.',
    deck: 'it',
    level: 'Advanced'
  },
  {
    id: 'it-4',
    word: 'Bottleneck',
    phonetic: '/ˈbɒtlnek/',
    pos: 'noun',
    definition: 'Điểm nghẽn (hiệu năng / quy trình phát triển)',
    example: 'Database queries turned out to be the main performance bottleneck.',
    deck: 'it',
    level: 'Intermediate'
  },
  {
    id: 'it-5',
    word: 'Asynchronous',
    phonetic: '/eɪˈsɪŋkrənəs/',
    pos: 'adjective',
    definition: 'Bất đồng bộ (không chờ hoàn thành công việc trước)',
    example: 'JavaScript uses asynchronous programming to handle network requests without blocking the thread.',
    deck: 'it',
    level: 'Intermediate'
  },
  {
    id: 'it-6',
    word: 'Concurrency',
    phonetic: '/kənˈkʌrənsi/',
    pos: 'noun',
    definition: 'Tính đồng thời (xử lý nhiều công việc trong cùng khoảng thời gian)',
    example: 'Rust provides memory safety guarantees even when handling high concurrency.',
    deck: 'it',
    level: 'Advanced'
  },
  {
    id: 'it-7',
    word: 'Payload',
    phonetic: '/ˈpeɪləʊd/',
    pos: 'noun',
    definition: 'Dữ liệu thực sự được truyền đi trong gói tin / request',
    example: 'Check the network tab to inspect the JSON payload sent to the backend.',
    deck: 'it',
    level: 'Beginner'
  },
  {
    id: 'it-8',
    word: 'Middleware',
    phonetic: '/ˈmɪdlweə(r)/',
    pos: 'noun',
    definition: 'Phần mềm trung gian xử lý request trước khi đến controller',
    example: 'Authentication is handled by a custom middleware in Express.',
    deck: 'it',
    level: 'Intermediate'
  },

  // --- TOEIC ---
  {
    id: 'toeic-1',
    word: 'Negotiate',
    phonetic: '/nɪˈɡəʊʃieɪt/',
    pos: 'verb',
    definition: 'Đàm phán, thương lượng hợp đồng/giá cả',
    example: 'The team managed to negotiate a better contract with the supplier.',
    deck: 'toeic',
    level: 'Intermediate'
  },
  {
    id: 'toeic-2',
    word: 'Implement',
    phonetic: '/ˈɪmplɪment/',
    pos: 'verb',
    definition: 'Thực thi, thi hành (kế hoạch, chính sách)',
    example: 'Management decided to implement new security guidelines immediately.',
    deck: 'toeic',
    level: 'Intermediate'
  },
  {
    id: 'toeic-3',
    word: 'Agenda',
    phonetic: '/əˈdʒendə/',
    pos: 'noun',
    definition: 'Chương trình nghị sự, nội dung cuộc họp',
    example: 'Please review the meeting agenda before joining the conference call.',
    deck: 'toeic',
    level: 'Beginner'
  },
  {
    id: 'toeic-4',
    word: 'Comply',
    phonetic: '/kəmˈplaɪ/',
    pos: 'verb',
    definition: 'Tuân thủ (quy định, tiêu chuẩn)',
    example: 'All employees must comply with the company code of conduct.',
    deck: 'toeic',
    level: 'Intermediate'
  },
  {
    id: 'toeic-5',
    word: 'Reimburse',
    phonetic: '/ˌriːɪmˈbɜːs/',
    pos: 'verb',
    definition: 'Hoàn tiền, bồi hoàn chi phí',
    example: 'The company will reimburse travel expenses within 5 business days.',
    deck: 'toeic',
    level: 'Intermediate'
  },
  {
    id: 'toeic-6',
    word: 'Discrepancy',
    phonetic: '/dɪsˈkrepənsi/',
    pos: 'noun',
    definition: 'Sự sai lệch, chênh lệch không nhất quán',
    example: 'Auditors found a major discrepancy between the inventory list and actual stock.',
    deck: 'toeic',
    level: 'Advanced'
  },

  // --- IELTS ---
  {
    id: 'ielts-1',
    word: 'Ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    pos: 'adjective',
    definition: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi',
    example: 'Smartphones have become ubiquitous in modern human society.',
    deck: 'ielts',
    level: 'Advanced'
  },
  {
    id: 'ielts-2',
    word: 'Mitigate',
    phonetic: '/ˈmɪtɪɡeɪt/',
    pos: 'verb',
    definition: 'Giảm thiểu tác hại, làm dịu bớt hậu quả',
    example: 'Planting trees helps to mitigate the effects of global climate change.',
    deck: 'ielts',
    level: 'Intermediate'
  },
  {
    id: 'ielts-3',
    word: 'Plausible',
    phonetic: '/ˈplɔːzəbl/',
    pos: 'adjective',
    definition: 'Hợp lý, có vẻ đáng tin cậy',
    example: 'The scientist offered a highly plausible explanation for the sudden phenomenon.',
    deck: 'ielts',
    level: 'Intermediate'
  },
  {
    id: 'ielts-4',
    word: 'Detrimental',
    phonetic: '/ˌdetrɪˈmentl/',
    pos: 'adjective',
    definition: 'Gây hại, có hại cho sức khỏe/sự phát triển',
    example: 'Excessive consumption of sugar has a detrimental impact on human health.',
    deck: 'ielts',
    level: 'Intermediate'
  },
  {
    id: 'ielts-5',
    word: 'Prevalent',
    phonetic: '/ˈprevələnt/',
    pos: 'adjective',
    definition: 'Thịnh hành, lưu hành rộng rãi',
    example: 'Remote work became prevalent across many global industries following 2020.',
    deck: 'ielts',
    level: 'Intermediate'
  },

  // --- OXFORD 3000 ---
  {
    id: 'oxford-1',
    word: 'Consistent',
    phonetic: '/kənˈsɪstənt/',
    pos: 'adjective',
    definition: 'Kiên định, nhất quán, trước sau như một',
    example: 'Consistent daily effort is the key to mastering any new language.',
    deck: 'oxford',
    level: 'Beginner'
  },
  {
    id: 'oxford-2',
    word: 'Accurate',
    phonetic: '/ˈækjərət/',
    pos: 'adjective',
    definition: 'Chính xác, chuẩn xác không sai sót',
    example: 'Make sure your financial report provides accurate measurements and numbers.',
    deck: 'oxford',
    level: 'Beginner'
  },
  {
    id: 'oxford-3',
    word: 'Enthusiastic',
    phonetic: '/ɪnˌθjuːziˈæstɪk/',
    pos: 'adjective',
    definition: 'Hăng hái, nhiệt tình, hào hứng',
    example: 'She gave an enthusiastic presentation that won over the entire audience.',
    deck: 'oxford',
    level: 'Beginner'
  },
  {
    id: 'oxford-4',
    word: 'Crucial',
    phonetic: '/ˈkruːʃl/',
    pos: 'adjective',
    definition: 'Cực kỳ quan trọng, mang tính quyết định',
    example: 'Getting enough sleep is crucial for optimal cognitive performance.',
    deck: 'oxford',
    level: 'Intermediate'
  }
];
