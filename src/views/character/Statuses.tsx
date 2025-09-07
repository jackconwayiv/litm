import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  Spinner,
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
    if (!newName.trim()) return;
    const payload = {
      character_id: characterId,
      name: newName.trim(),
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
    <Box p={4}>
      <Heading size="md" mb={3}>
        Statuses
      </Heading>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <VStack align="stretch" spacing={3}>
          {rows.length === 0 ? (
            <Box color="gray.500">No statuses yet.</Box>
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
      <HStack align="stretch" spacing={3} mt={4}>
        <Input
          placeholder="New status name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          size="sm"
        />
        <Button onClick={add} size="sm" colorScheme="teal">
          Add Status
        </Button>
      </HStack>
    </Box>
  );
}
