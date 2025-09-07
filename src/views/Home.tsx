// src/views/Home.tsx
import { AddIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Character } from "../types/types";

export default function Home() {
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newName, setNewName] = useState("");
  const toast = useToast({
    duration: 2000,
    position: "top-right",
    isClosable: true,
  });
  const nav = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("characters")
      .select("id,name,player_id,fellowship_id,promise,created_at")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setChars((data ?? []) as Character[]);
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", uid)
      .single();
    setUsername(profile?.display_name);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createCharacter() {
    setErr(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      toast({ status: "warning", title: "Name required" });
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) {
      setSaving(false);
      setErr("Not authenticated.");
      return;
    }

    const { data, error } = await supabase
      .from("characters")
      .insert({ name: trimmed, player_id: uid, fellowship_id: null })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }

    setNewName("");
    onClose();
    toast({ status: "success", title: "Character created" });

    // Navigate to the new character dashboard
    if (data?.id) {
      nav(`/c/${data.id}`);
      return;
    }

    // Fallback refresh
    load();
  }

  if (loading) {
    return (
      <HStack p={6} spacing={3}>
        <Spinner /> <Text>Loading…</Text>
      </HStack>
    );
  }

  return (
    <Box p={4}>
      <HStack paddingBottom={5}>
        <Heading>Welcome, {username}!</Heading>
      </HStack>
      {err && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {err}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={3}>
        {/* Add Character tile */}
        <Card
          as="button"
          onClick={onOpen}
          _hover={{ boxShadow: "md" }}
          borderStyle="dashed"
          borderWidth="2px"
          borderColor="gray.300"
        >
          <CardHeader pt={6} pb={0}>
            <Center>
              <Icon as={AddIcon} boxSize={6} color="gray.500" />
            </Center>
          </CardHeader>
          <CardBody>
            <Center>
              <Text fontWeight="bold" color="gray.600">
                Add character
              </Text>
            </Center>
          </CardBody>
          <CardFooter />
        </Card>

        {/* Existing characters */}
        {chars.map((c) => (
          <Card key={c.id} as="button" onClick={() => nav(`/c/${c.id}`)}>
            <CardBody>
              <Heading size="sm" noOfLines={1}>
                {c.name}
              </Heading>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Promise: {c.promise}
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Create Character Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!saving) onClose();
        }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create character</ModalHeader>
          <ModalCloseButton isDisabled={saving} />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Character name"
                  autoFocus
                  isDisabled={saving}
                />
              </FormControl>
              {/* Add more essential fields from characters table here if needed */}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              isDisabled={saving}
            >
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={createCharacter}
              isLoading={saving}
              loadingText="Creating"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
