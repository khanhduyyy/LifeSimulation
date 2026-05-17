class Character < ApplicationRecord
  validates :age, :money, :health, :happiness, presence: true
  validates :health, :happiness, numericality: { in: 0..100 }
  validates :gender, inclusion: { in: %w[male female], allow_nil: true }
  validates :background, inclusion: { in: %w[poor middle rich], allow_nil: true }

  # Background starting stats
  BACKGROUNDS = {
    'poor'   => { money: 200, health: 90, happiness: 40 },
    'middle' => { money: 500, health: 80, happiness: 50 },
    'rich'   => { money: 1000, health: 70, happiness: 60 }
  }.freeze

  def self.stats_for_background(bg)
    BACKGROUNDS[bg] || BACKGROUNDS['middle']
  end

  # Family helper methods
  def father
    f = family&.dig('father')
    # Initialize relationship_quality if missing
    if f && !f['deceased'] && !f['relationship_quality']
      f['relationship_quality'] = 50
      self.family = self.family # Trigger save
    end
    f
  end

  def mother
    m = family&.dig('mother')
    # Initialize relationship_quality if missing
    if m && !m['deceased'] && !m['relationship_quality']
      m['relationship_quality'] = 50
      self.family = self.family # Trigger save
    end
    m
  end

  def spouse
    s = family&.dig('spouse')
    # Initialize relationship_quality if missing
    if s && !s['relationship_quality']
      s['relationship_quality'] = 70
      self.family = self.family # Trigger save
    end
    s
  end

  def children_list
    children = family&.dig('children') || []
    # Initialize relationship_quality if missing
    needs_save = false
    children.each do |child|
      unless child['relationship_quality']
        child['relationship_quality'] = 80
        needs_save = true
      end
    end
    self.family = self.family if needs_save # Trigger save
    children
  end

  def add_spouse(name:, age:)
    f = self.family || {}
    f['spouse'] = { 'name' => name, 'age' => age, 'relationship_quality' => 70 }
    self.family = f
  end

  def add_child(name:, gender:)
    f = self.family || {}
    f['children'] ||= []
    f['children'] << { 'name' => name, 'gender' => gender, 'age' => 0, 'relationship_quality' => 80 }
    self.family = f
  end

  # Update relationship quality for a family member
  def update_relationship_quality(member_type, index = nil, change)
    f = self.family || {}

    case member_type
    when 'father'
      return unless f['father']
      f['father']['relationship_quality'] = ((f['father']['relationship_quality'] || 50) + change).clamp(0, 100)
    when 'mother'
      return unless f['mother']
      f['mother']['relationship_quality'] = ((f['mother']['relationship_quality'] || 50) + change).clamp(0, 100)
    when 'spouse'
      return unless f['spouse']
      f['spouse']['relationship_quality'] = ((f['spouse']['relationship_quality'] || 50) + change).clamp(0, 100)
    when 'child'
      return unless f['children'] && f['children'][index]
      f['children'][index]['relationship_quality'] = ((f['children'][index]['relationship_quality'] || 50) + change).clamp(0, 100)
    end

    self.family = f
  end

  # Get average family relationship quality
  def average_relationship_quality
    f = self.family || {}
    qualities = []

    qualities << f['father']['relationship_quality'] if f['father'] && !f['father']['deceased']
    qualities << f['mother']['relationship_quality'] if f['mother'] && !f['mother']['deceased']
    qualities << f['spouse']['relationship_quality'] if f['spouse']
    (f['children'] || []).each { |c| qualities << (c['relationship_quality'] || 50) }

    qualities.empty? ? 50 : (qualities.sum / qualities.size)
  end

  def update_job(title_en:, title_vi:, salary:, position_en: nil, position_vi: nil)
    self.job = {
      'title_en' => title_en,
      'title_vi' => title_vi,
      'salary' => salary,
      'position_en' => position_en || title_en,
      'position_vi' => position_vi || title_vi
    }
  end

  # Age family members each turn
  def age_family_members
    f = self.family || {}
    f['father']['age'] += 1 if f['father']
    f['mother']['age'] += 1 if f['mother']
    f['spouse']['age'] += 1 if f['spouse']
    (f['children'] || []).each { |c| c['age'] = (c['age'] || 0) + 1 }
    self.family = f
  end

  # Get list of children with their ages
  def children_with_ages(current_year)
    flags = self.flags || {}
    children_count = flags['children_count'].to_i
    result = []

    (1..children_count).each do |i|
      birth_year = flags["child_#{i}_birth_year"]
      if birth_year
        age = current_year - birth_year
        result << { index: i, birth_year: birth_year, age: age }
      end
    end

    result
  end

  # Check if any child just turned 22 this year
  def children_turning_22(current_year)
    children_with_ages(current_year).select { |child| child[:age] >= 22 }
  end
end
