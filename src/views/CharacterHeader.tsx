import { DeleteIcon, EditIcon, SettingsIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  HStack,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { CharacterRow } from "../types/types";

type Props = {
  character: Pick<CharacterRow, "id" | "name">;
  onRename: (name: string) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  rightExtras?: React.ReactNode; // e.g., <PromiseStepper …/>
};

export default function CharacterHeader({
  character,
  onRename,
  onDelete,
  rightExtras,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(character.name);
  const [busyRename, setBusyRename] = useState(false);

  const [confirmDel, setConfirmDel] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(character.name), [character.name]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusyRename(true);
    await onRename(trimmed);
    setBusyRename(false);
    setEditMode(false);
  };

  const handleDelete = async () => {
    setBusyDelete(true);
    await onDelete();
    setBusyDelete(false);
    setConfirmDel(false);
  };

  return (
    <Box py={{ base: 1, md: 2 }}>
      {/* Top row: name (or inline editor), stepper, gear */}
      <HStack
        w="full"
        minW={0}
        spacing={{ base: 2, md: 3 }}
        align="center"
        flexWrap={{ base: "wrap", md: "nowrap" }}
      >
        {/* Name / Inline editor */}
        {editMode ? (
          <HStack
            spacing={2}
            flex={{ base: "1 1 100%", md: "1 1 auto" }}
            minW={{ base: "100%", md: "260px" }}
            maxW={{ base: "100%", md: "60%" }}
          >
            <Input
              ref={inputRef}
              size="sm"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setName(character.name);
                  setEditMode(false);
                }
              }}
              flex="1 1 0"
              minW={0}
              autoFocus
            />
            <Button
              size="sm"
              colorScheme="teal"
              isDisabled={!name.trim()}
              isLoading={busyRename}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setName(character.name);
                setEditMode(false);
              }}
            >
              Cancel
            </Button>
          </HStack>
        ) : (
          <Heading
            size="md"
            noOfLines={1}
            title={character.name}
            flex={{ base: "1 1 100%", md: "1 1 auto" }}
            minW={{ base: "100%", md: "220px" }}
            maxW={{ base: "100%", md: "60%" }}
          >
            {character.name}
          </Heading>
        )}

        <Spacer />

        {/* Inline extras (Promise stepper, etc.) */}
        {rightExtras && (
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            flexShrink={0}
            overflow="hidden"
          >
            {rightExtras}
          </Box>
        )}

        {/* Gear menu triggers inline actions */}
        <Menu placement="bottom-end" autoSelect={false}>
          <MenuButton
            as={IconButton}
            aria-label="Character options"
            icon={<SettingsIcon />}
            size="sm"
            variant="ghost"
            flexShrink={0}
          />
          <MenuList>
            <MenuItem
              icon={<EditIcon />}
              onClick={() => {
                setEditMode(true);
                setConfirmDel(false);
                // focus input next tick
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<DeleteIcon />} // trash can, only accessible via gear
              color="red.500"
              onClick={() => {
                setConfirmDel(true);
                setEditMode(false);
              }}
            >
              Delete Character
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Inline delete confirm row (appears only after choosing Delete from gear) */}
      {confirmDel && (
        <HStack
          mt={2}
          spacing={2}
          justify="flex-end"
          flexWrap={{ base: "wrap", md: "nowrap" }}
        >
          <Text fontSize="sm" color="gray.600">
            Are you sure you want to delete this character?
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDel(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            colorScheme="red"
            onClick={handleDelete}
            isLoading={busyDelete}
          >
            Delete
          </Button>
        </HStack>
      )}
    </Box>
  );
}
