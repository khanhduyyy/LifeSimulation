class AddEventTypeAndArcToEvents < ActiveRecord::Migration[8.1]
  def change
    add_column :events, :event_type, :string, default: 'random'
    add_column :events, :arc_id, :string
    add_column :events, :arc_sequence, :integer
    add_column :events, :arc_trigger_flags, :string, array: true, default: []
    add_index :events, :event_type
    add_index :events, :arc_id
  end
end
