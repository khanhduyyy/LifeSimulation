namespace :i18n do
  desc "Populate _vi columns from gameContent.ts translations for existing records"
  task populate_vi: :environment do
    puts "Populating Vietnamese translations..."

    vi_data = {
      # Event titles & descriptions
      "e1" => { title_vi: "Ngày Đầu Tiên Đại Học", description_vi: "Bạn vừa tròn 18 tuổi và đây là ngày đầu tiên ở đại học. Khuôn viên trường rộng lớn khiến bạn choáng ngợp. Bạn sẽ làm gì?" },
      "e2" => { title_vi: "Cơ Hội Việc Làm Bán Thời Gian", description_vi: "Một quán cà phê gần đây đang tuyển nhân viên bán thời gian. Lương khá ổn nhưng đồng nghĩa với việc ít thời gian rảnh hơn. Bạn quyết định thế nào?" },
      "e3" => { title_vi: "Vấn Đề Sức Khỏe", description_vi: "Gần đây bạn cảm thấy mệt mỏi và không khỏe. Có lẽ bạn nên đi khám bác sĩ, nhưng chi phí khám bệnh cũng tốn kém." },
      "e4" => { title_vi: "Thừa Kế Bất Ngờ", description_vi: "Một người họ hàng xa qua đời và để lại cho bạn một khoản tiền. Bạn sẽ làm gì với số tiền thừa kế?" },
      "e5" => { title_vi: "Rắc Rối Tình Cảm", description_vi: "Người bạn thích lâu nay cuối cùng cũng rủ bạn đi chơi. Nhưng bạn thân của bạn cũng có tình cảm với người đó. Bạn sẽ làm gì?" },
      "e6" => { title_vi: "Cơ Hội Học Bổng", description_vi: "Trường đại học của bạn công bố một suất học bổng danh giá. Yêu cầu viết bài luận và duy trì điểm số cao." },
      "e7" => { title_vi: "Ngày Tốt Nghiệp", description_vi: "Bạn đã đến ngày tốt nghiệp! Đứng xếp hàng nhận bằng, bạn hồi tưởng lại những năm tháng đã qua. Đã đến lúc lên kế hoạch cho tương lai." },
    }

    choice_vi = {
      "e1.c1" => "Tham gia câu lạc bộ sinh viên", "e1.c2" => "Đi thẳng đến thư viện học bài", "e1.c3" => "Trốn học và khám phá thành phố",
      "e2.c1" => "Nhận việc ở quán cà phê", "e2.c2" => "Từ chối và tập trung học tập",
      "e3.c1" => "Đi khám bác sĩ (tốn $200)", "e3.c2" => "Bỏ qua và cố gắng chịu đựng",
      "e4.c1" => "Gửi tiết kiệm ngân hàng", "e4.c2" => "Tổ chức một bữa tiệc lớn!", "e4.c3" => "Đầu tư vào khóa học trực tuyến",
      "e5.c1" => "Đi hẹn hò", "e5.c2" => "Nhường lại vì bạn thân",
      "e6.c1" => "Nộp đơn xin học bổng", "e6.c2" => "Không cần, tốn quá nhiều công sức",
      "e7.c1" => "Nộp đơn xin việc ngay", "e7.c2" => "Nghỉ một năm để đi du lịch", "e7.c3" => "Tiếp tục học cao học",
    }

    outcome_vi = {
      "e1.c1.o1" => "Bạn đã kết bạn với những người tuyệt vời ở câu lạc bộ! Đời sống xã hội đang nở rộ.",
      "e1.c1.o2" => "Câu lạc bộ không như bạn mong đợi. Bạn cảm thấy lúng túng nhưng ít nhất bạn đã thử.",
      "e1.c2.o1" => "Bạn tìm được một góc yên tĩnh và đọc trước bài. Thông minh đấy!",
      "e1.c2.o2" => "Bạn học chăm đến mức ngủ gục trong thư viện. Xấu hổ nhưng hiệu quả!",
      "e1.c3.o1" => "Bạn phát hiện ra một quán ăn đường phố tuyệt vời! Cuộc sống là một cuộc phiêu lưu.",
      "e1.c3.o2" => "Bạn bị lạc và bỏ lỡ buổi định hướng quan trọng. Không phải khởi đầu tốt lắm.",
      "e2.c1.o1" => "Bạn đã được nhận việc! Tiền tip khá ổn và cà phê miễn phí giúp bạn tỉnh táo.",
      "e2.c1.o2" => "Công việc rất mệt. Bạn kiếm được tiền nhưng điểm số đang giảm.",
      "e2.c2.o1" => "Bạn đạt điểm cao trong kỳ thi giữa kỳ! Các giáo sư ấn tượng với bạn.",
      "e2.c2.o2" => "Không có thu nhập thêm, ngân sách eo hẹp. Tối nay lại ăn mì gói.",
      "e3.c1.o1" => "Chỉ là thiếu vitamin thôi! Bác sĩ kê đơn bổ sung và bạn cảm thấy khỏe hơn nhiều.",
      "e3.c1.o2" => "Hóa ra bệnh nghiêm trọng hơn. May mà bạn phát hiện sớm!",
      "e3.c2.o1" => "Chỉ là cảm lạnh thôi. Bạn tự khỏi sau vài ngày.",
      "e3.c2.o2" => "Tình trạng của bạn trở nên tệ hơn. Bạn phải vào phòng cấp cứu và nghỉ học cả tuần.",
      "e4.c1.o1" => "Quyết định khôn ngoan! Bạn tiết kiệm được $500 phòng khi cần.",
      "e4.c2.o1" => "Bữa tiệc tuyệt nhất! Ai cũng bàn tán về nó. Bạn trở thành huyền thoại trường!",
      "e4.c2.o2" => "Bữa tiệc vượt tầm kiểm soát. Ai đó làm hỏng laptop và hàng xóm gọi cảnh sát.",
      "e4.c3.o1" => "Bạn học được những kỹ năng mới quý giá! Điều này có thể giúp ích cho sự nghiệp.",
      "e4.c3.o2" => "Khóa học là lừa đảo. Bạn mất tiền và rút ra bài học đắt giá.",
      "e5.c1.o1" => "Buổi hẹn hò tuyệt vời! Có lẽ bạn đã tìm được người đặc biệt.",
      "e5.c1.o2" => "Bạn thân phát hiện ra và rất tức giận. Drama có thật rồi.",
      "e5.c2.o1" => "Bạn thân rất biết ơn. Tình bạn trở nên bền chặt hơn.",
      "e5.c2.o2" => "Bạn hối hận vì đã không nắm lấy cơ hội. Giá như...",
      "e6.c1.o1" => "Bạn đã giành được học bổng! $1000 và được hiệu trưởng ghi nhận!",
      "e6.c1.o2" => "Lần này bạn không được. Nhưng kinh nghiệm viết luận rất quý giá.",
      "e6.c2.o1" => "Bạn chọn nghỉ ngơi. Đôi khi không làm gì cũng là một lựa chọn.",
      "e7.c1.o1" => "Bạn được nhận vào vị trí junior tại công ty công nghệ! Lương khởi điểm: $3000/tháng!",
      "e7.c1.o2" => "Thị trường việc làm khó khăn. Bạn vẫn đang tìm kiếm nhưng luôn lạc quan.",
      "e7.c2.o1" => "Bạn đã du lịch khắp Đông Nam Á! Những trải nghiệm thay đổi cuộc đời.",
      "e7.c2.o2" => "Bạn hết tiền giữa chừng. Phải quay về sớm.",
      "e7.c3.o1" => "Bạn được nhận vào chương trình thạc sĩ với học bổng một phần!",
      "e7.c3.o2" => "Bị từ chối vào cao học. Đã đến lúc xem xét lại các lựa chọn.",
    }

    Event.find_each do |event|
      next unless event.i18n_key && vi_data[event.i18n_key]
      event.update!(vi_data[event.i18n_key])
      puts "  Event #{event.i18n_key}: #{event.title_vi}"
    end

    Choice.find_each do |choice|
      next unless choice.i18n_key && choice_vi[choice.i18n_key]
      choice.update!(content_vi: choice_vi[choice.i18n_key])
      puts "  Choice #{choice.i18n_key}: #{choice.content_vi}"
    end

    Outcome.find_each do |outcome|
      next unless outcome.i18n_key && outcome_vi[outcome.i18n_key]
      outcome.update!(message_vi: outcome_vi[outcome.i18n_key])
      puts "  Outcome #{outcome.i18n_key}: updated"
    end

    puts "Done!"
  end
end
