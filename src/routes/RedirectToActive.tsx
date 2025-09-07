// src/routes/RedirectToActive.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RedirectToActive() {
  const nav = useNavigate();
  useEffect(() => {
    (async () => {
      // 1) try profile.active_character_id (optional column; see note below)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return nav("/characters", { replace: true });

      const { data: prof } = await supabase
        .from("profiles")
        .select("active_character_id")
        .eq("id", user.id)
        .single();

      let charId = prof?.active_character_id as string | null;

      // 2) fallback: most recent character
      if (!charId) {
        const { data: c } = await supabase
          .from("characters")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        charId = c?.id ?? null;
      }

      if (charId) nav(`/c/${charId}`, { replace: true });
      else nav("/characters", { replace: true });
    })();
  }, [nav]);

  return null;
}
