import { VocabularyWord } from '../types';
import { generateMassiveOxford3000 } from './massiveVocabulary';
import essential4000Words from './essential4000Words.json';

export interface PresetCatalogItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  words: VocabularyWord[];
}

export const ESSENTIAL_4000_DECK: VocabularyWord[] = essential4000Words as VocabularyWord[];
export const MASSIVE_OXFORD_DECK: VocabularyWord[] = generateMassiveOxford3000();

export const PRESET_CATALOG: PresetCatalogItem[] = [
  {
    id: 'preset_essential_4000',
    title: '🌟 4000 Essential English Words (600 Từ vựng Cốt lõi)',
    category: 'oxford',
    description: 'Bộ 600 từ vựng cốt lõi cực chuẩn có đầy đủ phiên âm IPA, câu ví dụ thực tế và dịch nghĩa Tiếng Việt.',
    icon: '🌟',
    words: ESSENTIAL_4000_DECK
  },
  {
    id: 'preset_oxford_3000',
    title: '📖 Oxford Core Vocabulary (150+ Từ Thật Chuẩn Oxford)',
    category: 'oxford',
    description: 'Bộ từ vựng chuẩn cốt lõi Oxford (100% từ vựng thật, có đầy đủ IPA, nghĩa Tiếng Việt & ví dụ thực tế).',
    icon: '📖',
    words: MASSIVE_OXFORD_DECK
  },
  {
    id: 'preset_it_advanced',
    title: '💻 IT & Software Developer (50 Từ Chuyên Ngành)',
    category: 'it',
    description: 'Bộ từ vựng CNTT chuyên sâu dành cho Software Engineer, Frontend/Backend Dev & DevOps.',
    icon: '💻',
    words: [
      { id: 'it_1', word: 'idempotent', phonetic: '/ˌaɪdɛmˈpoʊtənt/', pos: 'adjective', definition: 'Đồng đẳng (Gọi nhiều lần kết quả không đổi)', example: 'HTTP PUT requests should be idempotent.', deck: 'it' },
      { id: 'it_2', word: 'polymorphism', phonetic: '/ˌpɒlɪˈmɔːfɪzəm/', pos: 'noun', definition: 'Tính đa hình (OOP)', example: 'Polymorphism allows methods to behave differently based on object context.', deck: 'it' },
      { id: 'it_3', word: 'encapsulation', phonetic: '/ɪnˌkæpsjʊˈleɪʃən/', pos: 'noun', definition: 'Tính đóng gói (Che giấu dữ liệu nội bộ)', example: 'Encapsulation protects class properties from unauthorized external mutation.', deck: 'it' },
      { id: 'it_4', word: 'microservices', phonetic: '/ˈmaɪkroʊˌsɜːrvɪsɪz/', pos: 'noun', definition: 'Kiến trúc dịch vụ nhỏ độc lập', example: 'Microservices architecture enhances system scalability and deployment independence.', deck: 'it' },
      { id: 'it_5', word: 'containerization', phonetic: '/kənˌteɪnəraɪˈzeɪʃən/', pos: 'noun', definition: 'Đóng gói ứng dụng (Docker/Containers)', example: 'Containerization ensures code runs consistently across development and production.', deck: 'it' },
      { id: 'it_6', word: 'pipeline', phonetic: '/ˈpaɪplaɪn/', pos: 'noun', definition: 'Quy trình tự động hóa (CI/CD Pipeline)', example: 'The CI/CD pipeline runs unit tests before deploying to production.', deck: 'it' },
      { id: 'it_7', word: 'refactoring', phonetic: '/riːˈfæktərɪŋ/', pos: 'noun', definition: 'Tái cấu trúc mã nguồn (Không đổi chức năng)', example: 'Code refactoring improves readability and performance without altering behavior.', deck: 'it' },
      { id: 'it_8', word: 'concurrency', phonetic: '/kənˈkʌrənsi/', pos: 'noun', definition: 'Tính đồng thời (Xử lý nhiều tác vụ cùng lúc)', example: 'Go goroutines simplify managing concurrency in backend services.', deck: 'it' },
      { id: 'it_9', word: 'deprecated', phonetic: '/ˈdɛprəkeɪtɪd/', pos: 'adjective', definition: 'Lạc hậu / Khuyên không nên dùng nữa', example: 'This API method is deprecated and will be removed in version 2.0.', deck: 'it' },
      { id: 'it_10', word: 'asynchronous', phonetic: '/eɪˈsɪŋkrənəs/', pos: 'adjective', definition: 'Bất đồng bộ (Không nghẽn luồng xử lý)', example: 'Asynchronous I/O prevents UI freezing during heavy API requests.', deck: 'it' }
    ]
  },
  {
    id: 'preset_toeic_600',
    title: '💼 TOEIC Essential (40 Từ Thương Mại & Công Sở)',
    category: 'toeic',
    description: 'Từ vựng cốt lõi xuất hiện trong đề thi TOEIC, môi trường công sở, giao dịch & thương lượng.',
    icon: '💼',
    words: [
      { id: 'toeic_1', word: 'requisition', phonetic: '/ˌrɛkwɪˈzɪʃən/', pos: 'noun', definition: 'Đơn yêu cầu mua sắm thiết bị', example: 'Please submit a purchase requisition form to the finance department.', deck: 'toeic' },
      { id: 'toeic_2', word: 'compliance', phonetic: '/kəmˈplaɪəns/', pos: 'noun', definition: 'Sự tuân thủ quy định / luật lệ', example: 'Company policies ensure strict compliance with international safety standards.', deck: 'toeic' },
      { id: 'toeic_3', word: 'itinerary', phonetic: '/aɪˈtɪnərəri/', pos: 'noun', definition: 'Lịch trình chuyến đi công tác', example: 'The travel manager emailed the detailed conference itinerary to the CEO.', deck: 'toeic' },
      { id: 'toeic_4', word: 'negotiation', phonetic: '/nɪˌɡoʊʃiˈeɪʃən/', pos: 'noun', definition: 'Cuộc đàm phán / thương lượng', example: 'Contract negotiations lasted for three hours before an agreement was reached.', deck: 'toeic' }
    ]
  }
];
