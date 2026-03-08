import { Translations } from './en';

export const vi: Translations = {
  // Màn hình bắt đầu
  startTitle: 'Mô Phỏng Cuộc Sống',
  startSubtitle: 'Mỗi quyết định thay đổi số phận. Mỗi lần chơi là một cuộc đời mới. Bạn sẽ sống cuộc đời như thế nào?',
  startButton: '🎮 Bắt đầu cuộc đời mới',
  featureRandom: 'Kết quả ngẫu nhiên',
  featureEvents: '40+ Sự kiện',
  featureReplay: 'Chơi lại nhiều lần',
  featureEndings: 'Nhiều kết thúc',

  // Chỉ số
  statAge: 'Tuổi',
  statHealth: 'Sức khỏe',
  statMoney: 'Tiền',
  statHappiness: 'Hạnh phúc',

  // Sự kiện
  ageBadge: '📅 Tuổi',
  yourChoices: '🤔 Lựa chọn của bạn',
  locked: '🔒 Khóa',

  // Kết quả
  rollingDice: 'Đang tung xúc xắc',
  diceResult: 'Kết quả xúc xắc',
  viewResults: '💀 Xem kết quả',
  continueBtn: '➡️ Tiếp tục',

  // Kết thúc - Chết
  deathTitle: 'Bạn Đã Qua Đời',
  deathSubtitle: (age: number) => `Cuộc đời bạn kết thúc ở tuổi ${age}. Đây là di sản của bạn:`,

  // Kết thúc - Phá sản
  bankruptTitle: 'Phá Sản!',
  bankruptSubtitle: (age: number) => `Bạn vỡ nợ ở tuổi ${age}. Đây là di sản của bạn:`,

  // Kết thúc - Tuyệt vọng
  depressedTitle: 'Tuyệt Vọng',
  depressedSubtitle: (age: number) => `Bạn mất đi ý chí sống ở tuổi ${age}. Đây là di sản của bạn:`,

  // Kết thúc - Về hưu
  retirementTitle: 'Chúc Mừng!',
  retirementSubtitle: (age: number) => `Bạn đã sống trọn vẹn đến tuổi ${age}! Đây là di sản của bạn:`,

  // Legacy
  gameOverTitle: 'Kết Thúc',
  gameOverSubtitle: (age: number) => `Cuộc đời bạn kết thúc ở tuổi ${age}.`,

  playAgain: '🔄 Chơi lại',

  // Tải & Lỗi
  creatingLife: 'Đang tạo cuộc đời...',
  errorStart: 'Không thể bắt đầu. Backend đã chạy chưa?',
  errorChoice: 'Không thể xử lý lựa chọn',
  errorContinue: 'Không thể tiếp tục',

  // Ngôn ngữ
  langLabel: '🌐',
  langName: 'VI',
};
