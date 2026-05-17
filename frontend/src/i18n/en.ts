export const en = {
  // Start Screen
  startTitle: 'Life Simulation',
  startSubtitle: 'Every decision changes your fate. Every playthrough is a new life. How will you live yours?',
  startButton: '🎮 Start a New Life',
  featureRandom: 'Random Outcomes',
  featureEvents: '100+ Events',
  featureReplay: 'High Replayability',
  featureEndings: 'Multiple Endings',

  // Character Creation
  createTitle: 'Create Your Character',
  createSubtitle: 'Choose your name, gender, and family background to begin your journey.',
  nameLabel: 'Character Name',
  namePlaceholder: 'Enter your name...',
  genderLabel: 'Gender',
  genderMale: '👦 Male',
  genderFemale: '👧 Female',
  backgroundLabel: 'Family Background',
  bgPoor: 'Poor Family',
  bgPoorDesc: 'Life is tough, but you\'re resilient.',
  bgMiddle: 'Middle Class',
  bgMiddleDesc: 'A balanced start with moderate resources.',
  bgRich: 'Wealthy Family',
  bgRichDesc: 'Privilege comes with its own pressures.',
  bgMoney: 'Money',
  bgHealth: 'Health',
  bgHappiness: 'Happiness',
  createButton: '🌟 Begin Your Life',

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

  // Action Buttons
  btnRelationships: 'Relationships',
  btnJob: 'Career',
  btnAssets: 'Assets',
  btnActions: 'Actions',

  // Relationship Popup
  relTitle: 'Relationships',
  relFather: 'Father',
  relMother: 'Mother',
  relSpouse: 'Spouse',
  relChildren: 'Children',
  relNone: 'None',
  relAge: 'Age',

  // Job Popup
  jobTitle: 'Career',
  jobName: 'Position',
  jobSalary: 'Salary',
  jobPosition: 'Rank',
  jobNone: 'Unemployed',

  // Assets Popup
  assetTitle: 'Assets',
  assetHouse: 'House',
  assetCar: 'Car',
  assetInsurance: 'Insurance',
  assetNone: 'No assets',
  assetValue: 'Value',
  assetYes: 'Active',
  assetNo: 'None',

  // Actions Popup
  actionsTitle: 'Actions',
  actionsComingSoon: 'Actions will be available as you progress through life.',

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

  // Legacy
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

  // Misc
  close: 'Close',
  yearSummary: (age: number) => `📊 Year Summary (Age ${age})`,
  summaryContBtn: 'Continue ▸',
  yourChoices: 'Your Choices',
  diceResult: 'Dice Result',
  continueBtn: 'Continue ▸',
  viewResults: 'View Results ▸',
  locked: '🔒',
};

export type Translations = typeof en;
