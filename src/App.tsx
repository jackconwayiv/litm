// src/App.tsx
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Login from "./Login";
import { supabase } from "./types/supabase";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!session) return <Login />;
  return <Outlet />;
}
