class Event < ApplicationRecord
  has_many :choices, dependent: :destroy

  scope :milestones, -> { where(event_type: 'milestone') }
  scope :arcs, -> { where(event_type: 'arc') }
  scope :randoms, -> { where(event_type: 'random') }

  def self.eligible_for_character(character)
    events = Event.all.select do |event|
      meets_conditions?(event, character)
    end

    # Filter salary review events based on time since last review
    events.reject do |event|
      if event.title_en == "Business Revenue Review"
        last_review_age = character.flags&.dig('last_seniority_increase_age') || 0
        years_since_review = character.age - last_review_age
        years_since_review < 3
      else
        false
      end
    end
  end

  def self.meets_conditions?(event, character)
    return true if event.conditions.blank?

    cond = event.conditions.is_a?(String) ? JSON.parse(event.conditions) : event.conditions
    flags = character.flags || {}

    return false if cond['min_age'] && character.age < cond['min_age']
    return false if cond['max_age'] && character.age > cond['max_age']

    if cond['requires_flags']
      return false unless cond['requires_flags'].all? { |f| flags[f] }
    end

    if cond['excludes_flags']
      return false if cond['excludes_flags'].any? { |f| flags[f] }
    end

    true
  end
end
