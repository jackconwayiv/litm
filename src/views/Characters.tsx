// src/views/Characters.tsx
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Collapse,
  Heading,
  HStack,
  IconButton,
  Input,
  List,
  ListItem,
  Spinner,
  Stack,
  Tag,
  TagLabel,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Character } from "../types/types";
import Themes from "./Themes";

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const nav = useNavigate();

  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("characters")
      .select("id,name,player_id,fellowship_id,promise,created_at")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setCharacters((data ?? []) as Character[]);
    setLoading(false);
  }, []);

  const loadActive = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) {
      setActiveId(null);
      return;
    }
    const { data: p, error } = await supabase
      .from("profiles")
      .select("active_character_id")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      setActiveId(null);
      return;
    }
    setActiveId((p?.active_character_id as string) ?? null);
  }, []);

  useEffect(() => {
    load();
    loadActive();
    const ch = supabase
      .channel("rt:characters")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load, loadActive]);

  async function ensureProfileId(): Promise<string | null> {
    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u?.user) return null;
    const uid = u.user.id;

    const { data: prof, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", uid)
      .maybeSingle();

    if (error) return null;

    if (!prof) {
      const meta = u.user.user_metadata as Record<string, unknown>;
      const display_name =
        (typeof meta.name === "string" && meta.name) ||
        (u.user.email ? u.user.email.split("@")[0] : "Player");
      const { error: insErr } = await supabase
        .from("profiles")
        .insert({ id: uid, display_name });
      if (insErr) return null;
    }
    return uid;
  }

  async function setActiveCharacter(id: string) {
    setErr(null);

    const uid = await ensureProfileId();
    if (!uid) {
      setErr("Not authenticated or profile missing.");
      return;
    }

    // Optional: ensure ownership
    const { data: owned } = await supabase
      .from("characters")
      .select("id")
      .eq("id", id)
      .eq("player_id", uid)
      .maybeSingle();
    if (!owned) {
      setErr("Not your character.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ active_character_id: id })
      .eq("id", uid)
      .select("active_character_id")
      .single();

    if (error) {
      setErr(error.message);
      return;
    }

    setActiveId(data.active_character_id as string);
    await loadActive();
  }

  async function createCharacter() {
    setErr(null);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return setErr("Not authenticated.");
    const trimmed = name.trim();
    if (!trimmed) return setErr("Name required.");

    const { data, error } = await supabase
      .from("characters")
      .insert({ name: trimmed, player_id: uid, fellowship_id: null })
      .select("id")
      .single();

    if (error) return setErr(error.message);
    setName("");

    if (data?.id) {
      await setActiveCharacter(data.id);
      return nav(`/c/${data.id}#bio`, { replace: true });
    }

    load();
  }

  async function deleteCharacter(id: string) {
    setErr(null);
    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) setErr(error.message);
    else {
      if (id === activeId) setActiveId(null);
      load();
      loadActive();
    }
  }

  const go = (id: string, hash: string) => nav(`/c/${id}#${hash}`);

  return (
    <Box
      p={{ base: 2, md: 4 }}
      w="full"
      maxW="100%"
      overflowX="hidden"
      minW={0}
    >
      {/* Toolbar */}
      <HStack mb={{ base: 2, md: 4 }} spacing={{ base: 2, md: 3 }} w="full">
        <Button
          leftIcon={<RepeatIcon />}
          onClick={load}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
        <Tag size="sm" colorScheme="gray">
          <TagLabel>{characters.length} characters</TagLabel>
        </Tag>
      </HStack>

      {/* Create Character */}
      <Box
        mb={{ base: 4, md: 6 }}
        p={{ base: 2, md: 4 }}
        borderWidth="1px"
        rounded="lg"
      >
        <Heading as="h3" size="sm" mb={{ base: 2, md: 3 }}>
          Create Character
        </Heading>
        <Stack
          as="form"
          direction={{ base: "column", md: "row" }}
          onSubmit={(e) => {
            e.preventDefault();
            void createCharacter();
          }}
          spacing={{ base: 2, md: 3 }}
          w="full"
          minW={0}
          align={{ base: "stretch", md: "center" }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            size="sm"
            flex="1 1 0"
            minW={0}
          />
          <Button type="submit" colorScheme="teal" size="sm" flexShrink={0}>
            Add
          </Button>
        </Stack>
      </Box>

      {err && (
        <Alert status="error" mb={{ base: 3, md: 4 }}>
          <AlertIcon /> {err}
        </Alert>
      )}

      {loading ? (
        <HStack spacing={2}>
          <Spinner size="sm" /> <Text fontSize="sm">Loading…</Text>
        </HStack>
      ) : characters.length === 0 ? (
        <Text color="gray.600" fontSize="sm">
          No characters yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={{ base: 2, md: 3 }} w="full" minW={0}>
          <Heading as="h2" size="md">
            Characters
          </Heading>

          <List spacing={{ base: 2, md: 2 }}>
            {characters.map((c) => (
              <ListItem
                key={c.id}
                p={{ base: 2, md: 2 }}
                borderWidth="1px"
                rounded="md"
              >
                {/* Row header */}
                <HStack
                  align="center"
                  spacing={{ base: 2, md: 3 }}
                  w="full"
                  minW={0}
                >
                  <IconButton
                    aria-label={open[c.id] ? "Collapse" : "Expand"}
                    icon={
                      open[c.id] ? <ChevronDownIcon /> : <ChevronRightIcon />
                    }
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(c.id)}
                    flexShrink={0}
                  />
                  <Text
                    fontWeight="bold"
                    flex="1 1 0"
                    minW={0}
                    noOfLines={1}
                    title={c.name}
                  >
                    {c.name.toUpperCase()}{" "}
                    {c.id === activeId && (
                      <Tag size="sm" colorScheme="purple" ml={2}>
                        <TagLabel>Active</TagLabel>
                      </Tag>
                    )}
                  </Text>

                  <HStack spacing={{ base: 1, md: 2 }} flexShrink={0}>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => go(c.id, "bio")}
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant={c.id === activeId ? "solid" : "outline"}
                      colorScheme="purple"
                      onClick={() => void setActiveCharacter(c.id)}
                      isDisabled={c.id === activeId}
                    >
                      Set Active
                    </Button>
                  </HStack>
                </HStack>

                {/* Expanded content */}
                <Collapse in={!!open[c.id]} animateOpacity>
                  <VStack
                    align="start"
                    mt={{ base: 2, md: 2 }}
                    spacing={{ base: 2, md: 3 }}
                    w="full"
                  >
                    {/* Quick links row: wrap on mobile */}
                    <Wrap spacing={{ base: 2, md: 2 }}>
                      <WrapItem>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => go(c.id, "relationships")}
                        >
                          Relationships
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => go(c.id, "promise")}
                        >
                          Quintessences
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => go(c.id, "backpack")}
                        >
                          Backpack
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => go(c.id, "fellowship")}
                        >
                          Fellowship
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <IconButton
                          aria-label="Delete character"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => void deleteCharacter(c.id)}
                        />
                      </WrapItem>
                    </Wrap>

                    {/* Themes list for this character */}
                    <Box w="full" minW={0}>
                      <Themes characterId={c.id} />
                    </Box>
                  </VStack>
                </Collapse>
              </ListItem>
            ))}
          </List>
        </VStack>
      )}
    </Box>
  );
}
