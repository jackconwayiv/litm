import { SettingsIcon } from "@chakra-ui/icons";
import {
  Button,
  HStack,
  Heading,
  IconButton,
  Input,
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
    <HStack py={1} justify="space-between">
      {editMode ? (
        <HStack w="full" gap={2}>
          <Input
            size="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            flex={1}
          />
          <Button
            size="sm"
            colorScheme="teal"
            isDisabled={!name.trim()}
            isLoading={busy}
            onClick={async () => {
              setBusy(true);
              await onRename(name.trim());
              setBusy(false);
              setEditMode(false);
            }}
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
        <HStack w="full" justify="space-between">
          <Heading size="md" noOfLines={1}>
            {character.name}
          </Heading>
          <IconButton
            aria-label="Edit character"
            icon={<SettingsIcon />}
            size="sm"
            variant="ghost"
            onClick={() => setEditMode(true)}
          />
        </HStack>
      )}

      {confirmDel ? (
        <HStack>
          <Text fontSize="xs">Confirm delete?</Text>
          <Button size="xs" colorScheme="red" onClick={onDelete}>
            Delete
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setConfirmDel(false)}
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
        >
          Delete
        </Button>
      )}
    </HStack>
  );
}
