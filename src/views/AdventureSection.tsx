import { Box, Button, HStack, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import type { JoinedAdventure } from "../types/types";

type Props = {
  joined: JoinedAdventure | null;
  joinCodeDefault?: string;
  onJoin: (code: string) => Promise<void>;
  onLeave: () => Promise<void>;
  busyJoin?: boolean;
  busyLeave?: boolean;
};

export default function AdventureSection({
  joined,
  joinCodeDefault = "",
  onJoin,
  onLeave,
  busyJoin = false,
  busyLeave = false,
}: Props) {
  const [code, setCode] = useState<string>(joinCodeDefault);

  if (joined) {
    return (
      <HStack
        mt={2}
        mb={2}
        p={2}
        borderWidth="1px"
        rounded="md"
        bg="blackAlpha.50"
        justify="space-between"
      >
        <Box>
          <Heading size="sm">Enrolled in {joined.name || "Adventure"}</Heading>
          {joined.subscribe_code ? (
            <Text fontSize="xs" color="gray.500">
              Code: {joined.subscribe_code}
            </Text>
          ) : null}
        </Box>
        <Button
          size="sm"
          colorScheme="red"
          onClick={onLeave}
          isLoading={busyLeave}
        >
          Leave
        </Button>
      </HStack>
    );
  }

  return (
    <HStack
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        onJoin(code.trim().toUpperCase());
      }}
      mt={2}
      mb={2}
      p={2}
      gap={2}
      borderWidth="1px"
      rounded="md"
      bg="blackAlpha.50"
    >
      <Input
        size="sm"
        value={code}
        onChange={(e) =>
          setCode(
            e.target.value
              .toUpperCase()
              .replace(/[^A-Z]/g, "")
              .slice(0, 4)
          )
        }
        placeholder="ABCD"
        maxLength={4}
        fontFamily="mono"
        w="140px"
      />
      <Button size="sm" colorScheme="teal" type="submit" isLoading={busyJoin}>
        Join
      </Button>
    </HStack>
  );
}
