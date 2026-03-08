class AddI18nKeyToEventsChoicesOutcomes < ActiveRecord::Migration[8.1]
  def change
    add_column :events, :i18n_key, :string
    add_column :choices, :i18n_key, :string
    add_column :outcomes, :i18n_key, :string
  end
end
