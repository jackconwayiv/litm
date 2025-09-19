import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { CharacterRow } from "../../types/types";

type Props = {
  character: CharacterRow;
  onLocalUpdate: (patch: Partial<CharacterRow>) => void;
};

type BioFieldKey =
  | "appearance"
  | "personality"
  | "background"
  | "relationships"
  | "aspirations"
  | "achievements";

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

  // Clean brief: avoid stray commas/spaces when some fields are empty
  const brief = useMemo(() => {
    const parts: string[] = [];
    const phys = character.brief_trait_physical?.trim();
    const pers = character.brief_trait_personality?.trim();
    const race = character.brief_race?.trim();
    const cls = character.brief_class?.trim();

    const left = [phys, pers].filter(Boolean).join(", ");
    const right = [race, cls].filter(Boolean).join(" ");

    if (left) parts.push(left);
    if (right) parts.push(right);

    return parts.join(" ").trim();
  }, [
    character.brief_trait_physical,
    character.brief_trait_personality,
    character.brief_race,
    character.brief_class,
  ]);

  return (
    <Box p={{ base: 2, md: 3 }} w="full" maxW="100%" overflowX="hidden">
      <Heading size="sm" mb={{ base: 2, md: 2 }}>
        Character Brief
      </Heading>

      {/* Brief Inputs */}
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
        gap={{ base: 2, md: 2 }}
        mb={{ base: 2, md: 2 }}
        w="full"
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
          minW={0}
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
          minW={0}
        />
        <Input
          size="sm"
          placeholder="Species"
          value={character.brief_race}
          onChange={(e) => onLocalUpdate({ brief_race: e.target.value })}
          onBlur={(e) => void savePatch({ brief_race: e.target.value })}
          isDisabled={busy}
          minW={0}
        />
        <Input
          size="sm"
          placeholder="Class or Career"
          value={character.brief_class}
          onChange={(e) => onLocalUpdate({ brief_class: e.target.value })}
          onBlur={(e) => void savePatch({ brief_class: e.target.value })}
          isDisabled={busy}
          minW={0}
        />
      </Grid>

      {/* Preview row */}
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        mb={{ base: 2, md: 2 }}
        spacing={{ base: 1, md: 2 }}
        w="full"
      >
        <Text fontSize="sm" color="gray.600">
          Preview
        </Text>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => void navigator.clipboard.writeText(brief || "")}
          alignSelf={{ base: "flex-start", md: "auto" }}
        >
          Copy
        </Button>
      </Stack>

      <Box
        p={{ base: 2, md: 2 }}
        borderWidth="1px"
        rounded="md"
        mb={{ base: 3, md: 3 }}
      >
        <Text fontSize="sm" whiteSpace="pre-wrap">
          {brief || "—"}
        </Text>
      </Box>

      <Heading size="sm" mb={{ base: 2, md: 2 }}>
        Details
      </Heading>

      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={{ base: 2, md: 3 }}
        w="full"
      >
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
          <GridItem key={key} minW={0}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              {label}
            </Text>
            <Textarea
              size="sm"
              rows={5}
              value={character[key] ?? ""}
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
              resize="vertical"
              minW={0}
            />
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
}
