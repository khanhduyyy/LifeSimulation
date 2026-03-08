module Api
  module V1
    class EventsController < ApplicationController
      # GET /api/v1/events
      def index
        character = Character.find(params[:character_id])

        # If a specific next_event_id is requested (branching)
        if params[:next_event_id].present?
          event = Event.find_by(id: params[:next_event_id])
          if event
            # Also record this branching event as seen so it doesn't pop up randomly later
            unless character.seen_event_ids.include?(event.id)
              character.update!(seen_event_ids: character.seen_event_ids + [event.id])
            end
            return render json: event.as_json(include: { choices: { include: :outcomes } })
          end
        end

        # Filter events by character conditions (age, stats, flags) AND EXCLUDE SEEN
        events = Event.all.select do |e|
          !character.seen_event_ids.include?(e.id) && meets_conditions?(e.conditions, character)
        end

        event = events.sample
        
        if event
          # Record this event as seen
          character.update!(seen_event_ids: character.seen_event_ids + [event.id])
          render json: event.as_json(include: { choices: { include: :outcomes } })
        else
          render json: { error: "No more events available. You've lived a full life!" }, status: :not_found
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Character not found" }, status: :not_found
      end

      # GET /api/v1/events/:id
      def show
        event = Event.find(params[:id])
        render json: event.as_json(include: { choices: { include: :outcomes } })
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Event not found" }, status: :not_found
      end

      private

      def meets_conditions?(conditions, character)
        return true if conditions.blank?

        conditions.all? do |key, value|
          case key
          when "min_age"
            character.age >= value
          when "max_age"
            character.age <= value
          when "min_money"
            character.money >= value
          when "min_health"
            character.health >= value
          when "min_happiness"
            character.happiness >= value
          when "requires_flags"
            # value is an array of flag names that must be true
            Array(value).all? { |flag| character.flags&.dig(flag) }
          when "excludes_flags"
            # value is an array of flag names that must NOT be true
            Array(value).none? { |flag| character.flags&.dig(flag) }
          else
            true
          end
        end
      end
    end
  end
end
