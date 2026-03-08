class Character < ApplicationRecord
  validates :age, :money, :health, :happiness, presence: true
  validates :health, :happiness, numericality: { in: 0..100 }
end
