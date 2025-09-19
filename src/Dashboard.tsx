// src/Dashboard.tsx
import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import NavBar from "./views/Navbar";

export default function Dashboard() {
  return (
    <Box w="full" maxW="100vw" minH="100dvh" overflowX="hidden">
      {/* Keep the navbar at the top; if Navbar is already sticky, this is fine as-is */}
      <NavBar />

      {/* Main content area */}
      <Box
        as="main"
        px={{ base: 2, md: 4 }} // compact padding on mobile
        py={{ base: 2, md: 3 }}
        w="full"
        minW={0} // critical to prevent flex overflow
      >
        {/* Optional: constrain super-wide layouts; change/remove maxW if you prefer full-width */}
        <Box w="full" minW={0} maxW="container.lg" mx="auto">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
