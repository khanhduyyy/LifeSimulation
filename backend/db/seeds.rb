# db/seeds.rb
# Encoding: UTF-8
require 'json'

puts "Clearing DB..."
Outcome.delete_all; Choice.delete_all; Event.delete_all; Character.delete_all

events_dir = Rails.root.join('db', 'events')
unless Dir.exist?(events_dir)
  puts "No db/events directory found."
  exit
end

# Glob **/*.json to support both flat files and subdirectory structure
json_files = Dir[events_dir.join('**', '*.json')]
events_data = []

json_files.each do |file|
  content = File.read(file)
  # Strip BOM if present
  content = content.sub("\xEF\xBB\xBF", "")
  data = JSON.parse(content)
  events_data.concat(data)
end

puts "Starting database insertions from #{json_files.size} JSON files (#{events_data.size} events)..."

# Track i18n_key → DB id for next_event_key resolution
key_to_id = {}

events_data.each do |data|
  e = Event.create!(
    title_en: data['title_en'], title_vi: data['title_vi'],
    description_en: data['description_en'], description_vi: data['description_vi'],
    conditions: data['conditions'],
    i18n_key: data['i18n_key'],
    event_type: data['event_type'] || 'random',
    arc_id: data['arc_id'],
    arc_sequence: data['arc_sequence'],
    arc_trigger_flags: data['arc_trigger_flags'] || []
  )

  # Track i18n_key for linking
  key_to_id[data['i18n_key']] = e.id if data['i18n_key'].present?

  data['choices'].each do |ch|
    choice = e.choices.create!(
      content_en: ch['content_en'], content_vi: ch['content_vi'],
      display_conditions: ch['display_conditions'],
      i18n_key: ch['i18n_key']
    )
    ch['outcomes'].each do |o|
      out_hash = {
        probability: o['probability'],
        message_en: o['message_en'],
        message_vi: o['message_vi'],
        stat_changes: o['stat_changes'] || {},
        set_flags: o['set_flags'] || {},
        unset_flags: o['unset_flags'] || [],
        i18n_key: o['i18n_key']
      }
      choice.outcomes.create!(out_hash)
    end
  end
end

puts "Resolving branching links..."

# Pass 1: Resolve next_event_key (new i18n_key-based linking)
events_data.each do |data|
  data['choices'].each do |ch|
    ch['outcomes'].each do |o|
      next_key = o['next_event_key']
      if next_key && key_to_id[next_key]
        db_orig = data['i18n_key'].present? ?
          Event.find_by(i18n_key: data['i18n_key']) :
          Event.find_by(title_en: data['title_en'])

        if db_orig
          Outcome.joins(:choice)
                 .where(choices: { event_id: db_orig.id })
                 .where(message_en: o['message_en'])
                 .update_all(next_event_id: key_to_id[next_key])
        end
      end
    end
  end
end

# Pass 2: Backward compatibility — resolve next_event_title_en (old linking)
events_data.each do |data|
  data['choices'].each do |ch|
    ch['outcomes'].each do |o|
      next_ref_title = o['next_event_title_en']
      next unless next_ref_title
      # Skip if already resolved via next_event_key
      next if o['next_event_key']

      db_orig = Event.find_by(title_en: data['title_en'])
      db_next = Event.find_by(title_en: next_ref_title)
      if db_orig && db_next
        Outcome.joins(:choice)
               .where(choices: { event_id: db_orig.id })
               .where(message_en: o['message_en'])
               .update_all(next_event_id: db_next.id)
      end
    end
  end
end

puts "Done! Seeded #{Event.count} events from #{json_files.size} JSON files."
puts "  Milestones: #{Event.milestones.count}"
puts "  Arcs: #{Event.arcs.count}"
puts "  Random: #{Event.randoms.count}"
puts "  Outcomes with unset_flags: #{Outcome.where.not(unset_flags: []).count}"
puts "  Outcomes with next_event: #{Outcome.where.not(next_event_id: nil).count}"
