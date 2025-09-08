import { Button, HStack, Input, Select, Text, VStack } from "@chakra-ui/react";
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
    <VStack align="stretch" p={2} borderWidth="1px" rounded="md" gap={2}>
      <Text fontSize="sm" fontWeight="semibold">
        Add Theme
      </Text>
      <Input
        size="sm"
        placeholder="Theme name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <HStack gap={2}>
        <Select
          size="sm"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
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
        >
          {orderedMight.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </HStack>
      <HStack justify="flex-end" gap={2}>
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
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
        >
          Create
        </Button>
      </HStack>
    </VStack>
  );
}
