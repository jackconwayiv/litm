// src/views/SingleAdventure.tsx
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
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Def, ThemeRow } from "../types/types";
import { buildCharacterBrief } from "../utils/character";
import SingleTheme from "./SingleTheme";

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

// Safely coerce unknown rows to {id,name} without using `any`
function normalizeDefs(rows: unknown): Def[] {
  if (!Array.isArray(rows)) return [];
  const out: Def[] = [];
  for (const r of rows) {
    const row = r as { id?: unknown; name?: unknown };
    if (typeof row?.id === "string" && typeof row?.name === "string") {
      out.push({ id: row.id, name: row.name });
    }
  }
  return out;
}

// Helper: fetch a single def id by exact name from a table
async function getDefIdByName(
  table: "theme_type_defs" | "might_level_defs",
  name: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn(`Lookup failed for ${table}.${name}:`, error);
    return null;
  }
  const id = (data?.id as string | undefined) ?? null;
  return id;
}

// Idempotent create-or-get for a fellowship theme
async function upsertFellowshipTheme(opts: {
  fellowshipId: string;
  name: string;
  typeId: string;
  mightId: string;
}): Promise<ThemeRow | null> {
  const { fellowshipId, name, typeId, mightId } = opts;

  const payload = {
    fellowship_id: fellowshipId,
    name,
    quest: null,
    improve: 0,
    abandon: 0,
    milestone: 0,
    is_scratched: false,
    is_retired: false,
    type_id: typeId,
    might_level_id: mightId,
  };

  // Prefer unique on fellowship_id (one theme per fellowship)
  let res = await supabase
    .from("themes")
    .upsert(payload, { onConflict: "fellowship_id" })
    .select("*")
    .maybeSingle<ThemeRow>();

  if (res.data) return res.data;

  // If unique is on (fellowship_id, name), try that
  if (res.error) {
    res = await supabase
      .from("themes")
      .upsert(payload, { onConflict: "fellowship_id,name" })
      .select("*")
      .maybeSingle<ThemeRow>();

    if (res.data) return res.data;
  }

  // Race-condition fallback: re-select existing row
  const again = await supabase
    .from("themes")
    .select("*")
    .eq("fellowship_id", fellowshipId)
    .maybeSingle<ThemeRow>();
  if (again.data) return again.data;

  if (res.error) throw res.error;
  return null;
}

export default function SingleAdventure() {
  const { id } = useParams<{ id: string }>();

  const [uid, setUid] = useState<string | null>(null);
  const [adv, setAdv] = useState<Adventure | null>(null);
  const [roster, setRoster] = useState<RosterWithBriefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Quit button states
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [busyQuit, setBusyQuit] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Fellowship theme states
  const [fellowshipId, setFellowshipId] = useState<string | null>(null);
  const [canEditFellowship, setCanEditFellowship] = useState<boolean>(false);
  const [fellowshipTheme, setFellowshipTheme] = useState<ThemeRow | null>(null);
  const [typeDefs, setTypeDefs] = useState<Def[]>([]);
  const [mightDefs, setMightDefs] = useState<Def[]>([]);
  const [themeLoading, setThemeLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const isOwner = useMemo(
    () => !!adv && !!uid && adv.owner_player_id === uid,
    [adv, uid]
  );

  const load = useCallback(async () => {
    setErr(null);
    setInfoMsg(null);

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

      setRoster(Array.isArray(rosterData) ? rosterData : []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fellowship + defs + canEdit + fellowship theme (create with Fellowship/Origin if needed)
  const loadFellowshipTheme = useCallback(async () => {
    if (!id) return;
    setThemeLoading(true);

    try {
      // 1) Fellowship for this adventure
      const { data: f, error: fErr } = await supabase
        .from("fellowships")
        .select("id")
        .eq("adventure_id", id)
        .maybeSingle();
      if (fErr) {
        // eslint-disable-next-line no-console
        console.error(fErr);
      }
      const fid = (f?.id as string | undefined) ?? null;
      setFellowshipId(fid);

      // 2) Load defs for editing UI (full lists)
      const [typesRes, mightsRes] = await Promise.all([
        supabase
          .from("theme_type_defs")
          .select("id,name")
          .order("name", { ascending: true }),
        supabase
          .from("might_level_defs")
          .select("id,name")
          .order("name", { ascending: true }),
      ]);

      const normTypes = normalizeDefs(typesRes.data);
      const normMights = normalizeDefs(mightsRes.data);
      setTypeDefs(normTypes);
      setMightDefs(normMights);

      // 3) Determine canEdit (owner or owns any rostered character)
      let canEdit = false;
      if (uid && adv) {
        if (adv.owner_player_id === uid) {
          canEdit = true;
        } else {
          const { data: rows, error: rErr } = await supabase
            .from("adventure_roster")
            .select("character_id, characters!inner(player_id)")
            .eq("adventure_id", id)
            .eq("characters.player_id", uid)
            .limit(1);
          if (!rErr && rows && rows.length > 0) canEdit = true;
        }
      }
      setCanEditFellowship(canEdit);

      // 4) Get or create the fellowship theme with type=Fellowship, might=Origin
      if (fid) {
        const { data: t, error: tErr } = await supabase
          .from("themes")
          .select("*")
          .eq("fellowship_id", fid)
          .maybeSingle<ThemeRow>();

        if (!tErr && t) {
          setFellowshipTheme(t);
        } else if (!t && canEdit) {
          // Try to find IDs from the already-fetched lists first
          let typeId =
            normTypes.find((d) => d.name === "Fellowship")?.id ?? null;
          let mightId = normMights.find((d) => d.name === "Origin")?.id ?? null;

          // Fallback: direct name lookups if not in the lists
          if (!typeId) {
            typeId = await getDefIdByName("theme_type_defs", "Fellowship");
          }
          if (!mightId) {
            mightId = await getDefIdByName("might_level_defs", "Origin");
          }

          if (!typeId || !mightId) {
            setErr(
              "Cannot auto-create fellowship theme: missing required defs (type: 'Fellowship', might: 'Origin')."
            );
            setFellowshipTheme(null);
          } else {
            try {
              const created = await upsertFellowshipTheme({
                fellowshipId: fid,
                name: "Fellowship Theme",
                typeId,
                mightId,
              });
              setFellowshipTheme(created);
            } catch (cErr: unknown) {
              const msg =
                typeof cErr === "object" && cErr && "message" in cErr
                  ? (cErr as { message?: string }).message ?? "Unknown error"
                  : String(cErr);
              setErr(`Create fellowship theme failed: ${msg}`);
              // eslint-disable-next-line no-console
              console.error("Create fellowship theme failed:", cErr);
              setFellowshipTheme(null);
            }
          }
        } else {
          setFellowshipTheme(null);
        }
      } else {
        setFellowshipTheme(null);
      }
    } finally {
      setThemeLoading(false);
    }
  }, [id, uid, adv]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadFellowshipTheme();
  }, [loadFellowshipTheme]);

  useEffect(() => {
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
        () => {
          void load();
          void loadFellowshipTheme();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fellowships",
          filter: `adventure_id=eq.${id}`,
        },
        () => void loadFellowshipTheme()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => {
          void load();
          void loadFellowshipTheme();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, loadFellowshipTheme, id]);

  // Quit (leave this adventure)
  const quitAdventure = useCallback(async () => {
    if (!id || !uid) return;
    if (isOwner) {
      setInfoMsg("Owners can’t leave from here.");
      return;
    }

    setBusyQuit(true);
    setErr(null);
    setInfoMsg(null);
    try {
      const { data: fids, error: fErr } = await supabase
        .from("fellowships")
        .select("id")
        .eq("adventure_id", id);
      if (fErr) {
        setErr(fErr.message);
        return;
      }
      const fellowshipIds = (fids ?? []).map((fRow) => fRow.id as string);
      if (fellowshipIds.length === 0) {
        setInfoMsg("You are not enrolled in this adventure.");
        return;
      }

      const { error: upErr } = await supabase
        .from("characters")
        .update({ fellowship_id: null })
        .eq("player_id", uid)
        .in("fellowship_id", fellowshipIds);

      if (upErr) {
        setErr(upErr.message);
        return;
      }

      setConfirmQuit(false);
      setInfoMsg("You have left this Adventure.");
      navigate("/", { replace: true });
    } finally {
      setBusyQuit(false);
    }
  }, [id, uid, isOwner, navigate]);

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
      {/* Header row */}
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

        {/* Quit button (non-owners) */}
        {!isOwner &&
          (!confirmQuit ? (
            <Button
              variant="outline"
              size="sm"
              colorScheme="red"
              alignSelf={{ base: "flex-start", md: "auto" }}
              flexShrink={0}
              onClick={() => setConfirmQuit(true)}
              isDisabled={!uid}
            >
              Leave Adventure
            </Button>
          ) : (
            <HStack
              spacing={2}
              alignSelf={{ base: "flex-start", md: "auto" }}
              flexShrink={0}
            >
              <Text fontSize="sm">
                Are you sure you want to leave this Adventure?
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmQuit(false)}
                isDisabled={busyQuit}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={() => void quitAdventure()}
                isLoading={busyQuit}
              >
                Leave Adventure
              </Button>
            </HStack>
          ))}
      </Stack>

      {/* Meta badges */}
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
      {infoMsg && (
        <Alert status="info" mb={{ base: 3, md: 4 }}>
          <AlertIcon /> {infoMsg}
        </Alert>
      )}
      {/* Roster */}
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
      {/* Fellowship Theme */}
      <VStack
        align="stretch"
        spacing={{ base: 2, md: 3 }}
        mt={{ base: 3, md: 4 }}
      >
        <Heading as="h2" size="md">
          Fellowship Theme
        </Heading>
        <Card>
          <CardBody>
            {themeLoading ? (
              <HStack>
                <Spinner size="sm" />
                <Text>Loading fellowship theme…</Text>
              </HStack>
            ) : fellowshipId && fellowshipTheme ? (
              <SingleTheme
                theme={fellowshipTheme}
                mightDefs={mightDefs}
                typeDefs={typeDefs}
                onDelete={async (themeId: string) => {
                  await supabase.from("themes").delete().eq("id", themeId);
                  setFellowshipTheme(null);
                }}
                canEdit={canEditFellowship}
              />
            ) : (
              <Text color="gray.600" fontSize="sm">
                {canEditFellowship
                  ? "No fellowship theme yet. It will be created automatically when you edit."
                  : "No fellowship theme available."}
              </Text>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
