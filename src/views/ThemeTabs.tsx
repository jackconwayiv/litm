import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  Box,
  HStack,
  IconButton,
  Tab,
  TabList,
  Tabs,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  PiBackpackFill,
  PiSpiralBold,
  PiUserFill,
  PiUsersFill,
} from "react-icons/pi";
import type { TabKey, ThemeRow } from "../types/types";
import { buildTabOrder, isThemeTab } from "../types/types";

const truncate = (s: string) => (s.length <= 10 ? s : s.slice(0, 10) + "…");

type Props = {
  themes: (ThemeRow | null)[];
  active: TabKey;
  onChange: (next: TabKey, index: number) => void;
  onEmptyThemeClick: (slotIndex1Based: number) => void;
  showFellowship?: boolean; // NEW
};

export default function ThemeTabs({
  themes,
  active,
  onChange,
  onEmptyThemeClick,
  showFellowship = false,
}: Props) {
  // Build local order (inserts "fellowship" between theme4 and backpack)
  const ORDER = buildTabOrder(showFellowship);
  const index = Math.max(0, ORDER.indexOf(active)); // guard if hash is stale
  const isDesktop = useBreakpointValue({ base: false, md: true });

  // Map an ORDER index to (theme|null, slotIndex1Based)
  const getThemeForIndex = (i: number) => {
    const wrapped = (i + ORDER.length) % ORDER.length;
    let t = 0;
    for (let k = 0; k < ORDER.length; k += 1) {
      const kk = ORDER[k];
      if (isThemeTab(kk)) {
        if (k === wrapped)
          return { theme: themes[t] ?? null, slotIndex1Based: t + 1 };
        t += 1;
      }
    }
    return { theme: null, slotIndex1Based: null };
  };

  const goIndex = (nextIdx: number) => {
    const wrapped = (nextIdx + ORDER.length) % ORDER.length;
    const key = ORDER[wrapped];
    const { theme, slotIndex1Based } = getThemeForIndex(wrapped);
    if (isThemeTab(key) && !theme && slotIndex1Based)
      onEmptyThemeClick(slotIndex1Based);
    onChange(key, wrapped);
  };
  const goPrev = () => goIndex(index - 1);
  const goNext = () => goIndex(index + 1);

  // Mobile neighbor indicator
  const renderIndicator = (i: number) => {
    const wrapped = (i + ORDER.length) % ORDER.length;
    const key = ORDER[wrapped];
    const muted = { opacity: 0.7 };

    if (key === "bio") return <PiUserFill style={muted} />;
    if (key === "backpack") return <PiBackpackFill style={muted} />;
    if (key === "statuses") return <PiSpiralBold style={muted} />;
    if (key === "fellowship") return <PiUsersFill style={muted} />;

    // theme slot badge
    let t = 0;
    for (let k = 0; k < ORDER.length; k += 1) {
      const kk = ORDER[k];
      if (isThemeTab(kk)) {
        if (k === wrapped) {
          return (
            <Box
              as="span"
              minW="1.25rem"
              px="1"
              textAlign="center"
              fontSize="xs"
              borderWidth="1px"
              borderRadius="full"
              sx={muted}
            >
              {t + 1}
            </Box>
          );
        }
        t += 1;
      }
    }
    return null;
  };

  // Current label
  const currentKey = ORDER[index];
  const { theme: currentTheme } = getThemeForIndex(index);
  const labelStr =
    currentKey === "bio"
      ? "Bio"
      : currentKey === "backpack"
      ? "Backpack"
      : currentKey === "statuses"
      ? "Statuses"
      : currentKey === "fellowship"
      ? "Fellowship"
      : currentTheme
      ? truncate(currentTheme.name)
      : "No Theme";

  const labelTitle =
    currentKey === "bio"
      ? "Bio"
      : currentKey === "backpack"
      ? "Backpack"
      : currentKey === "statuses"
      ? "Statuses"
      : currentKey === "fellowship"
      ? "Fellowship"
      : currentTheme?.name ?? "No Theme";

  const leftIcon =
    currentKey === "bio" ? (
      <PiUserFill />
    ) : currentKey === "backpack" ? (
      <PiBackpackFill />
    ) : currentKey === "statuses" ? (
      <PiSpiralBold />
    ) : currentKey === "fellowship" ? (
      <PiUsersFill />
    ) : null;

  const prevIdx = index - 1;
  const nextIdx = index + 1;

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
      maxW="100%"
      overflowX="hidden"
    >
      {isDesktop ? (
        <Tabs
          index={index}
          onChange={(i) => onChange(ORDER[i], i)}
          variant="soft-rounded"
          isFitted
          w="full"
        >
          <TabList
            overflowX="auto"
            overflowY="hidden"
            whiteSpace="nowrap"
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
              let t = 0;
              return ORDER.map((k) => {
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
                      <HStack gap={1}>
                        <PiUserFill />
                        <Text as="span">Bio</Text>
                      </HStack>
                    ) : k === "backpack" ? (
                      <HStack gap={1}>
                        <PiBackpackFill />
                        <Text as="span">Backpack</Text>
                      </HStack>
                    ) : k === "statuses" ? (
                      <HStack gap={1}>
                        <PiSpiralBold />
                        <Text as="span">Statuses</Text>
                      </HStack>
                    ) : k === "fellowship" ? (
                      <HStack gap={1}>
                        <PiUsersFill />
                        <Text as="span">Fellowship</Text>
                      </HStack>
                    ) : theme ? (
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
      ) : (
        // ---------- MOBILE ----------
        <HStack w="full" justify="space-between" align="center">
          <Tooltip label="Previous" openDelay={200}>
            <IconButton
              aria-label="Previous tab"
              icon={<ChevronLeftIcon />}
              size="sm"
              variant="ghost"
              onClick={goPrev}
            />
          </Tooltip>

          <HStack spacing={3} minW={0} align="center">
            {renderIndicator(prevIdx)}
            <Box
              as="button"
              onClick={goNext}
              px={1}
              py={0.5}
              borderRadius="md"
              maxW="64vw"
              minW={0}
              title={labelTitle}
            >
              <HStack spacing={2} justify="center" minW={0}>
                {leftIcon}
                <Text
                  as="span"
                  fontSize="sm"
                  fontWeight="semibold"
                  noOfLines={1}
                  minW={0}
                  textAlign="center"
                >
                  {labelStr}
                </Text>
              </HStack>
            </Box>
            {renderIndicator(nextIdx)}
          </HStack>

          <Tooltip label="Next" openDelay={200}>
            <IconButton
              aria-label="Next tab"
              icon={<ChevronRightIcon />}
              size="sm"
              variant="ghost"
              onClick={goNext}
            />
          </Tooltip>
        </HStack>
      )}
    </Box>
  );
}
