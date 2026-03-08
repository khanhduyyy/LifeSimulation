export const en = {
  // Start Screen
  startTitle: 'Life Simulation',
  startSubtitle: 'Every decision changes your fate. Every playthrough is a new life. How will you live yours?',
  startButton: '🎮 Start a New Life',
  featureRandom: 'Random Outcomes',
  featureEvents: '40+ Events',
  featureReplay: 'High Replayability',
  featureEndings: 'Multiple Endings',

  // Stats
  statAge: 'Age',
  statHealth: 'Health',
  statMoney: 'Money',
  statHappiness: 'Happiness',

  // Event
  ageBadge: '📅 Age',
  yourChoices: '🤔 Your Choices',
  locked: '🔒 Locked',

  // Outcome
  rollingDice: 'Rolling the dice',
  diceResult: 'Dice Roll Result',
  viewResults: '💀 View Results',
  continueBtn: '➡️ Continue',

  // Game Over - Death
  deathTitle: 'You Passed Away',
  deathSubtitle: (age: number) => `Your life ended at age ${age}. Here's your legacy:`,

  // Game Over - Bankrupt
  bankruptTitle: 'Bankrupt!',
  bankruptSubtitle: (age: number) => `You fell into massive debt at age ${age}. Here's your legacy:`,

  // Game Over - Depressed
  depressedTitle: 'Overwhelmed',
  depressedSubtitle: (age: number) => `You lost the will to go on at age ${age}. Here's your legacy:`,

  // Game Over - Retirement
  retirementTitle: 'Congratulations!',
  retirementSubtitle: (age: number) => `You lived a full life to age ${age}! Here's your legacy:`,

  // Legacy (keep for backward compat)
  gameOverTitle: 'Game Over',
  gameOverSubtitle: (age: number) => `Your life ended at age ${age}.`,

  playAgain: '🔄 Play Again',

  // Loading & Error
  creatingLife: 'Creating your life...',
  errorStart: 'Failed to start game. Is the backend running?',
  errorChoice: 'Failed to process choice',
  errorContinue: 'Failed to continue',

  // Language
  langLabel: '🌐',
  langName: 'EN',
};

export type Translations = typeof en;
