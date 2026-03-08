class CreateOutcomes < ActiveRecord::Migration[8.1]
  def change
    create_table :outcomes do |t|
      t.references :choice, null: false, foreign_key: true
      t.integer :probability
      t.text :message
      t.jsonb :stat_changes

      t.timestamps
    end
  end
end
