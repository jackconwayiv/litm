//singleTheme.tsx
import { CheckIcon, CloseIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  GiCrossedSwords,
  GiCrown,
  GiThreeLeaves,
  GiTripleScratches,
} from "react-icons/gi";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { supabase } from "../lib/supabase";
import type { Def, ThemeRow } from "../types/types";
import PowerTags from "./PowerTags";

export default function SingleTheme({
  theme,
  mightDefs,
  typeDefs,
  onDelete,
}: {
  theme: ThemeRow;
  mightDefs: Def[];
  typeDefs: Def[];
  onDelete: (id: string) => void;
}) {
  const toast = useToast({
    position: "top-right",
    duration: 2200,
    isClosable: true,
  });
  const [local, setLocal] = useState(theme);
  const [saving, setSaving] = useState(false);

  async function save(partial: Partial<ThemeRow>) {
    const prev = local;
    const next = { ...local, ...partial };
    setLocal(next); // optimistic
    setSaving(true);
    const { error } = await supabase
      .from("themes")
      .update({
        name: next.name,
        quest: next.quest,
        improve: next.improve,
        abandon: next.abandon,
        milestone: next.milestone,
        is_retired: next.is_retired,
        is_scratched: next.is_scratched,
        might_level_id: next.might_level_id,
        type_id: next.type_id,
      })
      .eq("id", prev.id);
    setSaving(false);
    if (error) {
      setLocal(prev);
      return toast({ status: "error", title: error.message });
    }
  }

  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(local.name);
  const [editingTypes, setEditingTypes] = useState(false);
  const [editingQuest, setEditingQuest] = useState(false);
  const [tempQuest, setTempQuest] = useState(local.quest ?? "");
  const [deleting, setDeleting] = useState(false);
  const [editingPowerTags, setEditingPowerTags] = useState(false);
  const [editingWeaknessTags, setEditingWeaknessTags] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const mightName =
    mightDefs.find((d) => d.id === local.might_level_id)?.name ?? "";
  const bgColor =
    mightName === "Origin"
      ? "green.50"
      : mightName === "Adventure"
      ? "red.50"
      : mightName === "Greatness"
      ? "purple.50"
      : "white";

  useEffect(() => {
    if (!editingTypes) return;
    setLocal((prev) => {
      let next = prev;
      if (!prev.type_id && typeDefs.length > 0)
        next = { ...next, type_id: typeDefs[0].id };
      if (!prev.might_level_id && mightDefs.length > 0)
        next = { ...next, might_level_id: mightDefs[0].id };
      return next;
    });
  }, [editingTypes, typeDefs, mightDefs]);

  return (
    <Box
      borderWidth="1px"
      rounded="md"
      p={{ base: 2, md: 4 }}
      m={0}
      shadow="sm"
      w="full"
      bg={bgColor}
      opacity={deleting ? 0.6 : 1}
      pointerEvents={deleting ? "none" : "auto"}
      maxW="100%"
      overflowX="hidden"
    >
      <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
        {/* Theme types */}
        <HStack
          justify="space-between"
          align="center"
          w="full"
          minW={0}
          spacing={{ base: 2, md: 3 }}
        >
          {editingTypes ? (
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={{ base: 2, md: 3 }}
              flex="1 1 0"
              minW={0}
            >
              <Select
                value={local.type_id ?? ""}
                onChange={(e) => void save({ type_id: e.target.value || null })}
                size="sm"
                bgColor="white"
                isDisabled={saving}
                minW={0}
                flex="1 1 0"
              >
                <option value="" disabled>
                  Select type
                </option>
                {typeDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              <Select
                value={local.might_level_id ?? ""}
                onChange={(e) =>
                  void save({ might_level_id: e.target.value || null })
                }
                size="sm"
                bgColor="white"
                isDisabled={saving}
                minW={0}
                flex="1 1 0"
              >
                <option value="" disabled>
                  Select might
                </option>
                {mightDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Stack>
          ) : (
            <HStack flex="1 1 0" spacing={{ base: 2, md: 3 }} minW={0}>
              {(() => {
                const label =
                  typeDefs.find((d) => d.id === local.type_id)?.name ||
                  "Unknown Type";
                const mName = mightDefs.find(
                  (d) => d.id === local.might_level_id
                )?.name;
                const MightIcon =
                  mName === "Origin"
                    ? GiThreeLeaves
                    : mName === "Adventure"
                    ? GiCrossedSwords
                    : mName === "Greatness"
                    ? GiCrown
                    : null;
                return (
                  <>
                    {MightIcon && (
                      <Icon as={MightIcon} boxSize={5} flexShrink={0} />
                    )}
                    <Text noOfLines={1} title={label}>
                      Theme: {label}
                    </Text>
                  </>
                );
              })()}
            </HStack>
          )}

          <Tooltip label="Edit type & might">
            <IconButton
              aria-label="Edit type/might"
              icon={<IoIosArrowDropdownCircle />}
              size="sm"
              variant="ghost"
              onClick={() => setEditingTypes(!editingTypes)}
              isDisabled={saving}
              flexShrink={0}
            />
          </Tooltip>
        </HStack>

        <Divider my={{ base: 1, md: 2 }} />

        {/* Name */}
        <HStack
          justify="space-between"
          align="center"
          bgColor="yellow.50"
          p={{ base: 1, md: 2 }}
          rounded="sm"
        >
          <Tooltip label="Toggle scratched">
            <IconButton
              aria-label="Toggle scratched"
              icon={<GiTripleScratches />}
              variant="ghost"
              size="sm"
              colorScheme={local.is_scratched ? "red" : "gray"}
              isDisabled={saving}
              onClick={() => void save({ is_scratched: !local.is_scratched })}
              flexShrink={0}
            />
          </Tooltip>

          {editing ? (
            <HStack flex="1 1 0" minW={0} spacing={1}>
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                isDisabled={saving}
                bgColor="white"
                fontWeight="bold"
                autoFocus
                size="sm"
                minW={0}
                flex="1 1 0"
              />
              <IconButton
                aria-label="Save name"
                icon={<CheckIcon />}
                size="sm"
                colorScheme="teal"
                onClick={async () => {
                  if (tempName.trim() !== local.name)
                    await save({ name: tempName.trim() });
                  setEditing(false);
                }}
                isDisabled={saving}
              />
              <IconButton
                aria-label="Cancel"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTempName(local.name);
                  setEditing(false);
                }}
                isDisabled={saving}
              />
            </HStack>
          ) : (
            <Text
              flex="1 1 0"
              minW={0}
              fontWeight="bold"
              color={local.is_scratched ? "red.600" : "black"}
              textDecoration={local.is_scratched ? "line-through" : "none"}
              noOfLines={1}
              title={local.name || "Untitled Theme"}
            >
              {local.name || "Untitled Theme"}
            </Text>
          )}

          {!editing && (
            <Tooltip label="Edit theme name">
              <IconButton
                aria-label="Edit"
                icon={<IoIosArrowDropdownCircle />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTempName(local.name);
                  setEditing(true);
                }}
                isDisabled={saving}
                flexShrink={0}
              />
            </Tooltip>
          )}
        </HStack>

        {/* Power Tags section */}
        <HStack justify="space-between" align="center" minW={0}>
          <Text fontWeight="bold">Power Tags</Text>
          <Tooltip label={editingPowerTags ? "Done" : "Edit power tags"}>
            <IconButton
              aria-label="Edit power tags"
              icon={<IoIosArrowDropdownCircle />}
              size="sm"
              variant="ghost"
              onClick={() => setEditingPowerTags((v) => !v)}
              isDisabled={saving}
            />
          </Tooltip>
        </HStack>

        <PowerTags
          themeId={local.id}
          editing={editingPowerTags}
          tagType="Power"
          scratchable
        />

        <Divider mt={{ base: 1, md: 2 }} />

        {/* Weakness Tags section */}
        <HStack justify="space-between" align="center" minW={0}>
          <Text fontWeight="bold">Weakness Tags</Text>
          <Tooltip label={editingWeaknessTags ? "Done" : "Edit weakness tags"}>
            <IconButton
              aria-label="Edit weakness tags"
              icon={<IoIosArrowDropdownCircle />}
              size="sm"
              variant="ghost"
              onClick={() => setEditingWeaknessTags((v) => !v)}
              isDisabled={saving}
            />
          </Tooltip>
        </HStack>
        <PowerTags
          themeId={local.id}
          editing={editingWeaknessTags}
          tagType="Weakness"
          scratchable={false}
        />

        {/* Quest field */}
        <Text fontWeight="bold" mt={{ base: 1, md: 2 }}>
          Quest:
        </Text>
        <HStack
          align="start"
          justify="space-between"
          w="full"
          bgColor="white"
          p={{ base: 1, md: 2 }}
          rounded="sm"
          minW={0}
        >
          {editingQuest ? (
            <VStack align="stretch" flex="1 1 0" minW={0} spacing={2}>
              <Input
                placeholder="Quest…"
                size="sm"
                minH="48px"
                bgColor="white"
                value={tempQuest}
                onChange={(e) => setTempQuest(e.target.value)}
                isDisabled={saving}
                autoFocus
              />
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={async () => {
                    await save({ quest: tempQuest });
                    setEditingQuest(false);
                  }}
                  isDisabled={saving}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTempQuest(local.quest ?? "");
                    setEditingQuest(false);
                  }}
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          ) : (
            <Text flex="1 1 0" minW={0} minH="48px" whiteSpace="pre-wrap">
              {local.quest && local.quest.trim().length > 0
                ? local.quest
                : "No quest set"}
            </Text>
          )}

          <Tooltip label="Edit quest">
            <IconButton
              aria-label="Edit quest"
              icon={<IoIosArrowDropdownCircle />}
              size="sm"
              variant="ghost"
              onClick={() => {
                setTempQuest(local.quest ?? "");
                setEditingQuest(!editingQuest);
              }}
              isDisabled={saving}
              flexShrink={0}
            />
          </Tooltip>
        </HStack>

        <Divider my={{ base: 1, md: 2 }} />

        {/* Middle: improve / abandon / milestone controls */}
        <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
          {[
            { key: "improve" as const, label: "Improve" },
            { key: "abandon" as const, label: "Abandon" },
            { key: "milestone" as const, label: "Milestone" },
          ].map(({ key, label }) => (
            <HStack key={key} justify="space-between" minW={0}>
              <Text w="96px" fontSize="sm">
                {label}
              </Text>
              <HStack spacing={{ base: 2, md: 3 }}>
                {[1, 2, 3].map((i) => {
                  const checked = i <= local[key];
                  return (
                    <Checkbox
                      key={i}
                      bgColor="white"
                      isChecked={checked}
                      onChange={() => {
                        const next = checked ? i - 1 : i;
                        const update: Partial<ThemeRow> = {
                          [key]: next,
                        } as Pick<ThemeRow, typeof key>;
                        void save(update);
                      }}
                      size="sm"
                    />
                  );
                })}
              </HStack>
            </HStack>
          ))}
        </VStack>

        <Divider my={{ base: 1, md: 2 }} />

        {/* Bottom: actions */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={{ base: 2, md: 3 }}
          justify="flex-end"
        >
          <Tooltip label="Delete theme">
            <IconButton
              aria-label="Delete theme"
              icon={<DeleteIcon />}
              colorScheme="red"
              size="sm"
              onClick={onOpen}
              isDisabled={saving}
              alignSelf={{ base: "flex-end", md: "auto" }}
            />
          </Tooltip>
        </Stack>

        <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader pb={1}>Delete theme?</ModalHeader>
            <ModalCloseButton />
            <ModalBody pt={0}>
              <Text fontSize="sm">
                Are you sure you want to delete this theme?
              </Text>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" mr={1} onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                isLoading={deleting}
                size="sm"
                onClick={async () => {
                  try {
                    setDeleting(true);
                    await onDelete(local.id);
                    toast({ status: "success", title: "Theme deleted" });
                    onClose();
                  } catch (e: unknown) {
                    toast({
                      status: "error",
                      title: e instanceof Error ? e.message : "Delete failed",
                    });
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}
