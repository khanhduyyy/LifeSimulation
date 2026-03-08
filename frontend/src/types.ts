export interface Character {
  id: number;
  age: number;
  money: number;
  health: number;
  happiness: number;
  flags: Record<string, boolean>;
  seen_event_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface Outcome {
  id: number;
  choice_id: number;
  probability: number;
  message_en: string;
  message_vi?: string;
  stat_changes: Record<string, number> | null;
  set_flags: Record<string, boolean> | null;
  next_event_id: number | null;
  i18n_key?: string;
}

export interface Choice {
  id: number;
  event_id: number;
  content_en: string;
  content_vi?: string;
  display_conditions: Record<string, number> | null;
  outcomes: Outcome[];
  i18n_key?: string;
}

export interface Event {
  id: number;
  title_en: string;
  title_vi?: string;
  description_en: string;
  description_vi?: string;
  conditions: Record<string, unknown> | null;
  choices: Choice[];
  i18n_key?: string;
}

export interface SelectResult {
  roll: number;
  outcome: Outcome;
  character: Character;
  game_over: boolean;
}

export type GamePhase = 'start' | 'event' | 'rolling' | 'outcome' | 'gameover';
