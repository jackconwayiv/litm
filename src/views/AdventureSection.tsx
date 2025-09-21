import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { JoinedAdventure } from "../types/types";

type Props = {
  joined: JoinedAdventure | null;
  joinCodeDefault?: string;
  onJoin: (code: string) => Promise<void>;
  busyJoin?: boolean;
};

export default function AdventureSection({
  joined,
  joinCodeDefault = "",
  onJoin,
  busyJoin = false,
}: Props) {
  const [code, setCode] = useState<string>(joinCodeDefault);
  const navigate = useNavigate();

  // Keep local code in sync if parent default changes (e.g., after hydrate)
  useEffect(() => {
    setCode(joinCodeDefault);
  }, [joinCodeDefault]);

  // When enrolled, render a compact, clickable card
  if (joined) {
    return (
      <Card
        role="button"
        tabIndex={0}
        onClick={() => joined.id && navigate(`/adventures/${joined.id}`)}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if ((e.key === "Enter" || e.key === " ") && joined.id) {
            navigate(`/adventures/${joined.id}`);
          }
        }}
        borderWidth="1px"
        rounded="md"
        bg="blackAlpha.50"
        _hover={{ shadow: "md" }}
        cursor="pointer"
        mt={{ base: 2, md: 3 }}
        mb={{ base: 2, md: 3 }}
      >
        <CardBody py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }}>
          <HStack justify="space-between" align="center" w="full" minW={0}>
            <Text
              fontWeight="semibold"
              noOfLines={1}
              title={joined.name || "Adventure"}
            >
              Enrolled in {joined.name || "Adventure"}
            </Text>
            {joined.subscribe_code ? (
              <HStack spacing={2} flexShrink={0}>
                <Text fontSize="xs" color="gray.500">
                  Code:
                </Text>
                <Badge fontSize="0.8em">
                  {joined.subscribe_code.toUpperCase()}
                </Badge>
              </HStack>
            ) : null}
          </HStack>
        </CardBody>
      </Card>
    );
  }

  // Not enrolled: input row with bold label, then input, then Join button
  return (
    <Box
      as="form"
      onSubmit={(e: React.FormEvent<HTMLDivElement>) => {
        e.preventDefault();
        onJoin(code.trim().toUpperCase());
      }}
      mt={{ base: 2, md: 3 }}
      mb={{ base: 2, md: 3 }}
      p={{ base: 2, md: 3 }}
      borderWidth="1px"
      rounded="md"
      bg="blackAlpha.50"
    >
      <HStack w="full" minW={0} spacing={{ base: 2, md: 3 }}>
        <Text fontWeight="bold" whiteSpace="nowrap">
          Adventure Code:
        </Text>
        <Input
          aria-label="Join code"
          size="sm"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
          flex="0 0 160px"
          w={{ base: "160px", md: "180px" }}
          minW={0}
        />
        <Button
          size="sm"
          colorScheme="teal"
          type="submit"
          isLoading={busyJoin}
          flexShrink={0}
          minW="80px"
        >
          Join
        </Button>
      </HStack>
    </Box>
  );
}
