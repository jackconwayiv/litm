import {
  Box,
  HStack,
  Tab,
  TabList,
  Tabs,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
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
  const isFitted = useBreakpointValue({ base: false, md: true });
  return (
    <Box
      px={{ base: 1, md: 2 }}
      py={{ base: 1, md: 1 }}
      position="sticky"
      top={0}
      zIndex={10}
      bg="chakra-body-bg"
      borderBottomWidth="1px"
      w="full"
      maxW="100vw"
      overflowX="hidden" // ensure the page never scrolls horizontally
    >
      <Tabs
        index={index}
        onChange={(i) => onChange(TAB_ORDER[i], i)}
        variant="soft-rounded"
        isFitted={isFitted}
        w="full"
      >
        <TabList
          // The bar itself can scroll on small screens
          overflowX="auto"
          overflowY="hidden"
          whiteSpace="nowrap"
          // Hide scrollbar cross-platform without disabling scroll
          sx={{
            WebkitOverflowScrolling: "touch",
            "::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          gap={{ base: 1, md: 2 }}
          px={{ base: 1, md: 1 }}
        >
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

              const opacity = isThemeTab(k) ? (theme ? 1 : 0.7) : 1;

              return (
                <Tab
                  key={k}
                  opacity={opacity}
                  px={{ base: 2, md: 3 }}
                  py={{ base: 1, md: 1 }}
                  fontSize={{ base: "xs", md: "sm" }}
                  lineHeight={1.1}
                  // prevent each tab from forcing the bar wider than the viewport
                  maxW={{ base: "42vw", md: "none" }}
                  minW="auto"
                  onClick={() => {
                    if (isThemeTab(k) && !theme && slotIndex1Based) {
                      onEmptyThemeClick(slotIndex1Based);
                    }
                  }}
                  aria-label={k}
                >
                  {k === "bio" ? (
                    <Text noOfLines={1}>Bio</Text>
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
                    // Truncate safely with ellipsis; give each tab a cap width on mobile
                    <Text noOfLines={1} title={theme.name}>
                      {truncate(theme.name)}
                    </Text>
                  ) : (
                    <Text noOfLines={1}>No Theme</Text>
                  )}
                </Tab>
              );
            });
          })()}
        </TabList>
      </Tabs>
    </Box>
  );
}
