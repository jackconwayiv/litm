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
  Spacer,
  Spinner,
  Tag,
  TagLabel,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Character } from "../types/types";
import Themes from "./Themes";

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("characters")
      .select("id,name,player_id,fellowship_id,promise")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setCharacters((data ?? []) as Character[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
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
  }, [load]);

  async function createCharacter() {
    setErr(null);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return setErr("Not authenticated.");
    const trimmed = name.trim();
    if (!trimmed) return setErr("Name required.");

    const { error } = await supabase.from("characters").insert({
      name: trimmed,
      player_id: uid,
      fellowship_id: null,
    });
    if (error) return setErr(error.message);
    setName("");
    load();
  }

  async function deleteCharacter(id: string) {
    setErr(null);
    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) setErr(error.message);
    else load();
  }

  return (
    <Box p={4}>
      <HStack mb={4}>
        <Button leftIcon={<RepeatIcon />} onClick={load} variant="outline">
          Refresh
        </Button>
        <Tag size="md" colorScheme="gray">
          <TagLabel>{characters.length} characters</TagLabel>
        </Tag>
        <Spacer />
      </HStack>

      <Box mb={6} p={4} borderWidth="1px" rounded="lg">
        <Heading as="h3" size="md" mb={3}>
          Create Character
        </Heading>
        <HStack
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            createCharacter();
          }}
          gap={3}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Button type="submit" colorScheme="teal">
            Add
          </Button>
        </HStack>
      </Box>

      {err && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {err}
        </Alert>
      )}

      {loading ? (
        <HStack>
          <Spinner /> <Text>Loading…</Text>
        </HStack>
      ) : characters.length === 0 ? (
        <Text>No characters yet.</Text>
      ) : (
        <VStack align="stretch" gap={2}>
          <Heading as="h2" size="md">
            Characters
          </Heading>
          <List spacing={2}>
            {characters.map((c) => (
              <ListItem key={c.id} p={2} borderWidth="1px" rounded="md">
                <HStack align="center" gap={3}>
                  <IconButton
                    aria-label={open[c.id] ? "Collapse" : "Expand"}
                    icon={
                      open[c.id] ? <ChevronDownIcon /> : <ChevronRightIcon />
                    }
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(c.id)}
                  />
                  <Text fontWeight="bold" flex="1">
                    {c.name.toUpperCase()}{" "}
                    <Text as="span" color="gray.500"></Text>
                  </Text>
                </HStack>
                <Collapse in={!!open[c.id]} animateOpacity>
                  <VStack align="start" mt={2} spacing={2}>
                    <HStack>
                      <Button size="sm" variant="ghost">
                        Relationships
                      </Button>
                      <Button size="sm" variant="ghost">
                        Quintessences
                      </Button>
                      <Button size="sm" variant="ghost">
                        Backpack
                      </Button>
                      <Button size="sm" variant="ghost">
                        {c.promise} Promise
                      </Button>
                      <Button size="sm" variant="ghost">
                        Fellowship
                      </Button>
                      <IconButton
                        aria-label="Delete character"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => deleteCharacter(c.id)}
                      />
                    </HStack>
                    <Themes characterId={c.id} />
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
