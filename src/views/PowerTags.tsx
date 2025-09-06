// src/components/PowerTags.tsx
import { DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Button,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FiChevronsDown } from "react-icons/fi";
import { GiTripleScratches } from "react-icons/gi";
import { supabase } from "../lib/supabase";

type TagRow = {
  id: string;
  theme_id: string | null;
  name: string;
  type: string; // 'Power' | 'Weakness' | 'Story' | ...
  is_scratched: boolean | null;
  is_negative: boolean | null;
  created_at?: string;
};

const TABLE = "tags";

export default function PowerTags({
  themeId,
  editing,
  tagType, // e.g. "Power" or "Weakness"
  scratchable, // true for Power, false for Weakness
}: {
  themeId: string;
  editing: boolean;
  tagType: "Power" | "Weakness";
  scratchable: boolean;
}) {
  const [tags, setTags] = useState<TagRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select("id,theme_id,name,type,is_scratched,is_negative")
      .eq("theme_id", themeId)
      .eq("type", tagType)
      .order("name", { ascending: true });

    if (error) setErr(error.message);
    setTags((data ?? []) as TagRow[]);
    setLoading(false);
  }, [themeId, tagType]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`rt:${TABLE}:${tagType}:${themeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLE,
          filter: `theme_id=eq.${themeId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, themeId, tagType]);

  async function add() {
    if (!tags) return;
    const name = newName.trim();
    if (!name) return;

    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const optimistic: TagRow = {
      id: tempId,
      theme_id: themeId,
      name,
      type: tagType,
      is_scratched: false,
      is_negative: false,
    };
    setTags([...tags, optimistic]);
    setNewName("");

    const { error } = await supabase.from(TABLE).insert({
      id: tempId,
      theme_id: themeId,
      name,
      type: tagType,
      is_scratched: false,
      is_negative: false,
    });
    if (error) {
      setErr(error.message);
      setTags((prev) => prev?.filter((t) => t.id !== tempId) ?? null);
    }
  }

  async function rename(id: string, name: string) {
    if (!tags) return;
    const prev = tags;
    const next = tags.map((t) => (t.id === id ? { ...t, name } : t));
    setTags(next);
    const { error } = await supabase.from(TABLE).update({ name }).eq("id", id);
    if (error) {
      setErr(error.message);
      setTags(prev);
    }
  }

  async function del(id: string) {
    if (!tags) return;
    const prev = tags;
    setTags(tags.filter((t) => t.id !== id));
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      setErr(error.message);
      setTags(prev);
    }
  }

  if (loading) {
    return (
      <HStack spacing={2}>
        <Spinner size="xs" />{" "}
        <Text fontSize="sm">Loading {tagType.toLowerCase()} tags…</Text>
      </HStack>
    );
  }

  return (
    <VStack align="stretch" spacing={2}>
      {err && (
        <Alert status="error" variant="subtle">
          <AlertIcon /> {err}
        </Alert>
      )}

      {/* rows */}
      <VStack align="stretch" spacing={1}>
        {(tags ?? []).map((t) =>
          editing ? (
            <HStack key={t.id} spacing={2} justify="space-between">
              <Input
                size="sm"
                value={t.name}
                onChange={(e) => void rename(t.id, e.target.value)}
                bg="white"
              />
              <Tooltip label={`Delete ${tagType.toLowerCase()} tag`}>
                <IconButton
                  aria-label={`Delete ${tagType} tag`}
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => void del(t.id)}
                />
              </Tooltip>
            </HStack>
          ) : (
            <HStack
              key={t.id}
              spacing={1}
              p={1}
              m={0}
              justify="space-between"
              w="full"
              bgColor={tagType === "Weakness" ? "orange.50" : "yellow.50"}
            >
              {tagType === "Weakness" && (
                <IconButton
                  aria-label="Weakness Tag"
                  icon={<FiChevronsDown />}
                  variant="ghost"
                  size="sm"
                  isDisabled={true}
                />
              )}
              {scratchable && (
                <Tooltip label="Toggle scratched">
                  <IconButton
                    aria-label="Toggle scratched"
                    icon={<GiTripleScratches />}
                    variant="ghost"
                    size="sm"
                    colorScheme={t.is_scratched ? "red" : "gray"}
                    onClick={async () => {
                      const next = !t.is_scratched;
                      // optimistic toggle
                      setTags((prev) =>
                        prev
                          ? prev.map((x) =>
                              x.id === t.id ? { ...x, is_scratched: next } : x
                            )
                          : prev
                      );
                      const { error } = await supabase
                        .from(TABLE)
                        .update({ is_scratched: next })
                        .eq("id", t.id);
                      if (error) {
                        setErr(error.message);
                        // rollback
                        setTags((prev) =>
                          prev
                            ? prev.map((x) =>
                                x.id === t.id
                                  ? { ...x, is_scratched: t.is_scratched }
                                  : x
                              )
                            : prev
                        );
                      }
                    }}
                  />
                </Tooltip>
              )}
              <Text
                flex="1"
                fontWeight="semibold"
                color={scratchable && t.is_scratched ? "red" : "black"}
                textDecoration={
                  scratchable && t.is_scratched ? "line-through" : "none"
                }
              >
                {t.name || `Untitled ${tagType} Tag`}
              </Text>
            </HStack>
          )
        )}
      </VStack>

      {/* add row */}
      {editing && (
        <HStack
          as="form"
          spacing={2}
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <Input
            size="sm"
            placeholder={`New ${tagType.toLowerCase()} tag`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            bg="white"
          />
          <Button size="sm" colorScheme="teal" onClick={() => void add()}>
            Add
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
