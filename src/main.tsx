// src/main.tsx
import { ChakraProvider } from "@chakra-ui/react";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import Dashboard from "./Dashboard";
import Adventures from "./views/Adventures";
import Characters from "./views/Characters";
import Profile from "./views/Profile";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route element={<Dashboard />}>
              <Route index element={<Navigate to="characters" replace />} />
              <Route path="adventures" element={<Adventures />} />
              <Route path="characters" element={<Characters />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
