import { DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Heading,
  IconButton,
  Input,
  Select,
  Spinner,
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
  character_id: string | null; // direct attachment to character
  theme_id: string | null; // should be null for Backpack items
  name: string;
  type: BackpackTagType;
  is_scratched: boolean | null;
  is_negative: boolean; // keep for parity with theme tags; unused here
  created_at?: string;
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
  const [newType, setNewType] = useState<BackpackTagType>("Story");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(
    () => !!characterId && newName.trim().length > 0 && !saving,
    [characterId, newName, saving]
  );

  const fetchRows = useCallback(async () => {
    if (!characterId) {
      setRows([]);
      setLoading(false); // important
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
      setRows(data ?? []);
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
    const insertPayload: Partial<TagRow> = {
      character_id: characterId,
      theme_id: null,
      name: newName.trim(),
      type: newType,
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
  }, [characterId, canSave, newName, newType, fetchRows, toast]);

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

  const backpack = useMemo(
    () => rows.filter((r) => r.type === "Story"),
    [rows]
  );
  const singleUse = useMemo(
    () => rows.filter((r) => r.type === "Single-Use"),
    [rows]
  );

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="md" mb={3}>
          Backpack
        </Heading>
        <HStack spacing={2}>
          <Input
            placeholder="Add item..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) addTag();
            }}
          />
          <Select
            width="160px"
            value={newType}
            onChange={(e) => setNewType(e.target.value as BackpackTagType)}
          >
            <option value="Story">Story</option>
            <option value="Single-Use">Single-Use</option>
          </Select>
          <Button
            colorScheme="teal"
            onClick={addTag}
            isDisabled={!canSave}
            isLoading={saving}
          >
            Add
          </Button>
        </HStack>
        {error ? (
          <Alert status="error" mt={3}>
            <AlertIcon />
            {error}
          </Alert>
        ) : null}
      </Box>

      {singleUse.length > 0 && (
        <TagSection
          title="Single-Use Tags"
          rows={singleUse}
          onScratch={toggleScratch}
          onRemove={removeTag}
        />
      )}

      {backpack.length > 0 && (
        <TagSection
          title="Story Tags"
          rows={backpack}
          onScratch={toggleScratch}
          onRemove={removeTag}
        />
      )}

      {loading ? (
        <HStack>
          <Spinner />
          <Text>Loading Backpack…</Text>
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
    <VStack align="stretch" spacing={2}>
      <Text fontWeight="bold" fontSize="lg">
        {title}
      </Text>
      <VStack align="stretch" spacing={1}>
        {rows.map((row) => (
          <HStack
            key={row.id}
            justify="space-between"
            p={2}
            borderWidth="1px"
            borderRadius="md"
            bgColor={row.is_negative ? "red.50" : "yellow.50"}
          >
            <HStack spacing={3}>
              <Tooltip
                label={row.is_scratched ? "Unscratch" : "Scratch"}
                openDelay={200}
              >
                <IconButton
                  aria-label="toggle scratch"
                  size="sm"
                  variant="ghost"
                  colorScheme={row.is_scratched ? "red" : "black"}
                  icon={<GiTripleScratches />}
                  onClick={() => onScratch(row)}
                />
              </Tooltip>
              <Text
                textDecor={row.is_scratched ? "line-through" : "none"}
                opacity={row.is_scratched ? 0.6 : 1}
                color={row.is_scratched ? "red" : "black"}
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
              />
            </Tooltip>
          </HStack>
        ))}
        {rows.length === 0 ? (
          <Text fontStyle="italic" color="gray.500">
            None yet.
          </Text>
        ) : null}
      </VStack>
    </VStack>
  );
}
