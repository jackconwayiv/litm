import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import SingleStatus from "../SingleStatus";

type StatusRow = {
  id: string;
  character_id: string | null;
  name: string;
  is_negative: boolean;
  tier1: boolean;
  tier2: boolean;
  tier3: boolean;
  tier4: boolean;
  tier5: boolean;
  tier6: boolean;
  created_at?: string;
};

export default function Statuses({ characterId }: { characterId: string }) {
  const toast = useToast();
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({
        status: "error",
        title: "Load failed",
        description: error.message,
      });
    } else {
      setRows((data || []) as StatusRow[]);
    }
    setLoading(false);
  }, [characterId, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const payload = {
      character_id: characterId,
      name,
      is_negative: false,
      tier1: false,
      tier2: false,
      tier3: false,
      tier4: false,
      tier5: false,
      tier6: false,
    };
    const { data, error } = await supabase
      .from("statuses")
      .insert(payload)
      .select()
      .single();
    setAdding(false);
    if (error) {
      toast({
        status: "error",
        title: "Add failed",
        description: error.message,
      });
    } else {
      setRows((r) => [...r, data as StatusRow]);
      setNewName("");
      toast({ status: "success", title: "Status added" });
    }
  };

  const handleDeleted = (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <Box w="full" maxW="100%" overflowX="hidden">
      <Heading size="md" mb={{ base: 2, md: 3 }}>
        Statuses
      </Heading>

      {loading ? (
        <HStack spacing={2}>
          <Spinner size="sm" />
          <Text fontSize="sm">Loading statuses…</Text>
        </HStack>
      ) : (
        <VStack align="stretch" spacing={{ base: 2, md: 3 }} w="full" minW={0}>
          {rows.length === 0 ? (
            <Box color="gray.500" fontSize="sm">
              No statuses yet.
            </Box>
          ) : null}

          {rows.map((r) => (
            <SingleStatus
              key={r.id}
              statusId={r.id}
              onDeleted={handleDeleted}
            />
          ))}
        </VStack>
      )}

      {/* Add row */}
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 2, md: 3 }}
        mt={{ base: 3, md: 4 }}
        w="full"
        minW={0}
        align={{ base: "stretch", md: "center" }}
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <Input
          placeholder="New status name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          size="sm"
          flex="1 1 0"
          minW={0}
        />
        <HStack spacing={2}>
          <Button
            onClick={add}
            size="sm"
            colorScheme="teal"
            isLoading={adding}
            isDisabled={!newName.trim()}
            flexShrink={0}
          >
            +
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
}
