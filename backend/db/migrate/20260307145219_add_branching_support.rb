class AddBranchingSupport < ActiveRecord::Migration[8.1]
  def change
    # Character flags for tracking life choices
    add_column :characters, :flags, :jsonb, default: {}

    # Outcomes can lead to specific next events and set flags
    add_column :outcomes, :next_event_id, :bigint, null: true
    add_column :outcomes, :set_flags, :jsonb

    add_index :outcomes, :next_event_id
    add_foreign_key :outcomes, :events, column: :next_event_id, on_delete: :nullify
  end
end
