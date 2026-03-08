class AddSeenEventsToCharacters < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :seen_event_ids, :integer, array: true, default: []
  end
end
