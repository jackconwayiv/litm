import {
  Box,
  Button,
  HStack,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
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

  // Keep local code in sync if parent default changes (e.g., after hydrate)
  useEffect(() => {
    setCode(joinCodeDefault);
  }, [joinCodeDefault]);

  if (joined) {
    return (
      <HStack
        mt={{ base: 2, md: 3 }}
        mb={{ base: 2, md: 3 }}
        p={{ base: 2, md: 3 }}
        borderWidth="1px"
        rounded="md"
        bg="blackAlpha.50"
        justify="space-between"
        align="center"
        w="full"
        minW={0}
        spacing={{ base: 2, md: 3 }}
      >
        <Box flex="1 1 0" minW={0}>
          <Heading size="sm" noOfLines={1} title={joined.name || "Adventure"}>
            Enrolled in {joined.name || "Adventure"}
          </Heading>
          {joined.subscribe_code ? (
            <Text fontSize="xs" color="gray.500" mt={0.5}>
              Code: {joined.subscribe_code}
            </Text>
          ) : null}
        </Box>
        <Button
          size="sm"
          colorScheme="red"
          onClick={onLeave}
          isLoading={busyLeave}
          flexShrink={0}
        >
          Leave
        </Button>
      </HStack>
    );
  }

  return (
    <Stack
      as="form"
      direction={{ base: "column", md: "row" }}
      onSubmit={(e) => {
        e.preventDefault();
        onJoin(code.trim().toUpperCase());
      }}
      mt={{ base: 2, md: 3 }}
      mb={{ base: 2, md: 3 }}
      p={{ base: 2, md: 3 }}
      spacing={{ base: 2, md: 3 }}
      borderWidth="1px"
      rounded="md"
      bg="blackAlpha.50"
      align={{ base: "stretch", md: "center" }}
      w="full"
      minW={0}
    >
      <HStack w="full" minW={0} spacing={{ base: 2, md: 3 }}>
        <Input
          aria-label="Join code"
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
          pattern="[A-Za-z]{4}"
          fontFamily="mono"
          textAlign="center"
          letterSpacing="widest"
          flex="0 0 120px"
          w={{ base: "120px", md: "140px" }}
          minW={0}
        />
        <Button
          size="sm"
          colorScheme="teal"
          type="submit"
          isLoading={busyJoin}
          flexShrink={0}
        >
          Join
        </Button>
      </HStack>

      {/* Optional helper text for mobile UX */}
      <Text
        fontSize="xs"
        color="gray.600"
        display={{ base: "block", md: "none" }}
      >
        Enter the 4-letter adventure code.
      </Text>
    </Stack>
  );
}
