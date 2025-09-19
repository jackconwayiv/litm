import { DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  Spinner,
  Stack,
  Switch,
  Text,
  Tooltip,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GiTripleScratches } from "react-icons/gi";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type BackpackTagType = "Story" | "Single-Use";

type TagRow = {
  id: string;
  character_id: string | null;
  theme_id: string | null;
  name: string;
  type: BackpackTagType | null;
  is_scratched: boolean;
  is_negative: boolean;
  scratched_at?: string | null;
  scratched_by_player_id?: string | null;
};

const TABLE = "tags";

export default function BackpackView({
  characterId: propId,
}: {
  characterId?: string;
}) {
  const { charId } = useParams<{ charId: string }>();
  const characterId = propId ?? charId;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TagRow[]>([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleUse, setSingleUse] = useState(false);

  const canSave = useMemo(
    () => !!characterId && newName.trim().length > 0 && !saving,
    [characterId, newName, saving]
  );

  const fetchRows = useCallback(async () => {
    if (!characterId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("character_id", characterId)
      .is("theme_id", null)
      .in("type", ["Story", "Single-Use"])
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as TagRow[]);
    }
    setLoading(false);
  }, [characterId]);

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    fetchRows();
  }, [characterId, fetchRows]);

  const addTag = useCallback(async () => {
    if (!characterId || !canSave) return;
    setSaving(true);
    const tagType: BackpackTagType = singleUse ? "Single-Use" : "Story";
    const insertPayload = {
      character_id: characterId,
      theme_id: null,
      name: newName.trim(),
      type: tagType,
      is_scratched: false,
      is_negative: false,
    };
    const { error } = await supabase.from(TABLE).insert(insertPayload);
    setSaving(false);
    if (error) {
      toast({
        status: "error",
        title: "Add failed",
        description: error.message,
      });
      return;
    }
    setNewName("");
    await fetchRows();
  }, [characterId, canSave, newName, singleUse, fetchRows, toast]);

  const toggleScratch = useCallback(
    async (row: TagRow) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ is_scratched: !row.is_scratched })
        .eq("id", row.id);
      if (error) {
        toast({
          status: "error",
          title: "Update failed",
          description: error.message,
        });
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, is_scratched: !row.is_scratched } : r
        )
      );
    },
    [toast]
  );

  const removeTag = useCallback(
    async (row: TagRow) => {
      const { error } = await supabase.from(TABLE).delete().eq("id", row.id);
      if (error) {
        toast({
          status: "error",
          title: "Delete failed",
          description: error.message,
        });
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    },
    [toast]
  );

  const storyRows = useMemo(
    () => rows.filter((r) => r.type === "Story"),
    [rows]
  );
  const singleUseRows = useMemo(
    () => rows.filter((r) => r.type === "Single-Use"),
    [rows]
  );

  return (
    <VStack align="stretch" spacing={{ base: 3, md: 4 }} w="full" minW={0}>
      <Box w="full" minW={0}>
        <Heading size="md" mb={{ base: 2, md: 3 }}>
          Backpack
        </Heading>

        {/* Add row */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={{ base: 2, md: 2 }}
          w="full"
          minW={0}
          align={{ base: "stretch", md: "center" }}
        >
          <Input
            placeholder="Add item…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) addTag();
            }}
            size="sm"
            flex="1 1 0"
            minW={0}
          />

          <HStack spacing={2} flexShrink={0}>
            <FormControl display="flex" alignItems="center">
              <Switch
                id="single-use"
                isChecked={singleUse}
                size="sm"
                onChange={(e) => setSingleUse(e.target.checked)}
              />
              <FormLabel
                htmlFor="single-use"
                mb="0"
                ml="2"
                mr="0"
                fontSize="xs"
              >
                1-Use
              </FormLabel>
            </FormControl>

            <Button
              colorScheme="teal"
              onClick={addTag}
              isDisabled={!canSave}
              isLoading={saving}
              size="sm"
              flexShrink={0}
            >
              +
            </Button>
          </HStack>
        </Stack>

        {error ? (
          <Alert status="error" mt={{ base: 2, md: 3 }}>
            <AlertIcon />
            {error}
          </Alert>
        ) : null}
      </Box>

      {singleUseRows.length > 0 && (
        <TagSection
          title="Single-Use Tags"
          rows={singleUseRows}
          onScratch={toggleScratch}
          onRemove={removeTag}
        />
      )}

      {storyRows.length > 0 && (
        <TagSection
          title="Story Tags"
          rows={storyRows}
          onScratch={toggleScratch}
          onRemove={removeTag}
        />
      )}

      {loading ? (
        <HStack spacing={2}>
          <Spinner size="sm" />
          <Text fontSize="sm">Loading Backpack…</Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

function TagSection({
  title,
  rows,
  onScratch,
  onRemove,
}: {
  title: string;
  rows: TagRow[];
  onScratch: (row: TagRow) => void;
  onRemove: (row: TagRow) => void;
}) {
  return (
    <VStack align="stretch" spacing={{ base: 2, md: 3 }} w="full" minW={0}>
      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
        {title}
      </Text>

      <VStack align="stretch" spacing={1} w="full" minW={0}>
        {rows.map((row) => (
          <HStack
            key={row.id}
            justify="space-between"
            p={{ base: 2, md: 2 }}
            borderWidth="1px"
            borderRadius="md"
            bgColor={row.is_negative ? "red.50" : "yellow.50"}
            w="full"
            minW={0}
            spacing={{ base: 2, md: 3 }}
          >
            <HStack spacing={{ base: 2, md: 3 }} minW={0} flex="1 1 0">
              <Tooltip
                label={row.is_scratched ? "Unscratch" : "Scratch"}
                openDelay={200}
              >
                <IconButton
                  aria-label="toggle scratch"
                  size="sm"
                  variant="ghost"
                  color={row.is_scratched ? "red.500" : "gray.800"}
                  icon={<GiTripleScratches />}
                  onClick={() => onScratch(row)}
                  flexShrink={0}
                />
              </Tooltip>
              <Text
                noOfLines={1}
                title={row.name}
                textDecor={row.is_scratched ? "line-through" : "none"}
                opacity={row.is_scratched ? 0.6 : 1}
                color={row.is_scratched ? "red.500" : "gray.800"}
                minW={0}
                flex="1 1 0"
              >
                {row.name}
              </Text>
            </HStack>

            <Tooltip label="Delete" openDelay={200}>
              <IconButton
                aria-label="delete"
                size="sm"
                colorScheme="red"
                variant="ghost"
                icon={<DeleteIcon />}
                onClick={() => onRemove(row)}
                flexShrink={0}
              />
            </Tooltip>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}
