// src/views/SingleAdventure.tsx
import { RepeatIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { buildCharacterBrief } from "../utils/character";

type Adventure = {
  id: string;
  owner_player_id: string;
  name: string;
  subscribe_code: string;
  created_at: string;
};

type RosterWithBriefRow = {
  character_id: string;
  character_name: string;
  owner_display_name: string;
  character_created_at: string;
  brief_trait_physical: string;
  brief_trait_personality: string;
  brief_race: string;
  brief_class: string;
};

export default function SingleAdventure() {
  const { id } = useParams<{ id: string }>();

  const [uid, setUid] = useState<string | null>(null);
  const [adv, setAdv] = useState<Adventure | null>(null);
  const [roster, setRoster] = useState<RosterWithBriefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isOwner = useMemo(
    () => !!adv && !!uid && adv.owner_player_id === uid,
    [adv, uid]
  );

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
        .maybeSingle<Adventure>();
      if (advErr) {
        setErr(advErr.message);
        setAdv(null);
        return;
      }
      setAdv(advData ?? null);

      const { data: rosterData, error: rErr } = await supabase
        .rpc("get_adventure_roster_with_brief", { p_adventure_id: id })
        .returns<RosterWithBriefRow[]>();

      if (rErr) setErr(rErr.message);

      const rows: RosterWithBriefRow[] = Array.isArray(rosterData)
        ? rosterData
        : [];
      setRoster(rows);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
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
        () => void load()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fellowships",
          filter: `adventure_id=eq.${id}`,
        },
        () => void load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => void load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [load, id]);

  if (loading) {
    return (
      <HStack p={{ base: 3, md: 4 }} spacing={2}>
        <Spinner size="sm" /> <Text fontSize="sm">Loading…</Text>
      </HStack>
    );
  }

  if (!adv) {
    return (
      <Alert status="error" mt={{ base: 3, md: 4 }}>
        <AlertIcon /> Adventure not found.
      </Alert>
    );
  }

  return (
    <Box
      p={{ base: 2, md: 4 }}
      w="full"
      maxW="100%"
      overflowX="hidden"
      minW={0}
    >
      {/* Header row: wraps on mobile */}
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 2, md: 3 }}
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        mb={{ base: 2, md: 3 }}
        w="full"
        minW={0}
      >
        <Heading as="h1" size="lg" noOfLines={1} minW={0}>
          {adv.name}
        </Heading>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={() => void load()}
          variant="outline"
          size="sm"
          alignSelf={{ base: "flex-start", md: "auto" }}
          flexShrink={0}
        >
          Refresh
        </Button>
      </Stack>

      {/* Meta badges: wrap nicely */}
      <Wrap spacing={{ base: 2, md: 3 }} mb={{ base: 3, md: 4 }}>
        <WrapItem>
          <Badge colorScheme="purple">Code: {adv.subscribe_code}</Badge>
        </WrapItem>
        <WrapItem>
          <Badge colorScheme={isOwner ? "green" : "gray"}>
            {isOwner ? "Owner" : "Viewer"}
          </Badge>
        </WrapItem>
        <WrapItem>
          <Text color="gray.600" fontSize="sm">
            Created {new Date(adv.created_at).toLocaleString()}
          </Text>
        </WrapItem>
      </Wrap>

      {err && (
        <Alert status="error" mb={{ base: 3, md: 4 }}>
          <AlertIcon /> {err}
        </Alert>
      )}

      <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
        <Heading as="h2" size="md">
          Fellowship Roster
        </Heading>

        {roster.length === 0 ? (
          <Text color="gray.600" fontSize="sm">
            No characters enrolled yet.
          </Text>
        ) : (
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            spacing={{ base: 2, md: 3 }}
            w="full"
            minW={0}
          >
            {roster.map((r) => {
              const brief = buildCharacterBrief(
                {
                  brief_trait_physical: r.brief_trait_physical,
                  brief_trait_personality: r.brief_trait_personality,
                  brief_race: r.brief_race,
                  brief_class: r.brief_class,
                },
                { capitalizeTraits: true, titleCaseRaceClass: true }
              );

              return (
                <Card key={r.character_id}>
                  <CardBody>
                    <VStack align="stretch" spacing={1}>
                      <Heading
                        size="sm"
                        noOfLines={1}
                        textAlign="center"
                        minW={0}
                      >
                        {r.character_name}
                      </Heading>
                      <Text
                        fontSize="sm"
                        color="gray.700"
                        textAlign="center"
                        wordBreak="break-word"
                      >
                        {brief || "—"}
                      </Text>
                      <HStack justify="space-between" mt={1} minW={0}>
                        <Badge flexShrink={0}>
                          Player: {r.owner_display_name}
                        </Badge>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          noOfLines={1}
                          minW={0}
                        >
                          Joined{" "}
                          {new Date(
                            r.character_created_at
                          ).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
}
