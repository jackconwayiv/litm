// src/Dashboard.tsx
import { Outlet } from "react-router-dom";
import NavBar from "./views/Navbar";

export default function Dashboard() {
  return (
    <div>
      <NavBar />
      <main style={{ padding: "4px 8px" }}>
        {" "}
        {/* was 16px; tighter + symmetric */}
        <Outlet />
      </main>
    </div>
  );
}
