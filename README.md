# Life Simulation Game 🎮

A text-based life simulation game built with Ruby on Rails (Backend) and React/Vite (Frontend). Make choices, deal with consequences, and try to survive from age 18 to 80 without running out of money, health, or happiness!

*Language: English / [Tiếng Việt](#trò-chơi-mô-phỏng-cuộc-đời-)*

---

## 🌟 Key Features
- **100 Unique Handcrafted Events**: Every event is deeply unique with no repetitive choices. From funny everyday accidents to massive life choices.
- **Dynamic Branching Narratives**: Some choices lead immediately to specific follow-up events 
- **Three Core Stats**: Balance your `Money 💰`, `Health ❤️`, and `Happiness 😊`. If health drops to 0, you die. If money drops below 0, you go bankrupt. If happiness drops to 0, you succumb to despair.
- **Bilingual Interface**: Seamlessly switch between English and Vietnamese.

## 🚀 Getting Started

### Prerequisites
- Ruby 3.2.1
- Rails 8.1.2
- Node.js & npm
- PostgreSQL (or standard SQLite for dev)

### Backend Setup (API)
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Ruby gems:
   ```bash
   bundle install
   ```
3. Set up the database and seed the 100 events:
   ```bash
   rails db:migrate
   rails db:seed
   ```
4. Start the Rails server:
   ```bash
   rails s
   ```
   *The API will run on http://localhost:3000*

### Frontend Setup (UI)
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The Web UI will be available at http://127.0.0.1:5173*

## 🛠️ How to Add Custom Events
To add new events to the game without touching Ruby code:
1. Open `backend/db/events.json`
2. Add a new JSON block following the existing structure.
3. Run `rails db:seed` in the backend folder to apply changes to the database.

---

<br>

# Trò Chơi Mô Phỏng Cuộc Đời 🎮

Một tựa game mô phỏng cuộc đời dạng văn bản (text-based) được xây dựng bằng Ruby on Rails (Backend) và React/Vite (Frontend). Đưa ra các quyết định, đối mặt với hậu quả và cố gắng sống sót từ năm 18 tuổi đến khi 80 tuổi mà không bị cạn kiệt tiền bạc, sức khỏe hay hạnh phúc!

## 🌟 Tính Năng Chính
- **100 Sự Kiện Độc Bản**: Mỗi sự kiện được viết tay hoàn toàn độc nhất với các kết quả khác biệt. Từ những tai nạn buồn cười hàng ngày đến các quyết định sinh tử của đời người.
- **Cốt Truyện Rẽ Nhánh**: Một số sự kiện sẽ dẫn trực tiếp đến các hậu quả ở tương lai.
- **Quản Lý 3 Chỉ Số Cốt Lõi**: Cân bằng `Tiền Bạc 💰`, `Sức Khỏe ❤️`, và `Hạnh Phúc 😊`. Nếu máu về 0, bạn "bay màu". Nếu tiền âm, bạn phá sản. Nếu hạnh phúc chạm đáy, bạn rơi vào tuyệt vọng (Game Over).
- **Giao Diện Song Ngữ**: Chế độ luân chuyển mượt mà giữa Tiếng Anh và Tiếng Việt..

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Ruby 3.2.1
- Rails 8.1.2
- Node.js & npm
- PostgreSQL (hoặc SQLite mặc định)

### Cài Đặt Backend (API)
1. Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện Ruby:
   ```bash
   bundle install
   ```
3. Khởi tạo database và nạp 100 sự kiện có sẵn:
   ```bash
   rails db:migrate
   rails db:seed
   ```
4. Chạy server Rails:
   ```bash
   rails s
   ```
   *API sẽ chạy tại http://localhost:3000*

### Cài Đặt Frontend (UI)
1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Chạy giao diện Vite:
   ```bash
   npm run dev
   ```
   *Web UI chơi game sẽ hiện ở http://127.0.0.1:5173*

## 🛠️ Cách Tạo Sự Kiện Riêng (Mod Game)
Để thêm sự kiện mới tự chế mà không cần biết code Ruby:
1. Mở file `backend/db/events.json`
2. Copy và dán thêm 1 cụm sự kiện mới tuân theo cấu trúc có sẵn. Sửa các câu chữ và các chỉ số thưởng/phạt tùy ý.
3. Chạy lệnh `rails db:seed` ở thư mục backend để nạp sự kiện mới này vào game.