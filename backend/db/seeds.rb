# db/seeds.rb
# Encoding: UTF-8
require 'json'

puts "Clearing DB..."
Outcome.delete_all; Choice.delete_all; Event.delete_all; Character.delete_all

file_path = Rails.root.join('db', 'events.json')
unless File.exist?(file_path)
  puts "No db/events.json found. Please run your backup or create one."
  exit
end

events_data = JSON.parse(File.read(file_path))

puts "Starting database insertions from db/events.json..."
events_data.each do |data|
  e = Event.create!(
    title_en: data['title_en'], title_vi: data['title_vi'],
    description_en: data['description_en'], description_vi: data['description_vi'],
    conditions: data['conditions']
  )
  
  data['choices'].each do |ch|
    choice = e.choices.create!(
      content_en: ch['content_en'], content_vi: ch['content_vi'],
      display_conditions: ch['display_conditions']
    )
    ch['outcomes'].each do |o|
      out_hash = { 
        probability: o['probability'], 
        message_en: o['message_en'], 
        message_vi: o['message_vi'], 
        stat_changes: o['stat_changes'] || {}, 
        set_flags: o['set_flags'] || {} 
      }
      choice.outcomes.create!(out_hash)
    end
  end
end

puts "Resolving branching (next_event_id) links..."
events_data.each do |data|
  data['choices'].each do |ch|
    ch['outcomes'].each do |o|
      next_ref_title = o['next_event_title_en']
      if next_ref_title
        db_orig = Event.find_by(title_en: data['title_en'])
        db_next = Event.find_by(title_en: next_ref_title)
        if db_orig && db_next
          # Find the exact outcome by its message text belonging to the original event
          Outcome.joins(:choice)
                 .where(choices: { event_id: db_orig.id })
                 .where(message_en: o['message_en'])
                 .update_all(next_event_id: db_next.id)
        end
      end
    end
  end
end

puts "Done! Seeded EXACTLY #{Event.count} tightly coupled events from JSON!"
