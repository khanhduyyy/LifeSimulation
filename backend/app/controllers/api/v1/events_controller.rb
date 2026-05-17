module Api
  module V1
    class EventsController < ApplicationController
      # GET /api/v1/events
      # V3: Returns an ARRAY of all eligible events for the character's current age.
      # Can return empty array if no events at this age (valid — frontend shows "Next Year").
      def index
        character = Character.find(params[:character_id])

        # If a specific next_event_id is requested (branching from outcome)
        if params[:next_event_id].present?
          event = Event.find_by(id: params[:next_event_id])
          if event
            unless character.seen_event_ids.include?(event.id)
              character.update!(seen_event_ids: character.seen_event_ids + [event.id])
            end
            return render json: [event.as_json(include: { choices: { include: :outcomes } })]
          end
        end

        # V3: Collect ALL eligible events for this turn
        events = find_all_events(character)

        # Mark all as seen
        new_seen_ids = events.map(&:id) - character.seen_event_ids
        if new_seen_ids.any?
          character.update!(seen_event_ids: character.seen_event_ids + new_seen_ids)
        end

        # Return array (can be empty — that's OK, means peaceful year)
        render json: events.map { |e| e.as_json(include: { choices: { include: :outcomes } }) }

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

      # V3: Find ALL events for this turn (milestones + arc + randoms)
      def find_all_events(character)
        results = []

        # 1. ALL milestones that match
        milestones = find_all_milestones(character)
        results.concat(milestones)

        # 2. Arc event (if active arc, get next in sequence)
        if character.flags&.dig("active_arc").present?
          arc_event = find_arc_event(character)
          if arc_event
            results << arc_event
          else
            # Arc finished, clear
            current_flags = character.flags || {}
            current_flags.delete("active_arc")
            current_flags.delete("arc_progress")
            character.update!(flags: current_flags)
          end
        end

        # 3. Check for new triggerable arc (if no active arc)
        if character.flags&.dig("active_arc").blank?
          new_arc = find_triggerable_arc(character)
          if new_arc
            current_flags = character.flags || {}
            current_flags["active_arc"] = new_arc[:arc_id]
            current_flags["arc_progress"] = 0
            character.update!(flags: current_flags)
            results << new_arc[:first_event]
          end
        end

        # 4. Random pool — pick 1-2 random events if available
        already_picked_ids = results.map(&:id)
        eligible_randoms = Event.randoms.select do |e|
          !character.seen_event_ids.include?(e.id) &&
          !already_picked_ids.include?(e.id) &&
          meets_conditions?(e.conditions, character) &&
          !salary_review_too_soon?(e, character)
        end

        # Pool refresh if empty
        if eligible_randoms.empty?
          random_ids = Event.randoms.pluck(:id)
          milestone_arc_seen = character.seen_event_ids - random_ids
          character.update!(seen_event_ids: milestone_arc_seen + already_picked_ids)
          eligible_randoms = Event.randoms.select do |e|
            !already_picked_ids.include?(e.id) &&
            meets_conditions?(e.conditions, character) &&
            !salary_review_too_soon?(e, character)
          end
        end

        # Reduce frequency for childhood events (age 0-17)
        # Only 30% chance of getting a random event during childhood
        if character.age <= 17
          random_pick = rand(1..100) <= 30 ? eligible_randoms.sample(1) : []
        else
          # Pick up to 1 random event per turn for adults
          random_pick = eligible_randoms.sample(1)
        end
        results.concat(random_pick)

        results.uniq
      end

      # Find ALL milestones (not just the first one)
      def find_all_milestones(character)
        Event.milestones.select do |e|
          !character.seen_event_ids.include?(e.id) && meets_conditions?(e.conditions, character)
        end
      end

      def find_arc_event(character)
        active_arc = character.flags&.dig("active_arc")
        arc_progress = character.flags&.dig("arc_progress") || 0
        return nil unless active_arc

        next_sequence = arc_progress + 1
        event = Event.arcs
                     .where(arc_id: active_arc, arc_sequence: next_sequence)
                     .first

        return event if event && meets_conditions?(event.conditions, character)
        nil
      end

      def find_triggerable_arc(character)
        completed_arcs = character.seen_event_ids.any? ?
          Event.arcs.where(id: character.seen_event_ids).pluck(:arc_id).uniq : []

        candidate_arcs = Event.arcs
                              .where(arc_sequence: 1)
                              .where.not(arc_id: completed_arcs)

        candidate_arcs.each do |arc_start|
          if arc_start.arc_trigger_flags.present?
            flags_met = arc_start.arc_trigger_flags.all? { |flag| character.flags&.dig(flag) }
            next unless flags_met
          end
          next unless meets_conditions?(arc_start.conditions, character)
          return { arc_id: arc_start.arc_id, first_event: arc_start }
        end

        nil
      end

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
            Array(value).all? { |flag| character.flags&.dig(flag) }
          when "excludes_flags"
            Array(value).none? { |flag| character.flags&.dig(flag) }
          when "requires_any_flag"
            Array(value).any? { |flag| character.flags&.dig(flag) }
          when "min_work_experience"
            (character.flags&.dig("work_experience") || 0) >= value
          when "min_child_age"
            # Check if any child meets the minimum age requirement
            has_child_of_age?(character, value)
          when "max_child_age"
            # Check if any child is under the maximum age
            has_child_under_age?(character, value)
          else
            true
          end
        end
      end

      def has_child_of_age?(character, min_age)
        flags = character.flags || {}
        children_count = flags['children_count'].to_i
        return false if children_count == 0

        (1..children_count).any? do |i|
          birth_year_flag = flags["child_#{i}_birth_year"]
          next false unless birth_year_flag

          # Calculate child age: current_year - birth_year
          # current_year can be approximated as character.age (since character starts at age 0)
          child_age = character.age - birth_year_flag.to_i
          child_age >= min_age
        end
      end

      def has_child_under_age?(character, max_age)
        flags = character.flags || {}
        children_count = flags['children_count'].to_i
        return false if children_count == 0

        (1..children_count).any? do |i|
          birth_year_flag = flags["child_#{i}_birth_year"]
          next false unless birth_year_flag

          child_age = character.age - birth_year_flag.to_i
          child_age <= max_age
        end
      end

      def salary_review_too_soon?(event, character)
        return false unless event.title_en == "Business Revenue Review"

        last_review_age = character.flags&.dig('last_seniority_increase_age') || 0
        years_since_review = character.age - last_review_age
        min_years = character.flags&.dig('next_seniority_increase_years') || 3

        years_since_review < min_years
      end
    end
  end
end
