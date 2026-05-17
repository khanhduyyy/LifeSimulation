class AddCharacterDetails < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :name, :string
    add_column :characters, :gender, :string
    add_column :characters, :background, :string, default: 'middle'
    add_column :characters, :family, :jsonb, default: {}
    add_column :characters, :job, :jsonb, default: {}
    add_column :characters, :assets, :jsonb, default: {}
  end
end
