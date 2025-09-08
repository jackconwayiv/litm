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
  Spacer,
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
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      px={4}
      py={2}
      borderBottom="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      position="sticky"
      top={0}
      zIndex={100}
    >
      {/* Left: home icon on mobile, inline links on desktop */}
      <Box as="nav" w="100%" px={4} py={2}>
        <Flex align="center" gap={2}>
          <IconButton
            aria-label="Home"
            icon={<MdHome size={20} />}
            display={{ base: "inline-flex", md: "none" }}
            variant="ghost"
            onClick={() => navigate("/")}
          />
          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
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

          <Spacer />

          <Button
            colorScheme="red"
            size="sm"
            display={{ base: "none", md: "inline-flex" }}
            onClick={() => {
              onClose?.();
              logout();
            }}
          >
            Sign Out
          </Button>
        </Flex>
      </Box>

      {/* Right: hamburger on mobile, logout always */}
      <HStack>
        <IconButton
          aria-label="Menu"
          icon={<HamburgerIcon />}
          display={{ base: "inline-flex", md: "none" }}
          variant="ghost"
          onClick={onOpen}
        />
      </HStack>

      {/* Drawer for mobile */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
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
                mt={10}
                onClick={() => {
                  onClose();
                  logout();
                }}
              >
                Sign Out
              </Button>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}
