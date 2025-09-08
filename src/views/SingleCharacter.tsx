// src/views/SingleCharacter.tsx
import { SettingsIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Tab,
  TabList,
  Tabs,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PiBackpackFill, PiSpiralBold } from "react-icons/pi";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BackpackView from "./character/BackpackView";
import Statuses from "./character/Statuses";
import ThemePage from "./character/ThemePage";
import type { ThemeRow as SingleThemeRow } from "./SingleTheme";

type ThemeRow = SingleThemeRow;

type TabKey =
  | "theme1"
  | "theme2"
  | "theme3"
  | "theme4"
  | "backpack"
  | "statuses";
const ORDER: TabKey[] = [
  "theme1",
  "theme2",
  "theme3",
  "theme4",
  "backpack",
  "statuses",
];
const isThemeTab = (k: TabKey) =>
  k === "theme1" || k === "theme2" || k === "theme3" || k === "theme4";

type CharacterRow = {
  id: string;
  name: string;
  player_id: string;
  fellowship_id: string | null;
  promise: number;
};

type TagRow = {
  id: string;
  name: string;
  type: string | null;
  is_scratched: boolean;
  is_negative: boolean;
  theme_id: string | null;
  character_id: string | null;
  fellowship_id: string | null;
};

type StatusRow = {
  id: string;
  name: string;
  tier: number;
  is_negative: boolean;
  character_id: string | null;
  fellowship_id: string | null;
  adventure_id: string | null;
};

type CharacterQuintessence = { quintessence_id: string; name: string };
type Def = { id: string; name: string };

type JoinedAdventure = {
  id: string; // adventure id ("" if none)
  name: string; // adventure name ("" if none)
  subscribe_code: string; // "" if none
  fellowship_id: string;
  fellowship_name: string; // fellowships.name
};

type Loaded = {
  character: CharacterRow;
  themes: ThemeRow[];
  tags: TagRow[];
  statuses: StatusRow[];
  quintessences: CharacterQuintessence[];
  mightDefs: Def[];
  typeDefs: Def[];
  joinedAdventure: JoinedAdventure | null;
};

const truncateThemeName = (s: string) => (s.length <= 20 ? s : s.slice(0, 20));

export default function SingleCharacter() {
  const { charId } = useParams();
  const [tab, setTab] = useState<TabKey>("theme1");
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // join/leave adventure UI state
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Add Theme modal state
  const addModal = useDisclosure();
  const toast = useToast({
    duration: 2000,
    position: "top-right",
    isClosable: true,
  });
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [newThemeName, setNewThemeName] = useState("");
  const [newTypeId, setNewTypeId] = useState<string>("");
  const [newMightId, setNewMightId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const settings = useDisclosure();
  const confirmDelete = useDisclosure();

  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deletingChar, setDeletingChar] = useState(false);
  const [savingPromise, setSavingPromise] = useState(false);

  // hash sync
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "") as TabKey;
    if (ORDER.includes(fromHash)) setTab(fromHash);
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "") as TabKey;
      if (ORDER.includes(h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const loadAll = useCallback(async () => {
    if (!charId) return;
    setLoading(true);
    setErr(null);

    // 1) character
    const { data: cRow, error: cErr } = await supabase
      .from("characters")
      .select("id,name,player_id,fellowship_id,promise")
      .eq("id", charId)
      .single<CharacterRow>();

    if (cErr || !cRow) {
      setErr(cErr?.message ?? "Character not found.");
      setLoading(false);
      return;
    }

    let joinedAdventure: JoinedAdventure | null = null;
    if (cRow.fellowship_id) {
      joinedAdventure = await hydrateJoinedAdventure(cRow.fellowship_id);
    }

    // 3) themes
    const { data: tRows, error: tErr } = await supabase
      .from("themes")
      .select(
        "id,name,quest,improve,abandon,milestone,is_retired,is_scratched,might_level_id,type_id"
      )
      .eq("character_id", charId);
    if (tErr) {
      setErr(tErr.message);
      setLoading(false);
      return;
    }

    // 4) tags
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

    // 5) might + type defs
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

    // 6) statuses
    const { data: sRows, error: sErr } = await supabase
      .from("statuses")
      .select("*")
      .eq("character_id", charId);
    if (sErr) {
      setErr(sErr.message);
      setLoading(false);
      return;
    }

    // 7) quintessences
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
    setLoading(false);
  }, [charId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
    const mightNames = ["Origin", "Adventure", "Greatness"];
    const originDef =
      data?.mightDefs.find((d) => d.name === "Origin") ??
      mightNames
        .map((n) => data?.mightDefs.find((d) => d.name === n))
        .find(Boolean) ??
      null;

    setNewMightId(originDef?.id ?? "");
    if (data) setNewTypeId(data.typeDefs[0]?.id ?? "");
    setNewThemeName("");
    addModal.onOpen();
  }

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

      // update the join code for UI convenience
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

  useEffect(() => {
    const fid = data?.character.fellowship_id;
    if (fid) hydrateJoinedAdventure(fid);
    else setData((p) => (p ? { ...p, joinedAdventure: null } : p));
  }, [data?.character.fellowship_id, hydrateJoinedAdventure]);

  async function joinAdventure() {
    if (!data || !charId) return;
    const code = joinCode.trim().toUpperCase();
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
    if (fid) await hydrateJoinedAdventure(fid);
    toast({ status: "success", title: "Joined adventure" });
  }

  async function leaveAdventure() {
    if (!data) return;
    if (!data.character.fellowship_id) return;
    setLeaving(true);
    const { error } = await supabase
      .from("characters")
      .update({ fellowship_id: null })
      .eq("id", data.character.id);
    setLeaving(false);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }
    setData((prev) =>
      prev
        ? {
            ...prev,
            character: { ...prev.character, fellowship_id: null },
            joinedAdventure: null,
          }
        : prev
    );
    setJoinCode("");
    toast({ status: "success", title: "Left adventure" });
  }

  // create theme handler (was missing)
  const handleCreateTheme = useCallback(async () => {
    if (!data || !charId) return;
    const name = newThemeName.trim();
    if (!name || !newTypeId || !newMightId) {
      toast({ status: "warning", title: "Name, Type, and Might are required" });
      return;
    }
    setCreating(true);
    const { data: inserted, error } = await supabase
      .from("themes")
      .insert({
        character_id: data.character.id,
        fellowship_id: null,
        name,
        type_id: newTypeId,
        might_level_id: newMightId,
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
      .single();

    setCreating(false);
    if (error) {
      toast({ status: "error", title: error.message });
      return;
    }
    if (inserted) {
      setData((prev) =>
        prev
          ? { ...prev, themes: [...prev.themes, inserted as ThemeRow] }
          : prev
      );
      addModal.onClose();

      if (pendingSlot) {
        setTab(ORDER[pendingSlot - 1]);
        window.location.hash = ORDER[pendingSlot - 1];
      }
      toast({ status: "success", title: "Theme added" });
    }
  }, [
    addModal,
    charId,
    data,
    newMightId,
    newThemeName,
    newTypeId,
    pendingSlot,
    toast,
  ]);

  const isJoined = !!data?.character.fellowship_id;
  const index = useMemo(() => ORDER.indexOf(tab), [tab]);

  if (loading) {
    return (
      <HStack p={6} spacing={3}>
        <Spinner />
        <Text>Loading character…</Text>
      </HStack>
    );
  }
  if (err) {
    return (
      <Alert status="error" m={4}>
        <AlertIcon />
        {err}
      </Alert>
    );
  }
  if (!data) return null;

  const sorted = [...data.themes].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  const themeSlots: (ThemeRow | null)[] = [0, 1, 2, 3].map(
    (i) => sorted[i] ?? null
  );

  const onTabChange = (i: number) => {
    const k = ORDER[i];
    if (isThemeTab(k) && !themeSlots[i]) openAddTheme(i + 1);
    setTab(k);
    window.location.hash = k;
  };

  return (
    <Box>
      <HStack pb={2} justify="space-between">
        <Heading size="lg">{data.character.name}</Heading>
        <IconButton
          aria-label="Character settings"
          icon={<SettingsIcon />}
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditName(data.character.name);
            settings.onOpen();
          }}
        />
      </HStack>
      <HStack justifyContent="center" pb={2}>
        <Text fontSize={12} mr={5}>
          Promise:
        </Text>
        <HStack spacing={1}>
          <Button
            size="xs"
            mr={5}
            onClick={() =>
              updatePromise(Math.max(0, data.character.promise - 1))
            }
            isDisabled={savingPromise || data.character.promise <= 0}
          >
            –
          </Button>
          <Text fontSize={16} fontWeight="bold">
            {data.character.promise}
          </Text>
          <Button
            size="xs"
            ml={5}
            onClick={() =>
              updatePromise(Math.min(5, data.character.promise + 1))
            }
            isDisabled={savingPromise || data.character.promise >= 5}
          >
            +
          </Button>
        </HStack>
      </HStack>

      {/* Adventure join/leave section */}
      {isJoined ? (
        <HStack
          justify="space-between"
          align="center"
          mt={2}
          mb={3}
          p={3}
          borderWidth="1px"
          rounded="md"
          bg="blackAlpha.50"
        >
          <Box>
            <Text fontSize="sm" color="gray.600"></Text>
            <Heading size="sm">
              Enrolled in {data.joinedAdventure?.name ?? "Adventure"}
            </Heading>
          </Box>
          <HStack>
            {data.joinedAdventure?.subscribe_code ? (
              <Text fontSize="xs" color="gray.500">
                Code: {data.joinedAdventure.subscribe_code}
              </Text>
            ) : null}
            <Button
              size="sm"
              colorScheme="red"
              onClick={leaveAdventure}
              isLoading={leaving}
            >
              Leave
            </Button>
          </HStack>
        </HStack>
      ) : (
        <HStack
          as="form"
          mt={2}
          mb={3}
          p={3}
          borderWidth="1px"
          rounded="md"
          bg="blackAlpha.50"
          onSubmit={(e) => {
            e.preventDefault();
            joinAdventure();
          }}
          gap={2}
        >
          <Input
            value={joinCode}
            onChange={(e) =>
              setJoinCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 4)
              )
            }
            placeholder="Join code (ABCD)"
            maxLength={4}
            fontFamily="mono"
            w="180px"
          />
          <Button
            colorScheme="teal"
            onClick={joinAdventure}
            isLoading={joining}
          >
            Join adventure
          </Button>
        </HStack>
      )}

      <Divider />

      <HStack
        px={2}
        py={1}
        position="sticky"
        top={0}
        zIndex={10}
        bg="chakra-body-bg"
      >
        <Tabs
          index={index}
          onChange={onTabChange}
          variant="soft-rounded"
          isFitted
          overflowX="auto"
          width="100%"
        >
          <TabList>
            {ORDER.map((k, i) => {
              const theme = isThemeTab(k) ? themeSlots[i] : null;
              const opacity = isThemeTab(k) ? (theme ? 1 : 0.6) : 1;

              return (
                <Tab
                  key={k}
                  opacity={opacity}
                  fontSize={{ base: "12", md: "14" }}
                  p={1}
                  onClick={() => {
                    if (isThemeTab(k) && !theme) openAddTheme(i + 1);
                  }}
                  aria-label={k}
                >
                  {k === "backpack" ? (
                    <HStack spacing={1}>
                      <PiBackpackFill />
                      <Text display={{ base: "none", md: "inline" }}>
                        Backpack
                      </Text>
                    </HStack>
                  ) : k === "statuses" ? (
                    <HStack spacing={1} m={0}>
                      <PiSpiralBold />
                      <Text display={{ base: "none", md: "inline" }}>
                        Statuses
                      </Text>
                    </HStack>
                  ) : theme ? (
                    truncateThemeName(theme.name)
                  ) : (
                    "No Theme"
                  )}
                </Tab>
              );
            })}
          </TabList>
        </Tabs>
      </HStack>

      <Box p={3}>
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
            <Box p={4}>
              <Text color="gray.500">No Theme assigned yet.</Text>
              <Button mt={3} colorScheme="teal" onClick={() => openAddTheme(1)}>
                Add Theme
              </Button>
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
            <Box p={4}>
              <Text color="gray.500">No Theme assigned yet.</Text>
              <Button mt={3} colorScheme="teal" onClick={() => openAddTheme(2)}>
                Add Theme
              </Button>
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
            <Box p={4}>
              <Text color="gray.500">No Theme assigned yet.</Text>
              <Button mt={3} colorScheme="teal" onClick={() => openAddTheme(3)}>
                Add Theme
              </Button>
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
            <Box p={4}>
              <Text color="gray.500">No Theme assigned yet.</Text>
              <Button mt={3} colorScheme="teal" onClick={() => openAddTheme(4)}>
                Add Theme
              </Button>
            </Box>
          ))}
        {tab === "backpack" && (
          <Box p={3}>
            <BackpackView characterId={data.character.id} />
          </Box>
        )}
        {tab === "statuses" && (
          <Box p={3}>
            <Statuses characterId={data.character.id} />
          </Box>
        )}
      </Box>

      {/* Add Theme Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={() => {
          if (!creating) addModal.onClose();
        }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a Theme for {data.character.name}</ModalHeader>
          <ModalCloseButton isDisabled={creating} />
          <ModalBody>
            <FormControl isRequired mb={3}>
              <FormLabel>Name</FormLabel>
              <Input
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="Theme name"
                isDisabled={creating}
                autoFocus
              />
            </FormControl>
            <FormControl isRequired mb={3}>
              <FormLabel>Type</FormLabel>
              <Select
                value={newTypeId}
                onChange={(e) => setNewTypeId(e.target.value)}
                isDisabled={creating}
              >
                {data.typeDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Might</FormLabel>
              <Select
                value={newMightId}
                onChange={(e) => setNewMightId(e.target.value)}
              >
                {["Origin", "Adventure", "Greatness"].map((name) => {
                  const def = data.mightDefs.find((d) => d.name === name);
                  return def ? (
                    <option key={def.id} value={def.id}>
                      {def.name}
                    </option>
                  ) : null;
                })}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={addModal.onClose}
              isDisabled={creating}
            >
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleCreateTheme}
              isLoading={creating}
              loadingText="Creating"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Character Settings Modal */}
      <Modal
        isOpen={settings.isOpen}
        onClose={() => !savingName && settings.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit {data.character.name}</ModalHeader>
          <ModalCloseButton isDisabled={savingName} />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                isDisabled={savingName}
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              variant="ghost"
              onClick={settings.onClose}
              isDisabled={savingName}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={() => {
                settings.onClose();
                confirmDelete.onOpen();
              }}
              isDisabled={savingName}
            >
              Delete…
            </Button>
            <Button
              colorScheme="teal"
              onClick={async () => {
                const name = editName.trim();
                if (!name)
                  return toast({ status: "warning", title: "Name required" });
                setSavingName(true);
                const { error } = await supabase
                  .from("characters")
                  .update({ name })
                  .eq("id", data!.character.id);
                setSavingName(false);
                if (error)
                  return toast({ status: "error", title: error.message });
                setData((prev) =>
                  prev
                    ? { ...prev, character: { ...prev.character, name } }
                    : prev
                );
                settings.onClose();
                toast({ status: "success", title: "Character updated" });
              }}
              isLoading={savingName}
              loadingText="Saving"
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={confirmDelete.isOpen}
        onClose={() => !deletingChar && confirmDelete.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete {data.character.name}?</ModalHeader>
          <ModalCloseButton isDisabled={deletingChar} />
          <ModalBody>
            <Text>
              This action permanently deletes the character{" "}
              <strong>{data.character.name}</strong> and all its data.
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              variant="ghost"
              onClick={confirmDelete.onClose}
              isDisabled={deletingChar}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={async () => {
                setDeletingChar(true);
                const { error } = await supabase
                  .from("characters")
                  .delete()
                  .eq("id", data!.character.id);
                setDeletingChar(false);
                if (error)
                  return toast({ status: "error", title: error.message });
                toast({ status: "success", title: "Character deleted" });
                confirmDelete.onClose();
                navigate("/", { replace: true });
              }}
              isLoading={deletingChar}
              loadingText="Deleting"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
