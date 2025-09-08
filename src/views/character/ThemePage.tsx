// src/views/character/ThemePage.tsx
import { Box, Text } from "@chakra-ui/react";
import type { Def, TagRow, ThemeRow } from "../../types/types";
import SingleTheme from "../SingleTheme";
// export type { ThemeRow } from "../../types/types";

export default function ThemePage({
  theme,
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
