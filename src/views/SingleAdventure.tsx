// src/views/SingleAdventure.tsx
import {
  ChevronDownIcon,
  ChevronRightIcon,
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
  List,
  ListItem,
  Spacer,
  Spinner,
  Tag,
  TagLabel,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Adventure = {
  id: string;
  owner_player_id: string;
  name: string;
  subscribe_code: string;
  created_at: string;
};

type RosterRow = {
  adventure_id: string;
  fellowship_id: string;
  character_id: string;
  character_name: string;
  owner_display_name: string;
  character_created_at: string;
};

export default function SingleAdventure() {
  const { id } = useParams<{ id: string }>();

  const [uid, setUid] = useState<string | null>(null);
  const [adv, setAdv] = useState<Adventure | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const isOwner = useMemo(
    () => !!adv && !!uid && adv.owner_player_id === uid,
    [adv, uid]
  );

  const toggle = (rowId: string) =>
    setOpen((s) => ({ ...s, [rowId]: !s[rowId] }));

  const load = useCallback(async () => {
    setErr(null);

    if (!id) {
      setAdv(null);
      setRoster([]);
      setLoading(false);
      setErr("Missing adventure id.");
      return;
    }

    setLoading(true);
    try {
      const { data: uRes } = await supabase.auth.getUser();
      setUid(uRes?.user?.id ?? null);

      const { data: advData, error: advErr } = await supabase
        .from("adventures")
        .select("id,owner_player_id,name,subscribe_code,created_at")
        .eq("id", id)
        .maybeSingle();

      if (advErr) {
        setErr(advErr.message);
        setAdv(null);
        return;
      }

      setAdv((advData ?? null) as Adventure | null);

      const { data: rosterData, error: rErr } = await supabase
        .from("adventure_roster")
        .select("*")
        .eq("adventure_id", id);
      if (rErr) setErr(rErr.message);
      setRoster((rosterData ?? []) as RosterRow[]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    if (!id) return;

    const ch = supabase
      .channel(`rt:single-adventure:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "adventures",
          filter: `id=eq.${id}`,
        },
        () => load()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fellowships",
          filter: `adventure_id=eq.${id}`,
        },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [load, id]);

  if (loading) {
    return (
      <HStack p={4}>
        <Spinner /> <Text>Loading…</Text>
      </HStack>
    );
  }

  if (!adv) {
    return (
      <Alert status="error" mt={4}>
        <AlertIcon /> Adventure not found.
      </Alert>
    );
  }

  return (
    <Box p={4}>
      <HStack mb={2}>
        <Heading as="h1" size="lg">
          {adv.name}
        </Heading>
        <Spacer />
        <Button leftIcon={<RepeatIcon />} onClick={load} variant="outline">
          Refresh
        </Button>
      </HStack>

      <HStack mb={4} gap={3}>
        <Tag colorScheme="purple">
          <TagLabel>Code: {adv.subscribe_code}</TagLabel>
        </Tag>
        {isOwner ? (
          <Tag colorScheme="green">
            <TagLabel>Owner</TagLabel>
          </Tag>
        ) : (
          <Tag colorScheme="gray">
            <TagLabel>Viewer</TagLabel>
          </Tag>
        )}
        <Text color="gray.600">
          Created {new Date(adv.created_at).toLocaleString()}
        </Text>
      </HStack>

      {err && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {err}
        </Alert>
      )}

      <VStack align="stretch" gap={2}>
        <Heading as="h2" size="md">
          Fellowship Roster
        </Heading>
        {roster.length === 0 ? (
          <Text>No characters enrolled yet.</Text>
        ) : (
          <List spacing={2}>
            {roster.map((r) => (
              <ListItem
                key={r.character_id}
                p={2}
                borderWidth="1px"
                rounded="md"
              >
                <HStack align="center" gap={3}>
                  <IconButton
                    aria-label={open[r.character_id] ? "Collapse" : "Expand"}
                    icon={
                      open[r.character_id] ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )
                    }
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(r.character_id)}
                  />
                  <Text fontWeight="bold" flex="1">
                    {r.character_name.toUpperCase()}
                  </Text>
                  <Tag size="sm">
                    <TagLabel>Player: {r.owner_display_name}</TagLabel>
                  </Tag>
                </HStack>

                <Collapse in={!!open[r.character_id]} animateOpacity>
                  <VStack align="start" mt={2} spacing={1}>
                    <Text fontSize="sm" color="gray.600">
                      Character ID: <code>{r.character_id}</code>
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Joined on{" "}
                      {new Date(r.character_created_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </Collapse>
              </ListItem>
            ))}
          </List>
        )}
      </VStack>
    </Box>
  );
}
