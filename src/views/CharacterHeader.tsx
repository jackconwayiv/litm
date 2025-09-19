import { SettingsIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  HStack,
  Heading,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import type { CharacterRow } from "../types/types";

type Props = {
  character: CharacterRow;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export default function CharacterHeader({
  character,
  onRename,
  onDelete,
}: Props) {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [name, setName] = useState<string>(character.name);
  const [confirmDel, setConfirmDel] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      spacing={{ base: 2, md: 3 }}
      align={{ base: "stretch", md: "center" }}
      w="full"
      minW={0}
      py={{ base: 1, md: 2 }}
    >
      {/* Left: Name + edit */}
      {editMode ? (
        <HStack w="full" minW={0} spacing={{ base: 2, md: 3 }}>
          <Input
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && name.trim()) {
                setBusy(true);
                await onRename(name.trim());
                setBusy(false);
                setEditMode(false);
              }
            }}
            flex="1 1 0"
            minW={0}
          />
          <Button
            size={{ base: "sm", md: "sm" }}
            colorScheme="teal"
            isDisabled={!name.trim()}
            isLoading={busy}
            onClick={async () => {
              setBusy(true);
              await onRename(name.trim());
              setBusy(false);
              setEditMode(false);
            }}
            flexShrink={0}
          >
            Save
          </Button>
          <Button
            size={{ base: "sm", md: "sm" }}
            variant="ghost"
            onClick={() => {
              setName(character.name);
              setEditMode(false);
            }}
            flexShrink={0}
          >
            Cancel
          </Button>
        </HStack>
      ) : (
        <HStack
          w="full"
          minW={0}
          justify="space-between"
          spacing={{ base: 2, md: 3 }}
        >
          <Heading
            size="md"
            noOfLines={1}
            minW={0}
            flex="1 1 0"
            title={character.name}
          >
            {character.name}
          </Heading>
          <IconButton
            aria-label="Edit character name"
            icon={<SettingsIcon />}
            size="sm"
            variant="ghost"
            onClick={() => setEditMode(true)}
            flexShrink={0}
          />
        </HStack>
      )}

      {/* Right: Delete controls */}
      <Box>
        {confirmDel ? (
          <HStack spacing={{ base: 2, md: 2 }}>
            <Text fontSize="xs" whiteSpace="nowrap">
              Confirm delete?
            </Text>
            <Button
              size="xs"
              colorScheme="red"
              onClick={onDelete}
              flexShrink={0}
            >
              Delete
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setConfirmDel(false)}
              flexShrink={0}
            >
              Cancel
            </Button>
          </HStack>
        ) : (
          <Button
            size="xs"
            variant="outline"
            colorScheme="red"
            onClick={() => setConfirmDel(true)}
            alignSelf={{ base: "flex-start", md: "auto" }}
            flexShrink={0}
          >
            Delete
          </Button>
        )}
      </Box>
    </Stack>
  );
}
