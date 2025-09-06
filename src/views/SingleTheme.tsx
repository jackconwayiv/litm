// src/components/SingleTheme.tsx
import {
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
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
import { useState } from "react";
import {
  GiCrossedSwords,
  GiCrown,
  GiThreeLeaves,
  GiTripleScratches,
} from "react-icons/gi";
import { supabase } from "../lib/supabase";

type Def = { id: string; name: string };
export type ThemeRow = {
  id: string;
  name: string;
  quest: string | null;
  improve: number;
  abandon: number;
  milestone: number;
  is_retired: boolean;
  is_scratched: boolean;
  might_level_id: string;
  type_id: string;
};

export default function SingleTheme({
  theme,
  mightDefs,
  typeDefs,
  onDelete,
}: {
  theme: ThemeRow;
  mightDefs: Def[];
  typeDefs: Def[];
  onChanged: () => void;
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
    setLocal(next); // optimistic UI
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
      setLocal(prev); // rollback
      return toast({ status: "error", title: error.message });
    }
    // no onChanged() here; realtime or parent will keep in sync without flicker
  }
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(local.name);
  const [editingTypes, setEditingTypes] = useState(false);
  const [editingQuest, setEditingQuest] = useState(false);
  const [tempQuest, setTempQuest] = useState(local.quest ?? "");
  const [deleting, setDeleting] = useState(false);

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

  return (
    <Box
      borderWidth="1px"
      rounded="lg"
      p={4}
      shadow="sm"
      w="full"
      bg={bgColor}
      opacity={deleting ? 0.6 : 1}
      pointerEvents={deleting ? "none" : "auto"}
    >
      <VStack align="stretch" spacing={2}>
        {/* Theme types */}
        <HStack justify="space-between" align="center" w="full">
          {editingTypes ? (
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={2}
              flex="1"
            >
              <Select
                value={local.type_id}
                bgColor="white"
                onChange={(e) => void save({ type_id: e.target.value })}
                size="sm"
                isDisabled={saving}
              >
                {typeDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select
                value={local.might_level_id}
                onChange={(e) => void save({ might_level_id: e.target.value })}
                size="sm"
                bgColor="white"
                isDisabled={saving}
              >
                {mightDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Stack>
          ) : (
            <HStack flex="1" spacing={3}>
              {(() => {
                const mightName = mightDefs.find(
                  (d) => d.id === local.might_level_id
                )?.name;
                const MightIcon =
                  mightName === "Origin"
                    ? GiThreeLeaves
                    : mightName === "Adventure"
                    ? GiCrossedSwords
                    : mightName === "Greatness"
                    ? GiCrown
                    : null;
                return (
                  <>
                    {MightIcon && <Icon as={MightIcon} boxSize={5} />}
                    <Text>
                      Theme:{" "}
                      {typeDefs.find((d) => d.id === local.type_id)?.name ||
                        "Unknown Type"}
                    </Text>
                  </>
                );
              })()}
            </HStack>
          )}

          <Tooltip label="Edit theme type & might">
            <IconButton
              aria-label="Edit type/might"
              icon={<SettingsIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setEditingTypes(!editingTypes)}
              isDisabled={saving}
            />
          </Tooltip>
        </HStack>
        <Divider />
        {/* Name */}
        <HStack justify="space-between" align="center">
          <Tooltip label="Toggle scratched">
            <IconButton
              aria-label="Toggle scratched"
              icon={<GiTripleScratches />}
              variant="ghost"
              size="sm"
              colorScheme={local.is_scratched ? "red" : "gray"}
              isDisabled={saving}
              onClick={() => void save({ is_scratched: !local.is_scratched })}
            />
          </Tooltip>
          {editing ? (
            <HStack flex="1">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                isDisabled={saving}
                bgColor="white"
                fontWeight="bold"
                autoFocus
              />
              <IconButton
                aria-label="Save name"
                icon={<CheckIcon />}
                size="sm"
                colorScheme="teal"
                onClick={async () => {
                  if (tempName.trim() !== local.name) {
                    await save({ name: tempName.trim() });
                  }
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
              flex="1"
              fontWeight="bold"
              color={local.is_scratched ? "red" : "black"}
              textDecoration={local.is_scratched ? "line-through" : "none"}
            >
              {local.name || "Untitled Theme"}
            </Text>
          )}

          <HStack>
            {!editing && (
              <Tooltip label="Edit theme name">
                <IconButton
                  aria-label="Edit"
                  icon={<SettingsIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTempName(local.name);
                    setEditing(true);
                  }}
                  isDisabled={saving}
                />
              </Tooltip>
            )}
          </HStack>
        </HStack>

        {/* Tags placeholder */}
        <Box
          borderWidth="1px"
          borderStyle="dashed"
          rounded="md"
          p={2}
          minH="64px"
          bg="gray.50"
        >
          <Text fontSize="sm" color="gray.600">
            Tags will render here
          </Text>
        </Box>

        {/* Quest field */}
        <Text fontWeight="bold">Quest:</Text>
        <HStack
          align="start"
          justify="space-between"
          w="full"
          bgColor="white"
          p={1}
        >
          {editingQuest ? (
            <VStack align="stretch" flex="1">
              <Input
                placeholder="Quest…"
                size="sm"
                minH="64px"
                bgColor="white"
                value={tempQuest}
                onChange={(e) => setTempQuest(e.target.value)}
                isDisabled={saving}
                autoFocus
              />
              <HStack>
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
            <Text flex="1" minH="64px">
              {local.quest && local.quest.trim().length > 0
                ? local.quest
                : "No quest set"}
            </Text>
          )}

          <Tooltip label="Edit quest">
            <IconButton
              aria-label="Edit quest"
              icon={<SettingsIcon />}
              size="sm"
              variant="ghost"
              onClick={() => {
                setTempQuest(local.quest ?? "");
                setEditingQuest(!editingQuest);
              }}
              isDisabled={saving}
            />
          </Tooltip>
        </HStack>

        <Divider />

        {/* Middle: improve / abandon / milestone controls (3 checkboxes each) */}
        <VStack align="stretch" spacing={3}>
          {[
            { key: "improve" as const, label: "Improve" },
            { key: "abandon" as const, label: "Abandon" },
            { key: "milestone" as const, label: "Milestone" },
          ].map(({ key, label }) => (
            <HStack key={key} justify="space-between">
              <Text w="96px">{label}</Text>
              <HStack>
                {[1, 2, 3].map((i) => {
                  const checked = i <= local[key];
                  return (
                    <Checkbox
                      key={i}
                      isChecked={checked}
                      onChange={() => {
                        const next = checked ? i - 1 : i;
                        // construct a partial ThemeRow with an index signature
                        const update: Partial<ThemeRow> = {
                          [key]: next,
                        } as Pick<ThemeRow, typeof key>;
                        void save(update);
                      }}
                    />
                  );
                })}
              </HStack>
            </HStack>
          ))}
        </VStack>

        <Divider />

        {/* Bottom: actions */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={2}
          justify="space-between"
        >
          {/* <Button
            size="sm"
            variant={local.is_retired ? "solid" : "outline"}
            colorScheme="purple"
            onClick={() => void save({ is_retired: !local.is_retired })}
            isDisabled={saving}
          >
            {local.is_retired ? "Un-Retire" : "Retire"}
          </Button> */}

          <Tooltip label="Delete theme">
            <IconButton
              aria-label="Delete theme"
              icon={<DeleteIcon />}
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={onOpen}
              isDisabled={saving}
            />
          </Tooltip>
        </Stack>
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete theme?</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Are you sure you want to delete this theme?</Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                isLoading={deleting}
                onClick={async () => {
                  try {
                    setDeleting(true);
                    await onDelete(local.id); // wait for parent to delete + reload
                    toast({ status: "success", title: "Theme deleted" });
                    onClose();
                  } catch (e: unknown) {
                    if (e instanceof Error) {
                      toast({ status: "error", title: e.message });
                    } else {
                      toast({ status: "error", title: "Delete failed" });
                    }
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
