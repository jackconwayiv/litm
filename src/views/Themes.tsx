// src/components/Themes.tsx
import {
  Alert,
  AlertIcon,
  Button,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ThemeRow } from "./SingleTheme";
import SingleTheme from "./SingleTheme";

type Theme = ThemeRow;
type Def = { id: string; name: string };

export default function Themes({ characterId }: { characterId: string }) {
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const toast = useToast({
    position: "top-right",
    duration: 2200,
    isClosable: true,
  });

  // defs + form state
  const [mightDefs, setMightDefs] = useState<Def[]>([]);
  const [typeDefs, setTypeDefs] = useState<Def[]>([]);
  const [tName, setTName] = useState("");
  const [tMightId, setTMightId] = useState<string>("");
  const [tTypeId, setTTypeId] = useState<string>("");

  const loadDefs = useCallback(async () => {
    setErr(null);
    const [{ data: ml, error: mlErr }, { data: tt, error: ttErr }] =
      await Promise.all([
        supabase.from("might_level_defs").select("id,name"),
        supabase.from("theme_type_defs").select("id,name").order("name"),
      ]);
    if (mlErr) setErr(mlErr.message);
    if (ttErr) setErr(ttErr.message);

    const order = ["Origin", "Adventure", "Greatness"];
    const sortedMl = (ml ?? []).sort(
      (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
    );

    setMightDefs(sortedMl);
    setTypeDefs(tt ?? []);
    if (sortedMl && sortedMl.length && !tMightId) setTMightId(sortedMl[0].id);
    if (tt && tt.length && !tTypeId) setTTypeId(tt[0].id);
  }, [tMightId, tTypeId]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("themes")
      .select(
        "id,name,quest,improve,abandon,milestone,is_retired,is_scratched,might_level_id,type_id"
      )
      .eq("character_id", characterId)
      .order("created_at", { ascending: true });
    if (error) setErr(error.message);
    setThemes((data ?? []) as Theme[]);
    setLoading(false);
  }, [characterId]);

  useEffect(() => {
    loadDefs();
  }, [loadDefs]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`rt:themes:${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "themes",
          filter: `character_id=eq.${characterId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, characterId]);

  async function addTheme() {
    setErr(null);

    const { data: sessRes, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) return setErr(sessErr.message);
    if (!sessRes?.session) return setErr("Sign in required.");

    const name = tName.trim();
    if (!name) return setErr("Theme name required.");
    if (!themes) return;
    if (themes.length >= 4) return setErr("Limit 4 themes per character.");
    if (!tMightId || !tTypeId) return setErr("Pick might and type.");

    // optimistic row
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const optimistic = {
      id: tempId,
      name,
      quest: null,
      improve: 0,
      abandon: 0,
      milestone: 0,
      is_retired: false,
      is_scratched: false,
      might_level_id: tMightId,
      type_id: tTypeId,
    } as Theme; // Theme = ThemeRow

    setThemes((prev) => (prev ? [...prev, optimistic] : [optimistic]));
    setTName(""); // clear immediately

    const { error } = await supabase.from("themes").insert({
      id: tempId, // supply same id so realtime won't duplicate
      name,
      character_id: characterId,
      might_level_id: tMightId,
      type_id: tTypeId,
      quest: null,
      improve: 0,
      abandon: 0,
      milestone: 0,
      is_retired: false,
      is_scratched: false,
    });

    if (error) {
      // rollback
      setThemes((prev) => prev?.filter((t) => t.id !== tempId) ?? null);
      setErr(error.message);
      // optional toast if you already use one:
      toast({
        status: "error",
        title: "Add failed",
        description: error.message,
      });
      return;
    }

    // success: no reload needed; realtime will confirm. If you prefer, you can call load().
    // await load();
  }

  async function deleteTheme(id: string) {
    setErr(null);
    // optimistic remove
    const prev = themes;
    setThemes((curr) => (curr ? curr.filter((t) => t.id !== id) : curr));

    const { error } = await supabase.from("themes").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      setThemes(prev); // rollback
      toast({
        status: "error",
        title: "Delete failed",
        description: error.message,
      });
      throw error;
    }
    // toast({ status: "success", title: "Theme deleted" });
    // no immediate reload; realtime or next interaction will keep it fresh
  }

  const canAdd = !!themes && themes.length < 4;

  return (
    <VStack align="start" spacing={2} w="full">
      {err && (
        <Alert status="error" variant="subtle">
          <AlertIcon />
          {err}
        </Alert>
      )}

      {loading ? (
        <HStack spacing={2}>
          <Spinner size="xs" />
          <Text fontSize="sm">Themes…</Text>
        </HStack>
      ) : (
        <>
          {(!themes || themes.length === 0) && (
            <Text fontSize="sm" color="gray.500">
              No themes
            </Text>
          )}
          {/* Add Theme Row */}
          {canAdd && (
            <HStack
              as="form"
              onSubmit={(e) => {
                e.preventDefault();
                void addTheme();
              }}
              spacing={2}
              w="full"
            >
              <Input
                size="sm"
                placeholder="Theme name"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                maxW="220px"
              />
              <Select
                size="sm"
                value={tTypeId}
                onChange={(e) => setTTypeId(e.target.value)}
                maxW="180px"
              >
                {typeDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select
                size="sm"
                value={tMightId}
                onChange={(e) => setTMightId(e.target.value)}
                maxW="180px"
              >
                {mightDefs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" colorScheme="teal">
                Add
              </Button>
            </HStack>
          )}
          {/* Render Theme Cards */}
          {themes && themes.length > 0 && (
            <SimpleGrid
              w="full"
              columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
              spacing={3}
            >
              {themes.map((t) => (
                <SingleTheme
                  key={t.id}
                  theme={t}
                  mightDefs={mightDefs}
                  typeDefs={typeDefs}
                  onChanged={load}
                  onDelete={(id) => deleteTheme(id)}
                />
              ))}
            </SimpleGrid>
          )}
        </>
      )}
    </VStack>
  );
}
