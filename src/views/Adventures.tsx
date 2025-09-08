// src/views/Adventures.tsx
import {
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  EditIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
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
  Spacer,
  Spinner,
  Tag,
  TagLabel,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Adventure = {
  id: string;
  owner_player_id: string;
  name: string;
  subscribe_code: string;
  created_at: string;
};

export default function Adventures() {
  const [rows, setRows] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [uid, setUid] = useState<string | null>(null);
  const nav = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u?.user) {
      setUid(null);
      setErr("Not authenticated.");
      setLoading(false);
      return;
    }
    setUid(u.user.id);

    const { data, error } = await supabase
      .from("adventures")
      .select("id,owner_player_id,name,subscribe_code,created_at")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    setRows((data ?? []) as Adventure[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("rt:adventures")
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

  async function ensureProfileId(): Promise<string | null> {
    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u?.user) return null;
    const id = u.user.id;

    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!prof) {
      const meta = u.user.user_metadata as Record<string, unknown>;
      const display_name =
        (typeof meta.name === "string" && meta.name) ||
        (u.user.email ? u.user.email.split("@")[0] : "Player");
      const { error: insErr } = await supabase
        .from("profiles")
        .insert({ id, display_name });
      if (insErr) return null;
    }
    return id;
  }

  async function createAdventure() {
    setErr(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setErr("Name required.");
      return;
    }
    setSavingCreate(true);

    const pid = await ensureProfileId();
    if (!pid) {
      setSavingCreate(false);
      setErr("Not signed in.");
      return;
    }

    const { error } = await supabase
      .from("adventures")
      .insert({ name: trimmed, owner_player_id: pid });

    setSavingCreate(false);
    if (error) setErr(error.message);
    else setNewName("");
  }

  function beginEdit(a: Adventure) {
    setEditId(a.id);
    setEditName(a.name);
  }

  async function saveEdit() {
    if (!editId) return;
    setErr(null);
    const trimmed = editName.trim();
    if (!trimmed) {
      setErr("Name required.");
      return;
    }
    setSavingEditId(editId);

    const { error } = await supabase
      .from("adventures")
      .update({ name: trimmed })
      .eq("id", editId);

    setSavingEditId(null);
    if (error) setErr(error.message);
    setEditId(null);
    setEditName("");
  }

  async function deleteAdventure(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    setErr(null);
    const { error } = await supabase.from("adventures").delete().eq("id", id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (error) setErr(error.message);
  }

  const go = (id: string) => nav(`/adventures/${id}`);

  if (loading) {
    return (
      <HStack p={6} spacing={3}>
        <Spinner /> <Text>Loading…</Text>
      </HStack>
    );
  }

  return (
    <Box p={4}>
      <HStack mb={4}>
        <Button leftIcon={<RepeatIcon />} onClick={load} variant="outline">
          Refresh
        </Button>
        <Tag size="md" colorScheme="gray">
          <TagLabel>{rows.length} adventures</TagLabel>
        </Tag>
        <Spacer />
      </HStack>

      {err && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {err}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
        {/* Add Adventure card */}
        <Card borderStyle="dashed" borderWidth="2px" borderColor="gray.300">
          <CardHeader pb={2}>
            <Heading size="sm">Add adventure</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={2}>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Adventure name"
                isDisabled={savingCreate}
              />
            </VStack>
          </CardBody>
          <CardFooter pt={0}>
            <Button
              colorScheme="teal"
              onClick={createAdventure}
              isLoading={savingCreate}
              loadingText="Creating"
            >
              Create
            </Button>
          </CardFooter>
        </Card>

        {/* Existing adventures */}
        {rows.map((a) => {
          const isOwner = uid === a.owner_player_id;
          const isEditing = editId === a.id;
          const isDeleting = deletingId === a.id;
          const askConfirm = confirmDeleteId === a.id;
          return (
            <Card key={a.id} _hover={{ boxShadow: "md" }}>
              <CardHeader pb={2}>
                <HStack>
                  {isEditing ? (
                    <Input
                      size="sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <Heading size="sm" noOfLines={1}>
                      {a.name}
                    </Heading>
                  )}
                  <Spacer />
                  <Tag size="sm" colorScheme="purple">
                    <TagLabel>{a.subscribe_code}</TagLabel>
                  </Tag>
                </HStack>
              </CardHeader>

              <CardBody
                pt={0}
                onClick={() => !isEditing && go(a.id)}
                cursor="pointer"
              >
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">
                    Created {new Date(a.created_at).toLocaleString()}
                  </Text>
                  {!isOwner && (
                    <Tag size="sm" colorScheme="gray">
                      <TagLabel>Viewer</TagLabel>
                    </Tag>
                  )}
                </VStack>
              </CardBody>

              <CardFooter pt={0}>
                <HStack w="full" justify="space-between">
                  {isEditing ? (
                    <HStack>
                      <IconButton
                        aria-label="Save"
                        icon={<CheckIcon />}
                        size="sm"
                        colorScheme="teal"
                        onClick={saveEdit}
                        isLoading={savingEditId === a.id}
                      />
                      <IconButton
                        aria-label="Cancel"
                        icon={<CloseIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditId(null);
                          setEditName("");
                        }}
                      />
                    </HStack>
                  ) : (
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => go(a.id)}
                    >
                      Open
                    </Button>
                  )}

                  {isOwner && !isEditing && (
                    <HStack>
                      <IconButton
                        aria-label="Rename"
                        icon={<EditIcon />}
                        size="sm"
                        variant="outline"
                        onClick={() => beginEdit(a)}
                      />
                      <IconButton
                        aria-label={askConfirm ? "Confirm delete" : "Delete"}
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme={askConfirm ? "red" : "gray"}
                        onClick={() => deleteAdventure(a.id)}
                        isLoading={isDeleting}
                      />
                    </HStack>
                  )}
                </HStack>
              </CardFooter>
            </Card>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
