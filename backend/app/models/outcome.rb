class Outcome < ApplicationRecord
  belongs_to :choice
  belongs_to :next_event, class_name: 'Event', optional: true
end
