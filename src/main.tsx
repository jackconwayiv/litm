// src/main.tsx
import { ChakraProvider } from "@chakra-ui/react";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import Dashboard from "./Dashboard";
import "./index.css";
import Adventures from "./views/Adventures";

import Characters from "./views/Characters";
import Profile from "./views/Profile";
import SingleAdventure from "./views/SingleAdventure";
import SingleCharacter from "./views/SingleCharacter";
import Welcome from "./views/Welcome";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route element={<Dashboard />}>
              <Route index element={<Welcome />} />
              <Route path="c/:charId" element={<SingleCharacter />} />
              <Route path="adventures" element={<Adventures />} />
              <Route path="adventures/:id" element={<SingleAdventure />} />
              <Route path="characters" element={<Characters />} />{" "}
              {/* keep for CRUD */}
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
