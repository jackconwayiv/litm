// src/views/SingleStatus.tsx
import { DeleteIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Checkbox,
  HStack,
  IconButton,
  Input,
  Spinner,
  Switch,
  Text,
  Tooltip,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const TIER_NUMS = [1, 2, 3, 4, 5, 6] as const;
type TierNum = (typeof TIER_NUMS)[number];

const TIER_KEYS = {
  1: "tier1",
  2: "tier2",
  3: "tier3",
  4: "tier4",
  5: "tier5",
  6: "tier6",
} as const;
type TierKey = (typeof TIER_KEYS)[TierNum];

type StatusRowBase = {
  id: string;
  character_id: string | null;
  name: string;
  is_negative: boolean;
  created_at?: string;
};

type StatusRow = StatusRowBase & Record<TierKey, boolean>;

export default function SingleStatus({
  statusId,
  onDeleted,
}: {
  statusId: string;
  onDeleted?: (id: string) => void;
}) {
  const toast = useToast();
  const [row, setRow] = useState<StatusRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState<string>("");

  const highestActiveTier = useMemo(() => {
    if (!row) return 0;
    for (const n of [...TIER_NUMS].reverse()) {
      const key = TIER_KEYS[n];
      if (row[key]) return n;
    }
    return 0;
  }, [row]);

  const fetchRow = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("id", statusId)
      .single();
    if (error) {
      toast({
        status: "error",
        title: "Load failed",
        description: error.message,
      });
      setLoading(false);
      return;
    }
    const r = data as StatusRow;
    setRow(r);
    setNameDraft(r.name);
    setLoading(false);
  }, [statusId, toast]);

  useEffect(() => {
    fetchRow();
  }, [fetchRow]);

  const patch = async (patchData: Partial<StatusRow>) => {
    if (!row) return;
    setSaving(true);
    const optimistic = { ...row, ...patchData };
    setRow(optimistic);
    const { error } = await supabase
      .from("statuses")
      .update(patchData)
      .eq("id", row.id);
    if (error) {
      toast({
        status: "error",
        title: "Save failed",
        description: error.message,
      });
      await fetchRow();
    }
    setSaving(false);
  };

  const patchKey = async <K extends keyof StatusRow>(
    key: K,
    value: StatusRow[K]
  ) => {
    if (!row) return;
    await patch({ [key]: value } as Pick<StatusRow, K>);
  };

  const toggleTier = async (n: TierNum) => {
    if (!row) return;
    const key = TIER_KEYS[n];
    await patchKey(key, !row[key]);
  };

  const saveNameIfChanged = async () => {
    if (!row) return;
    const next = nameDraft.trim();
    if (next !== row.name) await patch({ name: next });
  };

  const toggleNegative = async () => {
    if (!row) return;
    await patch({ is_negative: !row.is_negative });
  };

  const remove = async () => {
    if (!row) return;
    const { error } = await supabase.from("statuses").delete().eq("id", row.id);
    if (error) {
      toast({
        status: "error",
        title: "Delete failed",
        description: error.message,
      });
    } else {
      onDeleted?.(row.id);
    }
  };

  if (loading || !row) return <Spinner size="sm" />;

  return (
    <Box
      p={{ base: 2, md: 3 }}
      borderWidth="1px"
      rounded="lg"
      w="full"
      maxW="100%"
      overflowX="hidden"
      bgColor={row.is_negative ? "red.50" : "green.50"}
    >
      <VStack align="start" spacing={{ base: 2, md: 3 }} w="full" minW={0}>
        {/* Header row: badge, name input, delete */}
        <HStack w="full" minW={0} spacing={{ base: 2, md: 3 }}>
          <Badge
            colorScheme={highestActiveTier ? "purple" : "gray"}
            flexShrink={0}
          >
            Tier {highestActiveTier}
          </Badge>
          <Input
            size="sm"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveNameIfChanged}
            bgColor="white"
            flex="1 1 0"
            minW={0}
          />
          <Tooltip label="Delete status">
            <IconButton
              aria-label="Delete"
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={remove}
              isLoading={saving}
              flexShrink={0}
            />
          </Tooltip>
        </HStack>

        {/* Negative toggle */}
        <HStack spacing={2}>
          <Switch
            isChecked={row.is_negative}
            onChange={toggleNegative}
            size="sm"
          />
          <Text m={0} fontSize="xs">
            Negative
          </Text>
        </HStack>

        {/* Tiers: wrap on mobile */}
        <Wrap spacing={{ base: 2, md: 3 }}>
          {TIER_NUMS.map((n) => {
            const key = TIER_KEYS[n];
            return (
              <WrapItem key={n}>
                <HStack spacing={1}>
                  <Tooltip label={`Tier ${n}`}>
                    <Checkbox
                      isChecked={row[key]}
                      onChange={() => toggleTier(n)}
                      size="sm"
                      bgColor="white"
                    />
                  </Tooltip>
                  <Text fontSize="sm">{n}</Text>
                </HStack>
              </WrapItem>
            );
          })}
        </Wrap>
      </VStack>
    </Box>
  );
}
