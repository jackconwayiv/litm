// src/views/Profile.tsx
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  id: string;
  display_name: string;
  active_character_id: string | null;
};

export default function Profile() {
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      setErr("Not authenticated.");
      setLoading(false);
      return;
    }

    const uid = user.id;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,active_character_id")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      const meta = user.user_metadata as Record<string, unknown>;
      const display_name =
        (typeof meta.name === "string" && meta.name) ||
        (typeof user.email === "string" && user.email.split("@")[0]) ||
        "Player";

      const { error: upErr } = await supabase
        .from("profiles")
        .insert({ id: uid, display_name });
      if (upErr) {
        setErr(upErr.message);
        setLoading(false);
        return;
      }
      setMe({ id: uid, display_name, active_character_id: null });
      setName(display_name);
    } else {
      const row = data as ProfileRow;
      setMe(row);
      setName(row.display_name ?? "");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!me) return;
    const display_name = name.trim();
    if (!display_name) {
      setErr("Name required.");
      return;
    }
    setErr(null);
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name })
      .eq("id", me.id);

    setSaving(false);
    if (error) {
      setErr(error.message);
    } else {
      setMe({ ...me, display_name });
      toast({ title: "Saved", status: "success", duration: 2000 });
    }
  }

  if (loading) {
    return (
      <Center py={{ base: 10, md: 16 }}>
        <HStack spacing={2}>
          <Spinner size="sm" />
          <Text fontSize="sm">Loading profile…</Text>
        </HStack>
      </Center>
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
      <Heading size="lg" mb={{ base: 2, md: 4 }}>
        Your Profile
      </Heading>

      {err && (
        <Alert status="error" mb={{ base: 3, md: 4 }}>
          <AlertIcon />
          {err}
        </Alert>
      )}

      {me ? (
        <Card variant="outline" w="full" minW={0}>
          <CardHeader pb={{ base: 1, md: 2 }}>
            <Heading size="md">Account</Heading>
            <Text fontSize="sm" color="gray.500" noOfLines={1} minW={0}>
              Current Profile Name: {me.display_name}
            </Text>
          </CardHeader>
          <Divider />
          <CardBody>
            <Stack spacing={{ base: 3, md: 4 }} w="full" minW={0}>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Update Profile Name
                </FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  size="sm"
                />
              </FormControl>

              <HStack justify="flex-end" spacing={2}>
                <Button
                  colorScheme="teal"
                  onClick={save}
                  isLoading={saving}
                  loadingText="Saving"
                  size="sm"
                >
                  Save
                </Button>
              </HStack>
            </Stack>
          </CardBody>
        </Card>
      ) : (
        <Alert status="warning">
          <AlertIcon />
          No profile found.
        </Alert>
      )}
    </Box>
  );
}
