// src/views/SingleCharacter.tsx
import {
  Alert,
  AlertIcon,
  Box,
  Divider,
  HStack,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type {
  CharacterQuintessence,
  CharacterRow,
  Def,
  JoinedAdventure,
  Loaded,
  StatusRow,
  TabKey,
  TagRow,
  ThemeRow,
} from "../types/types";
import { TAB_ORDER, buildTabOrder, isThemeTab } from "../types/types";
import AddThemeInline from "./AddThemeInline";
import AdventureSection from "./AdventureSection";
import BackpackView from "./character/BackpackView";
import BioPage from "./character/BioPage";
import Statuses from "./character/Statuses";
import ThemePage from "./character/ThemePage";
import CharacterHeader from "./CharacterHeader";
import PromiseStepper from "./PromiseStepper";
import SingleTheme from "./SingleTheme";
import ThemeTabs from "./ThemeTabs";

export default function SingleCharacter() {
  const { charId } = useParams();
  const [tab, setTab] = useState<TabKey>("theme1");
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // adventure UI
  const [joinCode, setJoinCode] = useState<string>("");
  const [joining, setJoining] = useState<boolean>(false);

  // add theme inline panel
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [showAddInline, setShowAddInline] = useState<boolean>(false);

  const [savingPromise, setSavingPromise] = useState<boolean>(false);
  const [fellowshipTheme, setFellowshipTheme] = useState<ThemeRow | null>(null);

  const navigate = useNavigate();
  const toast = useToast({
    duration: 2000,
    position: "top-right",
    isClosable: true,
  });

  // Hash sync — respects dynamic order once data (and joined state) is known
  useEffect(() => {
    const order = buildTabOrder(!!data?.joinedAdventure);
    const fromHash = window.location.hash.replace(/^#/, "") as TabKey;
    if (order.includes(fromHash)) setTab(fromHash);
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "") as TabKey;
      const nextOrder = buildTabOrder(!!data?.joinedAdventure);
      if (nextOrder.includes(h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [data?.joinedAdventure]);

  const hydrateJoinedAdventure = useCallback(
    async (fid: string): Promise<JoinedAdventure | null> => {
      type FellowshipRow = {
        id: string;
        name: string | null;
        adventure_id: string | null;
      };
      type AdvRow = { id: string; name: string; subscribe_code: string | null };

      const { data: fRaw, error: fErr } = await supabase
        .from("fellowships")
        .select("id,name,adventure_id")
        .eq("id", fid)
        .maybeSingle<FellowshipRow>();
      if (fErr || !fRaw) return null;

      const fellowship_name = (fRaw.name ?? "").trim() || "Fellowship";

      let adv: AdvRow | null = null;
      if (fRaw.adventure_id) {
        const { data: aRaw } = await supabase
          .from("adventures")
          .select("id,name,subscribe_code")
          .eq("id", fRaw.adventure_id)
          .maybeSingle<AdvRow>();
        adv = aRaw ?? null;
      }

      setJoinCode((adv?.subscribe_code ?? "").toUpperCase());

      return {
        id: adv?.id ?? "",
        name: adv?.name ?? "",
        subscribe_code: adv?.subscribe_code ?? "",
        fellowship_id: fRaw.id,
        fellowship_name,
      };
    },
    []
  );

  const loadAll = useCallback(async () => {
    if (!charId) return;
    setLoading(true);
    setErr(null);

    const { data: uRes } = await supabase.auth.getUser();
    setUid(uRes?.user?.id ?? null);

    const { data: cRow, error: cErr } = await supabase
      .from("characters")
      .select(
        "id,name,player_id,fellowship_id,promise," +
          "appearance,personality,background,relationships,aspirations,achievements," +
          "brief_trait_physical,brief_trait_personality,brief_race,brief_class"
      )
      .eq("id", charId)
      .single<CharacterRow>();

    if (cErr || !cRow) {
      setErr(cErr?.message ?? "Character not found.");
      setLoading(false);
      return;
    }

    let joinedAdventure: JoinedAdventure | null = null;
    let fellowshipThemeLocal: ThemeRow | null = null;

    if (cRow.fellowship_id) {
      joinedAdventure = await hydrateJoinedAdventure(cRow.fellowship_id);

      // Fetch fellowship theme if enrolled
      const { data: ft, error: ftErr } = await supabase
        .from("themes")
        .select(
          "id,name,quest,improve,abandon,milestone,is_retired,is_scratched,might_level_id,type_id,created_at,fellowship_id,character_id"
        )
        .eq("fellowship_id", cRow.fellowship_id)
        .maybeSingle<ThemeRow>();
      if (!ftErr && ft) fellowshipThemeLocal = ft;
    }

    const { data: tRows, error: tErr } = await supabase
      .from("themes")
      .select(
        "id,name,quest,improve,abandon,milestone,is_retired,is_scratched,might_level_id,type_id,created_at,character_id,fellowship_id"
      )
      .eq("character_id", charId)
      .order("created_at", { ascending: true });
    if (tErr) {
      setErr(tErr.message);
      setLoading(false);
      return;
    }

    const themeIds = (tRows ?? []).map((t) => t.id);
    const { data: tagRows, error: tagErr } = await supabase
      .from("tags")
      .select("*")
      .or(
        [
          `character_id.eq.${charId}`,
          themeIds.length ? `theme_id.in.(${themeIds.join(",")})` : "",
        ]
          .filter(Boolean)
          .join(",")
      );
    if (tagErr) {
      setErr(tagErr.message);
      setLoading(false);
      return;
    }

    const { data: mightDefsRows, error: mErr } = await supabase
      .from("might_level_defs")
      .select("id,name")
      .order("name");
    if (mErr) {
      setErr(mErr.message);
      setLoading(false);
      return;
    }

    const { data: typeDefsRows, error: tdefErr } = await supabase
      .from("theme_type_defs")
      .select("id,name")
      .order("name");
    if (tdefErr) {
      setErr(tdefErr.message);
      setLoading(false);
      return;
    }

    const { data: sRows, error: sErr } = await supabase
      .from("statuses")
      .select("*")
      .eq("character_id", charId);
    if (sErr) {
      setErr(sErr.message);
      setLoading(false);
      return;
    }

    type QDefObj = { name: string };
    type QuintessenceJoined = {
      quintessence_id: string;
      quintessence_defs: QDefObj | QDefObj[] | null;
    };
    const { data: qRows, error: qErr } = await supabase
      .from("character_quintessences")
      .select("quintessence_id,quintessence_defs(name)")
      .eq("character_id", charId);
    if (qErr) {
      setErr(qErr.message);
      setLoading(false);
      return;
    }

    const qList = (qRows ?? []) as QuintessenceJoined[];
    const quintessences: CharacterQuintessence[] = qList.map((r) => ({
      quintessence_id: r.quintessence_id,
      name: Array.isArray(r.quintessence_defs)
        ? r.quintessence_defs[0]?.name ?? ""
        : r.quintessence_defs?.name ?? "",
    }));

    setData({
      character: cRow,
      themes: (tRows ?? []) as ThemeRow[],
      tags: (tagRows ?? []) as TagRow[],
      statuses: (sRows ?? []) as StatusRow[],
      quintessences,
      mightDefs: (mightDefsRows ?? []) as Def[],
      typeDefs: (typeDefsRows ?? []) as Def[],
      joinedAdventure,
    });

    setFellowshipTheme(fellowshipThemeLocal);
    setLoading(false);
  }, [charId, hydrateJoinedAdventure]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Auto-open AddThemeInline for empty active theme slot (e.g., brand-new character)
  useEffect(() => {
    if (!data) return;
    // Sort like render does, then inspect the active tab slot
    const sortedLocal = [...data.themes].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    const activeIdx = TAB_ORDER.indexOf(tab);
    if (isThemeTab(tab) && !sortedLocal[activeIdx]) {
      setPendingSlot(activeIdx + 1);
      setShowAddInline(true);
    } else {
      setShowAddInline(false);
    }
  }, [data, tab]);

  async function ensureProfile(): Promise<string | null> {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return null;
    const myId = u.user.id;

    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", myId)
      .maybeSingle();
    if (!prof) {
      const meta = u.user.user_metadata as Record<string, unknown>;
      const display_name =
        (typeof meta.name === "string" && meta.name) ||
        (u.user.email ? u.user.email.split("@")[0] : "Player");
      const { error: insErr } = await supabase
        .from("profiles")
        .insert({ id: myId, display_name });
      if (insErr) return null;
    }
    return myId;
  }

  async function updatePromise(next: number) {
    if (!data) return;
    setSavingPromise(true);
    const { error } = await supabase
      .from("characters")
      .update({ promise: next })
      .eq("id", data.character.id);
    setSavingPromise(false);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }
    setData((prev) =>
      prev ? { ...prev, character: { ...prev.character, promise: next } } : prev
    );
  }

  function openAddTheme(slot: number) {
    setPendingSlot(slot);
    setShowAddInline(true);
  }

  const handleCreateTheme = useCallback(
    async (name: string, typeId: string, mightId: string) => {
      if (!data) return;
      const { data: inserted, error } = await supabase
        .from("themes")
        .insert({
          character_id: data.character.id,
          fellowship_id: null,
          name,
          type_id: typeId,
          might_level_id: mightId,
          quest: null,
          improve: 0,
          abandon: 0,
          milestone: 0,
          is_retired: false,
          is_scratched: false,
        })
        .select(
          "id,name,quest,improve,abandon,milestone,is_retired,is_scratched,might_level_id,type_id"
        )
        .single<ThemeRow>();
      if (error) {
        toast({ status: "error", title: error.message });
        return;
      }
      if (inserted) {
        setData((prev) =>
          prev ? { ...prev, themes: [...prev.themes, inserted] } : prev
        );
        setShowAddInline(false);
        if (pendingSlot) {
          const nextKey = TAB_ORDER[pendingSlot - 1];
          setTab(nextKey);
          window.location.hash = nextKey;
        }
        toast({ status: "success", title: "Theme added" });
      }
    },
    [data, pendingSlot, toast]
  );

  async function handleDeleteTheme(id: string) {
    const { error } = await supabase.from("themes").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      return;
    }
    setData((prev) =>
      prev ? { ...prev, themes: prev.themes.filter((t) => t.id !== id) } : prev
    );
  }

  async function joinAdventure(codeRaw: string) {
    if (!data || !charId) return;
    const code = codeRaw.trim().toUpperCase();
    if (code.length !== 4) {
      toast({ status: "warning", title: "Enter the 4-letter code" });
      return;
    }
    const pid = await ensureProfile();
    if (!pid) {
      toast({ status: "error", title: "Not authenticated" });
      return;
    }
    setJoining(true);
    const { error } = await supabase.rpc("rpc_join_fellowship_by_code", {
      p_join_code: code,
      p_character_id: charId,
    });
    setJoining(false);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }

    const { data: ch } = await supabase
      .from("characters")
      .select("fellowship_id")
      .eq("id", charId)
      .maybeSingle();
    const fid = ch?.fellowship_id ?? null;
    setData((prev) =>
      prev
        ? { ...prev, character: { ...prev.character, fellowship_id: fid } }
        : prev
    );
    if (fid) {
      const ja = await hydrateJoinedAdventure(fid);
      setData((prev) => (prev ? { ...prev, joinedAdventure: ja } : prev));

      // fetch fellowship theme after join
      const { data: ft } = await supabase
        .from("themes")
        .select(
          "id,name,quest,improve,abandon,milestone,is_retired,is_scratched,might_level_id,type_id,created_at,fellowship_id,character_id"
        )
        .eq("fellowship_id", fid)
        .maybeSingle<ThemeRow>();
      setFellowshipTheme(ft ?? null);
    } else {
      setFellowshipTheme(null);
    }
    setJoinCode(code);
    toast({ status: "success", title: "Joined adventure" });
  }

  async function renameCharacter(name: string) {
    if (!data) return;
    const { error } = await supabase
      .from("characters")
      .update({ name })
      .eq("id", data.character.id);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }
    setData((prev) =>
      prev ? { ...prev, character: { ...prev.character, name } } : prev
    );
    toast({ status: "success", title: "Character updated" });
  }

  async function deleteCharacter() {
    if (!data) return;
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", data.character.id);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }
    toast({ status: "success", title: "Character deleted" });
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <HStack p={{ base: 2, md: 4 }} gap={2}>
        <Spinner size="sm" />
        <Text fontSize="sm">Loading character…</Text>
      </HStack>
    );
  }
  if (err) {
    return (
      <Alert status="error" m={{ base: 2, md: 3 }} fontSize="sm">
        <AlertIcon />
        {err}
      </Alert>
    );
  }
  if (!data) return null;

  const themeSlots: (ThemeRow | null)[] = [0, 1, 2, 3].map(
    (i) => (data.themes ?? [])[i] ?? null
  );

  const showFellowshipTab = !!data.joinedAdventure; // only if enrolled

  const onTabChange = (k: TabKey) => {
    if (isThemeTab(k)) {
      const slotIdx =
        ["theme1", "theme2", "theme3", "theme4"].indexOf(k as TabKey) + 1; // 1-based
      if (slotIdx > 0 && !themeSlots[slotIdx - 1]) {
        openAddTheme(slotIdx);
      } else {
        setShowAddInline(false);
      }
    } else {
      setShowAddInline(false);
    }
    setTab(k);
    window.location.hash = k;
  };

  const canEditFellowship =
    !!uid && data.character.player_id === uid && !!data.joinedAdventure;

  return (
    <Box
      w="full"
      maxW="100%"
      overflowX="hidden"
      px={{ base: 2, md: 4 }}
      py={{ base: 2, md: 3 }}
      gap={0}
    >
      <CharacterHeader
        character={data.character}
        onRename={renameCharacter}
        onDelete={deleteCharacter}
        rightExtras={
          <PromiseStepper
            value={data.character.promise}
            onChange={updatePromise}
            busy={savingPromise}
          />
        }
      />

      <Box mt={{ base: 2, md: 3 }}>
        <AdventureSection
          joined={data.joinedAdventure}
          joinCodeDefault={joinCode}
          onJoin={joinAdventure}
          busyJoin={joining}
        />
      </Box>

      <Divider my={{ base: 2, md: 3 }} />

      <ThemeTabs
        themes={themeSlots}
        active={tab}
        onChange={onTabChange}
        onEmptyThemeClick={(slot) => openAddTheme(slot)}
        showFellowship={showFellowshipTab}
      />

      <Box p={{ base: 1, md: 2 }}>
        {/* Add Theme Inline — auto-shown when the active theme slot is empty */}
        {(() => {
          const activeIdx = TAB_ORDER.indexOf(tab); // fellowship isn't a theme tab, so TAB_ORDER works
          const shouldShowAdd =
            showAddInline && isThemeTab(tab) && !themeSlots[activeIdx];

          return shouldShowAdd ? (
            <Box my={2}>
              <AddThemeInline
                typeDefs={data.typeDefs}
                mightDefs={data.mightDefs}
                onCreate={handleCreateTheme}
                onCancel={() => setShowAddInline(false)}
              />
            </Box>
          ) : null;
        })()}

        {tab === "theme1" &&
          (themeSlots[0] ? (
            <ThemePage
              characterId={data.character.id}
              n={1}
              theme={themeSlots[0]}
              tags={data.tags}
              mightDefs={data.mightDefs}
              typeDefs={data.typeDefs}
              onDelete={handleDeleteTheme}
            />
          ) : (
            <Box p={{ base: 1, md: 2 }}>
              <Text color="gray.500" fontSize="sm">
                No Theme assigned yet.
              </Text>
            </Box>
          ))}

        {tab === "theme2" &&
          (themeSlots[1] ? (
            <ThemePage
              characterId={data.character.id}
              n={2}
              theme={themeSlots[1]}
              tags={data.tags}
              mightDefs={data.mightDefs}
              typeDefs={data.typeDefs}
              onDelete={handleDeleteTheme}
            />
          ) : (
            <Box p={{ base: 1, md: 2 }}>
              <Text color="gray.500" fontSize="sm">
                No Theme assigned yet.
              </Text>
            </Box>
          ))}

        {tab === "theme3" &&
          (themeSlots[2] ? (
            <ThemePage
              characterId={data.character.id}
              n={3}
              theme={themeSlots[2]}
              tags={data.tags}
              mightDefs={data.mightDefs}
              typeDefs={data.typeDefs}
              onDelete={handleDeleteTheme}
            />
          ) : (
            <Box p={{ base: 1, md: 2 }}>
              <Text color="gray.500" fontSize="sm">
                No Theme assigned yet.
              </Text>
            </Box>
          ))}

        {tab === "theme4" &&
          (themeSlots[3] ? (
            <ThemePage
              characterId={data.character.id}
              n={4}
              theme={themeSlots[3]}
              tags={data.tags}
              mightDefs={data.mightDefs}
              typeDefs={data.typeDefs}
              onDelete={handleDeleteTheme}
            />
          ) : (
            <Box p={{ base: 1, md: 2 }}>
              <Text color="gray.500" fontSize="sm">
                No Theme assigned yet.
              </Text>
            </Box>
          ))}

        {/* Fellowship tab — only if enrolled */}
        {tab === "fellowship" && !!data.joinedAdventure && (
          <Box p={{ base: 1, md: 2 }}>
            {fellowshipTheme ? (
              <SingleTheme
                theme={fellowshipTheme}
                mightDefs={data.mightDefs}
                typeDefs={data.typeDefs}
                onDelete={() => {
                  /* delete hidden by SingleTheme for fellowship; noop */
                }}
                canEdit={canEditFellowship}
              />
            ) : (
              <Text color="gray.600" fontSize="sm">
                No fellowship theme yet.
              </Text>
            )}
          </Box>
        )}

        {tab === "backpack" && (
          <Box p={{ base: 1, md: 2 }}>
            <BackpackView characterId={data.character.id} />
          </Box>
        )}
        {tab === "statuses" && (
          <Box p={{ base: 1, md: 2 }}>
            <Statuses characterId={data.character.id} />
          </Box>
        )}
        {tab === "bio" && (
          <Box p={{ base: 1, md: 2 }}>
            <BioPage
              character={data.character}
              onLocalUpdate={(patch) =>
                setData((prev) =>
                  prev
                    ? { ...prev, character: { ...prev.character, ...patch } }
                    : prev
                )
              }
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
