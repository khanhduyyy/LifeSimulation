class CreateChoices < ActiveRecord::Migration[8.1]
  def change
    create_table :choices do |t|
      t.references :event, null: false, foreign_key: true
      t.text :content
      t.jsonb :display_conditions

      t.timestamps
    end
  end
end
