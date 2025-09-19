import {
  Button,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import type { Def } from "../types/types";

type Props = {
  typeDefs: Def[];
  mightDefs: Def[];
  onCreate: (name: string, typeId: string, mightId: string) => Promise<void>;
  onCancel?: () => void;
};

export default function AddThemeInline({
  typeDefs,
  mightDefs,
  onCreate,
  onCancel,
}: Props) {
  const [name, setName] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [mightId, setMightId] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const orderedMight = useMemo(() => {
    const want = ["Origin", "Adventure", "Greatness"];
    const byName = new Map(mightDefs.map((d) => [d.name, d]));
    return want.map((n) => byName.get(n)).filter((d): d is Def => !!d);
  }, [mightDefs]);

  useEffect(() => {
    if (!typeId && typeDefs[0]) setTypeId(typeDefs[0].id);
    if (!mightId && orderedMight[0]) setMightId(orderedMight[0].id);
  }, [typeDefs, orderedMight, typeId, mightId]);

  return (
    <VStack
      align="stretch"
      p={{ base: 2, md: 3 }}
      borderWidth="1px"
      rounded="md"
      spacing={{ base: 2, md: 3 }}
      w="full"
      minW={0}
    >
      <Text fontSize="sm" fontWeight="semibold">
        Add Theme
      </Text>

      <Input
        size="sm"
        placeholder="Theme name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        flex="1 1 0"
        minW={0}
      />

      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 2, md: 2 }}
        w="full"
        minW={0}
      >
        <Select
          size="sm"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          flex="1 1 0"
          minW={0}
        >
          {typeDefs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>

        <Select
          size="sm"
          value={mightId}
          onChange={(e) => setMightId(e.target.value)}
          flex="1 1 0"
          minW={0}
        >
          {orderedMight.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Stack>

      <HStack justify="flex-end" spacing={2}>
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel} flexShrink={0}>
            Cancel
          </Button>
        ) : null}
        <Button
          size="sm"
          colorScheme="teal"
          isDisabled={!name.trim() || !typeId || !mightId}
          isLoading={busy}
          onClick={async () => {
            setBusy(true);
            await onCreate(name.trim(), typeId, mightId);
            setBusy(false);
          }}
          flexShrink={0}
        >
          Create
        </Button>
      </HStack>
    </VStack>
  );
}
