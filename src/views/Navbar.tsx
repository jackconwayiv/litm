// src/views/Navbar.tsx
import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Link,
  Stack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { MdHome } from "react-icons/md";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function NavBar() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const inactiveColor = useColorModeValue("gray.700", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("gray.50", "gray.800");

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else navigate("/", { replace: true });
  }

  const toolbarLinkProps = {
    px: 3,
    py: 2,
    borderRadius: "6px",
    color: inactiveColor,
    _activeLink: { color: "white", bg: "blue.600", fontWeight: "bold" },
    onClick: onClose,
  } as const;

  const drawerLinkProps = {
    px: 3,
    py: 2,
    borderRadius: "6px",
    color: inactiveColor,
    onClick: onClose,
  } as const;

  return (
    <Box
      as="nav"
      w="full"
      maxW="100vw"
      position="sticky"
      top={0}
      zIndex={100}
      borderBottom="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      overflowX="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 2, md: 4 }}
        py={{ base: 1, md: 2 }}
        w="full"
        minW={0}
        gap={2}
      >
        {/* Left: brand/home & desktop links */}
        <HStack spacing={2} minW={0} flex="1 1 0">
          <IconButton
            aria-label="Home"
            icon={<MdHome size={20} />}
            display={{ base: "inline-flex", md: "none" }}
            variant="ghost"
            onClick={() => navigate("/")}
            flexShrink={0}
          />

          {/* Desktop links; horizontally scrollable if crowded */}
          <HStack
            spacing={2}
            display={{ base: "none", md: "flex" }}
            overflowX="auto"
            overflowY="hidden"
            whiteSpace="nowrap"
            sx={{
              WebkitOverflowScrolling: "touch",
              "::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
            minW={0}
          >
            <Link as={NavLink} to="/" {...toolbarLinkProps}>
              Home
            </Link>
            <Link as={NavLink} to="/adventures" {...toolbarLinkProps}>
              Adventures
            </Link>
            <Link as={NavLink} to="/characters" {...toolbarLinkProps}>
              Characters
            </Link>
            <Link as={NavLink} to="/profile" {...toolbarLinkProps}>
              Profile
            </Link>
          </HStack>
        </HStack>

        {/* Right: desktop sign out, mobile hamburger */}
        <HStack spacing={1} flexShrink={0}>
          <Button
            colorScheme="red"
            size="sm"
            display={{ base: "none", md: "inline-flex" }}
            onClick={() => {
              onClose();
              void logout();
            }}
          >
            Sign Out
          </Button>
          <IconButton
            aria-label="Menu"
            icon={<HamburgerIcon />}
            display={{ base: "inline-flex", md: "none" }}
            variant="ghost"
            onClick={onOpen}
          />
        </HStack>
      </Flex>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <Stack spacing={2}>
              <Link as={NavLink} to="/" {...drawerLinkProps}>
                Home
              </Link>
              <Link as={NavLink} to="/adventures" {...drawerLinkProps}>
                Adventures
              </Link>
              <Link as={NavLink} to="/characters" {...drawerLinkProps}>
                Characters
              </Link>
              <Link as={NavLink} to="/profile" {...drawerLinkProps}>
                Profile
              </Link>
              <Button
                colorScheme="red"
                mt={8}
                onClick={() => {
                  onClose();
                  void logout();
                }}
              >
                Sign Out
              </Button>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
