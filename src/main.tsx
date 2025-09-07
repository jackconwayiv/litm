// src/main.tsx
import { ChakraProvider } from "@chakra-ui/react";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import Dashboard from "./Dashboard";
import Adventures from "./views/Adventures";
import Characters from "./views/Characters";
import Profile from "./views/Profile";
import Home from "./views/Home";
import SingleCharacter from "./views/SingleCharacter";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route element={<Dashboard />}>
              <Route index element={<Home />} />
              <Route path="c/:charId" element={<SingleCharacter />} />
              <Route path="adventures" element={<Adventures />} />
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
