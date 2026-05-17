module Api
  module V1
    class ChoicesController < ApplicationController
      # POST /api/v1/choices/:id/select
      def select
        choice = Choice.find(params[:id])
        character = Character.find(params[:character_id])
        outcomes = choice.outcomes

        if outcomes.empty?
          render json: { error: "No outcomes for this choice" }, status: :unprocessable_entity
          return
        end

        # Roll the dice (1-100) and determine outcome
        roll = rand(1..100)
        cumulative = 0
        selected_outcome = nil

        outcomes.order(:id).each do |outcome|
          cumulative += outcome.probability
          if roll <= cumulative
            selected_outcome = outcome
            break
          end
        end

        selected_outcome ||= outcomes.last

        # Apply stat changes with dynamic variation (±20% randomness for replay variety)
        actual_changes = {}
        if selected_outcome.stat_changes.present?
          selected_outcome.stat_changes.each do |stat, change|
            if character.respond_to?("#{stat}=")
              base_change = change.to_i
              if base_change.abs >= 5
                variance = (base_change.abs * 0.2).ceil
                varied_change = base_change + rand(-variance..variance)
              else
                varied_change = base_change
              end
              actual_changes[stat] = varied_change
              new_value = character.send(stat) + varied_change
              new_value = new_value.clamp(0, 100) if %w[health happiness].include?(stat)
              character.send("#{stat}=", new_value)
            end
          end
        end

        # Apply flags from outcome
        if selected_outcome.set_flags.present?
          current_flags = character.flags || {}

          # SET flags mới
          selected_outcome.set_flags.each do |flag, value|
            # Skip salary_increase_percent - it's temporary
            next if flag == "salary_increase_percent"

            # Handle CURRENT_YEAR placeholder for child birth tracking
            if value == "CURRENT_YEAR"
              current_flags[flag] = character.age
            # Handle AGE_PLUS_10 for insurance expiration
            elsif value == "AGE_PLUS_10"
              current_flags[flag] = character.age + 10
            else
              current_flags[flag] = value
            end
          end

          # UNSET flags cũ (fix bug đổi nghề)
          if selected_outcome.unset_flags.present?
            selected_outcome.unset_flags.each do |flag|
              current_flags.delete(flag.to_s)
            end
          end

          character.flags = current_flags

          # === V3: Auto-update family/job/assets based on flags ===
          apply_family_updates(character, selected_outcome.set_flags)
          apply_job_updates(character, selected_outcome.set_flags)
          apply_asset_updates(character, selected_outcome.set_flags)

          # Apply salary increase if flag is set
          if selected_outcome.set_flags["salary_increase_percent"]
            apply_salary_increase(character, selected_outcome.set_flags["salary_increase_percent"])
          end

        elsif selected_outcome.unset_flags.present?
          current_flags = character.flags || {}
          selected_outcome.unset_flags.each do |flag|
            current_flags.delete(flag.to_s)
          end
          character.flags = current_flags
        end

        # Update arc progress if this event belongs to an arc
        event = choice.event
        if event.event_type == 'arc' && character.flags&.dig("active_arc") == event.arc_id
          current_flags = character.flags || {}
          current_flags["arc_progress"] = (current_flags["arc_progress"] || 0) + 1
          character.flags = current_flags
        end

        character.save!

        game_over = character.health <= 0 || character.money < 0 || character.happiness <= 0

        # Contextual message suffix based on character stats
        context_suffix_vi = if character.health < 30
          " (Sức khỏe kém khiến mọi thứ nặng nề hơn.)"
        elsif character.happiness < 30
          " (Tâm trạng tệ ảnh hưởng đến quyết định của bạn.)"
        elsif character.money < 50
          " (Túi rỗng khiến lựa chọn này càng thêm rủi ro.)"
        else
          ""
        end

        context_suffix_en = if character.health < 30
          " (Poor health makes everything harder.)"
        elsif character.happiness < 30
          " (Your low mood affects your decisions.)"
        elsif character.money < 50
          " (Being broke makes this choice even riskier.)"
        else
          ""
        end

        outcome_json = selected_outcome.as_json
        outcome_json["message_vi"] = (outcome_json["message_vi"] || "") + context_suffix_vi if context_suffix_vi.present?
        outcome_json["message_en"] = (outcome_json["message_en"] || "") + context_suffix_en if context_suffix_en.present?

        render json: {
          roll: roll,
          outcome: outcome_json,
          character: character,
          game_over: game_over
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Choice or Character not found" }, status: :not_found
      end

      private

      # Auto-update family when marriage/child flags are set
      def apply_family_updates(character, set_flags)
        if set_flags["is_married"] == true && character.spouse.nil?
          spouse_name = VietnameseNameGenerator.generate_spouse_name(character.gender)
          spouse_age = character.age + rand(-3..3)
          character.add_spouse(name: spouse_name, age: spouse_age)
        end

        if set_flags["has_child"] == true || set_flags["new_child"] == true
          child_gender = %w[male female].sample
          child_name = VietnameseNameGenerator.generate_child_name(child_gender)
          character.add_child(name: child_name, gender: child_gender)
        end
      end

      # Auto-update job info — infer from flag names since events set flags like job_office, job_manual etc.
      def apply_job_updates(character, set_flags)
        flags = character.flags || {}
        current_job = character.job || {}

        # Check if this is a job change (different job type flags)
        job_changed = job_type_changed?(character, set_flags)

        # Explicit job label (if event provides it)
        job_title = set_flags["job_title"] || set_flags["job_label_en"]
        if job_title.present?
          salary = job_changed ? calculate_salary(character) : (current_job['salary'] || calculate_salary(character))
          seniority = job_changed ? 0 : (current_job['seniority'] || 0)

          title_vi_map = {
            "Clerk" => "Thư ký / Nhập liệu",
            "Factory Worker" => "Công nhân nhà máy",
            "Street Food Vendor" => "Bán hàng vỉa hè",
            "Junior Analyst" => "Chuyên viên phân tích",
            "Technician" => "Kỹ thuật viên",
            "Consultant" => "Chuyên gia tư vấn",
            "Office Staff" => "Nhân viên văn phòng",
            "Construction Worker" => "Thợ xây dựng",
            "Self-Employed" => "Làm nghề tự do"
          }
          title_vi = set_flags["job_label_vi"] || title_vi_map[job_title] || job_title

          character.job = {
            'title_en' => job_title,
            'title_vi' => title_vi,
            'salary' => salary,
            'seniority' => seniority,
            'position_en' => set_flags["job_position_en"] || 'Employee',
            'position_vi' => set_flags["job_position_vi"] || 'Nhân viên'
          }
          if job_changed
            flags['last_seniority_increase_age'] = character.age
            flags['next_seniority_increase_years'] = rand(3..6)
          end
          character.flags = flags
          return
        end

        # Auto-detect from is_employed + job type flags
        if set_flags["is_employed"] == true || flags["is_employed"] == true
          job_info = if set_flags["job_office_senior"] || flags["job_office_senior"]
            { en: 'Senior Office Worker', vi: 'Nhân viên văn phòng cấp cao', pos_en: 'Senior', pos_vi: 'Cấp cao' }
          elsif set_flags["job_office"] || flags["job_office"]
            { en: 'Office Worker', vi: 'Nhân viên văn phòng', pos_en: 'Staff', pos_vi: 'Nhân viên' }
          elsif set_flags["job_manual"] || flags["job_manual"]
            { en: 'Manual Worker', vi: 'Công nhân', pos_en: 'Worker', pos_vi: 'Công nhân' }
          elsif set_flags["job_business"] || flags["job_business"]
            { en: 'Business Owner', vi: 'Chủ doanh nghiệp', pos_en: 'Owner', pos_vi: 'Chủ' }
          else
            { en: 'Employee', vi: 'Nhân viên', pos_en: 'Staff', pos_vi: 'Nhân viên' }
          end

          salary = job_changed ? calculate_salary(character) : (current_job['salary'] || calculate_salary(character))
          seniority = job_changed ? 0 : (current_job['seniority'] || 0)

          character.job = {
            'title_en' => job_info[:en],
            'title_vi' => job_info[:vi],
            'salary' => salary,
            'seniority' => seniority,
            'position_en' => job_info[:pos_en],
            'position_vi' => job_info[:pos_vi]
          }
          if job_changed
            flags['last_seniority_increase_age'] = character.age
            flags['next_seniority_increase_years'] = rand(3..6)
          end
          character.flags = flags
        end

        # Clear job on retirement
        if set_flags["is_retired"] == true
          character.job = {
            'title_en' => 'Retired',
            'title_vi' => 'Đã nghỉ hưu',
            'salary' => 0,
            'seniority' => 0,
            'position_en' => 'Retired',
            'position_vi' => 'Đã nghỉ hưu'
          }
        end
      end

      def apply_asset_updates(character, set_flags)
        current_assets = character.assets || {}

        if set_flags["has_house"]
          current_assets["house"] = {
            "name" => set_flags["house_name"] || "Nhà riêng",
            "value" => set_flags["house_value"] || 500
          }
        end

        if set_flags["has_car"]
          current_assets["car"] = {
            "name" => set_flags["car_name"] || "Xe hơi",
            "value" => set_flags["car_value"] || 200
          }
        end

        if set_flags["has_insurance"]
          current_assets["insurance"] = true
        end

        character.assets = current_assets
      end

      def calculate_salary(character)
        flags = character.flags || {}
        if flags["job_office_senior"]
          flags["has_masters"] ? 85 : 75
        elsif flags["job_office"]
          has_degree = flags["has_degree"] || flags["path_college_public"] || flags["path_college_private"]
          has_degree ? 55 : 40
        elsif flags["job_manual"]
          42
        elsif flags["job_business"]
          50
        else
          25
        end
      end

      def job_type_changed?(character, set_flags)
        flags = character.flags || {}
        current_job = character.job || {}

        # Check if any job type flag is being newly set
        job_type_flags = ['job_office', 'job_office_senior', 'job_manual', 'job_business']

        job_type_flags.any? do |flag|
          set_flags[flag] == true && !flags[flag]
        end
      end

      def apply_salary_increase(character, percent)
        current_job = character.job || {}
        current_salary = current_job['salary'] || 0

        return if current_salary == 0

        increase_amount = (current_salary * percent / 100.0).round
        new_salary = current_salary + increase_amount
        current_seniority = current_job['seniority'] || 0

        character.job = current_job.merge({
          'salary' => new_salary,
          'seniority' => current_seniority + 1
        })

        flags = character.flags || {}
        flags['last_seniority_increase_age'] = character.age
        flags['next_seniority_increase_years'] = rand(3..6)
        character.flags = flags
      end
    end
  end
end
