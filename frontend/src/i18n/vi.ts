import { Translations } from './en';

export const vi: Translations = {
  // Màn hình bắt đầu
  startTitle: 'Mô Phỏng Cuộc Sống',
  startSubtitle: 'Mỗi quyết định thay đổi số phận. Mỗi lần chơi là một cuộc đời mới. Bạn sẽ sống cuộc đời như thế nào?',
  startButton: '🎮 Bắt đầu cuộc đời mới',
  featureRandom: 'Kết quả ngẫu nhiên',
  featureEvents: '100+ Sự kiện',
  featureReplay: 'Chơi lại nhiều lần',
  featureEndings: 'Nhiều kết thúc',

  // Tạo nhân vật
  createTitle: 'Tạo Nhân Vật',
  createSubtitle: 'Chọn tên, giới tính và hoàn cảnh gia đình để bắt đầu hành trình.',
  nameLabel: 'Tên nhân vật',
  namePlaceholder: 'Nhập tên của bạn...',
  genderLabel: 'Giới tính',
  genderMale: '👦 Nam',
  genderFemale: '👧 Nữ',
  backgroundLabel: 'Gia cảnh',
  bgPoor: 'Gia đình nghèo',
  bgPoorDesc: 'Cuộc sống khó khăn nhưng bạn rất kiên cường.',
  bgMiddle: 'Gia đình trung lưu',
  bgMiddleDesc: 'Khởi đầu cân bằng với nguồn lực vừa phải.',
  bgRich: 'Gia đình giàu có',
  bgRichDesc: 'Đặc quyền đi kèm với áp lực riêng.',
  bgMoney: 'Tiền',
  bgHealth: 'Sức khỏe',
  bgHappiness: 'Hạnh phúc',
  createButton: '🌟 Bắt đầu cuộc đời',

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

  // Nút hành động
  btnRelationships: 'Quan hệ',
  btnJob: 'Công việc',
  btnAssets: 'Tài sản',
  btnActions: 'Hành động',

  // Popup Quan hệ
  relTitle: 'Quan Hệ',
  relFather: 'Ba',
  relMother: 'Mẹ',
  relSpouse: 'Vợ/Chồng',
  relChildren: 'Con',
  relNone: 'Chưa có',
  relAge: 'Tuổi',

  // Popup Công việc
  jobTitle: 'Công Việc',
  jobName: 'Chức vụ',
  jobSalary: 'Lương',
  jobPosition: 'Cấp bậc',
  jobNone: 'Chưa có việc',

  // Popup Tài sản
  assetTitle: 'Tài Sản',
  assetHouse: 'Nhà',
  assetCar: 'Xe',
  assetInsurance: 'Bảo hiểm',
  assetNone: 'Chưa có tài sản',
  assetValue: 'Giá trị',
  assetYes: 'Đang có',
  assetNo: 'Chưa có',

  // Popup Hành động
  actionsTitle: 'Hành Động',
  actionsComingSoon: 'Các hành động sẽ mở khi bạn tiến xa hơn trong cuộc đời.',

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

  // Misc
  close: 'Đóng',
  yearSummary: (age: number) => `📊 Tổng kết năm (Tuổi ${age})`,
  summaryContBtn: 'Tiếp tục ▸',
  yourChoices: 'Lựa chọn của bạn',
  diceResult: 'Kết quả xúc xắc',
  continueBtn: 'Tiếp tục ▸',
  viewResults: 'Xem kết quả ▸',
  locked: '🔒',
};
