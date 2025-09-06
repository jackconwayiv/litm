import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Adventure } from "../types/types";

export default function Adventures() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("adventures")
      .select("id,name,subscribe_code,owner_player_id")
      .order("name");

    if (error) setErr(error.message);
    setAdventures((data ?? []) as Adventure[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("rt:adventures")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "adventures" },
        () => {
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  return (
    <main style={{ padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <button onClick={load}>Refresh</button>
        <span style={{ marginLeft: 12 }}>{adventures.length} adventures</span>
      </header>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : adventures.length === 0 ? (
        <p>No adventures yet.</p>
      ) : (
        <section>
          <h2>Adventures</h2>
          <ul>
            {adventures.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
