export interface FamilyMember {
  name: string;
  age: number;
  gender?: string;
  deceased?: boolean;
  relationship_quality?: number;
}

export interface Family {
  father: FamilyMember | null;
  mother: FamilyMember | null;
  spouse: FamilyMember | null;
  children: FamilyMember[];
}

export interface Job {
  title_en?: string;
  title_vi?: string;
  salary?: number;
  position_en?: string;
  position_vi?: string;
}

export interface Assets {
  house?: { name: string; value: number } | null;
  car?: { name: string; value: number } | null;
  insurance?: boolean;
  stocks?: { name: string; name_vi: string; value: number } | null;
  business?: { name: string; value: number; income: number } | null;
  education_fund?: { name: string; name_vi: string; value: number } | null;
  luxury_items?: Array<{ name: string; value: number }>;
}

export interface Character {
  id: number;
  name: string;
  gender: string;
  background: string;
  age: number;
  money: number;
  health: number;
  happiness: number;
  flags: Record<string, unknown>;
  seen_event_ids: number[];
  family: Family;
  job: Job;
  assets: Assets;
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
  set_flags: Record<string, unknown> | null;
  next_event_id: number | null;
  i18n_key?: string;
}

export interface Choice {
  id: number;
  event_id: number;
  content_en: string;
  content_vi?: string;
  display_conditions: Record<string, unknown> | null;
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

export interface TurnSummaryItem {
  key: string;
  stat: string;
  value: number;
  message_en: string;
  message_vi: string;
}

export interface UpdateCharacterResult {
  character: Character;
  turn_summary: TurnSummaryItem[];
}

export interface ActionResult {
  success: boolean;
  message_en: string;
  message_vi: string;
  stat_changes?: Record<string, number>;
}

export interface CreateCharacterParams {
  name: string;
  gender: 'male' | 'female';
  background: 'poor' | 'middle' | 'rich';
}

export type GamePhase =
  | 'start'
  | 'create_character'
  | 'event'
  | 'rolling'
  | 'outcome'
  | 'turn_summary'
  | 'gameover';
