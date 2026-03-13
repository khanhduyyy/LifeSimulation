module Api
  module V1
    class CharactersController < ApplicationController
      # POST /api/v1/characters
      def create
        character = Character.new(
          age: 6,
          money: 100,            # Balanced start money: $100
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

        # Process end-of-turn (age increment)
        if params[:character][:age].present?
          new_age = params[:character][:age].to_i
          old_age = character.age || 0

          if new_age > old_age
            # 1. Health degradation after age 30
            if new_age > 30
              degradation = [ 1, (new_age - 30) / 5 ].max
              current_health = character.health
              character.health = [ current_health - degradation, 0 ].max
            end

            # 2. Living Expenses (Economy Balancing)
            if new_age >= 18
              base_cost = 20

              # Married? Cost doubles
              base_cost *= 2 if character.flags&.dig("is_married")

              # Children costs
              children = character.flags&.dig("children_count").to_i
              base_cost += (children * 30) if children > 0

              character.money -= base_cost
            end

            # 3. Salary income per turn (based on job type)
            flags = character.flags || {}
            if flags["is_employed"]
              salary = if flags["job_office_senior"]
                         120  # Senior office / post-Masters
                       elsif flags["job_office"]
                         has_degree = flags["has_degree"] || flags["path_college_public"] || flags["path_college_private"]
                         has_degree ? 90 : 70   # Degree premium vs no-degree office
                       elsif flags["job_manual"]
                         60   # Manual labour — starts earlier, lower ceiling
                       elsif flags["job_business"]
                         80   # Own business, variable but decent
                       else
                         50   # Misc / unknown job
                       end

              # Early workers (no degree) start at 18, others at 22+
              if flags["path_work_early"] && new_age < 22
                salary = [ salary - 20, 30 ].max  # Younger earners make less
              end

              character.money += salary
            end

            # 4. Retirement income
            if flags["is_retired"]
              pension = flags["job_office_senior"] ? 60 : flags["job_office"] ? 45 : 35
              # Children send money every year in retirement
              children = flags["children_count"].to_i
              pension += children * 20 if children > 0
              character.money += pension
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
          render json: character
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
