module Api
  module V1
    class CharactersController < ApplicationController
      # POST /api/v1/characters
      def create
        character = Character.new(
          age: 6,
          money: 150,             # Reduced start money for harder early game
          health: 80,
          happiness: 50,
          flags: {},
          seen_event_ids: []
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
            # 1. Health degradation after age 30 (accelerates after 50)
            if new_age > 30
              if new_age > 50
                degradation = [ 2, (new_age - 30) / 3 ].max
              else
                degradation = [ 1, (new_age - 30) / 5 ].max
              end
              current_health = character.health
              character.health = [ current_health - degradation, 0 ].max
              turn_summary << { key: "health_aging", stat: "health", value: -degradation,
                                message_en: "Age-related health decline", message_vi: "Sức khỏe giảm theo tuổi" }
            end

            # 2. Living Expenses (Economy Balancing — increased for difficulty)
            if new_age >= 18
              base_cost = 30  # Base living cost (increased from 20)

              # Married? Cost doubles
              base_cost *= 2 if character.flags&.dig("is_married")

              # Children costs (increased per child)
              children = character.flags&.dig("children_count").to_i
              base_cost += (children * 40) if children > 0

              character.money -= base_cost
              turn_summary << { key: "living_expenses", stat: "money", value: -base_cost,
                                message_en: "Living expenses", message_vi: "Chi phí sinh hoạt" }
            end

            # 2b. Family stipend for college students
            flags = character.flags || {}
            if flags["is_student"] && new_age >= 18 && new_age <= 24
              stipend = 15
              character.money += stipend
              turn_summary << { key: "family_stipend", stat: "money", value: stipend,
                                message_en: "Family allowance", message_vi: "Phụ cấp gia đình" }
            end

            # 2c. Random unexpected expenses (life is unpredictable)
            if new_age >= 25
              expense = rand(0..15)
              if expense > 8
                character.money -= expense
                turn_summary << { key: "unexpected_expense", stat: "money", value: -expense,
                                  message_en: "Unexpected expense", message_vi: "Chi phí phát sinh" }
              end
            end

            # 3. Salary income per turn (REDUCED for balance)
            if flags["is_employed"]
              salary = if flags["job_office_senior"]
                         90   # Senior office / post-Masters (was 120)
                       elsif flags["job_office"]
                         has_degree = flags["has_degree"] || flags["path_college_public"] || flags["path_college_private"]
                         has_degree ? 65 : 50   # Degree premium vs no-degree office (was 90/70)
                       elsif flags["job_manual"]
                         50   # Manual labour (was 60)
                       elsif flags["job_business"]
                         60   # Own business (was 80)
                       else
                         35   # Misc / unknown job (was 50)
                       end

              # Early workers (no degree) start at 18, others at 22+
              if flags["path_work_early"] && new_age < 22
                salary = [ salary - 15, 25 ].max  # Younger earners make less
              end

              character.money += salary
              turn_summary << { key: "salary", stat: "money", value: salary,
                                message_en: "Salary income", message_vi: "Thu nhập lương" }
            end

            # 4. Retirement income (reduced pensions for balance)
            if flags["is_retired"]
              pension = flags["job_office_senior"] ? 45 : flags["job_office"] ? 35 : 25
              # Children send money every year in retirement
              children = flags["children_count"].to_i
              pension += children * 15 if children > 0
              character.money += pension
              turn_summary << { key: "pension", stat: "money", value: pension,
                                message_en: "Retirement pension", message_vi: "Lương hưu" }
            end

            # 5. Work Experience growth
            if character.flags&.dig("is_employed")
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

      private

      def character_params
        params.require(:character).permit(:age, :money, :health, :happiness, seen_event_ids: [])
      end
    end
  end
end
