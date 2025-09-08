import { HStack, Tab, TabList, Tabs, Text } from "@chakra-ui/react";
import { PiBackpackFill, PiSpiralBold } from "react-icons/pi";
import type { TabKey, ThemeRow } from "../types/types";
import { TAB_ORDER, isThemeTab } from "../types/types";

const truncate = (s: string) => (s.length <= 20 ? s : s.slice(0, 20));

type Props = {
  themes: (ThemeRow | null)[];
  active: TabKey;
  onChange: (next: TabKey, index: number) => void;
  onEmptyThemeClick: (slotIndex1Based: number) => void;
};

export default function ThemeTabs({
  themes,
  active,
  onChange,
  onEmptyThemeClick,
}: Props) {
  const index = TAB_ORDER.indexOf(active);

  return (
    <HStack
      px={2}
      py={1}
      position="sticky"
      top={0}
      zIndex={10}
      bg="chakra-body-bg"
    >
      <Tabs
        index={index}
        onChange={(i) => onChange(TAB_ORDER[i], i)}
        variant="soft-rounded"
        isFitted
        overflowX="auto"
        w="100%"
      >
        <TabList>
          {(() => {
            let t = 0; // theme slot pointer
            return TAB_ORDER.map((k) => {
              let theme: ThemeRow | null = null;
              let slotIndex1Based: number | null = null;

              if (isThemeTab(k)) {
                theme = themes[t] ?? null;
                slotIndex1Based = t + 1;
                t += 1;
              }

              const opacity = isThemeTab(k) ? (theme ? 1 : 0.6) : 1;

              return (
                <Tab
                  key={k}
                  opacity={opacity}
                  fontSize={{ base: "12", md: "14" }}
                  p={1}
                  onClick={() => {
                    if (isThemeTab(k) && !theme && slotIndex1Based) {
                      onEmptyThemeClick(slotIndex1Based);
                    }
                  }}
                  aria-label={k}
                >
                  {k === "bio" ? (
                    "Bio"
                  ) : k === "backpack" ? (
                    <HStack gap={1}>
                      <PiBackpackFill />
                      <Text display={{ base: "none", md: "inline" }}>
                        Backpack
                      </Text>
                    </HStack>
                  ) : k === "statuses" ? (
                    <HStack gap={1}>
                      <PiSpiralBold />
                      <Text display={{ base: "none", md: "inline" }}>
                        Statuses
                      </Text>
                    </HStack>
                  ) : theme ? (
                    truncate(theme.name)
                  ) : (
                    "No Theme"
                  )}
                </Tab>
              );
            });
          })()}
        </TabList>
      </Tabs>
    </HStack>
  );
}
