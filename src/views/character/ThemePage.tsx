// src/views/character/ThemePage.tsx
import { Box, Text } from "@chakra-ui/react";
// NOTE: Path is correct per your setup.
import type { ThemeRow as SingleThemeRow } from "../SingleTheme";
import SingleTheme from "../SingleTheme";

type Def = { id: string; name: string };

type ThemeRow = SingleThemeRow; // keep shapes aligned with SingleTheme

type TagRow = {
  id: string;
  name: string;
  type: string | null;
  is_scratched: boolean;
  is_negative: boolean;
  theme_id: string | null;
  character_id: string | null;
  fellowship_id: string | null;
};

export default function ThemePage({
  // characterId,
  // n,
  theme,
  // tags, // kept for future use
  mightDefs,
  typeDefs,
  onDelete,
}: {
  characterId: string;
  n: number;
  theme: ThemeRow | null;
  tags: TagRow[];
  mightDefs: Def[];
  typeDefs: Def[];
  onDelete: (id: string) => Promise<void> | void;
}) {
  if (!theme) {
    return (
      <Box p={4}>
        <Text color="gray.500">No Theme assigned yet.</Text>
      </Box>
    );
  }

  return (
    <SingleTheme
      theme={theme}
      mightDefs={mightDefs}
      typeDefs={typeDefs}
      onDelete={onDelete}
    />
  );
}
