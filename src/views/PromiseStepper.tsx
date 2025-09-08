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
    <HStack justify="center" py={1} gap={2}>
      <Text fontSize="xs">Promise</Text>
      <HStack gap={1}>
        <Button
          size="xs"
          onClick={() => onChange(Math.max(min, value - 1))}
          isDisabled={busy || value <= min}
        >
          –
        </Button>
        <Text fontSize="sm" fontWeight="bold">
          {value}
        </Text>
        <Button
          size="xs"
          onClick={() => onChange(Math.min(max, value + 1))}
          isDisabled={busy || value >= max}
        >
          +
        </Button>
      </HStack>
    </HStack>
  );
}
