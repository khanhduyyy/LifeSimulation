class CreateCharacters < ActiveRecord::Migration[8.1]
  def change
    create_table :characters do |t|
      t.integer :age
      t.integer :money
      t.integer :health
      t.integer :happiness

      t.timestamps
    end
  end
end
 ngã tư sự nghiệp

 nghỉ học vẫn trừ tiền
 chưa mua bảo hiểm nhưng vẫn chọn được option có bảo hiểm
 kỳ vọng của tui nếu user không có 
 bảo hiểm thì không thể chọn option đó(disabled)
 nhưng hiện tại vẫn chọn được
 hay là cách xử lý "requires_flags": [
            "insurance_valid"
          ] và "excludes_flags": [
            "insurance_valid"
          ]
là chưa đúng

 chức năng kết hôn trong hẹn hò không work khi chọn hẹn hò nó hiện
 popup có đồng ý kết hôn hay không sau khi tui đồng ý bị trừ 150$
 nhưng sau đó không có bất kỳ sự thay đổi nào khác nó hiện tui 
 vẫn chưa kết hôn

 có những sự kiện mua xe nhưng không nhận được xe (nếu có thể bạn 
 sửa trực tiếp trong file json luôn nha)
 job_business lương nó sẽ không cố định theo hằng năm. hiện tại nó đang bị khi người dùng chọn job nó random từ 20-100 nhưng chọn xong nó cố định luôn, nó là không ổn định mà bạn fix nó mỗi năm sẽ ngẫu nhiên nha và trong tab công việc sau khi chọn phần lương bạn để là 20$-100$ nha vì chỉ ngành này nó không cố dịnh lương thôi 
 job_business nhưng vẫn có sự kiện vị trí cấp cao tại công ty hay là sự kiện bị đuổi việc không hợp lý bạn tìm cách nào không hiện sự kiện đó khi job là job_business nha
 ba mẹ mất hết nhưng vẫn có sự kiện liên quan đến ba mẹ kỳ vọng là nếu cha mẹ mất hết sẽ không xuất hiện những sự kiện này

 qua tuổi đi học chỉ xoay quanh tiền sức khỏe công viêc sự kiện cứ lặp lại
 thêm nhiều sự kiện

 sự kiện cha mẹ
 sự kiện job_business