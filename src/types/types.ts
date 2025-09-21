// Shared app types (no any)

export type TabKey =
  | "theme1"
  | "theme2"
  | "theme3"
  | "theme4"
  | "backpack"
  | "statuses"
  | "bio"
  | "fellowship";
export const TAB_ORDER: TabKey[] = [
  "theme1",
  "theme2",
  "theme3",
  "theme4",
  "backpack",
  "statuses",
  "bio",
];
export const isThemeTab = (k: TabKey) =>
  k === "theme1" || k === "theme2" || k === "theme3" || k === "theme4";

export const buildTabOrder = (showFellowship: boolean): TabKey[] =>
  showFellowship
    ? ([
        "theme1",
        "theme2",
        "theme3",
        "theme4",
        "fellowship",
        "backpack",
        "statuses",
        "bio",
      ] as TabKey[])
    : ([
        "theme1",
        "theme2",
        "theme3",
        "theme4",
        "backpack",
        "statuses",
        "bio",
      ] as TabKey[]);
export interface CharacterRow {
  id: string;
  name: string;
  player_id: string;
  fellowship_id: string | null;
  promise: number;

  // Bio
  appearance: string;
  personality: string;
  background: string;
  relationships: string;
  aspirations: string;
  achievements: string;

  // Character Brief
  brief_trait_physical: string;
  brief_trait_personality: string;
  brief_race: string;
  brief_class: string;
}

export interface ThemeRow {
  id: string;
  name: string;
  quest: string | null;
  improve: number;
  abandon: number;
  milestone: number;
  is_retired: boolean;
  is_scratched: boolean;
  might_level_id: string | null;
  type_id: string | null;
}

export interface TagRow {
  id: string;
  name: string;
  type: string | null;
  is_scratched: boolean;
  is_negative: boolean;
  theme_id: string | null;
  character_id: string | null;
  fellowship_id: string | null;
}

export interface StatusRow {
  id: string;
  name: string;
  tier: number;
  is_negative: boolean;
  character_id: string | null;
  fellowship_id: string | null;
  adventure_id: string | null;
}

export interface CharacterQuintessence {
  quintessence_id: string;
  name: string;
}

export interface Def {
  id: string;
  name: string;
}

export interface JoinedAdventure {
  id: string; // adventure id or ""
  name: string; // adventure name or ""
  subscribe_code: string; // "" if none
  fellowship_id: string;
  fellowship_name: string; // fellowships.name
}

export interface Loaded {
  character: CharacterRow;
  themes: ThemeRow[];
  tags: TagRow[];
  statuses: StatusRow[];
  quintessences: CharacterQuintessence[];
  mightDefs: Def[];
  typeDefs: Def[];
  joinedAdventure: JoinedAdventure | null;
}

export type Adventure = {
  id: string;
  name: string;
  subscribe_code: string;
  owner_player_id: string;
};

export type Fellowship = {
  id: string;
  name: string;
  adventure_id: string;
};

export type Character = {
  id: string;
  name: string;
  player_id: string;
  fellowship_id: string | null;
  promise: number;
  created_at: string;
};

export type Theme = {
  id: string;
  name: string;
  character_id: string | null;
  fellowship_id: string | null;
  quest: string | null;
  improve: number;
  abandon: number;
  milestone: number;
  is_retired: boolean;
};

export type Tag = {
  id: string;
  name: string;
  type: "Story" | "Power" | "Weakness" | "Fellowship" | "Single-Use";
  is_scratched: boolean;
  is_negative: boolean;
  theme_id: string | null;
  character_id: string | null;
  fellowship_id: string | null;
};

export type Status = {
  id: string;
  name: string;
  tier: number;
  is_negative: boolean;
  character_id: string | null;
  fellowship_id: string | null;
  adventure_id: string | null;
};

export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
};
