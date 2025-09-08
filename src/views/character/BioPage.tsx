import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import type { CharacterRow } from "../../types/types";

type Props = {
  character: CharacterRow;
  onLocalUpdate: (patch: Partial<CharacterRow>) => void; // keep SingleCharacter state in sync
};

type BioFieldKey =
  | "appearance"
  | "personality"
  | "background"
  | "relationships"
  | "aspirations"
  | "achievements";
// type BriefKey =
//   | "brief_trait_physical"
//   | "brief_trait_personality"
//   | "brief_race"
//   | "brief_class";

export default function BioPage({ character, onLocalUpdate }: Props) {
  const toast = useToast({
    duration: 1500,
    position: "top-right",
    isClosable: true,
  });
  const [busy, setBusy] = useState<boolean>(false);

  async function savePatch(patch: Partial<CharacterRow>) {
    setBusy(true);
    const { error } = await supabase
      .from("characters")
      .update(patch)
      .eq("id", character.id);
    setBusy(false);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }
    onLocalUpdate(patch);
    toast({ status: "success", title: "Saved" });
  }

  const brief =
    `${character.brief_trait_physical}, ${character.brief_trait_personality} ${character.brief_race} ${character.brief_class}`.trim();

  return (
    <Box p={2}>
      <Heading size="sm" mb={2}>
        Character Brief
      </Heading>
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
        gap={2}
        mb={2}
      >
        <Input
          size="sm"
          placeholder="Physical trait"
          value={character.brief_trait_physical}
          onChange={(e) =>
            onLocalUpdate({ brief_trait_physical: e.target.value })
          }
          onBlur={(e) =>
            void savePatch({ brief_trait_physical: e.target.value })
          }
          isDisabled={busy}
        />
        <Input
          size="sm"
          placeholder="Personality trait"
          value={character.brief_trait_personality}
          onChange={(e) =>
            onLocalUpdate({ brief_trait_personality: e.target.value })
          }
          onBlur={(e) =>
            void savePatch({ brief_trait_personality: e.target.value })
          }
          isDisabled={busy}
        />
        <Input
          size="sm"
          placeholder="Species"
          value={character.brief_race}
          onChange={(e) => onLocalUpdate({ brief_race: e.target.value })}
          onBlur={(e) => void savePatch({ brief_race: e.target.value })}
          isDisabled={busy}
        />
        <Input
          size="sm"
          placeholder="Class or Career"
          value={character.brief_class}
          onChange={(e) => onLocalUpdate({ brief_class: e.target.value })}
          onBlur={(e) => void savePatch({ brief_class: e.target.value })}
          isDisabled={busy}
        />
      </Grid>

      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" color="gray.600">
          Preview
        </Text>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => navigator.clipboard.writeText(brief)}
        >
          Copy
        </Button>
      </HStack>
      <Box p={2} borderWidth="1px" rounded="md" mb={3}>
        <Text fontSize="sm">{brief || "—"}</Text>
      </Box>

      <Heading size="sm" mb={2}>
        Details
      </Heading>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={2}>
        {(
          [
            ["appearance", "Appearance"],
            ["personality", "Personality"],
            ["background", "Background"],
            ["relationships", "Relationships"],
            ["aspirations", "Aspirations"],
            ["achievements", "Achievements"],
          ] as [BioFieldKey, string][]
        ).map(([key, label]) => (
          <GridItem key={key}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              {label}
            </Text>
            <Textarea
              size="sm"
              rows={5}
              value={character[key]}
              onChange={(e) =>
                onLocalUpdate({
                  [key]: e.target.value,
                } as Partial<CharacterRow>)
              }
              onBlur={(e) =>
                void savePatch({
                  [key]: e.target.value,
                } as Partial<CharacterRow>)
              }
              isDisabled={busy}
              bg="white"
            />
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
}
