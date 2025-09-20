// src/views/Navbar.tsx (minimal header padding + no double wrapper)
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

  const inactive = useColorModeValue("gray.700", "gray.300");
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("gray.50", "gray.800");

  const linkProps = {
    px: 2,
    py: 1,
    borderRadius: "6px",
    color: inactive,
    _activeLink: { color: "white", bg: "blue.600", fontWeight: "bold" },
    onClick: onClose,
  } as const;

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/", { replace: true });
  }

  return (
    <Box
      as="nav"
      w="full"
      borderBottom="1px solid"
      borderColor={border}
      bg={bg}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 2, md: 4 }}
        py={{ base: 1, md: 2 }}
        w="full"
        minW={0}
      >
        <HStack spacing={2} minW={0} flex="1 1 0">
          <IconButton
            aria-label="Home"
            icon={<MdHome size={18} />}
            display={{ base: "inline-flex", md: "none" }}
            variant="ghost"
            onClick={() => navigate("/")}
            flexShrink={0}
          />
          <HStack
            spacing={2}
            display={{ base: "none", md: "flex" }}
            overflowX="auto"
            minW={0}
            sx={{
              WebkitOverflowScrolling: "touch",
              "::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Link as={NavLink} to="/" {...linkProps}>
              Home
            </Link>
            <Link as={NavLink} to="/adventures" {...linkProps}>
              Adventures
            </Link>
            <Link as={NavLink} to="/characters" {...linkProps}>
              Characters
            </Link>
            <Link as={NavLink} to="/profile" {...linkProps}>
              Profile
            </Link>
          </HStack>
        </HStack>

        <HStack spacing={1} flexShrink={0}>
          <Button
            colorScheme="red"
            size="sm"
            display={{ base: "none", md: "inline-flex" }}
            onClick={logout}
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

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <Stack spacing={1}>
              <Link as={NavLink} to="/" {...linkProps}>
                Home
              </Link>
              <Link as={NavLink} to="/adventures" {...linkProps}>
                Adventures
              </Link>
              <Link as={NavLink} to="/characters" {...linkProps}>
                Characters
              </Link>
              <Link as={NavLink} to="/profile" {...linkProps}>
                Profile
              </Link>
              <Button colorScheme="red" mt={3} onClick={logout}>
                Sign Out
              </Button>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
