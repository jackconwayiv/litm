// src/views/Welcome.tsx
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Spinner,
  Tag,
  TagLabel,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { buildCharacterBrief } from "../utils/character";

type MiniCharacter = {
  id: string;
  name: string;
  player_id: string;
  created_at: string;
  brief_trait_physical: string | null;
  brief_trait_personality: string | null;
  brief_race: string | null;
  brief_class: string | null;
};

type MiniAdventure = {
  id: string;
  owner_player_id: string;
  name: string;
  subscribe_code: string;
  created_at: string;
};

export default function Welcome() {
  const nav = useNavigate();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Characters (latest 2)
  const [chars, setChars] = useState<MiniCharacter[]>([]);
  const [editCharId, setEditCharId] = useState<string | null>(null);
  const [editCharName, setEditCharName] = useState("");
  const [savingCharId, setSavingCharId] = useState<string | null>(null);

  // Adventures (latest 2)
  const [advs, setAdvs] = useState<MiniAdventure[]>([]);
  const [editAdvId, setEditAdvId] = useState<string | null>(null);
  const [editAdvName, setEditAdvName] = useState("");
  const [savingAdvId, setSavingAdvId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u?.user) {
      setUid(null);
      setUsername(null);
      setChars([]);
      setAdvs([]);
      setErr("Not signed in.");
      setLoading(false);
      return;
    }

    const myId = u.user.id;
    setUid(myId);

    // Username: profile first, then auth.name, then email prefix
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", myId)
      .maybeSingle();
    if (prof?.display_name) {
      setUsername(prof.display_name);
    } else {
      const meta = u.user.user_metadata as Record<string, unknown>;
      setUsername(
        (typeof meta.name === "string" && meta.name) ||
          (u.user.email ? u.user.email.split("@")[0] : "Player")
      );
    }

    // Characters: my two most recent, include brief fields
    const { data: cRows, error: cErr } = await supabase
      .from("characters")
      .select(
        "id,name,player_id,created_at,brief_trait_physical,brief_trait_personality,brief_race,brief_class"
      )
      .eq("player_id", myId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (cErr) {
      setErr(cErr.message);
      setLoading(false);
      return;
    }
    setChars((cRows ?? []) as MiniCharacter[]);

    // Adventures: my two most recent
    const { data: aRows, error: aErr } = await supabase
      .from("adventures")
      .select("id,owner_player_id,name,subscribe_code,created_at")
      .eq("owner_player_id", myId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (aErr) {
      setErr(aErr.message);
      setLoading(false);
      return;
    }
    setAdvs((aRows ?? []) as MiniAdventure[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // optional: live-ish refresh on changes
    const ch = supabase
      .channel("rt:welcome")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "adventures" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  // Inline save handlers
  async function saveCharacterName() {
    if (!editCharId) return;
    const trimmed = editCharName.trim();
    if (!trimmed) return;

    setSavingCharId(editCharId);
    const { error } = await supabase
      .from("characters")
      .update({ name: trimmed })
      .eq("id", editCharId);

    setSavingCharId(null);
    setEditCharId(null);
    setEditCharName("");
    if (error) setErr(error.message);
    else load();
  }

  async function saveAdventureName() {
    if (!editAdvId) return;
    const trimmed = editAdvName.trim();
    if (!trimmed) return;

    setSavingAdvId(editAdvId);
    const { error } = await supabase
      .from("adventures")
      .update({ name: trimmed })
      .eq("id", editAdvId);

    setSavingAdvId(null);
    setEditAdvId(null);
    setEditAdvName("");
    if (error) setErr(error.message);
    else load();
  }

  const goCharacter = (id: string) => nav(`/c/${id}#bio`);
  const goCharacters = () => nav("/characters");
  const goAdventure = (id: string) => nav(`/adventures/${id}`);
  const goAdventures = () => nav("/adventures");

  if (loading) {
    return (
      <HStack p={{ base: 4, md: 6 }} spacing={2}>
        <Spinner size="sm" /> <Text fontSize="sm">Loading…</Text>
      </HStack>
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
      <HStack paddingBottom={5}>
        <Heading size="lg">Welcome{username ? `, ${username}` : ""}!</Heading>
      </HStack>

      {err && (
        <Alert status="error" mb={{ base: 3, md: 4 }}>
          <AlertIcon /> {err}
        </Alert>
      )}

      {/* Characters Section */}
      <HStack
        justify="space-between"
        align="center"
        mb={{ base: 2, md: 3 }}
        spacing={{ base: 2, md: 3 }}
      >
        <Heading as="h2" size="md">
          Recent Characters
        </Heading>
        <Button size="sm" variant="outline" onClick={goCharacters}>
          See all
        </Button>
      </HStack>

      {uid && chars.length === 0 ? (
        <Text color="gray.600" fontSize="sm" mb={{ base: 3, md: 4 }}>
          You haven’t created any characters yet.
        </Text>
      ) : (
        <SimpleGrid
          columns={{ base: 1, sm: 2 }}
          spacing={{ base: 2, md: 3 }}
          mb={{ base: 4, md: 6 }}
        >
          {chars.map((c) => {
            const isEditing = editCharId === c.id;
            const brief = buildCharacterBrief(
              {
                brief_trait_physical: c.brief_trait_physical ?? "",
                brief_trait_personality: c.brief_trait_personality ?? "",
                brief_race: c.brief_race ?? "",
                brief_class: c.brief_class ?? "",
              },
              { capitalizeTraits: true, titleCaseRaceClass: true }
            );

            return (
              <Card
                key={c.id}
                _hover={{ boxShadow: !isEditing ? "md" : undefined }}
              >
                <CardHeader pb={2}>
                  <HStack w="full" minW={0} spacing={2}>
                    {isEditing ? (
                      <Input
                        size="sm"
                        value={editCharName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditCharName(e.target.value)
                        }
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>
                        ) => {
                          if (e.key === "Enter") void saveCharacterName();
                          if (e.key === "Escape") {
                            setEditCharId(null);
                            setEditCharName("");
                          }
                        }}
                        autoFocus
                        flex="1 1 0"
                        minW={0}
                      />
                    ) : (
                      <Heading size="sm" noOfLines={1} minW={0} flex="1 1 0">
                        {c.name}
                      </Heading>
                    )}

                    {/* Created date tag */}
                    <Tag size="sm" colorScheme="gray" flexShrink={0}>
                      <TagLabel>
                        {new Date(c.created_at).toLocaleDateString()}
                      </TagLabel>
                    </Tag>
                  </HStack>
                </CardHeader>

                <CardBody
                  pt={0}
                  onClick={() => !isEditing && goCharacter(c.id)}
                  cursor={isEditing ? "default" : "pointer"}
                >
                  <VStack align="start" spacing={1}>
                    {/* Brief line */}
                    <Text fontSize="sm" color="gray.700" noOfLines={2}>
                      {brief || "—"}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Created {new Date(c.created_at).toLocaleString()}
                    </Text>
                  </VStack>
                </CardBody>

                <CardFooter pt={0}>
                  <HStack justify="space-between" w="full">
                    {!isEditing ? (
                      <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => goCharacter(c.id)}
                      >
                        Open
                      </Button>
                    ) : (
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Save character name"
                          icon={<CheckIcon />}
                          size="sm"
                          colorScheme="teal"
                          onClick={() => void saveCharacterName()}
                          isLoading={savingCharId === c.id}
                        />
                        <IconButton
                          aria-label="Cancel edit"
                          icon={<CloseIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditCharId(null);
                            setEditCharName("");
                          }}
                        />
                      </HStack>
                    )}

                    {!isEditing && (
                      <IconButton
                        aria-label="Rename character"
                        icon={<EditIcon />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditCharId(c.id);
                          setEditCharName(c.name);
                        }}
                      />
                    )}
                  </HStack>
                </CardFooter>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* Adventures Section */}
      <HStack
        justify="space-between"
        align="center"
        mb={{ base: 2, md: 3 }}
        spacing={{ base: 2, md: 3 }}
      >
        <Heading as="h2" size="md">
          Recent Adventures
        </Heading>
        <Button size="sm" variant="outline" onClick={goAdventures}>
          See all
        </Button>
      </HStack>

      {uid && advs.length === 0 ? (
        <Text color="gray.600" fontSize="sm">
          You don’t own any adventures yet.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 2, md: 3 }}>
          {advs.map((a) => {
            const isEditing = editAdvId === a.id;
            return (
              <Card
                key={a.id}
                _hover={{ boxShadow: !isEditing ? "md" : undefined }}
              >
                <CardHeader pb={2}>
                  <HStack w="full" minW={0} spacing={2}>
                    {isEditing ? (
                      <Input
                        size="sm"
                        value={editAdvName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditAdvName(e.target.value)
                        }
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>
                        ) => {
                          if (e.key === "Enter") void saveAdventureName();
                          if (e.key === "Escape") {
                            setEditAdvId(null);
                            setEditAdvName("");
                          }
                        }}
                        autoFocus
                        flex="1 1 0"
                        minW={0}
                      />
                    ) : (
                      <Heading size="sm" noOfLines={1} minW={0} flex="1 1 0">
                        {a.name}
                      </Heading>
                    )}

                    <Tag size="sm" colorScheme="purple" flexShrink={0}>
                      <TagLabel>{a.subscribe_code}</TagLabel>
                    </Tag>
                  </HStack>
                </CardHeader>

                <CardBody
                  pt={0}
                  onClick={() => !isEditing && goAdventure(a.id)}
                  cursor={isEditing ? "default" : "pointer"}
                >
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.600">
                      Created {new Date(a.created_at).toLocaleString()}
                    </Text>
                  </VStack>
                </CardBody>

                <CardFooter pt={0}>
                  <HStack justify="space-between" w="full">
                    {!isEditing ? (
                      <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => goAdventure(a.id)}
                      >
                        Open
                      </Button>
                    ) : (
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Save adventure name"
                          icon={<CheckIcon />}
                          size="sm"
                          colorScheme="teal"
                          onClick={() => void saveAdventureName()}
                          isLoading={savingAdvId === a.id}
                        />
                        <IconButton
                          aria-label="Cancel edit"
                          icon={<CloseIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditAdvId(null);
                            setEditAdvName("");
                          }}
                        />
                      </HStack>
                    )}

                    {!isEditing && (
                      <IconButton
                        aria-label="Rename adventure"
                        icon={<EditIcon />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditAdvId(a.id);
                          setEditAdvName(a.name);
                        }}
                      />
                    )}
                  </HStack>
                </CardFooter>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
