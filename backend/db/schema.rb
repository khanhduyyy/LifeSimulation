# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_07_153026) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "characters", force: :cascade do |t|
    t.integer "age"
    t.datetime "created_at", null: false
    t.jsonb "flags", default: {}
    t.integer "happiness"
    t.integer "health"
    t.integer "money"
    t.integer "seen_event_ids", default: [], array: true
    t.datetime "updated_at", null: false
  end

  create_table "choices", force: :cascade do |t|
    t.text "content_en"
    t.text "content_vi"
    t.datetime "created_at", null: false
    t.jsonb "display_conditions"
    t.bigint "event_id", null: false
    t.string "i18n_key"
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_choices_on_event_id"
  end

  create_table "events", force: :cascade do |t|
    t.jsonb "conditions"
    t.datetime "created_at", null: false
    t.text "description_en"
    t.text "description_vi"
    t.string "i18n_key"
    t.string "title_en"
    t.string "title_vi"
    t.datetime "updated_at", null: false
  end

  create_table "outcomes", force: :cascade do |t|
    t.bigint "choice_id", null: false
    t.datetime "created_at", null: false
    t.string "i18n_key"
    t.text "message_en"
    t.text "message_vi"
    t.bigint "next_event_id"
    t.integer "probability"
    t.jsonb "set_flags"
    t.jsonb "stat_changes"
    t.datetime "updated_at", null: false
    t.index ["choice_id"], name: "index_outcomes_on_choice_id"
    t.index ["next_event_id"], name: "index_outcomes_on_next_event_id"
  end

  add_foreign_key "choices", "events"
  add_foreign_key "outcomes", "choices"
  add_foreign_key "outcomes", "events", column: "next_event_id", on_delete: :nullify
end
