class RenameColumnsToEnAndAddVi < ActiveRecord::Migration[8.1]
  def change
    # Events: rename title/description to _en, add _vi
    rename_column :events, :title, :title_en
    rename_column :events, :description, :description_en
    add_column :events, :title_vi, :string
    add_column :events, :description_vi, :text

    # Choices: rename content to _en, add _vi
    rename_column :choices, :content, :content_en
    add_column :choices, :content_vi, :text

    # Outcomes: rename message to _en, add _vi
    rename_column :outcomes, :message, :message_en
    add_column :outcomes, :message_vi, :text
  end
end
