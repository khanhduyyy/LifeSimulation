# frozen_string_literal: true

class VietnameseNameGenerator
  LAST_NAMES = %w[
    Nguyễn Trần Lê Phạm Hoàng Huỳnh Phan Vũ Võ Đặng
    Bùi Đỗ Hồ Ngô Dương Lý Đào Đinh Lâm Trịnh
  ].freeze

  MALE_MIDDLE_NAMES = %w[
    Văn Hữu Đức Quang Minh Thành Công Hoàng Xuân Bảo
  ].freeze

  FEMALE_MIDDLE_NAMES = %w[
    Thị Ngọc Thanh Thuỳ Phương Hoàng Kim Bích Diệu Mỹ
  ].freeze

  MALE_FIRST_NAMES = %w[
    Anh Bình Cường Dũng Đạt Hải Hùng Khoa Lâm Long
    Minh Nam Phúc Quân Sơn Thắng Tuấn Vinh Trung Đức
    Hưng Kiên Nghĩa Phong Tâm Thiện Trí Toàn Vương Bảo
  ].freeze

  FEMALE_FIRST_NAMES = %w[
    Anh Chi Dung Hà Hạnh Hương Lan Linh Mai Ngân
    Nhi Oanh Phương Quỳnh Thảo Thuỷ Trang Trinh Vân Yến
    Hằng Hiền Khánh Loan Ly Nhung Tâm Thanh Tuyết Uyên
  ].freeze

  class << self
    def generate(gender = nil)
      gender ||= %w[male female].sample
      last = LAST_NAMES.sample
      middle = gender == 'male' ? MALE_MIDDLE_NAMES.sample : FEMALE_MIDDLE_NAMES.sample
      first = gender == 'male' ? MALE_FIRST_NAMES.sample : FEMALE_FIRST_NAMES.sample
      "#{last} #{middle} #{first}"
    end

    def generate_male
      generate('male')
    end

    def generate_female
      generate('female')
    end

    def generate_parent_ages
      # Father: 25-35 years older than child (child starts at 0)
      father_age = rand(25..35)
      # Mother: 23-33 years older
      mother_age = rand(23..33)
      { father_age: father_age, mother_age: mother_age }
    end

    def generate_family
      ages = generate_parent_ages
      {
        "father" => { "name" => generate_male, "age" => ages[:father_age] },
        "mother" => { "name" => generate_female, "age" => ages[:mother_age] },
        "spouse" => nil,
        "children" => []
      }
    end

    def generate_spouse_name(character_gender)
      # Spouse is opposite gender
      character_gender == 'male' ? generate_female : generate_male
    end

    def generate_child_name(gender = nil)
      generate(gender || %w[male female].sample)
    end
  end
end
