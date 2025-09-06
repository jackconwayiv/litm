export type Adventure = {
  id: string;
  name: string;
  subscribe_code: string | null;
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
