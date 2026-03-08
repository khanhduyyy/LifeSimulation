module Api
  module V1
    class CharactersController < ApplicationController
      # POST /api/v1/characters
      def create
        character = Character.new(
          age: 18,
          money: 100,            # Balanced start money: $100
          health: 100,
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

        # Health degradation after age 30
        if params[:character][:age].present?
          new_age = params[:character][:age].to_i
          if new_age > 30
            degradation = [1, (new_age - 30) / 5].max
            current_health = character.health
            character.health = [current_health - degradation, 0].max
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
