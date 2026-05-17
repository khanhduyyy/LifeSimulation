class AddUnsetFlagsToOutcomes < ActiveRecord::Migration[8.1]
  def change
    add_column :outcomes, :unset_flags, :jsonb, default: []
  end
end
