class CreateCharacters < ActiveRecord::Migration[8.1]
  def change
    create_table :characters do |t|
      t.integer :age
      t.integer :money
      t.integer :health
      t.integer :happiness

      t.timestamps
    end
  end
end
