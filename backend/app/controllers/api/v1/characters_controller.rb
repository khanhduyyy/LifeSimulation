module Api
  module V1
    class CharactersController < ApplicationController
      # POST /api/v1/characters
      def create
        # Randomize stats within ranges
        money = rand(100..1000)
        health = rand(70..95)
        happiness = rand(35..55)  # Lower happiness range

        # Determine background based on money
        bg = if money < 300
          'poor'
        elsif money <= 600
          'middle'
        else
          'rich'
        end

        gender = params[:gender] || 'male'

        # Generate family
        family = VietnameseNameGenerator.generate_family

        character = Character.new(
          name: params[:name] || VietnameseNameGenerator.generate(gender),
          gender: gender,
          background: bg,
          age: params[:age] || 0,   # V3: Start at age 0 (or custom age for testing)
          money: money,
          health: health,
          happiness: happiness,
          flags: { "father_alive" => true, "mother_alive" => true },
          seen_event_ids: [],
          family: family,
          job: {},
          assets: {}
        )

        if character.save
          render json: character, status: :created
        else
          render json: { errors: character.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/characters/:id
      def show
        character = Character.find(params[:id])
        render json: character
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Character not found" }, status: :not_found
      end

      # PATCH /api/v1/characters/:id
      def update
        character = Character.find(params[:id])
        turn_summary = []

        # Process end-of-turn (age increment)
        if params[:character][:age].present?
          new_age = params[:character][:age].to_i
          old_age = character.age || 0

          if new_age > old_age
            flags = character.flags || {}

            # Check insurance validity
            insurance_expires_at = flags["insurance_expires_at"] || 0
            if insurance_expires_at > new_age
              flags["insurance_valid"] = true
            else
              flags.delete("insurance_valid")
            end

            # Age family members
            character.age_family_members

            # ===== 0. Random parent death =====
            family = character.family || {}

            # Father death check
            if family["father"] && !family["father"]["deceased"]
              father_age = family["father"]["age"] || 0
              if father_age >= 55
                # Death probability: starts at 2% at 55, increases ~2% per year, caps at 40%
                death_chance = [(father_age - 53) * 2, 40].min
                if rand(1..100) <= death_chance
                  family["father"]["deceased"] = true
                  character.family = family
                  flags["father_alive"] = false
                  character.flags = flags
                  happiness_loss = rand(10..20)
                  character.happiness = [character.happiness - happiness_loss, 0].max
                  turn_summary << { key: "father_death", stat: "happiness", value: -happiness_loss,
                                    message_en: "Your father #{family['father']['name']} passed away at age #{father_age}",
                                    message_vi: "Cha bạn #{family['father']['name']} qua đời ở tuổi #{father_age}" }
                end
              end
            end

            # Mother death check
            if family["mother"] && !family["mother"]["deceased"]
              mother_age = family["mother"]["age"] || 0
              if mother_age >= 58
                death_chance = [(mother_age - 56) * 2, 40].min
                if rand(1..100) <= death_chance
                  family["mother"]["deceased"] = true
                  character.family = family
                  flags["mother_alive"] = false
                  character.flags = flags
                  happiness_loss = rand(10..20)
                  character.happiness = [character.happiness - happiness_loss, 0].max
                  turn_summary << { key: "mother_death", stat: "happiness", value: -happiness_loss,
                                    message_en: "Your mother #{family['mother']['name']} passed away at age #{mother_age}",
                                    message_vi: "Mẹ bạn #{family['mother']['name']} qua đời ở tuổi #{mother_age}" }
                end
              end
            end

            # ===== 1. Health degradation =====
            if new_age > 30
              degradation = if new_age >= 70
                rand(7..10)     # Mất 7-10 máu mỗi năm
              elsif new_age >= 60
                rand(5..7)     # Mất 5-7 máu
              elsif new_age >= 50
                rand(3..5)     # Mất 3-5 máu
              elsif new_age >= 40
                2              # Mất 2 máu
              else
                1              # Mất 1 máu
              end
              character.health = [character.health - degradation, 0].max
              turn_summary << { key: "health_aging", stat: "health", value: -degradation,
                                message_en: "Age-related health decline", message_vi: "Sức khỏe giảm theo tuổi" }
            end

            # ===== 1b. Asset value fluctuation =====
            assets = character.assets || {}
            if assets["house"]
              old_val = assets["house"]["value"] || 500
              if rand(1..100) <= 80 # 80% chance appreciate
                change = (old_val * rand(1..15) / 100.0).round  # 2-3x higher volatility
                assets["house"]["value"] = old_val + change
                turn_summary << { key: "house_appreciate", stat: "money", value: change,
                                  message_en: "House value increased +$#{change}", message_vi: "Giá trị nhà tăng +$#{change}" }
              else
                change = (old_val * rand(1..15) / 100.0).round  # 2-3x higher volatility
                assets["house"]["value"] = [old_val - change, 50].max
                turn_summary << { key: "house_depreciate", stat: "money", value: -change,
                                  message_en: "House value decreased -$#{change}", message_vi: "Giá trị nhà giảm -$#{change}" }
              end
            end
            if assets["car"]
              old_val = assets["car"]["value"] || 200
              if rand(1..100) <= 30 # 30% chance appreciate (rare for cars)
                change = (old_val * rand(1..5) / 100.0).round
                assets["car"]["value"] = old_val + change
                turn_summary << { key: "car_appreciate", stat: "money", value: change,
                                  message_en: "Car value increased +$#{change}", message_vi: "Giá trị xe tăng +$#{change}" }
              else
                change = (old_val * rand(3..10) / 100.0).round
                assets["car"]["value"] = [old_val - change, 20].max
                turn_summary << { key: "car_depreciate", stat: "money", value: -change,
                                  message_en: "Car value decreased -$#{change}", message_vi: "Giá trị xe giảm -$#{change}" }
              end
            end

            # Stock portfolio fluctuation
            if assets["stocks"]
              old_val = assets["stocks"]["value"] || 150
              change_percent = rand(-10..30) # Can lose 15% or gain 35%
              change = (old_val * change_percent / 100.0).round
              assets["stocks"]["value"] = [old_val + change, 10].max
              if change > 0
                turn_summary << { key: "stocks_gain", stat: "money", value: change,
                                  message_en: "Stock portfolio gained +$#{change}", message_vi: "Danh mục cổ phiếu tăng +$#{change}" }
              elsif change < 0
                turn_summary << { key: "stocks_loss", stat: "money", value: change,
                                  message_en: "Stock portfolio lost $#{change.abs}", message_vi: "Danh mục cổ phiếu giảm $#{change.abs}" }
              end
            end

            # Business passive income and value fluctuation
            if assets["business"]
              old_val = assets["business"]["value"] || 800
              change_percent = rand(-5..10)
              change = (old_val * change_percent / 100.0).round
              new_val = [old_val + change, 100].max  # Minimum value of 100
              assets["business"]["value"] = new_val

              # Income is 2.5% of current business value
              income = (new_val * 0.025).round
              character.money += income

              if change > 0
                turn_summary << { key: "business_growth", stat: "money", value: change,
                                  message_en: "Business value increased +$#{change}", message_vi: "Giá trị doanh nghiệp tăng +$#{change}" }
              elsif change < 0
                turn_summary << { key: "business_decline", stat: "money", value: change,
                                  message_en: "Business value decreased $#{change.abs}", message_vi: "Giá trị doanh nghiệp giảm $#{change.abs}" }
              end

              turn_summary << { key: "business_income", stat: "money", value: income,
                                message_en: "Business income +$#{income}", message_vi: "Thu nhập doanh nghiệp +$#{income}" }
            end

            # Education fund growth
            if assets["education_fund"]
              old_val = assets["education_fund"]["value"] || 200
              growth = (old_val * rand(3..7) / 100.0).round
              assets["education_fund"]["value"] = old_val + growth
              turn_summary << { key: "education_fund_growth", stat: "money", value: growth,
                                message_en: "Education fund grew +$#{growth}", message_vi: "Quỹ học vấn tăng +$#{growth}" }
            end

            character.assets = assets if assets["house"] || assets["car"] || assets["stocks"] || assets["business"] || assets["education_fund"]

            # ===== 2. Living Expenses =====
            if new_age >= 18
              base_cost = flags["is_married"] ? 50 : 35

              # Child living expenses - add per child under 22
              children_count = flags["children_count"].to_i
              if children_count > 0
                children = character.children_with_ages(new_age)
                children_under_22 = children.select { |c| c[:age] < 22 }
                child_cost = children_under_22.count * 20
                base_cost += child_cost
              end

              character.money -= base_cost
              turn_summary << { key: "living_expenses", stat: "money", value: -base_cost,
                                message_en: "Living expenses", message_vi: "Chi phí sinh hoạt" }
            end

            # ===== 2b. Family stipend =====
            if flags["is_student"] && new_age >= 18 && new_age <= 24
              stipend = 12
              character.money += stipend
              turn_summary << { key: "family_stipend", stat: "money", value: stipend,
                                message_en: "Family allowance", message_vi: "Phụ cấp gia đình" }
            end

            # ===== 2c. Child support when children turn 22 =====
            children_count = flags["children_count"].to_i
            if children_count > 0
              children_turning_22 = character.children_turning_22(new_age)
              children_turning_22.each do |child|
                support = rand(50..70)
                character.money += support
                child_name = character.children_list[child[:index] - 1]&.dig('name') || "Child ##{child[:index]}"
                turn_summary << { key: "child_support_#{child[:index]}", stat: "money", value: support,
                                  message_en: "#{child_name} is now independent! Received support bonus",
                                  message_vi: "#{child_name} đã tự lập! Nhận tiền hỗ trợ của con" }
              end
            end

            # ===== 2c. Random unexpected expenses =====
            if new_age >= 25
              expense = rand(0..40)
              if expense > 20
                character.money -= expense
                turn_summary << { key: "unexpected_expense", stat: "money", value: -expense,
                                  message_en: "Unexpected expense", message_vi: "Chi phí phát sinh" }
              end
            end

            # ===== 2d. Elderly care costs =====
            if new_age > 55 && !flags["is_married"]
              elderly_expense = rand(0..60)
              if elderly_expense > 0
                character.money -= elderly_expense
                turn_summary << { key: "elderly_care", stat: "money", value: -elderly_expense,
                                  message_en: "Elderly costs - you don't have anyone to take care of you", message_vi: "Chi phí tuổi già do bạn không có ai chăm sóc" }
              end
            end

            # ===== 3. Salary income =====
            if flags["is_employed"] && new_age < 55
              # Get stored salary from job data
              current_salary = character.job["salary"] || 50
              salary = current_salary

              # Business job: randomize salary each year
              if flags["job_business"]
                salary = rand(20..100)
                job_data = character.job || {}
                job_data["salary"] = salary
                character.job = job_data
              else
                # Seniority-based salary increase: every 3-6 years (not for business)
                last_seniority_increase_age = flags["last_seniority_increase_age"] || new_age
                years_since_increase = new_age - last_seniority_increase_age
                next_increase_years = flags["next_seniority_increase_years"] || rand(3..6)

                if years_since_increase >= next_increase_years
                  # Apply seniority increase
                  increase_percent = rand(5..15)
                  increase_amount = (salary * increase_percent / 100.0).round
                  salary += increase_amount

                  # Update job salary and seniority
                  job_data = character.job || {}
                  job_data["salary"] = salary
                  job_data["seniority"] = (job_data["seniority"] || 0) + 1
                  character.job = job_data

                  # Reset timer for next increase
                  flags["last_seniority_increase_age"] = new_age
                  flags["next_seniority_increase_years"] = rand(3..6)

                  # Don't add to turn_summary - handle silently
                end
              end

              salary = [salary - 20, 15].max if flags["path_work_early"] && new_age < 18

              # Pension contribution (8% deduction for pension jobs)
              has_pension = flags["job_research"] || flags["job_office"] || flags["job_manual"] || flags["job_retail"] || flags["job_service"] || flags["job_industry_high"] || flags["job_industry_mid"]
              years_in_job = flags["years_in_current_job"] || 0

              if has_pension
                pension_contribution = (salary * 0.08).round
                salary_after_pension = salary - pension_contribution

                # Track pension contributions
                flags["pension_years"] = (flags["pension_years"] || 0) + 1
                flags["pension_total"] = (flags["pension_total"] || 0) + pension_contribution
                flags["years_in_current_job"] = years_in_job + 1
                character.flags = flags

                character.money += salary_after_pension
                turn_summary << { key: "salary", stat: "money", value: salary_after_pension,
                                  message_en: "Salary after pension (8% deducted)", message_vi: "Lương sau trừ lương hưu (8%)" }
                # Pension contribution handled silently
              else
                flags["years_in_current_job"] = years_in_job + 1
                character.flags = flags
                character.money += salary
                turn_summary << { key: "salary", stat: "money", value: salary,
                                  message_en: "Salary income", message_vi: "Thu nhập lương" }
              end

              # Health penalties for certain jobs
              if flags["job_manual"]
                health_loss = rand(1..3)
                character.health = [character.health - health_loss, 0].max
                turn_summary << { key: "manual_labor_health", stat: "health", value: -health_loss,
                                  message_en: "Manual labor health toll -#{health_loss}", message_vi: "Sức khỏe giảm do lao động nặng -#{health_loss}" }
              end

              if flags["job_industry_high"] || flags["job_industry_mid"]
                health_loss = rand(1..2)
                character.health = [character.health - health_loss, 0].max
                turn_summary << { key: "industry_health", stat: "health", value: -health_loss,
                                  message_en: "Industrial work health toll -#{health_loss}", message_vi: "Sức khỏe giảm do công việc công nghiệp -#{health_loss}" }
              end

              # Happiness penalties for certain jobs
              if flags["job_retail"]
                happiness_loss = rand(1..5)
                character.happiness = [character.happiness - happiness_loss, 0].max
                turn_summary << { key: "retail_stress", stat: "happiness", value: -happiness_loss,
                                  message_en: "Retail job stress -#{happiness_loss}", message_vi: "Căng thẳng công việc bán lẻ -#{happiness_loss}" }
              end

              if flags["job_office"]
                happiness_loss = 1
                character.happiness = [character.happiness - happiness_loss, 0].max
                turn_summary << { key: "office_stress", stat: "happiness", value: -happiness_loss,
                                  message_en: "Office work stress -#{happiness_loss}", message_vi: "Căng thẳng công việc văn phòng -#{happiness_loss}" }
              end

              if flags["job_industry_high"] || flags["job_industry_mid"]
                happiness_loss = rand(1..3)
                character.happiness = [character.happiness - happiness_loss, 0].max
                turn_summary << { key: "industry_stress", stat: "happiness", value: -happiness_loss,
                                  message_en: "Industrial work stress -#{happiness_loss}", message_vi: "Căng thẳng công việc công nghiệp -#{happiness_loss}" }
              end
            end

            # Force retirement at age 55
            if new_age >= 55 && flags["is_employed"]
              flags["is_employed"] = false
              flags["is_retired"] = true
              character.flags = flags
              turn_summary << { key: "forced_retirement", stat: "happiness", value: 0,
                                message_en: "Reached retirement age (55)", message_vi: "Đến tuổi nghỉ hưu (55)" }
            end

            # ===== 4. Pension payout (age 55+, 15+ years contribution) =====
            if new_age >= 55 && flags["pension_years"].to_i >= 15
              pension_total = flags["pension_total"] || 0
              annual_pension = (pension_total * 0.16).round
              character.money += annual_pension
              turn_summary << { key: "pension_payout", stat: "money", value: annual_pension,
                                message_en: "Pension payout +$#{annual_pension}", message_vi: "Lương hưu +$#{annual_pension}" }
            end

            # ===== 5. Legacy retirement income (old system) =====
            if flags["is_retired"] && flags["pension_years"].to_i < 15
              pension = if flags["job_research"] then 50
                        elsif flags["job_office"] then 30
                        elsif flags["job_manual"] then 22
                        elsif flags["job_trade"] then 28
                        elsif flags["job_business"] then 0  # No pension
                        elsif flags["job_creative"] then 0  # No pension
                        # Legacy support
                        elsif flags["job_office_senior"] then 40
                        else 15 end
              children = flags["children_count"].to_i
              pension += children * 10 if children > 0
              character.money += pension
              turn_summary << { key: "pension", stat: "money", value: pension,
                                message_en: "Retirement pension", message_vi: "Lương hưu" }
            end

            # ===== 5. Work Experience growth =====
            if flags["is_employed"]
              current_flags = character.flags || {}
              current_flags["work_experience"] = (current_flags["work_experience"] || 0) + 1
              character.flags = current_flags
            end
          end
        end

        if character.update(character_params)
          render json: { character: character, turn_summary: turn_summary }
        else
          render json: { errors: character.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Character not found" }, status: :not_found
      end

      # POST /api/v1/characters/:id/action
      def action
        character = Character.find(params[:id])
        action_type = params[:action_type]
        result = perform_action(character, action_type, params)

        if result[:success]
          character.save!
        end
        render json: { character: character, result: result }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Character not found" }, status: :not_found
      end

      # POST /api/v1/characters/:id/select_job
      def select_job
        character = Character.find(params[:id])
        job_type = params[:job_type]

        # Check if character is a graduate student
        flags = character.flags || {}
        if flags['is_grad_student']
          return render json: { error: "Graduate students cannot work", error_vi: "Sinh viên cao học không được làm việc" }, status: :unprocessable_entity
        end

        # Validate job type
        valid_jobs = ['job_research', 'job_industry_high', 'job_industry_mid', 'job_office', 'job_manual', 'job_business', 'job_service', 'job_retail']
        unless valid_jobs.include?(job_type)
          return render json: { error: "Invalid job type" }, status: :unprocessable_entity
        end

        # Check requirements
        flags = character.flags || {}
        case job_type
        when 'job_research'
          unless flags['has_grad_degree']
            return render json: { error: "Requires graduate degree", error_vi: "Cần bằng thạc sĩ/tiến sĩ" }, status: :unprocessable_entity
          end
        when 'job_industry_high'
          unless flags['has_grad_degree']
            return render json: { error: "Requires graduate degree", error_vi: "Cần bằng thạc sĩ/tiến sĩ" }, status: :unprocessable_entity
          end
        when 'job_industry_mid'
          unless flags['has_degree']
            return render json: { error: "Requires university degree", error_vi: "Cần bằng đại học" }, status: :unprocessable_entity
          end
        when 'job_office'
          unless flags['has_degree']
            return render json: { error: "Requires university degree", error_vi: "Cần bằng đại học" }, status: :unprocessable_entity
          end
        end

        # Set job
        flags['is_employed'] = true
        flags['first_day_done'] = true
        flags.delete('needs_job_search')

        # Clear old job flags and reset years
        flags.delete('job_research')
        flags.delete('job_office')
        flags.delete('job_manual')
        flags.delete('job_business')
        flags.delete('job_service')
        flags.delete('job_retail')
        flags['years_in_current_job'] = 0  # Reset when changing jobs

        # Initialize seniority increase tracking
        flags['last_seniority_increase_age'] = character.age
        flags['next_seniority_increase_years'] = rand(3..6)

        # Set new job flag
        flags[job_type] = true
        character.flags = flags

        # Generate job details
        job_data = generate_job_data(job_type)
        character.job = job_data

        if character.save
          render json: { character: character, message_en: "Started new job!", message_vi: "Bắt đầu công việc mới!" }
        else
          render json: { errors: character.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Character not found" }, status: :not_found
      end

      private

      def character_params
        params.require(:character).permit(:age, :money, :health, :happiness, seen_event_ids: [])
      end

      def generate_job_data(job_type)
        case job_type
        when 'job_research'
          titles = [
            { en: 'Research Scientist', vi: 'Nhà khoa học nghiên cứu' },
            { en: 'Lab Director', vi: 'Giám đốc phòng thí nghiệm' },
            { en: 'University Professor', vi: 'Giáo sư đại học' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(100..120),
            seniority: 0,
            position_en: 'Senior Researcher',
            position_vi: 'Nhà nghiên cứu cao cấp'
          }
        when 'job_industry_high'
          titles = [
            { en: 'Chemical Engineer', vi: 'Kỹ sư hóa chất' },
            { en: 'Petroleum Engineer', vi: 'Kỹ sư dầu khí' },
            { en: 'Mining Engineer', vi: 'Kỹ sư mỏ' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(130..150),
            seniority: 0,
            position_en: 'Senior Engineer',
            position_vi: 'Kỹ sư cao cấp'
          }
        when 'job_industry_mid'
          titles = [
            { en: 'Factory Supervisor', vi: 'Giám sát nhà máy' },
            { en: 'Production Manager', vi: 'Quản lý sản xuất' },
            { en: 'Quality Control Engineer', vi: 'Kỹ sư kiểm soát chất lượng' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(100..120),
            seniority: 0,
            position_en: 'Engineer',
            position_vi: 'Kỹ sư'
          }
        when 'job_office'
          titles = [
            { en: 'Marketing Manager', vi: 'Quản lý Marketing' },
            { en: 'Financial Analyst', vi: 'Chuyên viên phân tích tài chính' },
            { en: 'Project Manager', vi: 'Quản lý dự án' },
            { en: 'HR Specialist', vi: 'Chuyên viên nhân sự' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(70..90),
            seniority: 0,
            position_en: 'Office Worker',
            position_vi: 'Nhân viên văn phòng'
          }
        when 'job_manual'
          titles = [
            { en: 'Construction Worker', vi: 'Công nhân xây dựng' },
            { en: 'Factory Worker', vi: 'Công nhân nhà máy' },
            { en: 'Warehouse Staff', vi: 'Nhân viên kho' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(65..85),
            seniority: 0,
            position_en: 'Manual Laborer',
            position_vi: 'Lao động chân tay'
          }
        when 'job_business'
          titles = [
            { en: 'Freelance Trader', vi: 'Thương nhân tự do' },
            { en: 'Independent Merchant', vi: 'Tiểu thương độc lập' },
            { en: 'Small Trader', vi: 'Thương nhân nhỏ' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(20..100),
            seniority: 0,
            position_en: 'Self-Employed',
            position_vi: 'Tự kinh doanh'
          }
        when 'job_service'
          titles = [
            { en: 'Customer Service Rep', vi: 'Nhân viên dịch vụ khách hàng' },
            { en: 'Hospitality Staff', vi: 'Nhân viên khách sạn' },
            { en: 'Restaurant Server', vi: 'Nhân viên phục vụ' },
            { en: 'Hotel Receptionist', vi: 'Lễ tân khách sạn' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(25..45),
            seniority: 0,
            position_en: 'Service Worker',
            position_vi: 'Nhân viên dịch vụ'
          }
        when 'job_retail'
          titles = [
            { en: 'Retail Cashier', vi: 'Thu ngân bán lẻ' },
            { en: 'Store Clerk', vi: 'Nhân viên cửa hàng' },
            { en: 'Sales Associate', vi: 'Nhân viên bán hàng' },
            { en: 'Shop Assistant', vi: 'Trợ lý cửa hàng' }
          ].sample
          {
            title_en: titles[:en],
            title_vi: titles[:vi],
            salary: rand(35..55),
            seniority: 0,
            position_en: 'Retail Worker',
            position_vi: 'Nhân viên bán lẻ'
          }
        end
      end

      def perform_action(character, action_type, params = {})
        case action_type

        # ===== JOB =====
        when "quit_job"
          flags = character.flags || {}
          return { success: false, message_en: "You don't have a job to quit", message_vi: "Bạn không có việc để nghỉ" } unless flags["is_employed"]
          flags["is_employed"] = false
          flags.delete("job_office")
          flags.delete("job_office_senior")
          flags.delete("job_manual")
          flags.delete("job_business")
          flags.delete("job_research")
          flags.delete("job_service")
          flags.delete("job_retail")
          flags.delete("job_industry_high")
          flags.delete("job_industry_mid")
          flags.delete("first_day_done")
          flags.delete("work_experience")
          flags.delete("years_in_current_job")
          flags.delete("last_seniority_increase_age")
          flags.delete("next_seniority_increase_years")
          flags["needs_job_search"] = true
          character.flags = flags
          character.job = {}
          job_search_events = Event.where("title_en LIKE '%Job%Search%' OR title_en LIKE '%Career Crossroads%' OR title_en LIKE '%First Day%'").pluck(:id)
          character.seen_event_ids = character.seen_event_ids - job_search_events
          { success: true, message_en: "You quit your job. Time to find something new!", message_vi: "Bạn nghỉ việc. Tìm công việc mới thôi!" }

        when "withdraw_pension_lump_sum"
          flags = character.flags || {}
          pension_years = flags["pension_years"] || 0
          pension_total = flags["pension_total"] || 0

          return { success: false, message_en: "No pension contributions to withdraw", message_vi: "Không có đóng góp lương hưu để rút" } if pension_total <= 0
          return { success: false, message_en: "Cannot withdraw after 15 years of contribution", message_vi: "Không thể rút sau 15 năm đóng góp" } if pension_years >= 15

          # Withdraw 60% of total contributions
          withdrawal = (pension_total * 0.9).round
          character.money += withdrawal

          # Reset pension tracking
          flags["pension_years"] = 0
          flags["pension_total"] = 0
          character.flags = flags

          { success: true, message_en: "Withdrew 90% of pension contributions: +$#{withdrawal}. Pension years reset to 0.", message_vi: "Rút 90% đóng góp lương hưu: +$#{withdrawal}. Số năm đóng góp đặt lại về 0.", stat_changes: { "money" => withdrawal } }

        # ===== ASSETS =====
        when "buy_house"
          flags = character.flags || {}
          return { success: false, message_en: "You must be at least 15 years old", message_vi: "Bạn phải ít nhất 15 tuổi" } if character.age < 15
          assets = character.assets || {}
          return { success: false, message_en: "You already own a house", message_vi: "Bạn đã sở hữu nhà" } if assets["house"]

          cost = 500
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost

          character.money -= cost
          houses = [
            { name_en: "Cozy Apartment", name_vi: "Căn hộ ấm cúng" },
            { name_en: "Suburban House", name_vi: "Nhà ngoại ô" },
            { name_en: "Modern Condo", name_vi: "Chung cư hiện đại" }
          ].sample
          assets["house"] = { "name" => houses[:name_vi], "value" => cost }
          character.assets = assets
          flags["has_house"] = true
          flags["own_house"] = true
          character.flags = flags
          bonus = rand(5..10)
          character.happiness = [character.happiness + bonus, 100].min
          { success: true, message_en: "Bought #{houses[:name_en]} for $#{cost}! +#{bonus} happiness", message_vi: "Mua #{houses[:name_vi]} với giá $#{cost}! +#{bonus} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => bonus } }

        when "buy_car"
          flags = character.flags || {}
          return { success: false, message_en: "You must be at least 15 years old", message_vi: "Bạn phải ít nhất 15 tuổi" } if character.age < 15
          cost = 200
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          assets = character.assets || {}
          return { success: false, message_en: "You already own a car", message_vi: "Bạn đã sở hữu xe" } if assets["car"]
          character.money -= cost
          cars = [
            { name_en: "Honda Civic", name_vi: "Honda Civic" },
            { name_en: "Toyota Camry", name_vi: "Toyota Camry" },
            { name_en: "Mazda 3", name_vi: "Mazda 3" }
          ].sample
          assets["car"] = { "name" => cars[:name_vi], "value" => cost }
          character.assets = assets
          flags["has_car"] = true
          character.flags = flags
          bonus = rand(3..7)
          character.happiness = [character.happiness + bonus, 100].min
          { success: true, message_en: "Bought #{cars[:name_en]} for $#{cost}! +#{bonus} happiness", message_vi: "Mua #{cars[:name_vi]} với giá $#{cost}! +#{bonus} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => bonus } }

        when "buy_insurance"
          return { success: false, message_en: "You must be at least 25 years old", message_vi: "Bạn phải ít nhất 25 tuổi" } if character.age < 25
          cost = 60
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost

          flags = character.flags || {}
          current_expiry = flags["insurance_expires_at"] || 0
          new_expiry = [current_expiry, character.age].max + 10

          character.money -= cost
          flags["insurance_expires_at"] = new_expiry
          character.flags = flags

          { success: true, message_en: "Purchased health insurance! Coverage until age #{new_expiry}", message_vi: "Mua bảo hiểm sức khỏe! Bảo hiểm đến #{new_expiry} tuổi", stat_changes: { "money" => -cost } }

        when "buy_stocks"
          return { success: false, message_en: "You must be at least 15 years old", message_vi: "Bạn phải ít nhất 15 tuổi" } if character.age < 15
          cost = 150
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          assets = character.assets || {}
          return { success: false, message_en: "You already own stocks", message_vi: "Bạn đã sở hữu cổ phiếu" } if assets["stocks"]
          character.money -= cost
          assets["stocks"] = { "name" => "Stock Portfolio", "name_vi" => "Danh mục cổ phiếu", "value" => cost }
          character.assets = assets
          { success: true, message_en: "Bought stock portfolio for $#{cost}", message_vi: "Mua danh mục cổ phiếu với giá $#{cost}", stat_changes: { "money" => -cost } }

        when "buy_business"
          return { success: false, message_en: "You must be at least 15 years old", message_vi: "Bạn phải ít nhất 15 tuổi" } if character.age < 15
          cost = 800
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          assets = character.assets || {}
          return { success: false, message_en: "You already own a business", message_vi: "Bạn đã sở hữu doanh nghiệp" } if assets["business"]
          character.money -= cost
          expected_income = (cost * 0.025).round
          assets["business"] = { "name" => "Small Business", "value" => cost }
          character.assets = assets
          { success: true, message_en: "Bought a business for $#{cost}! Generates ~$#{expected_income}/year", message_vi: "Mua doanh nghiệp với giá $#{cost}! Tạo ra ~$#{expected_income}/năm", stat_changes: { "money" => -cost } }

        when "buy_education_fund"
          return { success: false, message_en: "You must be at least 15 years old", message_vi: "Bạn phải ít nhất 15 tuổi" } if character.age < 15
          cost = 200
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          return { success: false, message_en: "You need children first", message_vi: "Bạn cần có con trước" } unless character.flags&.dig("has_child")
          assets = character.assets || {}
          return { success: false, message_en: "You already have an education fund", message_vi: "Bạn đã có quỹ học vấn" } if assets["education_fund"]
          character.money -= cost
          assets["education_fund"] = { "name" => "Education Fund", "name_vi" => "Quỹ học vấn", "value" => cost }
          character.assets = assets
          { success: true, message_en: "Created education fund with $#{cost}", message_vi: "Tạo quỹ học vấn với $#{cost}", stat_changes: { "money" => -cost } }

        when "buy_luxury"
          return { success: false, message_en: "You must be at least 15 years old", message_vi: "Bạn phải ít nhất 15 tuổi" } if character.age < 15
          cost = 100
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          character.money -= cost
          assets = character.assets || {}
          assets["luxury_items"] ||= []
          items = [
            { name: "Designer Watch", name_vi: "Đồng hồ hiệu" },
            { name: "Jewelry", name_vi: "Trang sức" },
            { name: "Art Piece", name_vi: "Tác phẩm nghệ thuật" }
          ].sample
          assets["luxury_items"] << { "name" => items[:name_vi], "value" => cost }
          character.assets = assets
          bonus = rand(5..15)
          character.happiness = [character.happiness + bonus, 100].min
          { success: true, message_en: "Bought #{items[:name]} for $#{cost}! +#{bonus} happiness", message_vi: "Mua #{items[:name_vi]} với giá $#{cost}! +#{bonus} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => bonus } }

        when "sell_house"
          assets = character.assets || {}
          return { success: false, message_en: "You don't own a house", message_vi: "Bạn không sở hữu nhà" } unless assets["house"]
          sell_price = ((assets["house"]["value"] || 500) * rand(85..90) / 100.0).round
          assets.delete("house")
          character.assets = assets
          character.money += sell_price
          { success: true, message_en: "Sold your house for $#{sell_price}", message_vi: "Bán nhà được $#{sell_price}", stat_changes: { "money" => sell_price } }

        when "sell_car"
          assets = character.assets || {}
          return { success: false, message_en: "You don't own a car", message_vi: "Bạn không sở hữu xe" } unless assets["car"]
          sell_price = ((assets["car"]["value"] || 200) * rand(50..80) / 100.0).round
          assets.delete("car")
          character.assets = assets
          character.money += sell_price
          { success: true, message_en: "Sold your car for $#{sell_price}", message_vi: "Bán xe được $#{sell_price}", stat_changes: { "money" => sell_price } }

        # ===== HEALTH CARE =====
        when "health_checkup"
          cost = 200
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          character.money -= cost
          health_gain = rand(5..15)
          character.health = [character.health + health_gain, 100].min
          { success: true, message_en: "Health checkup completed! +#{health_gain} health", message_vi: "Khám sức khỏe hoàn tất! +#{health_gain} sức khỏe", stat_changes: { "money" => -cost, "health" => health_gain } }

        when "gym_membership"
          cost = 80
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          character.money -= cost
          health_gain = rand(3..8)
          character.health = [character.health + health_gain, 100].min
          { success: true, message_en: "Gym membership purchased! +#{health_gain} health", message_vi: "Tập gym! +#{health_gain} sức khỏe", stat_changes: { "money" => -cost, "health" => health_gain } }

        when "healthy_diet"
          cost = 50
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          character.money -= cost
          health_gain = rand(2..5)
          character.health = [character.health + health_gain, 100].min
          { success: true, message_en: "Healthy diet plan started! +#{health_gain} health", message_vi: "Bắt đầu chế độ ăn lành mạnh! +#{health_gain} sức khỏe", stat_changes: { "money" => -cost, "health" => health_gain } }

        # ===== RELATIONSHIPS =====
        when "find_date"
          cost = 50
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          return { success: false, message_en: "You're already married", message_vi: "Bạn đã kết hôn rồi" } if character.spouse
          return { success: false, message_en: "You must be at least 18 years old", message_vi: "Bạn phải ít nhất 18 tuổi" } if character.age < 18

          character.money -= cost
          # 75% chance to find partner
          if rand(1..100) <= 75
            spouse_name = VietnameseNameGenerator.generate(character.gender == 'male' ? 'female' : 'male')
            # Return proposal option instead of auto-marrying
            { success: true, proposal: true, partner_name: spouse_name, message_en: "You met #{spouse_name}! Do you want to marry?", message_vi: "Bạn gặp #{spouse_name}! Bạn có muốn kết hôn không?", stat_changes: { "money" => -cost } }
          else
            { success: true, message_en: "Dating didn't work out this time. Try again later.", message_vi: "Hẹn hò không thành công lần này. Thử lại sau.", stat_changes: { "money" => -cost } }
          end

        when "accept_proposal"
          partner_name = params[:partner_name]
          return { success: false, message_en: "Invalid proposal", message_vi: "Đề nghị không hợp lệ" } unless partner_name

          cost = 150
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost

          character.money -= cost
          family = character.family || {}
          family['spouse'] = { 'name' => partner_name, 'age' => character.age, 'relationship_quality' => rand(60..80) }
          character.family = family
          flags = character.flags || {}
          flags["is_married"] = true
          character.flags = flags
          happiness_gain = rand(15..25)
          character.happiness = [character.happiness + happiness_gain, 100].min
          character.save!
          { success: true, message_en: "You married #{partner_name}! +#{happiness_gain} happiness", message_vi: "Bạn kết hôn với #{partner_name}! +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        when "reject_proposal"
          { success: true, message_en: "You decided not to marry.", message_vi: "Bạn quyết định không kết hôn.", stat_changes: {} }

        when "gift_spouse"
          cost = 30
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          return { success: false, message_en: "You don't have a spouse", message_vi: "Bạn chưa có vợ/chồng" } unless character.spouse

          # Check cooldown
          flags = character.flags || {}
          last_used = flags["last_gift_spouse_year"]
          if last_used && last_used == character.age
            return { success: false, message_en: "You already gave a gift this year. Wait until next year.", message_vi: "Bạn đã tặng quà năm nay rồi. Chờ đến năm sau." }
          end

          character.money -= cost
          character.update_relationship_quality('spouse', nil, rand(8..15))
          happiness_gain = rand(3..8)
          character.happiness = [character.happiness + happiness_gain, 100].min
          flags["last_gift_spouse_year"] = character.age
          character.flags = flags
          { success: true, message_en: "Gave a thoughtful gift to your spouse! Relationship improved. +#{happiness_gain} happiness", message_vi: "Tặng quà ý nghĩa cho vợ/chồng! Quan hệ được cải thiện. +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        when "quality_time_spouse"
          cost = 20
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          return { success: false, message_en: "You don't have a spouse", message_vi: "Bạn chưa có vợ/chồng" } unless character.spouse

          # Check cooldown
          flags = character.flags || {}
          last_used = flags["last_quality_time_year"]
          if last_used && last_used == character.age
            return { success: false, message_en: "You already spent quality time this year. Wait until next year.", message_vi: "Bạn đã dành thời gian năm nay rồi. Chờ đến năm sau." }
          end

          character.money -= cost
          character.update_relationship_quality('spouse', nil, rand(5..10))
          happiness_gain = rand(5..10)
          character.happiness = [character.happiness + happiness_gain, 100].min
          flags["last_quality_time_year"] = character.age
          character.flags = flags
          { success: true, message_en: "Spent quality time together! Date night was wonderful. +#{happiness_gain} happiness", message_vi: "Dành thời gian bên nhau! Buổi hẹn hò tuyệt vời. +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        when "gift_parents"
          cost = 40
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          has_parents = (character.father && !character.father['deceased']) || (character.mother && !character.mother['deceased'])
          return { success: false, message_en: "Your parents have passed away", message_vi: "Bố mẹ bạn đã qua đời" } unless has_parents

          # Check cooldown
          flags = character.flags || {}
          last_used = flags["last_gift_parents_year"]
          if last_used && last_used == character.age
            return { success: false, message_en: "You already gave gifts to parents this year. Wait until next year.", message_vi: "Bạn đã tặng quà bố mẹ năm nay rồi. Chờ đến năm sau." }
          end

          character.money -= cost
          character.update_relationship_quality('father', nil, rand(5..10)) if character.father && !character.father['deceased']
          character.update_relationship_quality('mother', nil, rand(5..10)) if character.mother && !character.mother['deceased']
          happiness_gain = rand(5..12)
          character.happiness = [character.happiness + happiness_gain, 100].min
          flags["last_gift_parents_year"] = character.age
          character.flags = flags
          { success: true, message_en: "Sent gifts to your parents! They were so happy. +#{happiness_gain} happiness", message_vi: "Gửi quà cho bố mẹ! Họ rất vui. +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        when "family_vacation"
          cost = 100
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          flags = character.flags || {}
          return { success: false, message_en: "You need a family to go on vacation", message_vi: "Bạn cần có gia đình để đi nghỉ" } unless flags["is_married"] || flags["has_child"]

          # Check cooldown
          last_used = flags["last_vacation_year"]
          if last_used && last_used == character.age
            return { success: false, message_en: "You already went on vacation this year. Wait until next year.", message_vi: "Bạn đã đi nghỉ năm nay rồi. Chờ đến năm sau." }
          end

          character.money -= cost
          character.update_relationship_quality('spouse', nil, rand(10..20)) if character.spouse
          (character.children_list || []).each_with_index do |_, i|
            character.update_relationship_quality('child', i, rand(10..15))
          end
          happiness_gain = rand(15..25)
          health_gain = rand(5..10)
          character.happiness = [character.happiness + happiness_gain, 100].min
          character.health = [character.health + health_gain, 100].min
          flags["last_vacation_year"] = character.age
          character.flags = flags
          { success: true, message_en: "Amazing family vacation! Everyone had a great time. +#{happiness_gain} happiness, +#{health_gain} health", message_vi: "Kỳ nghỉ gia đình tuyệt vời! Mọi người đều vui. +#{happiness_gain} hạnh phúc, +#{health_gain} sức khỏe", stat_changes: { "money" => -cost, "happiness" => happiness_gain, "health" => health_gain } }

        when "resolve_conflict"
          cost = 50
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          return { success: false, message_en: "You don't have a spouse", message_vi: "Bạn chưa có vợ/chồng" } unless character.spouse

          # Check cooldown
          flags = character.flags || {}
          last_used = flags["last_therapy_year"]
          if last_used && last_used == character.age
            return { success: false, message_en: "You already had therapy this year. Wait until next year.", message_vi: "Bạn đã tư vấn năm nay rồi. Chờ đến năm sau." }
          end

          character.money -= cost
          character.update_relationship_quality('spouse', nil, rand(15..25))
          happiness_gain = rand(10..20)
          character.happiness = [character.happiness + happiness_gain, 100].min
          flags["last_therapy_year"] = character.age
          character.flags = flags
          { success: true, message_en: "Couples therapy helped resolve conflicts! Relationship much stronger. +#{happiness_gain} happiness", message_vi: "Tư vấn cặp đôi giúp giải quyết xung đột! Quan hệ vững chắc hơn. +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        # ===== NEW ASSETS =====
        when "buy_stocks"
          cost = 150
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          assets = character.assets || {}
          return { success: false, message_en: "You already have a stock portfolio", message_vi: "Bạn đã có danh mục cổ phiếu" } if assets["stocks"]
          character.money -= cost
          assets["stocks"] = { "name" => "Stock Portfolio", "value" => cost, "name_vi" => "Danh mục cổ phiếu" }
          character.assets = assets
          { success: true, message_en: "Invested in stocks for $#{cost}. Value will fluctuate over time.", message_vi: "Đầu tư cổ phiếu $#{cost}. Giá trị sẽ biến động theo thời gian.", stat_changes: { "money" => -cost } }

        when "buy_business"
          cost = 800
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          assets = character.assets || {}
          return { success: false, message_en: "You already own a business", message_vi: "Bạn đã sở hữu doanh nghiệp" } if assets["business"]
          character.money -= cost
          businesses = [
            { name_en: "Coffee Shop", name_vi: "Quán cà phê" },
            { name_en: "Convenience Store", name_vi: "Cửa hàng tiện lợi" },
            { name_en: "Online Store", name_vi: "Cửa hàng online" }
          ].sample
          assets["business"] = { "name" => businesses[:name_vi], "value" => cost, "income" => rand(30..60) }
          character.assets = assets
          { success: true, message_en: "Bought #{businesses[:name_en]} for $#{cost}! Generates passive income.", message_vi: "Mua #{businesses[:name_vi]} với giá $#{cost}! Tạo thu nhập thụ động.", stat_changes: { "money" => -cost } }

        when "buy_luxury"
          cost = 100
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          character.money -= cost
          assets = character.assets || {}
          assets["luxury_items"] ||= []
          luxuries = [
            { name_en: "Diamond Ring", name_vi: "Nhẫn kim cương" },
            { name_en: "Designer Watch", name_vi: "Đồng hồ hiệu" },
            { name_en: "Art Painting", name_vi: "Tranh nghệ thuật" }
          ].sample
          assets["luxury_items"] << { "name" => luxuries[:name_vi], "value" => cost }
          character.assets = assets
          happiness_gain = rand(5..10)
          character.happiness = [character.happiness + happiness_gain, 100].min
          { success: true, message_en: "Bought #{luxuries[:name_en]} for $#{cost}! +#{happiness_gain} happiness", message_vi: "Mua #{luxuries[:name_vi]} với giá $#{cost}! +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        when "buy_education_fund"
          cost = 200
          return { success: false, message_en: "Not enough money ($#{cost} required)", message_vi: "Không đủ tiền (cần $#{cost})" } if character.money < cost
          flags = character.flags || {}
          return { success: false, message_en: "You need children to create an education fund", message_vi: "Bạn cần có con để tạo quỹ học vấn" } unless flags["has_child"]
          assets = character.assets || {}
          return { success: false, message_en: "You already have an education fund", message_vi: "Bạn đã có quỹ học vấn" } if assets["education_fund"]
          character.money -= cost
          assets["education_fund"] = { "name" => "Education Fund", "value" => cost, "name_vi" => "Quỹ học vấn" }
          character.assets = assets
          happiness_gain = rand(8..15)
          character.happiness = [character.happiness + happiness_gain, 100].min
          { success: true, message_en: "Created education fund for $#{cost}! Securing your children's future. +#{happiness_gain} happiness", message_vi: "Tạo quỹ học vấn $#{cost}! Đảm bảo tương lai con cái. +#{happiness_gain} hạnh phúc", stat_changes: { "money" => -cost, "happiness" => happiness_gain } }

        when "sell_stocks"
          assets = character.assets || {}
          return { success: false, message_en: "You don't own stocks", message_vi: "Bạn không sở hữu cổ phiếu" } unless assets["stocks"]
          # Stock value fluctuates ±30%
          base_value = assets["stocks"]["value"] || 150
          sell_price = (base_value * rand(70..130) / 100.0).round
          assets.delete("stocks")
          character.assets = assets
          character.money += sell_price
          profit = sell_price - base_value
          message_en = profit >= 0 ? "Sold stocks for $#{sell_price}! Profit: $#{profit}" : "Sold stocks for $#{sell_price}. Loss: $#{profit.abs}"
          message_vi = profit >= 0 ? "Bán cổ phiếu được $#{sell_price}! Lãi: $#{profit}" : "Bán cổ phiếu được $#{sell_price}. Lỗ: $#{profit.abs}"
          { success: true, message_en: message_en, message_vi: message_vi, stat_changes: { "money" => sell_price } }

        when "sell_business"
          assets = character.assets || {}
          return { success: false, message_en: "You don't own a business", message_vi: "Bạn không sở hữu doanh nghiệp" } unless assets["business"]
          sell_price = ((assets["business"]["value"] || 800) * rand(80..120) / 100.0).round
          assets.delete("business")
          character.assets = assets
          character.money += sell_price
          { success: true, message_en: "Sold your business for $#{sell_price}", message_vi: "Bán doanh nghiệp được $#{sell_price}", stat_changes: { "money" => sell_price } }

        else
          { success: false, message_en: "Unknown action", message_vi: "Hành động không xác định" }
        end
      end
    end
  end
end
