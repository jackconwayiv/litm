// src/components/character/BioPage.tsx
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { CharacterRow } from "../../types/types";

type BioFieldKey =
  | "appearance"
  | "personality"
  | "background"
  | "relationships"
  | "aspirations"
  | "achievements";

type BriefKey =
  | "brief_trait_physical"
  | "brief_trait_personality"
  | "brief_race"
  | "brief_class";

type SavingKey = BriefKey | BioFieldKey | "brief_all" | "details_all" | null;

type DetailBlockProps = {
  keyName: BioFieldKey;
  label: string;
  rows?: number;
  editDetailsAll: boolean;
  savingKey: SavingKey;
  busy: boolean;
  value: string;
  draft: string;
  setDraftDetail: React.Dispatch<
    React.SetStateAction<Record<BioFieldKey, string>>
  >;
};

const DetailBlock = React.memo(function DetailBlock({
  keyName,
  label,
  rows = 5,
  editDetailsAll,
  savingKey,
  busy,
  value,
  draft,
  setDraftDetail,
}: DetailBlockProps) {
  // Hide if empty and not editing
  if (!editDetailsAll && !value) return null;

  return (
    <GridItem minW={0}>
      <Text fontSize="xs" color="gray.600" mb={1}>
        {label}
      </Text>

      <Box p={2} borderWidth="1px" rounded="md">
        {editDetailsAll ? (
          <Textarea
            size="sm"
            rows={rows}
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDraftDetail((s) => ({ ...s, [keyName]: e.target.value }))
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Escape") {
                setDraftDetail((s) => ({ ...s, [keyName]: value }));
              }
            }}
            isDisabled={busy && savingKey === "details_all"}
            bg="white"
            resize="vertical"
            minW={0}
          />
        ) : (
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {value}
          </Text>
        )}
      </Box>
    </GridItem>
  );
});

type Props = {
  character: CharacterRow;
  onLocalUpdate: (patch: Partial<CharacterRow>) => void;
};

export default function BioPage({ character, onLocalUpdate }: Props) {
  const toast = useToast({
    duration: 1500,
    position: "top-right",
    isClosable: true,
  });

  const [busy, setBusy] = useState(false);
  const [savingKey, setSavingKey] = useState<SavingKey>(null);

  // Brief: single toggle edits all 4 inputs
  const [editBriefAll, setEditBriefAll] = useState(false);
  // Details: single toggle edits all detail sections at once
  const [editDetailsAll, setEditDetailsAll] = useState(false);

  // Draft values while editing
  const [draftBrief, setDraftBrief] = useState<Record<BriefKey, string>>({
    brief_trait_physical: character.brief_trait_physical ?? "",
    brief_trait_personality: character.brief_trait_personality ?? "",
    brief_race: character.brief_race ?? "",
    brief_class: character.brief_class ?? "",
  });
  const [draftDetail, setDraftDetail] = useState<Record<BioFieldKey, string>>({
    appearance: character.appearance ?? "",
    personality: character.personality ?? "",
    background: character.background ?? "",
    relationships: character.relationships ?? "",
    aspirations: character.aspirations ?? "",
    achievements: character.achievements ?? "",
  });

  useEffect(() => {
    setDraftBrief({
      brief_trait_physical: character.brief_trait_physical ?? "",
      brief_trait_personality: character.brief_trait_personality ?? "",
      brief_race: character.brief_race ?? "",
      brief_class: character.brief_class ?? "",
    });
    setDraftDetail({
      appearance: character.appearance ?? "",
      personality: character.personality ?? "",
      background: character.background ?? "",
      relationships: character.relationships ?? "",
      aspirations: character.aspirations ?? "",
      achievements: character.achievements ?? "",
    });
    setEditBriefAll(false);
    setEditDetailsAll(false);
  }, [character]);

  async function savePatch(patch: Partial<CharacterRow>, key: SavingKey) {
    setBusy(true);
    setSavingKey(key);
    const { error } = await supabase
      .from("characters")
      .update(patch)
      .eq("id", character.id);
    setBusy(false);
    setSavingKey(null);
    if (error) {
      toast({ status: "error", title: error.message });
      return false;
    }
    onLocalUpdate(patch);
    toast({ status: "success", title: "Saved" });
    return true;
  }

  const brief = useMemo(() => {
    const parts: string[] = [];
    const phys = (character.brief_trait_physical ?? "").trim();
    const pers = (character.brief_trait_personality ?? "").trim();
    const race = (character.brief_race ?? "").trim();
    const cls = (character.brief_class ?? "").trim();
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

  async function saveBriefAll() {
    const ok = await savePatch(
      {
        brief_trait_physical: draftBrief.brief_trait_physical,
        brief_trait_personality: draftBrief.brief_trait_personality,
        brief_race: draftBrief.brief_race,
        brief_class: draftBrief.brief_class,
      },
      "brief_all"
    );
    if (ok) setEditBriefAll(false);
  }
  function cancelBriefAll() {
    setDraftBrief({
      brief_trait_physical: character.brief_trait_physical ?? "",
      brief_trait_personality: character.brief_trait_personality ?? "",
      brief_race: character.brief_race ?? "",
      brief_class: character.brief_class ?? "",
    });
    setEditBriefAll(false);
  }

  async function saveDetailsAll() {
    const ok = await savePatch(
      {
        appearance: draftDetail.appearance,
        personality: draftDetail.personality,
        background: draftDetail.background,
        relationships: draftDetail.relationships,
        aspirations: draftDetail.aspirations,
        achievements: draftDetail.achievements,
      },
      "details_all"
    );
    if (ok) setEditDetailsAll(false);
  }
  function cancelDetailsAll() {
    setDraftDetail({
      appearance: character.appearance ?? "",
      personality: character.personality ?? "",
      background: character.background ?? "",
      relationships: character.relationships ?? "",
      aspirations: character.aspirations ?? "",
      achievements: character.achievements ?? "",
    });
    setEditDetailsAll(false);
  }

  return (
    <Box p={{ base: 2, md: 3 }} w="full" maxW="100%" overflowX="hidden">
      {/* Character Brief header with inline Edit/Save/Cancel */}
      <HStack justify="space-between" align="center" mb={{ base: 2, md: 2 }}>
        <Heading size="sm">Character Brief</Heading>
        {!editBriefAll ? (
          <IconButton
            aria-label="Edit Character Brief"
            icon={<EditIcon />}
            size="xs"
            variant="ghost"
            onClick={() => setEditBriefAll(true)}
            isDisabled={busy}
          />
        ) : (
          <HStack spacing={1}>
            <IconButton
              aria-label="Save brief"
              icon={<CheckIcon />}
              size="sm"
              colorScheme="teal"
              onClick={() => void saveBriefAll()}
              isLoading={savingKey === "brief_all"}
            />
            <IconButton
              aria-label="Cancel brief edits"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={cancelBriefAll}
              isDisabled={busy && savingKey === "brief_all"}
            />
          </HStack>
        )}
      </HStack>

      {/* Brief: inputs when editing; otherwise assembled line */}
      {!editBriefAll ? (
        <Box p={2} borderWidth="1px" rounded="md" mb={{ base: 3, md: 3 }}>
          <Text
            fontSize="sm"
            whiteSpace="pre-wrap"
            color={brief ? "inherit" : "gray.400"}
          >
            {brief || "Add brief traits via Edit."}
          </Text>
        </Box>
      ) : (
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
          gap={{ base: 2, md: 2 }}
          mb={{ base: 3, md: 3 }}
        >
          <Input
            size="sm"
            placeholder="Physical trait"
            value={draftBrief.brief_trait_physical}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftBrief((s) => ({
                ...s,
                brief_trait_physical: e.target.value,
              }))
            }
            isDisabled={busy && savingKey === "brief_all"}
            minW={0}
          />
          <Input
            size="sm"
            placeholder="Personality trait"
            value={draftBrief.brief_trait_personality}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftBrief((s) => ({
                ...s,
                brief_trait_personality: e.target.value,
              }))
            }
            isDisabled={busy && savingKey === "brief_all"}
            minW={0}
          />
          <Input
            size="sm"
            placeholder="Species"
            value={draftBrief.brief_race}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftBrief((s) => ({ ...s, brief_race: e.target.value }))
            }
            isDisabled={busy && savingKey === "brief_all"}
            minW={0}
          />
          <Input
            size="sm"
            placeholder="Class or Career"
            value={draftBrief.brief_class}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraftBrief((s) => ({ ...s, brief_class: e.target.value }))
            }
            isDisabled={busy && savingKey === "brief_all"}
            minW={0}
          />
        </Grid>
      )}

      {/* Details header with single global Edit/Save/Cancel */}
      <HStack justify="space-between" align="center" mb={{ base: 2, md: 2 }}>
        <Heading size="sm">Details</Heading>
        {!editDetailsAll ? (
          <IconButton
            aria-label="Edit Details"
            icon={<EditIcon />}
            size="xs"
            variant="ghost"
            onClick={() => setEditDetailsAll(true)}
            isDisabled={busy}
          />
        ) : (
          <HStack spacing={1}>
            <IconButton
              aria-label="Save details"
              icon={<CheckIcon />}
              size="sm"
              colorScheme="teal"
              onClick={() => void saveDetailsAll()}
              isLoading={savingKey === "details_all"}
            />
            <IconButton
              aria-label="Cancel details edits"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={cancelDetailsAll}
              isDisabled={busy && savingKey === "details_all"}
            />
          </HStack>
        )}
      </HStack>

      {/* Detail sections — hidden when empty unless editing */}
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={{ base: 2, md: 3 }}
        w="full"
      >
        <DetailBlock
          keyName="appearance"
          label="Appearance"
          rows={5}
          editDetailsAll={editDetailsAll}
          savingKey={savingKey}
          busy={busy}
          value={character.appearance ?? ""}
          draft={draftDetail.appearance}
          setDraftDetail={setDraftDetail}
        />
        <DetailBlock
          keyName="personality"
          label="Personality"
          rows={5}
          editDetailsAll={editDetailsAll}
          savingKey={savingKey}
          busy={busy}
          value={character.personality ?? ""}
          draft={draftDetail.personality}
          setDraftDetail={setDraftDetail}
        />
        <DetailBlock
          keyName="background"
          label="Background"
          rows={5}
          editDetailsAll={editDetailsAll}
          savingKey={savingKey}
          busy={busy}
          value={character.background ?? ""}
          draft={draftDetail.background}
          setDraftDetail={setDraftDetail}
        />
        <DetailBlock
          keyName="relationships"
          label="Relationships"
          rows={5}
          editDetailsAll={editDetailsAll}
          savingKey={savingKey}
          busy={busy}
          value={character.relationships ?? ""}
          draft={draftDetail.relationships}
          setDraftDetail={setDraftDetail}
        />
        <DetailBlock
          keyName="aspirations"
          label="Aspirations"
          rows={5}
          editDetailsAll={editDetailsAll}
          savingKey={savingKey}
          busy={busy}
          value={character.aspirations ?? ""}
          draft={draftDetail.aspirations}
          setDraftDetail={setDraftDetail}
        />
        <DetailBlock
          keyName="achievements"
          label="Achievements"
          rows={5}
          editDetailsAll={editDetailsAll}
          savingKey={savingKey}
          busy={busy}
          value={character.achievements ?? ""}
          draft={draftDetail.achievements}
          setDraftDetail={setDraftDetail}
        />
      </Grid>
    </Box>
  );
}
