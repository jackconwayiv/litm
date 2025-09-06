// src/views/NavBar.tsx
import {
  Button,
  Flex,
  HStack,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../types/supabase";

export default function NavBar() {
  const navigate = useNavigate();
  const inactiveColor = useColorModeValue("gray.700", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("gray.50", "gray.800");

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else navigate("/", { replace: true });
  }

  const baseLinkProps = {
    px: 3,
    py: 2,
    borderRadius: "6px",
    color: inactiveColor,
    _activeLink: { color: "white", bg: "blue.600", fontWeight: "bold" },
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
    >
      <HStack spacing={2}>
        <Link as={NavLink} to="/adventures" {...baseLinkProps}>
          Adventures
        </Link>
        <Link as={NavLink} to="/characters" {...baseLinkProps}>
          Characters
        </Link>
        <Link as={NavLink} to="/profile" {...baseLinkProps}>
          Profile
        </Link>
      </HStack>
      <Button size="sm" colorScheme="red" onClick={logout}>
        Log out
      </Button>
    </Flex>
  );
}
