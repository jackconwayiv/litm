import { Button, HStack, Text } from "@chakra-ui/react";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  busy?: boolean;
};

export default function PromiseStepper({
  value,
  onChange,
  min = 0,
  max = 5,
  busy = false,
}: Props) {
  return (
    <HStack
      justify="center"
      align="center"
      spacing={{ base: 1, md: 2 }}
      py={{ base: 0.5, md: 1 }}
      w="full"
      minW={0}
    >
      <Text fontSize={{ base: "xs", md: "sm" }} whiteSpace="nowrap">
        Promise
      </Text>

      <HStack spacing={{ base: 1, md: 2 }}>
        <Button
          size="xs"
          variant="outline"
          onClick={() => onChange(Math.max(min, value - 1))}
          isDisabled={busy || value <= min}
          flexShrink={0}
        >
          –
        </Button>

        <Text
          fontSize={{ base: "sm", md: "md" }}
          fontWeight="bold"
          minW="20px"
          textAlign="center"
        >
          {value}
        </Text>

        <Button
          size="xs"
          variant="outline"
          onClick={() => onChange(Math.min(max, value + 1))}
          isDisabled={busy || value >= max}
          flexShrink={0}
        >
          +
        </Button>
      </HStack>
    </HStack>
  );
}
