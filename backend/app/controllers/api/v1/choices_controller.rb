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
              # Apply ±20% variation for non-zero values to make replays feel different
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
          selected_outcome.set_flags.each do |flag, value|
            current_flags[flag] = value
          end
          character.flags = current_flags
        end

        character.save!

        game_over = character.health <= 0 || character.money < 0 || character.happiness <= 0

        render json: {
          roll: roll,
          outcome: selected_outcome,
          character: character,
          game_over: game_over
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Choice or Character not found" }, status: :not_found
      end
    end
  end
end
