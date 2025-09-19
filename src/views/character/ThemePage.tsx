// src/views/character/ThemePage.tsx
import { Box, Text } from "@chakra-ui/react";
import type { Def, TagRow, ThemeRow } from "../../types/types";
import SingleTheme from "../SingleTheme";

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
      <Box
        p={{ base: 2, md: 4 }}
        w="full"
        maxW="100%"
        overflowX="hidden"
        rounded="md"
      >
        <Text fontSize="sm" color="gray.500">
          No Theme assigned yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box w="full" maxW="100%" overflowX="hidden" minW={0}>
      <SingleTheme
        theme={theme}
        mightDefs={mightDefs}
        typeDefs={typeDefs}
        onDelete={onDelete}
      />
    </Box>
  );
}
